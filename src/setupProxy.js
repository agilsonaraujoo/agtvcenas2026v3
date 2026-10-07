// Em desenvolvimento, o CRA não executa as funções de /api. Este middleware expõe somente
// /api/programacao, lendo o mesmo JSON de produção (ou EPG_DATA_FILE / EPG_DATA_URL).
const handler = require('../api/programacao');

module.exports = function setupProxy(app) {
  app.use('/api/programacao', (req, res) => {
    req.url = req.originalUrl;
    handler(req, res);
  });
};
