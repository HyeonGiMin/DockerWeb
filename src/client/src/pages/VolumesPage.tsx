import { useState } from 'react'
import { HardDrive, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../components/layout'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  LoadingState,
  Modal,
  Table,
  TextInput,
  tableStyles,
  useToast,
} from '../components/ui'
import {
  useCreateVolume,
  usePruneVolumes,
  useRemoveVolume,
  useVolumes,
} from '../hooks/useVolumes'
import { getApiErrorMessage } from '../lib/api'
import { relativeTime } from '../lib/format'
import type { VolumeDto } from '../types'
import styles from './page.module.css'

export function VolumesPage() {
  const toast = useToast()
  const { data, isLoading, isError, error } = useVolumes()
  const createVolume = useCreateVolume()
  const removeVolume = useRemoveVolume()
  const pruneVolumes = usePruneVolumes()

  const [createOpen, setCreateOpen] = useState(false)
  const [name, setName] = useState('')
  const [driver, setDriver] = useState('local')
  const [target, setTarget] = useState<VolumeDto | null>(null)

  const submitCreate = () => {
    createVolume.mutate(
      { name: name.trim() || undefined, driver: driver.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Volume created')
          setCreateOpen(false)
          setName('')
          setDriver('local')
        },
        onError: (err) => toast.error('Create failed', getApiErrorMessage(err)),
      },
    )
  }

  const confirmRemove = () => {
    if (!target) {
      return
    }
    removeVolume.mutate(
      { name: target.name, force: true },
      {
        onSuccess: () => {
          toast.success('Volume removed', target.name)
          setTarget(null)
        },
        onError: (err) => {
          toast.error('Remove failed', getApiErrorMessage(err))
          setTarget(null)
        },
      },
    )
  }

  const runPrune = () => {
    pruneVolumes.mutate(undefined, {
      onSuccess: (result) =>
        toast.success('Volumes pruned', `${result.deletedCount} removed`),
      onError: (err) => toast.error('Prune failed', getApiErrorMessage(err)),
    })
  }

  return (
    <>
      <PageHeader
        title="Volumes"
        description="Persistent storage managed by the Docker engine"
        actions={
          <>
            <Button onClick={runPrune} disabled={pruneVolumes.isPending}>
              Prune unused
            </Button>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setCreateOpen(true)}
            >
              Create volume
            </Button>
          </>
        }
      />

      {isLoading && <LoadingState label="Loading volumes…" />}

      {isError && (
        <div className={styles.errorPanel}>{getApiErrorMessage(error)}</div>
      )}

      {!isLoading && !isError && data && data.length === 0 && (
        <EmptyState
          icon={<HardDrive size={26} />}
          title="No volumes"
          message="Create a volume to persist data across container restarts."
        />
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <Table headers={['Name', 'Driver', 'Mountpoint', 'Created', '']}>
          {data.map((volume) => (
            <tr key={volume.name}>
              <td className={tableStyles.primaryCell}>{volume.name}</td>
              <td>{volume.driver}</td>
              <td className={tableStyles.mono}>{volume.mountpoint}</td>
              <td className={tableStyles.muted}>
                {relativeTime(volume.createdAt)}
              </td>
              <td>
                <div className={tableStyles.actions}>
                  <IconButton
                    label="Remove volume"
                    danger
                    onClick={() => setTarget(volume)}
                  >
                    <Trash2 size={16} aria-hidden />
                  </IconButton>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <Modal
        open={createOpen}
        title="Create volume"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submitCreate}
              disabled={createVolume.isPending}
            >
              {createVolume.isPending ? 'Creating…' : 'Create'}
            </Button>
          </>
        }
      >
        <Field label="Name" hint="Leave blank for an auto-generated name">
          {(id) => (
            <TextInput
              id={id}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-volume"
            />
          )}
        </Field>
        <Field label="Driver">
          {(id) => (
            <TextInput
              id={id}
              value={driver}
              onChange={(e) => setDriver(e.target.value)}
              placeholder="local"
            />
          )}
        </Field>
      </Modal>

      <ConfirmDialog
        open={Boolean(target)}
        title="Remove volume"
        message={`Remove volume "${target?.name}"? This cannot be undone.`}
        confirmLabel="Remove"
        danger
        busy={removeVolume.isPending}
        onConfirm={confirmRemove}
        onCancel={() => setTarget(null)}
      />
    </>
  )
}
