const { hasSameOrigin, sendJson } = require('../lib/serverApi');
const { CHANNELS, GROUPS, getChannel } = require('../lib/epg/channels');
const { TIMEZONE, DAY_MS, dateKey, dayRange, isValidDateKey } = require('../lib/epg/time');
const { findCurrentAndNext, hasUpcomingData, programsForDate } = require('../lib/epg/schedule');
const { loadDataset } = require('../lib/epg/store');

const getQuery = (req) => (
  req.query || Object.fromEntries(new URL(req.url, 'http://localhost').searchParams)
);

const buildChannel = (config, entry, { now, key, includePrograms }) => {
  const programs = entry ? entry.programs : [];
  const available = hasUpcomingData(programs, now);
  const { current, next } = available ? findCurrentAndNext(programs, now) : { current: null, next: null };

  const result = {
    slug: config.slug,
    channel: config.name,
    channelId: entry ? entry.channelId : null,
    group: config.group,
    source: entry ? entry.source : null,
    available,
    current,
    next,
  };

  if (includePrograms) {
    result.date = key;
    result.programs = available ? programsForDate(programs, key) : [];
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

  const channels = scope.map((config) => (
    buildChannel(config, dataset.channels[config.slug], { now, key, includePrograms })
  ));

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
