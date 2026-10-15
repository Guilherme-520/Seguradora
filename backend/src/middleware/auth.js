const crypto = require('crypto');
const { getPublicClient } = require('../lib/supabase');

/**
 * Middleware: valida o Bearer token JWT do Supabase Auth.
 * Popula req.user e define a origem das alterações como 'usuario'.
 */
async function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação ausente ou inválido' });
  }

  const token = authHeader.substring(7);

  try {
    const supabase = getPublicClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Token inválido ou expirado' });
    }

    req.user = user;
    req.accessToken = token;
    req.actor = {
      origin: 'usuario',
      id: user.id,
      name: user.user_metadata?.full_name || user.email,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Falha na validação do token' });
  }
}

function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Middleware: valida a API key do agente do watsonx Orchestrate.
 * Header esperado: X-API-Key: <ORCHESTRATE_API_KEY>
 * Define a origem das alterações como 'agente'.
 */
function requireOrchestrateKey(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.ORCHESTRATE_API_KEY;

  if (!expectedKey) {
    return res.status(500).json({ error: 'ORCHESTRATE_API_KEY não configurada no servidor' });
  }

  if (!apiKey || !safeEqual(apiKey, expectedKey)) {
    return res.status(401).json({ error: 'API key inválida ou ausente' });
  }

  req.actor = {
    origin: 'agente',
    id: null,
    // O agente pode informar o nome do atendente/assistente; padrão "Agente WXO"
    name: (req.body && req.body.author_name) || 'Agente WXO',
  };
  next();
}

module.exports = { requireAuth, requireOrchestrateKey };
