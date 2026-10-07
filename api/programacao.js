const { fetchTmdb, hasSameOrigin, normalizeTitle, sendJson } = require('../lib/serverApi');
const { CHANNELS, GROUPS, getChannel } = require('../lib/epg/channels');
const { TIMEZONE, DAY_MS, dateKey, dayRange, isValidDateKey } = require('../lib/epg/time');
const { findCurrentAndNext, hasUpcomingData, programsForDate } = require('../lib/epg/schedule');
const { loadDataset } = require('../lib/epg/store');

const getQuery = (req) => (
  req.query || Object.fromEntries(new URL(req.url, 'http://localhost').searchParams)
);


const POSTER_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const posterCache = new Map();

const posterForTitle = async (title) => {
  if (!title || !process.env.TMDB_API_KEY) return null;

  const key = normalizeTitle(title);
  const cached = posterCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.posterUrl;

  try {
    const data = await fetchTmdb('search/multi', { query: title });
    const match = (data.results || []).find((item) => (
      item.poster_path
      && ['movie', 'tv'].includes(item.media_type)
      && [item.title, item.name, item.original_title, item.original_name]
        .some((value) => value && normalizeTitle(value) === key)
    ));
    const posterUrl = match ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : null;
    posterCache.set(key, { posterUrl, expiresAt: Date.now() + POSTER_CACHE_TTL_MS });
    return posterUrl;
  } catch (error) {
    console.error('[EPG] TMDB poster lookup failed:', error.message);
    posterCache.set(key, { posterUrl: null, expiresAt: Date.now() + POSTER_CACHE_TTL_MS });
    return null;
  }
};

const enrichProgram = async (program) => {
  if (!program) return program;
  const posterUrl = await posterForTitle(program.title);
  return posterUrl ? { ...program, posterUrl } : program;
};

const buildChannel = async (config, entry, { now, key, includePrograms, slug }) => {
  const programs = entry ? entry.programs : [];
  const available = hasUpcomingData(programs, now);
  const { current, next } = available ? findCurrentAndNext(programs, now) : { current: null, next: null };

  const enriched = await Promise.all([current, next].map(enrichProgram));
  const result = {
    slug: config.slug,
    channel: config.name,
    channelId: entry ? entry.channelId : null,
    group: config.group,
    source: entry ? entry.source : null,
    available,
    current: enriched[0],
    next: enriched[1],
  };

  if (includePrograms) {
    result.date = key;
    result.programs = available ? programsForDate(programs, key) : [];
    if (slug && config.slug === slug) {
      result.programs = await Promise.all(result.programs.map(enrichProgram));
    }
  }
  return result;
};

const buildAvailableDates = (dataset, today, now) => {
  const dates = [];
  for (let offset = 0; offset < 7; offset += 1) {
    const key = dateKey(new Date(dayRange(today).start.getTime() + offset * DAY_MS));
    const hasData = Object.values(dataset.channels).some((entry) => (
      hasUpcomingData(entry.programs, now) && programsForDate(entry.programs, key).length > 0
    ));
    if (hasData) dates.push(key);
  }
  return dates;
};

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: { message: 'Método não permitido.' } });
  }
  if (!hasSameOrigin(req)) {
    return sendJson(res, 403, { error: { message: 'Origem não permitida.' } });
  }

  const query = getQuery(req);
  const slug = typeof query.channel === 'string' ? query.channel.trim() : '';
  const requestedDate = typeof query.date === 'string' ? query.date.trim() : '';

  if (requestedDate && !isValidDateKey(requestedDate)) {
    return sendJson(res, 400, { error: { message: 'Data inválida. Use o formato YYYY-MM-DD.' } });
  }
  if (slug && !getChannel(slug)) {
    return sendJson(res, 404, {
      error: { message: 'Canal não encontrado.', channels: CHANNELS.map((item) => item.slug) },
    });
  }

  let loaded;
  try {
    loaded = await loadDataset();
  } catch (error) {
    console.error('EPG dataset unavailable:', error.message);
    res.setHeader('Cache-Control', 'no-store');
    return sendJson(res, 503, {
      available: false,
      timezone: TIMEZONE,
      error: { message: 'A programação está temporariamente indisponível.' },
      channels: [],
      missing: [],
    });
  }

  const { data: dataset, stale } = loaded;
  const now = Date.now();
  const today = dateKey(new Date(now));
  const key = requestedDate || today;
  const includePrograms = Boolean(requestedDate || slug);
  const scope = slug ? [getChannel(slug)] : CHANNELS;

  const channels = await Promise.all(scope.map((config) => (
    buildChannel(config, dataset.channels[config.slug], { now, key, includePrograms, slug })
  )));

  const missing = channels
    .filter((item) => !item.available)
    .map((item) => {
      const known = (dataset.missing || []).find((entry) => entry.slug === item.slug);
      return {
        slug: item.slug,
        channel: item.channel,
        reason: dataset.channels[item.slug] ? 'desatualizada' : 'sem-programacao-nas-fontes',
        attempts: known ? known.attempts : [],
      };
    });

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return sendJson(res, 200, {
    timezone: TIMEZONE,
    now: new Date(now).toISOString(),
    date: key,
    generatedAt: dataset.generatedAt,
    stale,
    groups: GROUPS,
    sources: dataset.sources,
    availableDates: buildAvailableDates(dataset, today, now),
    channels,
    missing,
  });
};
