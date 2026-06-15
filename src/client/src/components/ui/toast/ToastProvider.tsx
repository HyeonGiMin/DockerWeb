import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import { ToastContext } from './toastContext'
import type { Toast, ToastKind } from './toastContext'
import styles from './toast.module.css'

const AUTO_DISMISS_MS = 5000

const ICONS: Record<ToastKind, typeof Info> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = crypto.randomUUID()
      setToasts((current) => [...current, { ...toast, id }])
      window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS)
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      toasts,
      push,
      dismiss,
      success: (title: string, message?: string) =>
        push({ kind: 'success', title, message }),
      error: (title: string, message?: string) =>
        push({ kind: 'error', title, message }),
      info: (title: string, message?: string) =>
        push({ kind: 'info', title, message }),
    }),
    [toasts, push, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={styles.viewport} role="region" aria-label="Notifications">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.kind]
          return (
            <div
              key={toast.id}
              className={`${styles.toast} ${styles[toast.kind]}`}
              role="status"
            >
              <Icon className={styles.icon} size={18} aria-hidden />
              <div className={styles.body}>
                <p className={styles.title}>{toast.title}</p>
                {toast.message && (
                  <p className={styles.message}>{toast.message}</p>
                )}
              </div>
              <button
                type="button"
                className={styles.close}
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
              >
                <X size={14} aria-hidden />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
