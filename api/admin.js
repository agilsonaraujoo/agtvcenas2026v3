const { GEMINI_BASE_URL, hasSameOrigin, sendJson } = require('../lib/serverApi');
const { CHANNELS, GROUPS } = require('../lib/epg/channels');
const { TIMEZONE, DAY_MS, dateKey, dayRange, isValidDateKey } = require('../lib/epg/time');
const { gamesForDate } = require('../lib/epg/games');
const { hasUpcomingData, programsForDate } = require('../lib/epg/schedule');
const { loadDataset } = require('../lib/epg/store');
const { withScores } = require('../lib/epg/scores');
const {
  MIN_PASSWORD_LENGTH, SESSION_MS, clientIp, createLimiter, createSession,
  parseAccounts, readSession, safeEqual, sessionCookie, validSession,
} = require('../lib/adminAuth');
const { PAINEL_SUPABASE_KEY, PAINEL_SUPABASE_URL } = require('../src/utils/painelConfig');

const LOCK_MS = 15 * 60 * 1000;
const FAIL_DELAY_MS = 500;
const ALL_CLIENTS = 'todos';

// Falhas de login por IP e no total (o total pega quem troca de IP a cada tentativa).
const failuresByIp = createLimiter({ limit: 5, windowMs: LOCK_MS });
const failuresTotal = createLimiter({ limit: 30, windowMs: LOCK_MS });
// Cada leitura consulta o placar, que tem cota de 10 chamadas por minuto.
const reads = createLimiter({ limit: 30, windowMs: 60 * 1000 });

// A IA escolhe só entre os programas da grade que o admin manda; os nomes da arte nunca vêm dela.
const MAX_CANDIDATES = 150;
const highlightsLimiter = createLimiter({ limit: 20, windowMs: 60 * 1000 });

const readBody = async (req) => {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 100000) throw new Error('Corpo grande demais.');
  }
  return raw ? JSON.parse(raw) : {};
};

const cleanCandidates = (list) => (Array.isArray(list) ? list : [])
  .slice(0, MAX_CANDIDATES)
  .map((item) => ({
    id: Number(item && item.id),
    title: String((item && item.title) || '').slice(0, 120),
    channel: String((item && item.channel) || '').slice(0, 60),
    time: String((item && item.time) || '').slice(0, 5),
  }))
  .filter((item) => Number.isInteger(item.id) && item.title);

const highlights = async (req, res) => {
  const limitedFor = highlightsLimiter.hit(clientIp(req));
  if (limitedFor) return tooMany(res, limitedFor);
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return sendJson(res, 503, { error: { message: 'IA não configurada.' } });

  let body;
  try {
    body = await readBody(req);
  } catch {
    return sendJson(res, 400, { error: { message: 'Pedido inválido.' } });
  }
  const candidates = cleanCandidates(body.candidates);
  const limit = Math.min(Math.max(Number(body.limit) || 10, 1), 20);
  if (!candidates.length) return sendJson(res, 200, { ids: [] });

  const lines = candidates.map((item) => `${item.id} | ${item.time} | ${item.title} | ${item.channel}`).join('\n');
  const games = body.kind === 'jogos';
  const prompt = (games ? [
    'Você escolhe os jogos de hoje com maior audiência no Brasil para uma arte de divulgação de uma TV por assinatura.',
    `Da lista abaixo (id | horário | jogo e campeonato | canais), escolha até ${limit} jogos que o público brasileiro mais quer ver:`,
    'clubes grandes do Brasil e clássicos, Seleção Brasileira, Libertadores, Copa do Brasil, Brasileirão,',
    'jogos decisivos e seleções e clubes famosos da Europa (Liga das Nações, Champions, Premier League, La Liga).',
    'Depois do futebol, só NBA, NFL ou vôlei se forem jogos de destaque. Evite jogos de pouca audiência.',
    'Responda só com os ids da lista, do jogo de maior audiência para o de menor.',
  ] : [
    'Você escolhe destaques de filmes e séries da TV paga para uma arte de divulgação no Brasil.',
    `Da lista abaixo (id | horário | título | canal), escolha até ${limit} programas que mais chamam atenção do público:`,
    'filmes conhecidos ou lançamentos recentes, séries populares e títulos com grande elenco ou franquia famosa.',
    'Evite reprises fracas, programas de bastidores, chamadas, vinhetas e títulos genéricos.',
    'Prefira variedade de canais e gêneros. Responda só com os ids da lista, do melhor para o pior.',
  ]).concat(['', lines]).join('\n');

  try {
    const response = await fetch(GEMINI_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: { type: 'OBJECT', properties: { ids: { type: 'ARRAY', items: { type: 'INTEGER' } } }, required: ['ids'] },
        },
      }),
    });
    if (!response.ok) throw new Error(`Gemini ${response.status}`);
    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || '';
    const valid = new Set(candidates.map((item) => item.id));
    const ids = [...new Set((JSON.parse(text).ids || []).map(Number))].filter((id) => valid.has(id)).slice(0, limit);
    if (!ids.length) throw new Error('Resposta sem ids válidos.');
    return sendJson(res, 200, { ids });
  } catch (error) {
    console.error('[admin] destaques da IA falharam:', error.message);
    return sendJson(res, 502, { error: { message: 'A IA não respondeu agora.' } });
  }
};

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

// O dono do painel (conta AGTV) define a senha nova de uma conta sem depender de e-mail.
// Usa a chave secreta do Supabase (SUPABASE_SERVICE_ROLE_KEY na Vercel), que nunca sai do servidor.
const MIN_ACCOUNT_PASSWORD = 8;
const passwordLimiter = createLimiter({ limit: 10, windowMs: 15 * 60 * 1000 });

const findUserId = async (email, serviceKey) => {
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  for (let page = 1; page <= 10; page += 1) {
    const response = await fetch(`${PAINEL_SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=100`, { headers });
    if (!response.ok) throw new Error(`Supabase ${response.status}`);
    const { users = [] } = await response.json();
    const found = users.find((user) => String(user.email || '').toLowerCase() === email);
    if (found) return found.id;
    if (users.length < 100) return null;
  }
  return null;
};

const accountsList = (res) => {
  const accounts = [...parseAccounts(process.env.ADMIN_CONTAS)].map(([email, marca]) => ({ email, marca }));
  return sendJson(res, 200, { accounts, ready: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY) });
};

const setAccountPassword = async (req, res) => {
  const limitedFor = passwordLimiter.hit(clientIp(req));
  if (limitedFor) return tooMany(res, limitedFor);
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return sendJson(res, 503, { error: { message: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY na Vercel.' } });
  }
  let body;
  try {
    body = await readBody(req);
  } catch {
    return sendJson(res, 400, { error: { message: 'Pedido inválido.' } });
  }
  const email = String(body.email || '').trim().toLowerCase();
  const newPassword = String(body.password || '');
  // Só contas do painel (ADMIN_CONTAS): nada de mexer em outros usuários do Supabase, como o da Central de Ajuda.
  if (!parseAccounts(process.env.ADMIN_CONTAS).has(email)) {
    return sendJson(res, 400, { error: { message: 'Essa conta não está no painel.' } });
  }
  if (newPassword.length < MIN_ACCOUNT_PASSWORD || newPassword.length > 72) {
    return sendJson(res, 400, { error: { message: `A senha precisa ter de ${MIN_ACCOUNT_PASSWORD} a 72 caracteres.` } });
  }
  try {
    const id = await findUserId(email, serviceKey);
    if (!id) return sendJson(res, 404, { error: { message: 'Essa conta ainda não foi criada no Supabase.' } });
    const response = await fetch(`${PAINEL_SUPABASE_URL}/auth/v1/admin/users/${id}`, {
      method: 'PUT',
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword }),
    });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      console.error('[admin] troca de senha recusada:', response.status, detail.msg || detail.error_code || '');
      const weak = /weak|password/i.test(String(detail.msg || detail.error_code || ''));
      return sendJson(res, weak ? 400 : 502, {
        error: { message: weak ? 'Senha fraca demais. Use letras e números.' : 'Não consegui trocar a senha agora.' },
      });
    }
    console.warn('[admin] senha de uma conta do painel foi redefinida pelo dono');
    return sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('[admin] troca de senha falhou:', error.message);
    return sendJson(res, 502, { error: { message: 'Não consegui trocar a senha agora.' } });
  }
};

const tooMany = (res, seconds) => {
  res.setHeader('Retry-After', String(seconds));
  const minutes = Math.ceil(seconds / 60);
  return sendJson(res, 429, {
    error: { message: `Muitas tentativas. Tente de novo em ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.` },
  });
};

// Confere no Supabase quem é o dono do token de login e devolve o e-mail (ou '' se não valer).
const emailFromToken = async (token) => {
  if (!token || token.length > 4000) return '';
  try {
    const response = await fetch(`${PAINEL_SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: PAINEL_SUPABASE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return '';
    const user = await response.json();
    return String((user && user.email) || '').trim().toLowerCase();
  } catch (error) {
    console.error('[admin] Supabase indisponível no login:', error.message);
    return '';
  }
};

// Login por conta (e-mail e senha no Supabase, cada e-mail ligado a uma marca em ADMIN_CONTAS)
// ou, enquanto as contas não existem, pela senha antiga de ADMIN_PASSWORD, que entra como AGTV.
const login = async (req, res, password) => {
  const ip = clientIp(req);
  const lockedFor = Math.max(failuresByIp.blocked(ip), failuresTotal.blocked(ALL_CLIENTS));
  if (lockedFor) return tooMany(res, lockedFor);

  let brand = null;
  const bearer = String(req.headers.authorization || '').match(/^Bearer\s+(\S+)$/i);
  if (bearer) {
    const email = await emailFromToken(bearer[1]);
    brand = email ? parseAccounts(process.env.ADMIN_CONTAS).get(email) || null : null;
    if (email && !brand) {
      console.warn('[admin] conta sem marca em ADMIN_CONTAS tentou entrar');
      return sendJson(res, 403, { error: { message: 'Esta conta ainda não foi liberada no painel.' } });
    }
  } else if (safeEqual(req.headers['x-admin-password'] || '', password)) {
    brand = 'agtv';
  }

  if (!brand) {
    failuresTotal.hit(ALL_CLIENTS);
    if (failuresByIp.hit(ip)) console.warn('[admin] login bloqueado por excesso de tentativas');
    await wait(FAIL_DELAY_MS);
    return sendJson(res, 401, { error: { message: 'E-mail ou senha incorretos.' } });
  }

  failuresByIp.reset(ip);
  res.setHeader('Set-Cookie', sessionCookie(req, createSession(password, brand), SESSION_MS));
  return sendJson(res, 200, { ok: true, marca: brand });
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

  // POST com a sessão e o cabeçalho de ação pede os destaques à IA; sem ele, é o login.
  const acao = req.headers['x-admin-acao'];
  if (acao === 'contas' || acao === 'senha') {
    const owner = validSession(readSession(req), password);
    if (!owner) return sendJson(res, 401, { error: { message: 'Entre de novo.' } });
    if (owner !== 'agtv') return sendJson(res, 403, { error: { message: 'Só o dono do painel pode fazer isso.' } });
    if (req.method === 'POST' && acao === 'senha') return setAccountPassword(req, res);
    if (req.method === 'GET' && acao === 'contas') return accountsList(res);
    return sendJson(res, 405, { error: { message: 'Método não permitido.' } });
  }
  if (req.method === 'POST' && req.headers['x-admin-acao'] === 'destaques') {
    if (!validSession(readSession(req), password)) {
      return sendJson(res, 401, { error: { message: 'Entre de novo.' } });
    }
    return highlights(req, res);
  }
  if (req.method === 'POST') return login(req, res, password);
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', sessionCookie(req, '', 0));
    return sendJson(res, 200, { ok: true });
  }

  const brand = validSession(readSession(req), password);
  if (!brand) {
    return sendJson(res, 401, { error: { message: 'Entre de novo.' } });
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
    marca: brand,
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
