const { hasSameOrigin, sendJson } = require('../lib/serverApi');
const { CHANNELS, GROUPS } = require('../lib/epg/channels');
const { TIMEZONE, DAY_MS, dateKey, dayRange, isValidDateKey } = require('../lib/epg/time');
const { gamesForDate } = require('../lib/epg/games');
const { hasUpcomingData, programsForDate } = require('../lib/epg/schedule');
const { loadDataset } = require('../lib/epg/store');
const { withScores } = require('../lib/epg/scores');
const {
  MIN_PASSWORD_LENGTH, SESSION_MS, clientIp, createLimiter, createSession,
  readSession, safeEqual, sessionCookie, validSession,
} = require('../lib/adminAuth');

const LOCK_MS = 15 * 60 * 1000;
const FAIL_DELAY_MS = 500;
const ALL_CLIENTS = 'todos';

// Falhas de login por IP e no total (o total pega quem troca de IP a cada tentativa).
const failuresByIp = createLimiter({ limit: 5, windowMs: LOCK_MS });
const failuresTotal = createLimiter({ limit: 30, windowMs: LOCK_MS });
// Cada leitura consulta o placar, que tem cota de 10 chamadas por minuto.
const reads = createLimiter({ limit: 30, windowMs: 60 * 1000 });

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

const tooMany = (res, seconds) => {
  res.setHeader('Retry-After', String(seconds));
  const minutes = Math.ceil(seconds / 60);
  return sendJson(res, 429, {
    error: { message: `Muitas tentativas. Tente de novo em ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.` },
  });
};

const login = async (req, res, password) => {
  const ip = clientIp(req);
  const lockedFor = Math.max(failuresByIp.blocked(ip), failuresTotal.blocked(ALL_CLIENTS));
  if (lockedFor) return tooMany(res, lockedFor);

  if (!safeEqual(req.headers['x-admin-password'] || '', password)) {
    failuresTotal.hit(ALL_CLIENTS);
    if (failuresByIp.hit(ip)) console.warn('[admin] login bloqueado por excesso de tentativas');
    await wait(FAIL_DELAY_MS);
    return sendJson(res, 401, { error: { message: 'Senha incorreta.' } });
  }

  failuresByIp.reset(ip);
  res.setHeader('Set-Cookie', sessionCookie(req, createSession(password), SESSION_MS));
  return sendJson(res, 200, { ok: true });
};

// Programação e jogos de um dia para a página /admin. A senha vem de ADMIN_PASSWORD na Vercel;
// sem ela configurada (ou curta demais), ninguém entra.
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return sendJson(res, 405, { error: { message: 'Método não permitido.' } });
  }
  if (!hasSameOrigin(req)) {
    return sendJson(res, 403, { error: { message: 'Origem não permitida.' } });
  }

  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return sendJson(res, 503, {
      error: { message: `Configure ADMIN_PASSWORD na Vercel com pelo menos ${MIN_PASSWORD_LENGTH} caracteres.` },
    });
  }

  if (req.method === 'POST') return login(req, res, password);
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', sessionCookie(req, '', 0));
    return sendJson(res, 200, { ok: true });
  }

  if (!validSession(readSession(req), password)) {
    return sendJson(res, 401, { error: { message: 'Entre com a senha.' } });
  }
  const limitedFor = reads.hit(clientIp(req));
  if (limitedFor) return tooMany(res, limitedFor);

  const now = Date.now();
  const today = dateKey(new Date(now));
  const requested = new URL(req.url, 'http://local').searchParams.get('date');
  if (requested && !isValidDateKey(requested)) {
    return sendJson(res, 400, { error: { message: 'Data inválida.' } });
  }
  const date = requested || today;

  let loaded;
  try {
    loaded = await loadDataset();
  } catch (error) {
    console.error('EPG dataset unavailable:', error.message);
    return sendJson(res, 503, { error: { message: 'A programação está indisponível agora.' } });
  }

  const { data: dataset } = loaded;
  const dayStart = dayRange(date).start.getTime();
  const [day] = await withScores([{ date, games: gamesForDate(Object.values(dataset.channels), date) }]);

  const channels = CHANNELS.map((config) => {
    const programs = (dataset.channels[config.slug] || {}).programs || [];
    const listed = hasUpcomingData(programs, now) ? programsForDate(programs, date) : [];
    return {
      slug: config.slug,
      name: config.name,
      group: config.group,
      // O que começou ontem e invade a madrugada fica na lista de ontem.
      programs: listed
        .filter((program, index) => (
          Date.parse(program.start) >= dayStart
          // As fontes às vezes repetem o mesmo programa no mesmo horário.
          && listed.findIndex((item) => item.start === program.start && item.title === program.title) === index
        ))
        .map(({ title, start, end }) => ({ title, start, end })),
    };
  });

  return sendJson(res, 200, {
    timezone: TIMEZONE,
    now: new Date(now).toISOString(),
    today,
    tomorrow: dateKey(new Date(dayRange(today).start.getTime() + DAY_MS)),
    date,
    groups: GROUPS,
    games: day.games,
    channels,
  });
};
