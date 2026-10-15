const STATUSES = ['aberto', 'em_atendimento', 'aguardando_cliente', 'resolvido', 'encerrado'];
const PRIORITIES = ['baixa', 'media', 'alta', 'critica'];
const CATEGORIES = ['sinistro', 'apolice', 'cobranca', 'cancelamento', 'duvida', 'reclamacao', 'outro'];

/**
 * Retorna mensagem de erro se `value` não pertence a `allowed`, senão null.
 */
function checkEnum(field, value, allowed) {
  if (value === undefined || value === null || value === '') return null;
  return allowed.includes(value)
    ? null
    : `Valor inválido para ${field}: "${value}". Use um de: ${allowed.join(', ')}`;
}

function onlyDigits(value) {
  return typeof value === 'string' ? value.replace(/\D/g, '') : value;
}

/**
 * Remove caracteres com significado especial na sintaxe de filtro do PostgREST
 * (`,` `(` `)` separam condições em .or(); `%` `*` são curingas do ilike).
 */
function sanitizeSearch(value) {
  return String(value).replace(/[,()%*\\]/g, ' ').trim().slice(0, 100);
}

function toInt(value, fallback, min, max) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
}

module.exports = {
  STATUSES,
  PRIORITIES,
  CATEGORIES,
  checkEnum,
  onlyDigits,
  sanitizeSearch,
  toInt,
};
