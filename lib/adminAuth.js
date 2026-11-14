// Sessão e limites da página /admin. A senha só viaja no login; depois vale um cookie HttpOnly
// assinado. Os contadores ficam na memória de cada instância da Vercel: seguram tentativas em
// sequência, mas não somam entre instâncias, então a senha longa continua sendo a defesa principal.
const crypto = require('crypto');

const COOKIE_NAME = 'agtv_admin';
const SESSION_MS = 8 * 60 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 12;
const MAX_TRACKED_KEYS = 5000;

const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest();

const safeEqual = (given, expected) => crypto.timingSafeEqual(sha256(given), sha256(expected));

// Janela fixa por chave: hit() conta, blocked() só consulta.
const createLimiter = ({ limit, windowMs, now = Date.now }) => {
  const entries = new Map();

  const current = (key) => {
    const entry = entries.get(key);
    if (entry && entry.resetAt > now()) return entry;
    entries.delete(key);
    return null;
  };

  const prune = () => {
    if (entries.size < MAX_TRACKED_KEYS) return;
    for (const [key, entry] of entries) {
      if (entry.resetAt <= now()) entries.delete(key);
    }
    // Enxurrada de IPs novos: descarta os mais antigos para a memória não crescer sem fim.
    for (const key of entries.keys()) {
      if (entries.size < MAX_TRACKED_KEYS) break;
      entries.delete(key);
    }
  };

  const blocked = (key) => {
    const entry = current(key);
    if (!entry || entry.count < limit) return 0;
    return Math.ceil((entry.resetAt - now()) / 1000);
  };

  const hit = (key) => {
    prune();
    const entry = current(key) || { count: 0, resetAt: now() + windowMs };
    entry.count += 1;
    entries.set(key, entry);
    return blocked(key);
  };

  return { blocked, hit, reset: (key) => entries.delete(key) };
};

// Na Vercel, x-real-ip e x-forwarded-for são definidos pela própria plataforma.
const clientIp = (req) => (
  req.headers['x-real-ip']
  || String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()
  || (req.socket && req.socket.remoteAddress)
  || 'desconhecido'
);

// Cada conta entra numa marca (agtv, csplay, valk...). A marca vai dentro do cookie assinado,
// então ninguém troca de marca editando o cookie.
const BRAND_PATTERN = /^[a-z0-9-]{2,20}$/;

const sign = (payload, password) => crypto
  .createHmac('sha256', sha256(`agtv-admin-session:${password}`))
  .update(String(payload))
  .digest('hex');

// Trocar ADMIN_PASSWORD invalida todas as sessões abertas.
const createSession = (password, brand = 'agtv', now = Date.now()) => {
  if (!BRAND_PATTERN.test(brand)) throw new Error('Marca inválida.');
  const expiresAt = now + SESSION_MS;
  return `${expiresAt}.${brand}.${sign(`${expiresAt}.${brand}`, password)}`;
};

// Devolve a marca da sessão, ou null se ela for inválida ou tiver vencido.
const validSession = (token, password, now = Date.now()) => {
  const [expiresAt, brand, signature, extra] = String(token || '').split('.');
  if (extra !== undefined || !/^\d+$/.test(expiresAt || '') || !BRAND_PATTERN.test(brand || '') || !signature) return null;
  if (Number(expiresAt) <= now) return null;
  return safeEqual(signature, sign(`${expiresAt}.${brand}`, password)) ? brand : null;
};

// ADMIN_CONTAS na Vercel: "email=marca" separados por vírgula ou ponto e vírgula.
const parseAccounts = (raw) => {
  const accounts = new Map();
  for (const item of String(raw || '').split(/[;,\n]/)) {
    const [email, brand] = item.split('=').map((part) => (part || '').trim().toLowerCase());
    if (email && email.includes('@') && BRAND_PATTERN.test(brand || '')) accounts.set(email, brand);
  }
  return accounts;
};

const readSession = (req) => {
  const cookies = String(req.headers.cookie || '').split(';').map((item) => item.trim());
  const cookie = cookies.find((item) => item.startsWith(`${COOKIE_NAME}=`));
  return cookie ? cookie.slice(COOKIE_NAME.length + 1) : '';
};

const sessionCookie = (req, value, maxAgeMs) => {
  const secure = req.headers['x-forwarded-proto'] === 'https' ? '; Secure' : '';
  const maxAge = Math.floor(maxAgeMs / 1000);
  return `${COOKIE_NAME}=${value}; Path=/api/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`;
};

module.exports = {
  MIN_PASSWORD_LENGTH,
  SESSION_MS,
  clientIp,
  createLimiter,
  createSession,
  parseAccounts,
  readSession,
  safeEqual,
  sessionCookie,
  validSession,
};
