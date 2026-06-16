import { createContext } from 'react'

export interface AuthContextValue {
  isAuthenticated: boolean
  /** Authenticate; stores the token on success or throws on failure. */
  login: (username: string, password: string) => Promise<void>
  /** Clear the token and navigate to the login page. */
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
