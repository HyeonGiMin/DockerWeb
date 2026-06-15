import styles from './ui.module.css'

interface StatusBadgeProps {
  state: string
}

type Tone = 'running' | 'paused' | 'exited'

function resolveTone(state: string): Tone {
  const normalized = state.toLowerCase()
  if (normalized === 'running') {
    return 'running'
  }
  if (normalized === 'paused') {
    return 'paused'
  }
  return 'exited'
}

const TONE_CLASS: Record<Tone, string> = {
  running: 'badgeRunning',
  paused: 'badgePaused',
  exited: 'badgeExited',
}

export function StatusBadge({ state }: StatusBadgeProps) {
  const tone = resolveTone(state)
  return (
    <span className={`${styles.badge} ${styles[TONE_CLASS[tone]]}`}>
      <span className={styles.dot} aria-hidden />
      {state || 'unknown'}
    </span>
  )
}
