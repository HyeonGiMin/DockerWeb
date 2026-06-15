import { useState } from 'react'
import { Network, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/layout'
import {
  Badge,
  Button,
  Checkbox,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  LoadingState,
  Modal,
  Select,
  Table,
  TextInput,
  tableStyles,
  useToast,
} from '../components/ui'
import {
  useCreateNetwork,
  useNetworks,
  useRemoveNetwork,
} from '../hooks/useNetworks'
import { getApiErrorMessage } from '../lib/api'
import type { NetworkDto } from '../types'
import styles from './page.module.css'

const BUILT_IN = new Set(['bridge', 'host', 'none'])

export function NetworksPage() {
  const toast = useToast()
  const { data, isLoading, isError, error } = useNetworks()
  const createNetwork = useCreateNetwork()
  const removeNetwork = useRemoveNetwork()

  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [driver, setDriver] = useState('bridge')
  const [internal, setInternal] = useState(false)
  const [target, setTarget] = useState<NetworkDto | null>(null)

  const submitCreate = () => {
    if (!name.trim()) {
      toast.error('Name required', 'Provide a network name.')
      return
    }
    createNetwork.mutate(
      { name: name.trim(), driver, internal },
      {
        onSuccess: () => {
          toast.success('Network created', name.trim())
          setCreateOpen(false)
          setName('')
          setDriver('bridge')
          setInternal(false)
        },
        onError: (err) => toast.error('Create failed', getApiErrorMessage(err)),
      },
    )
  }

  const confirmRemove = () => {
    if (!target) {
      return
    }
    removeNetwork.mutate(target.id, {
      onSuccess: () => {
        toast.success('Network removed', target.name)
        setTarget(null)
      },
      onError: (err) => {
        toast.error('Remove failed', getApiErrorMessage(err))
        setTarget(null)
      },
    })
  }

  return (
    <>
      <PageHeader
        title="Networks"
        description="Virtual networks connecting your containers"
        actions={
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setCreateOpen(true)}
          >
            Create network
          </Button>
        }
      />

      {isLoading && <LoadingState label="Loading networks…" />}

      {isError && (
        <div className={styles.errorPanel}>{getApiErrorMessage(error)}</div>
      )}

      {!isLoading && !isError && data && data.length === 0 && (
        <EmptyState
          icon={<Network size={26} />}
          title="No networks"
          message="Create a user-defined network to connect containers."
        />
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <Table
          headers={['Name', 'Driver', 'Scope', 'Internal', 'Containers', '']}
        >
          {data.map((network) => {
            const builtIn = BUILT_IN.has(network.name)
            return (
              <tr key={network.id}>
                <td className={tableStyles.primaryCell}>{network.name}</td>
                <td>{network.driver}</td>
                <td>{network.scope}</td>
                <td>
                  {network.internal ? (
                    <Badge tone="accent">Internal</Badge>
                  ) : (
                    <span className={tableStyles.muted}>—</span>
                  )}
                </td>
                <td>{network.containerCount}</td>
                <td>
                  <div className={tableStyles.actions}>
                    <IconButton
                      label={
                        builtIn
                          ? 'Built-in networks cannot be removed'
                          : 'Remove network'
                      }
                      danger
                      disabled={builtIn}
                      onClick={() => setTarget(network)}
                    >
                      <Trash2 size={16} aria-hidden />
                    </IconButton>
                  </div>
                </td>
              </tr>
            )
          })}
        </Table>
      )}

      <Modal
        open={createOpen}
        title="Create network"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submitCreate}
              disabled={createNetwork.isPending}
            >
              {createNetwork.isPending ? 'Creating…' : 'Create'}
            </Button>
          </>
        }
      >
        <Field label="Name">
          {(id) => (
            <TextInput
              id={id}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-network"
            />
          )}
        </Field>
        <Field label="Driver">
          {(id) => (
            <Select
              id={id}
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
            >
              <option value="bridge">bridge</option>
              <option value="overlay">overlay</option>
              <option value="macvlan">macvlan</option>
              <option value="ipvlan">ipvlan</option>
            </Select>
          )}
        </Field>
        <Checkbox
          checked={internal}
          onChange={setInternal}
          label="Internal (restrict external access)"
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(target)}
        title="Remove network"
        message={`Remove network "${target?.name}"?`}
        confirmLabel="Remove"
        danger
        busy={removeNetwork.isPending}
        onConfirm={confirmRemove}
        onCancel={() => setTarget(null)}
      />
    </>
  )
}
