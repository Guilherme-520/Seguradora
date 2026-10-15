const { getAdminClient } = require('../lib/supabase');
const { STATUSES, PRIORITIES, CATEGORIES } = require('../lib/validation');

/**
 * Conta chamados agrupados pelos valores de uma coluna.
 * Usa contagem no banco (head: true) em vez de baixar as linhas — o PostgREST
 * limita respostas a 1000 linhas, o que distorceria os totais.
 */
async function countBy(db, column, values) {
  const results = await Promise.all(values.map(value =>
    db.from('tickets').select('id', { count: 'exact', head: true }).eq(column, value)
  ));
  const counts = {};
  values.forEach((value, i) => {
    if (results[i].error) throw results[i].error;
    counts[value] = results[i].count || 0;
  });
  return counts;
}

/**
 * GET /api/dashboard/stats
 * Retorna contadores e indicadores para o painel.
 */
async function getStats(req, res) {
  const db = getAdminClient();

  const [byStatus, byPriority, byCategory, recent] = await Promise.all([
    countBy(db, 'status', STATUSES),
    countBy(db, 'priority', PRIORITIES),
    countBy(db, 'category', CATEGORIES),
    db
      .from('tickets')
      .select('id, protocol, title, status, priority, requester_name, created_at')
      .order('created_at', { ascending: false })
      .limit(5)
      .then(({ data }) => data || []),
  ]);

  const total = Object.values(byStatus).reduce((a, b) => a + b, 0);
  const open = byStatus.aberto + byStatus.em_atendimento + byStatus.aguardando_cliente;
  const critical = byPriority.critica;

  // Remove categorias sem chamados (mantém o formato anterior da resposta)
  Object.keys(byCategory).forEach(k => { if (!byCategory[k]) delete byCategory[k]; });

  return res.json({
    total,
    open,
    critical,
    by_status: byStatus,
    by_priority: byPriority,
    by_category: byCategory,
    recent_tickets: recent,
  });
}

module.exports = { getStats };
