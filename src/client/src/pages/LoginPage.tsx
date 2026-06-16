import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, LogIn, Ship } from 'lucide-react'
import { Button, Field, TextInput } from '../components/ui'
import { useAuth } from '../auth/useAuth'
import { getApiErrorMessage } from '../lib/api'
import styles from './login.module.css'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(username, password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(getApiErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.screen}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <Ship size={22} aria-hidden />
          </span>
          <span className={styles.brandText}>
            <span className={styles.brandName}>DockerWeb</span>
            <span className={styles.brandTag}>Control Panel</span>
          </span>
        </div>

        <h1 className={styles.heading}>Sign in</h1>
        <p className={styles.subheading}>
          Enter the admin credentials to manage Docker.
        </p>

        {error ? (
          <div className={styles.error} role="alert">
            <AlertCircle size={16} aria-hidden />
            {error}
          </div>
        ) : null}

        <Field label="Username">
          {(id) => (
            <TextInput
              id={id}
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
              required
            />
          )}
        </Field>

        <Field label="Password">
          {(id) => (
            <TextInput
              id={id}
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          )}
        </Field>

        <Button
          type="submit"
          variant="primary"
          className={styles.submit}
          disabled={submitting}
          icon={<LogIn size={16} aria-hidden />}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
    </div>
  )
}
