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

const sign = (expiresAt, password) => crypto
  .createHmac('sha256', sha256(`agtv-admin-session:${password}`))
  .update(String(expiresAt))
  .digest('hex');

// Trocar ADMIN_PASSWORD invalida todas as sessões abertas.
const createSession = (password, now = Date.now()) => {
  const expiresAt = now + SESSION_MS;
  return `${expiresAt}.${sign(expiresAt, password)}`;
};

const validSession = (token, password, now = Date.now()) => {
  const [expiresAt, signature] = String(token || '').split('.');
  if (!/^\d+$/.test(expiresAt || '') || !signature || Number(expiresAt) <= now) return false;
  return safeEqual(signature, sign(expiresAt, password));
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
  readSession,
  safeEqual,
  sessionCookie,
  validSession,
};
