const express = require('express');
function placeholderRoutes(tabName) {
  const router = express.Router();
  router.get('/', (req, res) => {
    res.json({ tab: tabName, status: 'em_breve', message: `A aba ${tabName} ainda nao foi ativada.`, data: null });
  });
  return router;
}
module.exports = placeholderRoutes;
