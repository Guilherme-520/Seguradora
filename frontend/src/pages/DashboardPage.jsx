import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../services/api'
import { StatusBadge, PriorityBadge } from '../components/Badges'
import { LoadingOverlay, Alert } from '../components/UI'
import { formatDate, CATEGORY_LABELS } from '../utils/ticketUtils'

function StatCard({ label, value, color = 'text-gray-900', sublabel }) {
  return (
    <div className="card p-6">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
      {sublabel && <p className="mt-1 text-xs text-gray-400">{sublabel}</p>}
    </div>
  )
}

function BarStat({ label, value, max, color = 'bg-brand-500' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    dashboardApi.stats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingOverlay text="Carregando painel..." />

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Painel</h1>
        <p className="text-sm text-gray-500">Visão geral dos chamados em tempo real</p>
      </div>

      {error && <Alert message={error} className="mb-6" />}

      {stats && (
        <>
          {/* KPIs */}
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="Total de chamados" value={stats.total} sublabel="todos os status" />
            <StatCard
              label="Chamados abertos"
              value={stats.open}
              color="text-blue-600"
              sublabel="aberto + em atendimento + aguardando"
            />
            <StatCard
              label="Prioridade crítica"
              value={stats.critical}
              color="text-red-600"
              sublabel="requer atenção imediata"
            />
            <StatCard
              label="Resolvidos"
              value={(stats.by_status?.resolvido || 0) + (stats.by_status?.encerrado || 0)}
              color="text-green-600"
              sublabel="resolvidos + encerrados"
            />
          </div>

          {/* Gráficos por status/prioridade + tabela recentes */}
          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Por status */}
            <div className="card p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Por status</h2>
              <div className="space-y-3">
                <BarStat label="Aberto" value={stats.by_status.aberto} max={stats.total} color="bg-blue-400" />
                <BarStat label="Em atendimento" value={stats.by_status.em_atendimento} max={stats.total} color="bg-yellow-400" />
                <BarStat label="Aguard. cliente" value={stats.by_status.aguardando_cliente} max={stats.total} color="bg-orange-400" />
                <BarStat label="Resolvido" value={stats.by_status.resolvido} max={stats.total} color="bg-green-400" />
                <BarStat label="Encerrado" value={stats.by_status.encerrado} max={stats.total} color="bg-gray-300" />
              </div>
            </div>

            {/* Por prioridade */}
            <div className="card p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Por prioridade</h2>
              <div className="space-y-3">
                <BarStat label="Crítica" value={stats.by_priority.critica} max={stats.total} color="bg-red-500" />
                <BarStat label="Alta" value={stats.by_priority.alta} max={stats.total} color="bg-orange-400" />
                <BarStat label="Média" value={stats.by_priority.media} max={stats.total} color="bg-blue-400" />
                <BarStat label="Baixa" value={stats.by_priority.baixa} max={stats.total} color="bg-gray-300" />
              </div>
            </div>

            {/* Por categoria */}
            <div className="card p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">Por categoria</h2>
              <div className="space-y-3">
                {Object.entries(stats.by_category || {})
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, count]) => (
                    <BarStat
                      key={cat}
                      label={CATEGORY_LABELS[cat] || cat}
                      value={count}
                      max={stats.total}
                      color="bg-brand-400"
                    />
                  ))}
              </div>
            </div>
          </div>

          {/* Chamados recentes */}
          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <h2 className="font-semibold text-gray-900">Chamados recentes</h2>
              <Link to="/tickets" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                Ver todos →
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-6 py-3">Protocolo</th>
                    <th className="px-6 py-3">Título</th>
                    <th className="px-6 py-3">Solicitante</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Prioridade</th>
                    <th className="px-6 py-3">Criado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.recent_tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-3">
                        <Link
                          to={`/tickets/${t.protocol}`}
                          className="font-mono text-xs font-medium text-brand-600 hover:underline"
                        >
                          {t.protocol}
                        </Link>
                      </td>
                      <td className="max-w-xs truncate px-6 py-3 text-gray-900">{t.title}</td>
                      <td className="whitespace-nowrap px-6 py-3 text-gray-600">{t.requester_name}</td>
                      <td className="whitespace-nowrap px-6 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-3">
                        <PriorityBadge priority={t.priority} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-3 text-gray-500">{formatDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
