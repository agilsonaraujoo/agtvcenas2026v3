const { fetchTmdb, hasSameOrigin, sendJson } = require('../lib/serverApi');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: { message: 'Método não permitido.' } });
  }
  if (!hasSameOrigin(req)) {
    return sendJson(res, 403, { error: { message: 'Origem não permitida.' } });
  }

  try {
    const data = await fetchTmdb('trending/all/day');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return sendJson(res, 200, { results: data.results || [] });
  } catch (error) {
    console.error('TMDB trending request failed:', error.message);
    return sendJson(res, error.statusCode || 502, {
      error: { message: error.message || 'Não foi possível carregar o conteúdo em alta.' },
    });
  }
};
