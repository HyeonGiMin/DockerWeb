import { useEffect, useState } from 'react'
import { PageHeader } from '../components/layout'
import {
  Button,
  Checkbox,
  Field,
  LoadingState,
  Select,
  TextInput,
  useToast,
} from '../components/ui'
import {
  useConnection,
  usePing,
  useUpdateConnection,
} from '../hooks/useSystem'
import { getApiErrorMessage } from '../lib/api'
import type { ConnectionMode } from '../types'
import styles from './page.module.css'

const DEFAULT_LOCAL = 'npipe:////./pipe/docker_engine'
const DEFAULT_REMOTE = 'tcp://localhost:2375'

export function SettingsPage() {
  const toast = useToast()
  const { data: connection, isLoading } = useConnection()
  const { data: ping } = usePing()
  const updateConnection = useUpdateConnection()

  const [mode, setMode] = useState<ConnectionMode>('Local')
  const [localEndpoint, setLocalEndpoint] = useState(DEFAULT_LOCAL)
  const [remoteEndpoint, setRemoteEndpoint] = useState(DEFAULT_REMOTE)
  const [tlsEnabled, setTlsEnabled] = useState(false)
  const [certPath, setCertPath] = useState('')
  const [certPassword, setCertPassword] = useState('')

  useEffect(() => {
    if (!connection) {
      return
    }
    setMode(connection.mode)
    setTlsEnabled(connection.tlsEnabled)
    if (connection.mode === 'Local') {
      setLocalEndpoint(connection.endpoint || DEFAULT_LOCAL)
    } else {
      setRemoteEndpoint(connection.endpoint || DEFAULT_REMOTE)
    }
  }, [connection])

  const save = () => {
    updateConnection.mutate(
      {
        mode,
        localEndpoint: mode === 'Local' ? localEndpoint.trim() : undefined,
        remoteEndpoint: mode === 'Remote' ? remoteEndpoint.trim() : undefined,
        tls: {
          enabled: tlsEnabled,
          clientCertPath: certPath.trim() || undefined,
          clientCertPassword: certPassword || undefined,
        },
      },
      {
        onSuccess: (result) => {
          if (result.ok) {
            toast.success('Connection saved', result.connection.endpoint)
          } else {
            toast.error(
              'Connection not verified',
              'Saved but engine unreachable.',
            )
          }
        },
        onError: (err) => toast.error('Save failed', getApiErrorMessage(err)),
      },
    )
  }

  if (isLoading) {
    return (
      <>
        <PageHeader title="Settings" description="Docker engine connection" />
        <LoadingState label="Loading connection settings…" />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configure how DockerWeb connects to the Docker engine"
      />

      <section
        className={styles.panel}
        style={{ maxWidth: 620 }}
        aria-label="Connection settings"
      >
        <h3 className={styles.panelTitle}>Engine connection</h3>

        <Field label="Mode">
          {(id) => (
            <Select
              id={id}
              value={mode}
              onChange={(e) => setMode(e.target.value as ConnectionMode)}
            >
              <option value="Local">Local</option>
              <option value="Remote">Remote</option>
            </Select>
          )}
        </Field>

        {mode === 'Local' ? (
          <Field label="Local endpoint" hint="Named pipe or unix socket">
            {(id) => (
              <TextInput
                id={id}
                value={localEndpoint}
                onChange={(e) => setLocalEndpoint(e.target.value)}
                placeholder={DEFAULT_LOCAL}
              />
            )}
          </Field>
        ) : (
          <Field label="Remote endpoint" hint="tcp://host:port">
            {(id) => (
              <TextInput
                id={id}
                value={remoteEndpoint}
                onChange={(e) => setRemoteEndpoint(e.target.value)}
                placeholder={DEFAULT_REMOTE}
              />
            )}
          </Field>
        )}

        <Checkbox
          checked={tlsEnabled}
          onChange={setTlsEnabled}
          label="Enable TLS (client certificate authentication)"
        />

        {tlsEnabled && (
          <>
            <Field label="Client certificate path">
              {(id) => (
                <TextInput
                  id={id}
                  value={certPath}
                  onChange={(e) => setCertPath(e.target.value)}
                  placeholder="/certs/client.pfx"
                />
              )}
            </Field>
            <Field label="Certificate password">
              {(id) => (
                <TextInput
                  id={id}
                  type="password"
                  value={certPassword}
                  onChange={(e) => setCertPassword(e.target.value)}
                  placeholder="••••••••"
                />
              )}
            </Field>
          </>
        )}

        <div style={{ marginTop: 'var(--space-2)' }}>
          <Button
            variant="primary"
            onClick={save}
            disabled={updateConnection.isPending}
          >
            {updateConnection.isPending ? 'Saving…' : 'Save connection'}
          </Button>
        </div>
      </section>

      <section
        className={styles.panel}
        style={{ maxWidth: 620, marginTop: 'var(--space-5)' }}
        aria-label="Current status"
      >
        <h3 className={styles.panelTitle}>Current status</h3>
        <dl className={styles.defList}>
          <dt>Reachable</dt>
          <dd>{ping?.ok ? 'Yes' : 'No'}</dd>
          <dt>Active endpoint</dt>
          <dd className={styles.mono}>{ping?.connection.endpoint ?? '—'}</dd>
          <dt>TLS</dt>
          <dd>{ping?.connection.tlsEnabled ? 'Enabled' : 'Disabled'}</dd>
        </dl>
      </section>
    </>
  )
}
