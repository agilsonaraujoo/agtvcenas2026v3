// Em desenvolvimento, o CRA não executa as funções de /api. Este middleware expõe somente
// /api/programacao e /api/jogos, lendo o mesmo JSON de produção (ou EPG_DATA_FILE / EPG_DATA_URL).
const handlers = {
  '/api/programacao': require('../api/programacao'),
  '/api/jogos': require('../api/jogos'),
};

module.exports = function setupProxy(app) {
  Object.entries(handlers).forEach(([route, handler]) => {
    app.use(route, (req, res) => {
      req.url = req.originalUrl;
      handler(req, res);
    });
  });
};
