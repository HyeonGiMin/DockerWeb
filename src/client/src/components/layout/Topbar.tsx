import { useLocation } from 'react-router-dom'
import { LogOut, RefreshCw } from 'lucide-react'
import { useIsFetching, useQueryClient } from '@tanstack/react-query'
import { IconButton } from '../ui'
import { useAuth } from '../../auth/useAuth'
import styles from './layout.module.css'

const TITLES: { prefix: string; title: string }[] = [
  { prefix: '/containers', title: 'Containers' },
  { prefix: '/images', title: 'Images' },
  { prefix: '/volumes', title: 'Volumes' },
  { prefix: '/networks', title: 'Networks' },
  { prefix: '/settings', title: 'Settings' },
]

function resolveTitle(pathname: string): string {
  const match = TITLES.find((entry) => pathname.startsWith(entry.prefix))
  return match?.title ?? 'Dashboard'
}

export function Topbar() {
  const { pathname } = useLocation()
  const queryClient = useQueryClient()
  const fetching = useIsFetching()
  const { logout } = useAuth()

  return (
    <header className={styles.topbar}>
      <h1 className={styles.topbarTitle}>{resolveTitle(pathname)}</h1>
      <div className={styles.topbarActions}>
        <IconButton
          label="Refresh data"
          onClick={() => queryClient.invalidateQueries()}
          disabled={fetching > 0}
        >
          <RefreshCw size={17} aria-hidden />
        </IconButton>
        <IconButton label="Sign out" onClick={logout}>
          <LogOut size={17} aria-hidden />
        </IconButton>
      </div>
    </header>
  )
}
