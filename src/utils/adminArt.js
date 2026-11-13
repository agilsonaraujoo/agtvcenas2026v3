// Artes de Stories (1080x1920) e feed (1080x1080) desenhadas no navegador com os dados reais do site: nenhum nome ou
// horário é gerado por IA. A área útil respeita as margens que o Instagram cobre em cima e embaixo.
const TIMEZONE = 'America/Sao_Paulo';
const WIDTH = 1080;
const PAD = 64;

// top: início do cabeçalho; contentTop/contentBottom: área das linhas; footerY: faixa verde.
export const ART_FORMATS = [
  { key: '9x16', label: '9:16', height: 1920, top: 170, contentTop: 440, contentBottom: 1570, footerY: 1590 },
  { key: '1x1', label: '1:1', height: 1080, top: 48, contentTop: 196, contentBottom: 966, footerY: 972, compact: true },
];
const GREEN = '#b7ff4a';
const INK = '#10130a';
const MUTED = '#a7a9b4';
const SURFACE = '#101116';
const DISPLAY = 'Manrope, sans-serif';
const UI = '"DM Sans", sans-serif';

// Horário padrão da arte de filmes e séries quando não é hoje (no dia de hoje começa na hora atual).
export const PRIME_START = '20:00';
export const PRIME_END = '23:00';
const MOVIE_GROUPS = ['filmes', 'series'];

const timeFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: TIMEZONE, hour: '2-digit', minute: '2-digit' });
export const formatTime = (iso) => timeFormatter.format(new Date(iso));

// "quinta-feira, 05/11" a partir de "2026-11-05".
export const formatDay = (key) => {
  const date = new Date(`${key}T12:00:00-03:00`);
  const weekday = new Intl.DateTimeFormat('pt-BR', { timeZone: TIMEZONE, weekday: 'long' }).format(date);
  const dayMonth = new Intl.DateTimeFormat('pt-BR', { timeZone: TIMEZONE, day: '2-digit', month: '2-digit' }).format(date);
  return `${weekday}, ${dayMonth}`;
};

export const gameEnded = (game, now) => (
  game.score ? game.score.status === 'finished' : now >= Date.parse(game.end)
);

const loadImage = (src) => new Promise((resolve) => {
  const image = new Image();
  image.onload = () => resolve(image);
  image.onerror = () => resolve(null);
  image.src = src;
});

const loadFonts = () => Promise.all([
  document.fonts.load(`800 80px ${DISPLAY}`),
  document.fonts.load(`700 32px ${UI}`),
  document.fonts.load(`500 28px ${UI}`),
]).catch(() => {});

const roundRect = (ctx, x, y, width, height, radius) => {
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
};

// Reduz a fonte até caber; se nem no mínimo couber, corta com reticências.
const fitFont = (ctx, text, maxWidth, weight, size, minSize, family) => {
  let current = size;
  ctx.font = `${weight} ${current}px ${family}`;
  while (current > minSize && ctx.measureText(text).width > maxWidth) {
    current -= 1;
    ctx.font = `${weight} ${current}px ${family}`;
  }
  return current;
};

const ellipsis = (ctx, text, maxWidth) => {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
};

const paintBackground = (ctx, format) => {
  const { height } = format;
  ctx.fillStyle = '#07080b';
  ctx.fillRect(0, 0, WIDTH, height);
  const glows = [[120, 160, 760, 'rgba(183,255,74,0.16)'], [980, height - 200, 900, 'rgba(154,123,255,0.22)']];
  for (const [x, y, radius, color] of glows) {
    const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
    glow.addColorStop(0, color);
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WIDTH, height);
  }
};

const paintLogo = (ctx, logo, x, y) => {
  if (!logo) return;
  ctx.save();
  roundRect(ctx, x, y, 88, 88, 20);
  ctx.clip();
  ctx.drawImage(logo, x, y, 88, 88);
  ctx.restore();
};

const paintHeader = (ctx, logo, title, subtitle, format) => {
  const { top } = format;
  if (format.compact) {
    // No quadrado a altura é curta: logo à direita, na mesma faixa do título.
    paintLogo(ctx, logo, WIDTH - PAD - 88, top);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = GREEN;
    ctx.font = `800 72px ${DISPLAY}`;
    ctx.fillText(title, PAD, top + 66);
    ctx.fillStyle = '#e4e5ec';
    ctx.font = `700 30px ${UI}`;
    ctx.fillText(subtitle, PAD, top + 116);
    return;
  }
  paintLogo(ctx, logo, PAD, top - 20);
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#fff';
  ctx.font = `800 40px ${DISPLAY}`;
  ctx.fillText('AGTV', PAD + (logo ? 106 : 0), top + 38);
  ctx.fillStyle = GREEN;
  ctx.font = `800 88px ${DISPLAY}`;
  ctx.fillText(title, PAD, top + 170);
  ctx.fillStyle = '#e4e5ec';
  ctx.font = `700 34px ${UI}`;
  ctx.fillText(subtitle, PAD, top + 226);
};

const paintFooter = (ctx, label, url, { footerY }) => {
  const height = 82;
  roundRect(ctx, PAD, footerY, WIDTH - PAD * 2, height, 41);
  ctx.fillStyle = GREEN;
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  fitFont(ctx, `${label} ${url}`, WIDTH - PAD * 2 - 60, 800, 34, 24, UI);
  ctx.fillText(`${label} ${url}`, WIDTH / 2, footerY + 53);
  ctx.textAlign = 'left';
};

const paintSectionTitle = (ctx, text, y) => {
  ctx.fillStyle = GREEN;
  ctx.fillRect(PAD, y + 6, 8, 36);
  fitFont(ctx, text, WIDTH - PAD * 2 - 30, 800, 36, 26, DISPLAY);
  ctx.fillText(text, PAD + 24, y + 37);
};

const paintRowBox = (ctx, y, height, time) => {
  roundRect(ctx, PAD, y, WIDTH - PAD * 2, height, 22);
  ctx.fillStyle = SURFACE;
  ctx.fill();
  ctx.strokeStyle = 'rgba(154,123,255,0.28)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = GREEN;
  ctx.font = `800 36px ${DISPLAY}`;
  ctx.fillText(time, PAD + 24, y + height / 2 + 13);
};

const TEXT_X = PAD + 164;
const TEXT_WIDTH = WIDTH - PAD - 24 - TEXT_X;
const GAME_ROW = 104;
const MOVIE_ROW = 96;
const GROUP_TITLE = 60;
const GROUP_GAP = 18;
const ROW_GAP = 12;
const CREST = 44;

const scoreText = (score) => `${score.home} x ${score.away}`;

const paintGameRow = (ctx, game, crests, y) => {
  paintRowBox(ctx, y, GAME_ROW, formatTime(game.start));
  const home = crests.get(game.homeCrest);
  const away = crests.get(game.awayCrest);
  const middle = game.score ? scoreText(game.score) : 'x';
  const crestSpace = (home ? CREST + 10 : 0) + (away ? CREST + 10 : 0);
  const available = TEXT_WIDTH - crestSpace - 44;

  const size = fitFont(ctx, `${game.home}${middle}${game.away}`, available, 800, 32, 22, UI);
  const baseline = y + 50;
  let x = TEXT_X;
  const crestY = baseline - 12 - CREST / 2;

  if (home) {
    ctx.drawImage(home, x, crestY, CREST, CREST);
    x += CREST + 10;
  }
  ctx.fillStyle = '#fff';
  ctx.font = `800 ${size}px ${UI}`;
  ctx.fillText(game.home, x, baseline);
  x += ctx.measureText(game.home).width + 14;

  if (game.score) {
    const width = ctx.measureText(middle).width + 20;
    roundRect(ctx, x - 6, baseline - size + 1, width, size + 8, 8);
    ctx.fillStyle = GREEN;
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.fillText(middle, x + 4, baseline);
    x += width + 8;
  } else {
    ctx.fillStyle = MUTED;
    ctx.fillText(middle, x, baseline);
    x += ctx.measureText(middle).width + 14;
  }

  if (away) {
    ctx.drawImage(away, x, crestY, CREST, CREST);
    x += CREST + 10;
  }
  ctx.fillStyle = '#fff';
  ctx.fillText(game.away, x, baseline);

  ctx.fillStyle = MUTED;
  ctx.font = `500 25px ${UI}`;
  const status = game.score ? `${game.score.status === 'finished' ? 'Encerrado' : 'Ao vivo'} · ` : '';
  const channels = game.channels.map((channel) => channel.name).join(', ');
  ctx.fillText(ellipsis(ctx, `${status}${channels}`, TEXT_WIDTH), TEXT_X, y + 88);
};

const byCompetition = (a, b) => (
  Number(b.competition.football) - Number(a.competition.football)
  || a.competition.order - b.competition.order
  || Date.parse(a.start) - Date.parse(b.start)
);

const layoutCost = (games) => {
  let used = 0;
  let last = null;
  for (const game of games) {
    used += GAME_ROW + ROW_GAP + (last === game.competition.name ? 0 : GROUP_TITLE + GROUP_GAP);
    last = game.competition.name;
  }
  return used;
};

// Monta os blocos que cabem: futebol e campeonatos principais primeiro. Com `ranked` (ordem da IA),
// entram os mais bem colocados que couberem, e a arte continua agrupada por campeonato.
const fitGames = (games, format, ranked = null) => {
  const limit = format.contentBottom - format.contentTop - 40;
  if (ranked) {
    for (let count = ranked.length; count > 0; count -= 1) {
      const chosen = ranked.slice(0, count).sort(byCompetition);
      if (layoutCost(chosen) <= limit) return fitGames(chosen, format);
    }
    return { groups: [], hidden: ranked.length };
  }
  const sorted = [...games].sort(byCompetition);
  const groups = [];
  let used = 0;
  let shown = 0;
  for (const game of sorted) {
    const last = groups[groups.length - 1];
    const sameGroup = last && last.name === game.competition.name;
    const cost = GAME_ROW + ROW_GAP + (sameGroup ? 0 : GROUP_TITLE + GROUP_GAP);
    if (used + cost > limit) break;
    used += cost;
    shown += 1;
    if (sameGroup) last.games.push(game);
    else groups.push({ name: game.competition.name, games: [game] });
  }
  return { groups, hidden: sorted.length - shown };
};

const createCanvas = ({ height }) => {
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = height;
  return [canvas, canvas.getContext('2d')];
};

const toBlob = (canvas) => new Promise((resolve) => { canvas.toBlob(resolve, 'image/png'); });

export const upcomingGames = (data, { onlyUpcoming, now }) => data.games.filter((game) => !onlyUpcoming || !gameEnded(game, now));

export const gamesArt = async (data, { onlyUpcoming, now, format, ranked }) => {
  const games = ranked || upcomingGames(data, { onlyUpcoming, now });
  if (!games.length) return null;
  const fitted = fitGames(games, format, ranked);
  // Com a IA, "+ N jogos" conta todos os que ficaram de fora da arte.
  const groups = fitted.groups;
  const hidden = ranked ? upcomingGames(data, { onlyUpcoming, now }).length - groups.reduce((n, g) => n + g.games.length, 0) : fitted.hidden;

  // Só escudos do próprio site: imagem de outro domínio impediria exportar o PNG.
  const sources = [...new Set(groups.flatMap((group) => group.games)
    .flatMap((game) => [game.homeCrest, game.awayCrest])
    .filter((src) => src && src.startsWith('/')))];
  const [logo, images] = await Promise.all([
    loadImage('/marca/favicon-192.png'),
    Promise.all(sources.map(loadImage)),
    loadFonts(),
  ]);
  const crests = new Map(sources.map((src, index) => [src, images[index]]).filter(([, image]) => image));

  const [canvas, ctx] = createCanvas(format);
  paintBackground(ctx, format);
  paintHeader(ctx, logo, 'JOGOS DO DIA', `${formatDay(data.date)} · horários de Brasília`, format);
  let y = format.contentTop;
  for (const group of groups) {
    paintSectionTitle(ctx, group.name, y);
    y += GROUP_TITLE;
    for (const game of group.games) {
      paintGameRow(ctx, game, crests, y);
      y += GAME_ROW + ROW_GAP;
    }
    y += GROUP_GAP;
  }
  if (hidden > 0) {
    ctx.fillStyle = '#e4e5ec';
    ctx.font = `700 30px ${UI}`;
    ctx.textAlign = 'center';
    ctx.fillText(`+ ${hidden} ${hidden === 1 ? 'jogo' : 'jogos'} no site`, WIDTH / 2, format.contentBottom - 8);
    ctx.textAlign = 'left';
  }
  paintFooter(ctx, 'Placar ao vivo:', 'agtvcenas.com.br/jogos', format);
  return toBlob(canvas);
};

// Faixa de chamada do Telecine que vem antes do nome do filme.
const cleanTitle = (title) => title.replace(/^Aquecimento\s+/i, '');

// Vinhetas da grade que não são filme nem série.
const FILLER = /^(?:preview|intervalo)\b/i;

const toMinutes = (hhmm) => {
  const [hours, minutes] = String(hhmm).split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

const sameTitle = (title) => title.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

export const movieRowsFor = (format) => Math.floor((format.contentBottom - format.contentTop) / (MOVIE_ROW + ROW_GAP));

// "das 14h às 17h30" para o cabeçalho e a legenda.
const hourLabel = (hhmm) => {
  const [hours, minutes] = hhmm.split(':');
  return `${Number(hours)}h${minutes === '00' ? '' : minutes}`;
};
export const windowLabel = ({ start, end }) => `das ${hourLabel(start)} às ${hourLabel(end === '23:59' ? '00:00' : end)}`;

// Filmes e séries que começam dentro do horário pedido, sem vinhetas e sem repetir título. São os únicos
// nomes que vão para a arte: a IA só ordena esta lista, nunca inventa programa.
export const movieCandidates = (data, { start, end, onlyUpcoming, now }) => {
  const from = toMinutes(start);
  const until = toMinutes(end) > from ? toMinutes(end) : 24 * 60;
  const seen = new Set();
  const list = [];
  for (const channel of data.channels.filter((item) => MOVIE_GROUPS.includes(item.group))) {
    for (const program of channel.programs) {
      const minute = toMinutes(formatTime(program.start));
      if (minute < from || minute >= until || FILLER.test(program.title)) continue;
      if (onlyUpcoming && Date.parse(program.end) <= now) continue;
      const title = cleanTitle(program.title);
      const key = sameTitle(title);
      if (!key || seen.has(key)) continue;
      seen.add(key);
      list.push({ id: list.length, title, channel: channel.name, start: program.start, end: program.end });
    }
  }
  return list;
};

// Sem IA: um destaque por canal (o primeiro do horário) e depois o resto, por ordem de canal.
export const simpleRanking = (candidates) => {
  const channels = new Set();
  const first = [];
  const rest = [];
  for (const item of candidates) {
    if (channels.has(item.channel)) rest.push(item);
    else { channels.add(item.channel); first.push(item); }
  }
  return [...first, ...rest];
};

// Os melhores que cabem no formato, na ordem do horário.
const picksFor = (ranked, rows) => ranked.slice(0, rows).sort((a, b) => Date.parse(a.start) - Date.parse(b.start));

const paintMovieRow = (ctx, item, y) => {
  paintRowBox(ctx, y, MOVIE_ROW, formatTime(item.start));
  ctx.fillStyle = '#fff';
  const size = fitFont(ctx, item.title, TEXT_WIDTH, 800, 32, 24, UI);
  ctx.font = `800 ${size}px ${UI}`;
  ctx.fillText(ellipsis(ctx, item.title, TEXT_WIDTH), TEXT_X, y + 44);
  ctx.fillStyle = MUTED;
  ctx.font = `500 25px ${UI}`;
  ctx.fillText(item.channel, TEXT_X, y + 78);
};

export const moviesArt = async (data, { ranked, window, format }) => {
  const items = picksFor(ranked, movieRowsFor(format));
  if (!items.length) return null;

  const [logo] = await Promise.all([loadImage('/marca/favicon-192.png'), loadFonts()]);
  const [canvas, ctx] = createCanvas(format);
  paintBackground(ctx, format);
  paintHeader(ctx, logo, 'FILMES E SÉRIES', `${formatDay(data.date)} · ${windowLabel(window)}`, format);
  let y = format.contentTop;
  for (const item of items) {
    paintMovieRow(ctx, item, y);
    y += MOVIE_ROW + ROW_GAP;
  }
  paintFooter(ctx, 'Grade completa:', 'agtvcenas.com.br/programacao', format);
  return toBlob(canvas);
};

// Legendas que acompanham as imagens: só dados do dia, mais o link do site.
const SITE = 'agtvcenas.com.br';
const dayWord = (data) => (data.date === data.today ? 'hoje' : 'amanhã');
const CAPTION_LINES = 5;

export const gamesCaption = (data, { onlyUpcoming, now, ranked }) => {
  const all = upcomingGames(data, { onlyUpcoming, now });
  if (!all.length) return '';
  // Com a IA, a legenda traz só os escolhidos por ela, na ordem do horário.
  const top = ranked && ranked.length
    ? ranked.slice(0, CAPTION_LINES).sort((a, b) => Date.parse(a.start) - Date.parse(b.start))
    : all.slice(0, CAPTION_LINES);
  const lines = top.map((game) => `${formatTime(game.start)} • ${game.home} x ${game.away}`);
  const more = all.length - lines.length;
  return [
    `⚽ Jogos de ${dayWord(data)} na AGTV, ${formatDay(data.date)}`,
    '',
    ...lines,
    ...(more > 0 ? [`+ ${more} ${more === 1 ? 'jogo' : 'jogos'}`] : []),
    '',
    `📺 Horários e onde assistir, em tempo real: ${SITE}/jogos`,
  ].join('\n');
};

export const moviesCaption = (data, { ranked, window }) => {
  const picks = picksFor(ranked, CAPTION_LINES);
  if (!picks.length) return '';
  const lines = picks.map((item) => `${formatTime(item.start)} • ${item.title}`);
  return [
    `🎬🍿 Filmes e séries de ${dayWord(data)} na AGTV, ${windowLabel(window)}`,
    '',
    ...lines,
    '',
    `📺 Grade completa, em tempo real: ${SITE}/programacao`,
  ].join('\n');
};
