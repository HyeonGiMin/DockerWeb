import { useEffect, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import { Button } from '../ui'
import { createMonitorConnection, subscribeLogs } from '../../lib/signalr'
import styles from './containers.module.css'

const LOG_TAIL = 200
const MAX_LINES = 2000

interface LogsTabProps {
  containerId: string
}

export function LogsTab({ containerId }: LogsTabProps) {
  const [lines, setLines] = useState<string[]>([])
  const [paused, setPaused] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pausedRef = useRef(false)
  const viewRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  useEffect(() => {
    setLines([])
    setError(null)
    const connection = createMonitorConnection()

    const dispose = subscribeLogs(connection, containerId, LOG_TAIL, {
      next: (line) => {
        if (pausedRef.current) {
          return
        }
        setLines((current) => {
          const next = [...current, line]
          return next.length > MAX_LINES ? next.slice(-MAX_LINES) : next
        })
      },
      error: () => setError('Log stream interrupted.'),
    })

    return () => {
      dispose()
      void connection.stop()
    }
  }, [containerId])

  useEffect(() => {
    if (!paused && viewRef.current) {
      viewRef.current.scrollTop = viewRef.current.scrollHeight
    }
  }, [lines, paused])

  return (
    <div className={styles.tabPanel}>
      <div className={styles.logToolbar}>
        <span className={styles.logStatus}>
          {error ?? `${lines.length} lines${paused ? ' · paused' : ''}`}
        </span>
        <Button
          size="sm"
          icon={paused ? <Play size={14} /> : <Pause size={14} />}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? 'Resume' : 'Pause'}
        </Button>
      </div>
      <div className={styles.logView} ref={viewRef} role="log" aria-live="polite">
        {lines.length === 0 ? (
          <span className={styles.logLine}>Waiting for log output…</span>
        ) : (
          lines.map((line, index) => (
            <span key={index} className={styles.logLine}>
              {line}
            </span>
          ))
        )}
      </div>
    </div>
  )
}
