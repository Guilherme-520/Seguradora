// Função serverless do Vercel: todas as requisições /api/* são reescritas
// para cá (ver vercel.json) e tratadas pelo app Express do backend.
module.exports = require('../backend/src/app');
