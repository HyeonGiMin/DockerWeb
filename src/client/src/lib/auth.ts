/** Token storage helpers backed by localStorage. */

const TOKEN_KEY = 'dockerweb_token'

/** Return the stored JWT, or null when absent. */
export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

/** Persist the JWT. */
export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

/** Remove the stored JWT. */
export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/** True when a token is present. */
export function isAuthenticated(): boolean {
  return Boolean(getToken())
}
