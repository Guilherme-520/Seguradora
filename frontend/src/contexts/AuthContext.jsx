import { createContext, useContext, useState, useEffect } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return
    }
    authApi.me()
      .then(({ user }) => setUser(user))
      .catch(() => {
        localStorage.removeItem('access_token')
      })
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const data = await authApi.login(email, password)
    localStorage.setItem('access_token', data.access_token)
    setUser(data.user)
    return data
  }

  async function logout() {
    await authApi.logout().catch(() => {})
    localStorage.removeItem('access_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
