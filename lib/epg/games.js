const { dayRange } = require('./time');

// "Jogos de hoje" sai direto da grade dos canais: só entra o que a própria emissora marca
// como transmissão ao vivo e tem cara de partida ("Time A x Time B"). Reprise, compacto e
// chamada ("Dia 03/11: ...") ficam de fora, e nada é inventado.
const GAME_GROUPS = ['abertos', 'esportes'];
const LIVE_SUFFIX = /\s*-\s*ao vivo\s*$/i;
const MATCH = /^(?:([^:]{2,40}):\s*)?(.+?\S)\s+x\s+(\S.*)$/i;
const SAME_GAME_WINDOW_MS = 30 * 60 * 1000;

const isLive = (program) => program.category === 'live broadcast' || LIVE_SUFFIX.test(program.title);

const parseGame = (program) => {
  if (!isLive(program)) return null;
  const match = MATCH.exec(program.title.replace(LIVE_SUFFIX, '').trim());
  if (!match) return null;
  const [, league, home, away] = match;
  return { league: league ? league.trim() : null, home: home.trim(), away: away.trim() };
};

const normalize = (value) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\W+/g, '');

const firstSentence = (text) => {
  if (!text) return null;
  const sentence = text.split(/(?<=\.)\s/)[0].trim();
  return sentence.length > 160 ? `${sentence.slice(0, 157)}...` : sentence;
};

// `channels`: entradas do dataset ({ slug, channel, group, programs }), na ordem do site.
const gamesForDate = (channels, key) => {
  const { start, end } = dayRange(key);
  const games = [];

  for (const entry of channels) {
    if (!GAME_GROUPS.includes(entry.group)) continue;
    for (const program of entry.programs) {
      const startMs = Date.parse(program.start);
      if (startMs < start.getTime() || startMs >= end.getTime()) continue;
      const game = parseGame(program);
      if (!game) continue;

      const id = `${normalize(game.home)}x${normalize(game.away)}`;
      const same = games.find((item) => item.id === id && Math.abs(Date.parse(item.start) - startMs) <= SAME_GAME_WINDOW_MS);
      if (same) {
        if (!same.channels.some((channel) => channel.slug === entry.slug)) {
          same.channels.push({ slug: entry.slug, name: entry.channel });
        }
        if (Date.parse(program.end) > Date.parse(same.end)) same.end = program.end;
        continue;
      }
      games.push({
        id,
        ...game,
        start: program.start,
        end: program.end,
        description: firstSentence(program.description),
        channels: [{ slug: entry.slug, name: entry.channel }],
      });
    }
  }

  return games
    .sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    .map((game) => ({ ...game, id: `${game.id}-${game.start}` }));
};

module.exports = { gamesForDate, parseGame };
