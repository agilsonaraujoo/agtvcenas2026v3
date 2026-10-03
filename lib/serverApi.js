const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent';

const sendJson = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
};

const hasSameOrigin = (req) => {
  const origin = req.headers.origin;
  if (!origin) return true;

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!host) return false;

  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
};

const normalizeTitle = (value) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, ' ')
  .trim();

const fetchTmdb = async (path, params = {}) => {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    const error = new Error('A integração com o catálogo não está configurada.');
    error.statusCode = 503;
    throw error;
  }

  const url = new URL(`${TMDB_BASE_URL}/${path}`);
  url.search = new URLSearchParams({
    ...params,
    api_key: apiKey,
    language: 'pt-BR',
    include_adult: 'false',
    page: '1',
  });

  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error('Não foi possível consultar o catálogo.');
    error.statusCode = 502;
    throw error;
  }

  return response.json();
};

module.exports = {
  GEMINI_BASE_URL,
  fetchTmdb,
  hasSameOrigin,
  normalizeTitle,
  sendJson,
};
