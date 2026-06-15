import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { StatusBadge } from '../ui'
import { containerName, truncateId } from '../../lib/format'
import type { ContainerDto } from '../../types'
import { LogsTab } from './LogsTab'
import { StatsTab } from './StatsTab'
import { InspectTab } from './InspectTab'
import styles from './containers.module.css'

type TabKey = 'logs' | 'stats' | 'inspect'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'logs', label: 'Logs' },
  { key: 'stats', label: 'Stats' },
  { key: 'inspect', label: 'Inspect' },
]

interface ContainerDetailDrawerProps {
  container: ContainerDto
  onClose: () => void
}

export function ContainerDetailDrawer({
  container,
  onClose,
}: ContainerDetailDrawerProps) {
  const [tab, setTab] = useState<TabKey>('logs')

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <>
      <div className={styles.drawerOverlay} onClick={onClose} aria-hidden />
      <aside
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label={`Container ${containerName(container.names)}`}
      >
        <header className={styles.drawerHeader}>
          <div>
            <p className={styles.drawerTitle}>
              {containerName(container.names)}
            </p>
            <p className={styles.drawerSub}>
              {truncateId(container.id)} · {container.image}
            </p>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <StatusBadge state={container.state} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--color-text-muted)',
            }}
          >
            <X size={20} aria-hidden />
          </button>
        </header>

        <div className={styles.tabs} role="tablist">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={tab === key}
              className={`${styles.tab} ${tab === key ? styles.tabActive : ''}`}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'logs' && <LogsTab containerId={container.id} />}
        {tab === 'stats' && <StatsTab containerId={container.id} />}
        {tab === 'inspect' && <InspectTab containerId={container.id} />}
      </aside>
    </>,
    document.body,
  )
}
