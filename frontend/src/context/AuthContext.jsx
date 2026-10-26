import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { authService } from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('bm_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [token, setToken] = useState(() => localStorage.getItem('bm_token') || null)
  const [loading, setLoading] = useState(false)
  const [initialising, setInitialising] = useState(true)

  // Verify stored token on mount
  useEffect(() => {
    const verify = async () => {
      if (!token) {
        setInitialising(false)
        return
      }
      try {
        const res = await authService.getMe()
        setUser(res.data.user)
        localStorage.setItem('bm_user', JSON.stringify(res.data.user))
      } catch {
        // Token invalid or expired — clear everything
        setToken(null)
        setUser(null)
        localStorage.removeItem('bm_token')
        localStorage.removeItem('bm_user')
      } finally {
        setInitialising(false)
      }
    }
    verify()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const persist = useCallback((tok, usr) => {
    setToken(tok)
    setUser(usr)
    localStorage.setItem('bm_token', tok)
    localStorage.setItem('bm_user', JSON.stringify(usr))
  }, [])

  const login = useCallback(async (email, password) => {
    setLoading(true)
    try {
      const res = await authService.login({ email, password })
      persist(res.data.token, res.data.user)
      return { success: true, user: res.data.user }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Login failed. Please try again.',
      }
    } finally {
      setLoading(false)
    }
  }, [persist])

  const register = useCallback(async (formData) => {
    setLoading(true)
    try {
      const res = await authService.register(formData)
      persist(res.data.token, res.data.user)
      return { success: true, user: res.data.user }
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Registration failed. Please try again.',
      }
    } finally {
      setLoading(false)
    }
  }, [persist])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('bm_token')
    localStorage.removeItem('bm_user')
  }, [])

  const value = useMemo(
    () => ({ user, token, loading, initialising, login, register, logout, isAuthenticated: !!user }),
    [user, token, loading, initialising, login, register, logout]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
