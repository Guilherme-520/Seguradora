/**
 * API client — todas as chamadas ao backend.
 * O token JWT é lido do localStorage e enviado como Bearer.
 */

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

function getToken() {
  return localStorage.getItem('access_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const error = new Error(data.error || `Erro ${res.status}`)
    error.status = res.status
    error.data = data
    throw error
  }

  return data
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request('/auth/me'),
  logout: () =>
    request('/auth/logout', { method: 'POST' }),
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  stats: () => request('/dashboard/stats'),
}

// ─── Tickets ─────────────────────────────────────────────────────────────────

export const ticketsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') qs.set(k, v)
    })
    return request(`/tickets?${qs}`)
  },

  getByProtocol: (protocol) => request(`/tickets/${encodeURIComponent(protocol)}`),

  getById: (id) => request(`/tickets/id/${id}`),

  update: (protocol, data) =>
    request(`/tickets/${encodeURIComponent(protocol)}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...data, origin: 'usuario' }),
    }),

  addInteraction: (protocol, content) =>
    request(`/tickets/${encodeURIComponent(protocol)}/interactions`, {
      method: 'POST',
      body: JSON.stringify({ content, origin: 'usuario' }),
    }),
}
