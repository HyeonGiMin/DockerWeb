import { useEffect, useState } from 'react'
import { Spinner } from '../ui'
import { createMonitorConnection, subscribeStats } from '../../lib/signalr'
import { formatBytes } from '../../lib/format'
import type { StatsDto } from '../../types'
import styles from './containers.module.css'

interface StatsTabProps {
  containerId: string
}

function barClass(percent: number): string {
  if (percent >= 90) {
    return styles.barFillDanger
  }
  if (percent >= 70) {
    return styles.barFillWarn
  }
  return styles.barFill
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }
  return Math.min(100, Math.max(0, value))
}

export function StatsTab({ containerId }: StatsTabProps) {
  const [stats, setStats] = useState<StatsDto | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setStats(null)
    setError(null)
    const connection = createMonitorConnection()

    const dispose = subscribeStats(connection, containerId, {
      next: (item) => setStats(item),
      error: () => setError('Stats stream interrupted.'),
    })

    return () => {
      dispose()
      void connection.stop()
    }
  }, [containerId])

  if (error) {
    return (
      <div className={styles.tabPanel}>
        <p className={styles.muted}>{error}</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className={styles.tabPanel}>
        <p className={styles.muted}>
          <Spinner size={16} /> Waiting for live stats…
        </p>
      </div>
    )
  }

  const cpu = clampPercent(stats.cpuPercent)
  const mem = clampPercent(stats.memoryPercent)

  return (
    <div className={styles.tabPanel}>
      <div className={styles.statGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>CPU</span>
          <p className={styles.statValue}>{cpu.toFixed(1)}%</p>
          <div className={styles.bar}>
            <div
              className={barClass(cpu)}
              style={{ width: `${cpu}%` }}
              aria-hidden
            />
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Memory</span>
          <p className={styles.statValue}>{mem.toFixed(1)}%</p>
          <div className={styles.bar}>
            <div
              className={barClass(mem)}
              style={{ width: `${mem}%` }}
              aria-hidden
            />
          </div>
        </div>
      </div>

      <div className={styles.statMeta}>
        <span>Memory usage</span>
        <span>
          {formatBytes(stats.memoryUsage)} / {formatBytes(stats.memoryLimit)}
        </span>
        <span>Network RX</span>
        <span>{formatBytes(stats.networkRx)}</span>
        <span>Network TX</span>
        <span>{formatBytes(stats.networkTx)}</span>
        <span>Block read</span>
        <span>{formatBytes(stats.blockRead)}</span>
        <span>Block write</span>
        <span>{formatBytes(stats.blockWrite)}</span>
      </div>
    </div>
  )
}
