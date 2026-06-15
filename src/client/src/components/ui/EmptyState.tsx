import type { ReactNode } from 'react'
import styles from './ui.module.css'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  message?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      {icon && (
        <div className={styles.emptyIcon} aria-hidden>
          {icon}
        </div>
      )}
      <p className={styles.emptyTitle}>{title}</p>
      {message && <p className={styles.emptyMessage}>{message}</p>}
      {action}
    </div>
  )
}
