import type { ReactNode } from 'react'
import styles from './ui.module.css'

type BadgeTone = 'accent' | 'neutral'

interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
}

export function Badge({ tone = 'neutral', children }: BadgeProps) {
  const toneClass = tone === 'accent' ? styles.badgeAccent : styles.badgeNeutral
  return <span className={`${styles.badge} ${toneClass}`}>{children}</span>
}
