import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ticketsApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { StatusBadge, PriorityBadge } from '../components/Badges'
import { LoadingOverlay, Alert, Spinner } from '../components/UI'
import {
  formatDate,
  STATUS_LABELS,
  PRIORITY_LABELS,
  CATEGORY_LABELS,
  ORIGIN_LABELS,
} from '../utils/ticketUtils'

const STATUS_OPTIONS = ['aberto', 'em_atendimento', 'aguardando_cliente', 'resolvido', 'encerrado']

export default function TicketDetailPage() {
  const { protocol } = useParams()
  const { user } = useAuth()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Estado dos forms de edição
  const [newStatus, setNewStatus] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [newInteraction, setNewInteraction] = useState('')
  const [saving, setSaving] = useState(false)
  const [addingInteraction, setAddingInteraction] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    ticketsApi
      .getByProtocol(protocol)
      .then((d) => {
        setData(d)
        setNewStatus(d.ticket.status)
        setNewAssignee(d.ticket.assignee_name || '')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [protocol])

  useEffect(() => { load() }, [load])

  function flash(msg) {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3500)
  }

  async function handleSaveStatus() {
    if (newStatus === data.ticket.status && newAssignee === (data.ticket.assignee_name || '')) {
      return
    }
    setSaving(true)
    setError('')
    try {
      await ticketsApi.update(protocol, {
        status: newStatus !== data.ticket.status ? newStatus : undefined,
        assignee_name: newAssignee !== (data.ticket.assignee_name || '') ? newAssignee : undefined,
        author_name: user?.name || user?.email,
      })
      flash('Chamado atualizado com sucesso!')
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddInteraction(e) {
    e.preventDefault()
    if (!newInteraction.trim()) return
    setAddingInteraction(true)
    setError('')
    try {
      await ticketsApi.addInteraction(protocol, newInteraction.trim())
      setNewInteraction('')
      flash('Interação registrada!')
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setAddingInteraction(false)
    }
  }

  if (loading) return <LoadingOverlay text="Carregando chamado..." />

  if (error && !data) {
    return (
      <div className="p-8">
        <Alert message={error} />
        <Link to="/tickets" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
          ← Voltar para chamados
        </Link>
      </div>
    )
  }

  if (!data) return null

  const { ticket, interactions, history } = data
  const isClosed = ticket.status === 'encerrado'

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Link
            to="/tickets"
            className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
          >
            ← Chamados
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm font-semibold text-brand-600">{ticket.protocol}</span>
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
            <span className="text-sm text-gray-400">
              {CATEGORY_LABELS[ticket.category] || ticket.category}
            </span>
          </div>
        </div>
      </div>

      {successMsg && <Alert type="success" message={successMsg} onDismiss={() => setSuccessMsg('')} className="mb-4" />}
      {error && <Alert message={error} onDismiss={() => setError('')} className="mb-4" />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Coluna principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Descrição */}
          <div className="card p-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Descrição</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Timeline de interações + histórico */}
          <div className="card p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Histórico e interações
            </h2>

            {/* Merge e ordena por data */}
            {(() => {
              const items = [
                ...interactions.map((i) => ({ ...i, _type: 'interaction', _date: i.created_at })),
                ...history.map((h) => ({ ...h, _type: 'history', _date: h.changed_at })),
              ].sort((a, b) => new Date(a._date) - new Date(b._date))

              if (items.length === 0) {
                return <p className="text-sm text-gray-400">Nenhum registro ainda.</p>
              }

              return (
                <div className="space-y-4">
                  {items.map((item) => {
                    if (item._type === 'interaction') {
                      const isAgent = item.origin === 'agente'
                      return (
                        <div key={item.id} className={`flex gap-3 ${isAgent ? 'flex-row' : 'flex-row-reverse'}`}>
                          <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${isAgent ? 'bg-purple-500' : 'bg-brand-500'}`}>
                            {isAgent ? '🤖' : (item.author_name?.[0] || 'U')}
                          </div>
                          <div className={`max-w-lg rounded-xl px-4 py-3 text-sm ${isAgent ? 'bg-gray-100 text-gray-700' : 'bg-brand-50 text-gray-800'}`}>
                            <div className={`mb-1 flex items-center gap-2 text-xs font-medium ${isAgent ? 'text-gray-500' : 'text-brand-600'}`}>
                              <span>{item.author_name}</span>
                              <span className="opacity-50">·</span>
                              <span className="font-normal opacity-75">{formatDate(item.created_at)}</span>
                            </div>
                            <p className="leading-relaxed">{item.content}</p>
                          </div>
                        </div>
                      )
                    } else {
                      // history entry
                      return (
                        <div key={item.id} className="flex items-center gap-2 text-xs text-gray-400 pl-2">
                          <span className="h-px flex-1 bg-gray-100" />
                          <span className="flex items-center gap-1">
                            <span>{ORIGIN_LABELS[item.origin] || item.origin}</span>
                            <span className="font-medium text-gray-600">{item.author_name}</span>
                            alterou <strong>{item.field_name}</strong>
                            {item.old_value && <><span className="text-red-400 line-through">{item.old_value}</span> →</>}
                            <span className="text-green-600 font-medium">{item.new_value}</span>
                            · {formatDate(item.changed_at)}
                          </span>
                          <span className="h-px flex-1 bg-gray-100" />
                        </div>
                      )
                    }
                  })}
                </div>
              )
            })()}

            {/* Form de nova interação */}
            {!isClosed && (
              <form onSubmit={handleAddInteraction} className="mt-6 border-t border-gray-100 pt-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Adicionar comentário
                </label>
                <textarea
                  className="input min-h-[80px] resize-y"
                  placeholder="Escreva uma atualização ou nota..."
                  value={newInteraction}
                  onChange={(e) => setNewInteraction(e.target.value)}
                  disabled={addingInteraction}
                />
                <button
                  type="submit"
                  className="btn-primary mt-2"
                  disabled={!newInteraction.trim() || addingInteraction}
                >
                  {addingInteraction ? <><Spinner size="sm" /> Enviando...</> : 'Enviar comentário'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="space-y-4">
          {/* Dados do solicitante */}
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Solicitante</h2>
            <div className="space-y-2 text-sm">
              <p className="font-medium text-gray-900">{ticket.requester_name}</p>
              {ticket.requester_cpf && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-gray-400">CPF</span>
                  <span className="font-mono text-xs font-semibold text-gray-700">
                    {ticket.requester_cpf.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')}
                  </span>
                </div>
              )}
              {ticket.requester_email && (
                <p className="text-gray-600">{ticket.requester_email}</p>
              )}
              {ticket.requester_phone && (
                <p className="text-gray-600">{ticket.requester_phone}</p>
              )}
              {ticket.policy_number && (
                <div className="mt-2 rounded-md bg-gray-50 px-3 py-2">
                  <span className="text-xs text-gray-400">Apólice</span>
                  <p className="font-mono text-xs font-semibold text-gray-800">{ticket.policy_number}</p>
                </div>
              )}
            </div>
          </div>

          {/* Datas */}
          <div className="card p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Datas</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Criado</span>
                <span className="text-gray-700">{formatDate(ticket.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Atualizado</span>
                <span className="text-gray-700">{formatDate(ticket.updated_at)}</span>
              </div>
              {ticket.resolved_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Resolvido</span>
                  <span className="text-green-600">{formatDate(ticket.resolved_at)}</span>
                </div>
              )}
              {ticket.closed_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Encerrado</span>
                  <span className="text-gray-400">{formatDate(ticket.closed_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Gestão do chamado */}
          {!isClosed && (
            <div className="card p-5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Gestão</h2>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Status</label>
                  <select
                    className="input text-sm"
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Responsável</label>
                  <input
                    type="text"
                    className="input text-sm"
                    placeholder="Nome do responsável"
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                  />
                </div>
                <button
                  className="btn-primary w-full justify-center"
                  onClick={handleSaveStatus}
                  disabled={saving}
                >
                  {saving ? <><Spinner size="sm" /> Salvando...</> : 'Salvar alterações'}
                </button>
              </div>
            </div>
          )}

          {isClosed && (
            <div className="rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
              Este chamado está encerrado.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
