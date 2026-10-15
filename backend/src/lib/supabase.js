const { createClient } = require('@supabase/supabase-js');

let adminClient = null;
let publicClient = null;

/**
 * Supabase admin client — usa a service_role key.
 * Bypassa RLS. Utilizado apenas em operações privilegiadas do backend.
 */
function getAdminClient() {
  if (!adminClient) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
      throw new Error('SUPABASE_URL e SUPABASE_SECRET_KEY são obrigatórios');
    }
    adminClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }
  return adminClient;
}

/**
 * Supabase public client — usa a anon/publishable key.
 * Respeitará RLS. Usado para operações em nome do usuário autenticado.
 */
function getPublicClient() {
  if (!publicClient) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_PUBLISHABLE_KEY) {
      throw new Error('SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY são obrigatórios');
    }
    publicClient = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_PUBLISHABLE_KEY
    );
  }
  return publicClient;
}

module.exports = { getAdminClient, getPublicClient };
