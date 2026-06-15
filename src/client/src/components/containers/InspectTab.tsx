import { Spinner } from '../ui'
import { useContainerInspect } from '../../hooks/useContainers'
import styles from './containers.module.css'

interface InspectTabProps {
  containerId: string
}

export function InspectTab({ containerId }: InspectTabProps) {
  const { data, isLoading, isError } = useContainerInspect(containerId)

  if (isLoading) {
    return (
      <div className={styles.tabPanel}>
        <p className={styles.muted}>
          <Spinner size={16} /> Loading inspect data…
        </p>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className={styles.tabPanel}>
        <p className={styles.muted}>Could not load inspect data.</p>
      </div>
    )
  }

  return (
    <div className={styles.tabPanel}>
      <pre className={styles.inspect}>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
