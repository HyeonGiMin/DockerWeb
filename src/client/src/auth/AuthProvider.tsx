import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api'
import { clearToken, isAuthenticated, setToken } from '../lib/auth'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const navigate = useNavigate()
  const [authed, setAuthed] = useState<boolean>(() => isAuthenticated())

  const login = useCallback(async (username: string, password: string) => {
    const result = await authApi.login(username, password)
    setToken(result.token)
    setAuthed(true)
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setAuthed(false)
    navigate('/login', { replace: true })
  }, [navigate])

  const value = useMemo<AuthContextValue>(
    () => ({ isAuthenticated: authed, login, logout }),
    [authed, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
