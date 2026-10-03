const { fetchTmdb, hasSameOrigin, normalizeTitle, sendJson } = require('../lib/serverApi');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: { message: 'Método não permitido.' } });
  }
  if (!hasSameOrigin(req)) {
    return sendJson(res, 403, { error: { message: 'Origem não permitida.' } });
  }

  const requestUrl = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const query = (requestUrl.searchParams.get('query') || '').trim();
  const mediaType = requestUrl.searchParams.get('mediaType');
  if (!query || query.length > 120 || !['movie', 'tv'].includes(mediaType)) {
    return sendJson(res, 400, { error: { message: 'Título ou tipo de conteúdo inválido.' } });
  }

  try {
    const data = await fetchTmdb('search/multi', { query });
    const normalizedQuery = normalizeTitle(query);
    const match = (data.results || []).find((item) => {
      if (!item.poster_path || item.media_type !== mediaType) return false;
      return [item.title, item.name, item.original_title, item.original_name]
        .some((title) => title && normalizeTitle(title) === normalizedQuery);
    });

    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    return sendJson(res, 200, {
      posterUrl: match ? `https://image.tmdb.org/t/p/w500${match.poster_path}` : null,
    });
  } catch (error) {
    console.error('TMDB title search failed:', error.message);
    return sendJson(res, error.statusCode || 502, {
      error: { message: error.message || 'Não foi possível buscar a capa do título.' },
    });
  }
};
