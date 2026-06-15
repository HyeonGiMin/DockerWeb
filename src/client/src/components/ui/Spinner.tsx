import styles from './ui.module.css'

interface SpinnerProps {
  size?: number
  label?: string
}

export function Spinner({ size = 18 }: SpinnerProps) {
  const border = Math.max(2, Math.round(size / 9))
  return (
    <span
      className={styles.spinner}
      style={{ width: size, height: size, borderWidth: border }}
      role="status"
      aria-label="Loading"
    />
  )
}

export function LoadingState({ label = 'Loading…' }: SpinnerProps) {
  return (
    <div className={styles.spinnerCenter}>
      <Spinner size={28} />
      <span>{label}</span>
    </div>
  )
}
