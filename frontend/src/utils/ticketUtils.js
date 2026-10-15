/**
 * Utilitários de chamados: labels, cores, badges.
 */

export const STATUS_LABELS = {
  aberto: 'Aberto',
  em_atendimento: 'Em atendimento',
  aguardando_cliente: 'Aguardando cliente',
  resolvido: 'Resolvido',
  encerrado: 'Encerrado',
}

export const STATUS_COLORS = {
  aberto: 'bg-blue-100 text-blue-800',
  em_atendimento: 'bg-yellow-100 text-yellow-800',
  aguardando_cliente: 'bg-orange-100 text-orange-800',
  resolvido: 'bg-green-100 text-green-800',
  encerrado: 'bg-gray-100 text-gray-600',
}

export const PRIORITY_LABELS = {
  baixa: 'Baixa',
  media: 'Média',
  alta: 'Alta',
  critica: 'Crítica',
}

export const PRIORITY_COLORS = {
  baixa: 'bg-gray-100 text-gray-600',
  media: 'bg-blue-100 text-blue-700',
  alta: 'bg-orange-100 text-orange-700',
  critica: 'bg-red-100 text-red-700',
}

export const CATEGORY_LABELS = {
  sinistro: 'Sinistro',
  apolice: 'Apólice',
  cobranca: 'Cobrança',
  cancelamento: 'Cancelamento',
  duvida: 'Dúvida',
  reclamacao: 'Reclamação',
  outro: 'Outro',
}

export const ORIGIN_LABELS = {
  agente: '🤖 Agente WXO',
  usuario: '👤 Usuário',
}

export function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}
