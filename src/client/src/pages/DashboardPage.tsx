import {
  Boxes,
  Container,
  Cpu,
  HardDrive,
  MemoryStick,
  Pause,
  Play,
  Square,
} from 'lucide-react'
import { PageHeader } from '../components/layout'
import { EmptyState, LoadingState } from '../components/ui'
import { usePing, useSystemInfo } from '../hooks/useSystem'
import { formatBytes } from '../lib/format'
import styles from './page.module.css'

interface StatCard {
  label: string
  value: string
  sub?: string
  icon: typeof Container
  accent?: string
}

export function DashboardPage() {
  const { data: info, isLoading, isError } = useSystemInfo()
  const { data: ping } = usePing()

  if (isLoading) {
    return (
      <>
        <PageHeader title="Dashboard" description="Docker engine overview" />
        <LoadingState label="Loading system information…" />
      </>
    )
  }

  if (isError || !info) {
    return (
      <>
        <PageHeader title="Dashboard" description="Docker engine overview" />
        <EmptyState
          icon={<Container size={26} />}
          title="Engine unreachable"
          message="Could not load system information. Check the connection settings."
        />
      </>
    )
  }

  const cards: StatCard[] = [
    {
      label: 'Containers',
      value: String(info.containers),
      sub: `${info.containersRunning} running`,
      icon: Container,
      accent: styles.cardAccent,
    },
    {
      label: 'Running',
      value: String(info.containersRunning),
      icon: Play,
      accent: styles.cardRunning,
    },
    {
      label: 'Paused',
      value: String(info.containersPaused),
      icon: Pause,
      accent: styles.cardPaused,
    },
    {
      label: 'Stopped',
      value: String(info.containersStopped),
      icon: Square,
      accent: styles.cardExited,
    },
    {
      label: 'Images',
      value: String(info.images),
      icon: Boxes,
      accent: styles.cardAccent,
    },
    {
      label: 'CPUs',
      value: String(info.ncpu),
      icon: Cpu,
    },
    {
      label: 'Memory',
      value: formatBytes(info.memTotal),
      sub: 'total',
      icon: MemoryStick,
    },
    {
      label: 'Root dir',
      value: info.dockerRootDir ? '✓' : '—',
      sub: info.dockerRootDir,
      icon: HardDrive,
    },
  ]

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`${info.name} · ${info.os}/${info.architecture}`}
      />

      <section className={styles.cardGrid} aria-label="Engine statistics">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <article key={card.label} className={styles.card}>
              <span className={styles.cardLabel}>
                <Icon size={16} aria-hidden />
                {card.label}
              </span>
              <span className={`${styles.cardValue} ${card.accent ?? ''}`}>
                {card.value}
              </span>
              {card.sub && <span className={styles.cardSub}>{card.sub}</span>}
            </article>
          )
        })}
      </section>

      <section className={styles.panel} aria-label="Connection">
        <h3 className={styles.panelTitle}>Connection</h3>
        <dl className={styles.defList}>
          <dt>Status</dt>
          <dd>{ping?.ok ? 'Connected' : 'Disconnected'}</dd>
          <dt>Mode</dt>
          <dd>{ping?.connection.mode ?? '—'}</dd>
          <dt>Endpoint</dt>
          <dd className={styles.mono}>{ping?.connection.endpoint ?? '—'}</dd>
          <dt>TLS</dt>
          <dd>{ping?.connection.tlsEnabled ? 'Enabled' : 'Disabled'}</dd>
          <dt>Server version</dt>
          <dd>{info.serverVersion}</dd>
          <dt>API version</dt>
          <dd>{info.apiVersion}</dd>
        </dl>
      </section>
    </>
  )
}
