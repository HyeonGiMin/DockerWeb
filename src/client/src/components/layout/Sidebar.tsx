import { NavLink } from 'react-router-dom'
import {
  Boxes,
  Container,
  HardDrive,
  LayoutDashboard,
  Network,
  Settings,
  Ship,
} from 'lucide-react'
import { usePing } from '../../hooks/useSystem'
import styles from './layout.module.css'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/containers', label: 'Containers', icon: Container, end: false },
  { to: '/images', label: 'Images', icon: Boxes, end: false },
  { to: '/volumes', label: 'Volumes', icon: HardDrive, end: false },
  { to: '/networks', label: 'Networks', icon: Network, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
]

function ConnectionStatus() {
  const { data, isError } = usePing()
  const connected = Boolean(data?.ok) && !isError
  const connection = data?.connection

  return (
    <div className={styles.connection}>
      <div className={styles.connectionHead}>
        <span
          className={`${styles.statusDot} ${
            connected ? styles.statusOk : styles.statusDown
          }`}
          aria-hidden
        />
        {connected ? 'Connected' : 'Disconnected'}
      </div>
      <div className={styles.connectionMeta}>
        {connection ? (
          <>
            {connection.mode}
            {connection.tlsEnabled ? ' · TLS' : ''}
            <br />
            <span className={styles.connectionEndpoint}>
              {connection.endpoint}
            </span>
          </>
        ) : (
          'Engine unreachable'
        )}
      </div>
    </div>
  )
}

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandMark}>
          <Ship size={20} aria-hidden />
        </span>
        <span className={styles.brandText}>
          <span className={styles.brandName}>DockerWeb</span>
          <span className={styles.brandTag}>Control Panel</span>
        </span>
      </div>

      <nav className={styles.nav} aria-label="Primary">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
            }
          >
            <Icon size={18} className={styles.navIcon} aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>

      <ConnectionStatus />
    </aside>
  )
}
