const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const routes = require('./routes');

const app = express();

// No Vercel o app roda atrás de um proxy (necessário para req.ip / req.protocol corretos)
app.set('trust proxy', 1);

// ─── Segurança e logging ─────────────────────────────────────────────────────

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'tiny' : 'dev'));

// ─── CORS ────────────────────────────────────────────────────────────────────
// No Vercel frontend e API ficam no mesmo domínio, então o CORS só importa
// para desenvolvimento local ou para um frontend hospedado em outro domínio.

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Sem origin: curl, Orchestrate, etc. — sempre permitido
    if (!origin) return callback(null, true);
    const allowed =
      allowedOrigins.includes(origin) ||
      allowedOrigins.includes('*') ||
      /\.vercel\.app$/.test(origin);
    callback(null, allowed);
  },
  credentials: true,
}));

// ─── Body parsing ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────

const health = (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.1.0' });
};
app.get('/health', health);
app.get('/api/health', health);

// ─── Spec OpenAPI (para importar no watsonx Orchestrate) ─────────────────────
// Serve o openapi.yaml da raiz com a URL do servidor apontando para o host atual.

const OPENAPI_PATH = path.join(__dirname, '..', '..', 'openapi.yaml');

app.get('/api/openapi.yaml', (req, res) => {
  let spec;
  try {
    spec = fs.readFileSync(OPENAPI_PATH, 'utf8');
  } catch {
    return res.status(404).json({ error: 'openapi.yaml não encontrado no servidor' });
  }
  const baseUrl = `${req.protocol}://${req.get('host')}/api`;
  res.type('text/yaml').send(spec.replace(/https:\/\/SEU-PROJETO\.vercel\.app\/api/g, baseUrl));
});

// ─── Rotas ────────────────────────────────────────────────────────────────────

app.use('/api', routes);

// ─── 404 ──────────────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// ─── Error handler ────────────────────────────────────────────────────────────

app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON inválido no corpo da requisição' });
  }
  console.error('Erro não tratado:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

module.exports = app;
