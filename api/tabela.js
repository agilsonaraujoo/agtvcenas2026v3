const { hasSameOrigin, sendJson } = require('../lib/serverApi');
const { COMPETITIONS, fetchStandings } = require('../lib/epg/standings');

// Tabela de classificação de um campeonato de futebol: /api/tabela?c=BSA
module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { error: { message: 'Método não permitido.' } });
  }
  if (!hasSameOrigin(req)) {
    return sendJson(res, 403, { error: { message: 'Origem não permitida.' } });
  }

  const code = String(new URL(req.url, 'http://local').searchParams.get('c') || '').toUpperCase();
  if (!COMPETITIONS[code]) {
    return sendJson(res, 404, { error: { message: 'Campeonato sem tabela disponível.' } });
  }

  const data = await fetchStandings(code);
  if (!data) {
    res.setHeader('Cache-Control', 'no-store');
    return sendJson(res, 503, { error: { message: 'A tabela está indisponível agora.' } });
  }
  res.setHeader('Cache-Control', 'public, s-maxage=600, stale-while-revalidate=1800');
  return sendJson(res, 200, data);
};
