// Placar ao vivo do football-data.org (plano grátis: Brasileirão Série A e grandes ligas europeias).
// Só liga quando FOOTBALL_DATA_KEY estiver configurada na Vercel; sem ela, os jogos seguem só
// com horário e canal. O plano grátis aceita 10 chamadas por minuto: guardamos 60 s em memória.
const { slugOf, fullSlugOf } = require('./crests');
const { COMPETITIONS } = require('./standings');

const API_URL = 'https://api.football-data.org/v4/matches';
const CACHE_MS = 60 * 1000;
const FETCH_TIMEOUT_MS = 8000;
const KICKOFF_WINDOW_MS = 45 * 60 * 1000;

const LIVE = new Set(['IN_PLAY', 'PAUSED']);
const STATUS = { IN_PLAY: 'live', PAUSED: 'halftime', FINISHED: 'finished' };

let cache = null;

const utcDay = (ms) => new Date(ms).toISOString().slice(0, 10);

const fetchMatches = async (fromMs, toMs) => {
  const key = process.env.FOOTBALL_DATA_KEY;
  if (!key) return [];
  const range = `${utcDay(fromMs)}|${utcDay(toMs)}`;
  if (cache && cache.range === range && Date.now() - cache.at < CACHE_MS) return cache.matches;

  const url = `${API_URL}?${new URLSearchParams({ dateFrom: utcDay(fromMs), dateTo: utcDay(toMs) })}`;
  try {
    const response = await fetch(url, {
      headers: { 'X-Auth-Token': key },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    cache = { range, at: Date.now(), matches: data.matches || [] };
  } catch (error) {
    console.error('[placar] football-data.org indisponível:', error.message);
    // Mantém o último placar conhecido em vez de apagar tudo por uma falha passageira.
    if (!cache || cache.range !== range) return [];
  }
  return cache.matches;
};

// Nomes da grade ("Atlético-MG") e da API ("Clube Atlético Mineiro") raramente batem:
// comparamos as palavras do nome curto, da sigla e do nome completo.
const words = (value) => new Set(slugOf(value || '').split('-').filter((word) => word.length > 2));

const sameTeam = (ours, team) => {
  if (!team) return false;
  // Junta as palavras do nome da grade e do nome completo do apelido (athletico + paranaense).
  const mine = new Set([...words(ours), ...fullSlugOf(ours || '').split('-').filter((word) => word.length > 2)]);
  if (!mine.size) return false;
  const theirs = new Set([...words(team.shortName), ...words(team.name), ...words(team.tla)]);
  const short = words(team.shortName);
  return [...mine].every((word) => theirs.has(word))
    || (short.size > 0 && [...short].every((word) => mine.has(word)))
    || [...words(team.name)].some((word) => word.length > 4 && mine.has(word));
};

// Os dois times batendo é o ideal; se só um bater no mesmo horário, ainda é o mesmo jogo
// (nenhum time joga duas vezes em 45 min), então aceitamos para não perder o placar.
const findMatch = (game, matches) => {
  const near = matches.filter((match) => (
    Math.abs(Date.parse(match.utcDate) - Date.parse(game.start)) <= KICKOFF_WINDOW_MS
  ));
  return near.find((match) => sameTeam(game.home, match.homeTeam) && sameTeam(game.away, match.awayTeam))
    || near.find((match) => sameTeam(game.home, match.homeTeam) || sameTeam(game.away, match.awayTeam));
};

const withScores = async (days) => {
  const games = days.flatMap((day) => day.games);
  if (!games.length || !process.env.FOOTBALL_DATA_KEY) return days;
  const starts = games.map((game) => Date.parse(game.start));
  const matches = await fetchMatches(Math.min(...starts), Math.max(...starts));
  if (!matches.length) return days;

  for (const game of games) {
    const match = findMatch(game, matches);
    if (!match) continue;
    const { fullTime } = match.score || {};
    if (match.status in STATUS && fullTime && fullTime.home !== null) {
      game.score = { home: fullTime.home, away: fullTime.away, status: STATUS[match.status] };
      if (LIVE.has(match.status) && match.minute) game.score.minute = match.minute;
    }
    if (match.competition && match.competition.name && game.competition.name === 'Outros jogos') {
      const known = COMPETITIONS[match.competition.code];
      game.competition = { ...game.competition, name: known || match.competition.name, football: true };
    }
    if (match.competition && COMPETITIONS[match.competition.code]) {
      game.competition = { ...game.competition, table: match.competition.code };
    }
    game.homeCrest = game.homeCrest || (match.homeTeam && match.homeTeam.crest) || null;
    game.awayCrest = game.awayCrest || (match.awayTeam && match.awayTeam.crest) || null;
  }
  return days;
};

module.exports = { withScores, sameTeam };
