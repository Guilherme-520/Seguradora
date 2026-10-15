const { getAdminClient, getPublicClient } = require('../lib/supabase');

/**
 * POST /api/auth/login
 * Faz login via Supabase Auth com email/senha.
 */
async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email e senha são obrigatórios' });
  }

  const supabase = getPublicClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  return res.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.full_name || data.user.email,
    },
    access_token: data.session.access_token,
    expires_at: data.session.expires_at,
  });
}

/**
 * POST /api/auth/logout
 * Invalida a sessão atual.
 */
async function logout(req, res) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.json({ message: 'Logout efetuado' });

  const token = authHeader.substring(7);

  // signOut com o JWT do usuário exige o client com service_role
  await getAdminClient().auth.admin.signOut(token).catch(() => {});
  return res.json({ message: 'Logout efetuado com sucesso' });
}

/**
 * GET /api/auth/me
 * Retorna os dados do usuário autenticado.
 */
async function me(req, res) {
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      name: req.user.user_metadata?.full_name || req.user.email,
    },
  });
}

module.exports = { login, logout, me };
