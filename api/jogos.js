const { hasSameOrigin, sendJson } = require('../lib/serverApi');
const { TIMEZONE, DAY_MS, dateKey, dayRange } = require('../lib/epg/time');
const { gamesForDate } = require('../lib/epg/games');
const { loadDataset } = require('../lib/epg/store');

// Jogos ao vivo de hoje e amanhã, tirados da mesma grade de /api/programacao.
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: { message: 'Método não permitido.' } });
  }
  if (!hasSameOrigin(req)) {
    return sendJson(res, 403, { error: { message: 'Origem não permitida.' } });
  }

  let loaded;
  try {
    loaded = await loadDataset();
  } catch (error) {
    console.error('EPG dataset unavailable:', error.message);
    res.setHeader('Cache-Control', 'no-store');
    return sendJson(res, 503, { error: { message: 'Os jogos estão temporariamente indisponíveis.' }, days: [] });
  }

  const { data: dataset, stale } = loaded;
  const now = Date.now();
  const today = dateKey(new Date(now));
  const tomorrow = dateKey(new Date(dayRange(today).start.getTime() + DAY_MS));
  const channels = Object.values(dataset.channels);

  res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  return sendJson(res, 200, {
    timezone: TIMEZONE,
    now: new Date(now).toISOString(),
    generatedAt: dataset.generatedAt,
    stale,
    days: [today, tomorrow].map((date) => ({ date, games: gamesForDate(channels, date) })),
  });
};
