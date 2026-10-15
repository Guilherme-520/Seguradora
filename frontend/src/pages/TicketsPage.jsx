import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ticketsApi } from '../services/api'
import { StatusBadge, PriorityBadge } from '../components/Badges'
import { LoadingOverlay, Alert } from '../components/UI'
import { formatDate, STATUS_LABELS, PRIORITY_LABELS, CATEGORY_LABELS } from '../utils/ticketUtils'

const STATUS_OPTIONS = ['', 'aberto', 'em_atendimento', 'aguardando_cliente', 'resolvido', 'encerrado']
const PRIORITY_OPTIONS = ['', 'baixa', 'media', 'alta', 'critica']
const CATEGORY_OPTIONS = ['', 'sinistro', 'apolice', 'cobranca', 'cancelamento', 'duvida', 'reclamacao', 'outro']

export default function TicketsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [tickets, setTickets] = useState([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const page = parseInt(searchParams.get('page') || '1')
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const priority = searchParams.get('priority') || ''
  const category = searchParams.get('category') || ''

  const load = useCallback(() => {
    setLoading(true)
    setError('')
    ticketsApi
      .list({ page, search, status, priority, category, limit: 15 })
      .then(({ tickets, total, pages }) => {
        setTickets(tickets)
        setTotal(total)
        setPages(pages)
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [page, search, status, priority, category])

  useEffect(() => { load() }, [load])

  function setParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  function setPage(p) {
    const next = new URLSearchParams(searchParams)
    next.set('page', p)
    setSearchParams(next)
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Chamados</h1>
          <p className="text-sm text-gray-500">{total} chamado{total !== 1 ? 's' : ''} encontrado{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="text"
          className="input w-64"
          placeholder="Nome, CPF, protocolo, apólice..."
          value={search}
          onChange={(e) => setParam('search', e.target.value)}
        />

        <select className="input w-48" value={status} onChange={(e) => setParam('status', e.target.value)}>
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.filter(Boolean).map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>

        <select className="input w-40" value={priority} onChange={(e) => setParam('priority', e.target.value)}>
          <option value="">Todas as prioridades</option>
          {PRIORITY_OPTIONS.filter(Boolean).map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </select>

        <select className="input w-44" value={category} onChange={(e) => setParam('category', e.target.value)}>
          <option value="">Todas as categorias</option>
          {CATEGORY_OPTIONS.filter(Boolean).map((c) => (
            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
          ))}
        </select>

        {(search || status || priority || category) && (
          <button className="btn-secondary" onClick={() => setSearchParams({})}>
            Limpar filtros
          </button>
        )}
      </div>

      {error && <Alert message={error} className="mb-4" />}

      {loading ? (
        <LoadingOverlay text="Carregando chamados..." />
      ) : tickets.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <svg className="mb-3 h-12 w-12 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm">Nenhum chamado encontrado</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3">Protocolo</th>
                  <th className="px-6 py-3">Título</th>
                  <th className="px-6 py-3">Solicitante</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Prioridade</th>
                  <th className="px-6 py-3">Responsável</th>
                  <th className="px-6 py-3">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      <Link
                        to={`/tickets/${t.protocol}`}
                        className="font-mono text-xs font-semibold text-brand-600 hover:underline"
                      >
                        {t.protocol}
                      </Link>
                    </td>
                    <td className="max-w-xs px-6 py-4">
                      <Link
                        to={`/tickets/${t.protocol}`}
                        className="block truncate text-gray-900 hover:text-brand-600"
                        title={t.title}
                      >
                        {t.title}
                      </Link>
                      {t.policy_number && (
                        <span className="text-xs text-gray-400">Apólice: {t.policy_number}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="font-medium text-gray-900">{t.requester_name}</p>
                      {t.requester_email && (
                        <p className="text-xs text-gray-400">{t.requester_email}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                      {t.assignee_name || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                      {formatDate(t.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
              <span>Página {page} de {pages}</span>
              <div className="flex gap-2">
                <button
                  className="btn-secondary px-3 py-1 text-xs"
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                >
                  ← Anterior
                </button>
                <button
                  className="btn-secondary px-3 py-1 text-xs"
                  disabled={page >= pages}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
