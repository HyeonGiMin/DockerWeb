import { useState } from 'react'
import {
  Container as ContainerIcon,
  Pause,
  Play,
  Plus,
  Power,
  RotateCw,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '../components/layout'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  IconButton,
  LoadingState,
  StatusBadge,
  Table,
  tableStyles,
  useToast,
} from '../components/ui'
import { CreateContainerModal } from '../components/containers/CreateContainerModal'
import { ContainerDetailDrawer } from '../components/containers/ContainerDetailDrawer'
import {
  useContainerAction,
  useContainers,
  useRemoveContainer,
} from '../hooks/useContainers'
import { getApiErrorMessage } from '../lib/api'
import { containerName, formatPorts, relativeTime } from '../lib/format'
import type { ContainerAction, ContainerDto } from '../types'
import pageStyles from './page.module.css'
import drawerStyles from '../components/containers/containers.module.css'

function isRunning(state: string): boolean {
  return state.toLowerCase() === 'running'
}

function isPaused(state: string): boolean {
  return state.toLowerCase() === 'paused'
}

export function ContainersPage() {
  const toast = useToast()
  const { data, isLoading, isError, error } = useContainers(true)
  const action = useContainerAction()
  const removeContainer = useRemoveContainer()

  const [createOpen, setCreateOpen] = useState(false)
  const [selected, setSelected] = useState<ContainerDto | null>(null)
  const [removeTarget, setRemoveTarget] = useState<ContainerDto | null>(null)

  const runAction = (container: ContainerDto, act: ContainerAction) => {
    action.mutate(
      { id: container.id, action: act },
      {
        onSuccess: () =>
          toast.success(`Container ${act}`, containerName(container.names)),
        onError: (err) =>
          toast.error(`Action failed: ${act}`, getApiErrorMessage(err)),
      },
    )
  }

  const confirmRemove = () => {
    if (!removeTarget) {
      return
    }
    removeContainer.mutate(
      { id: removeTarget.id, force: true },
      {
        onSuccess: () => {
          toast.success('Container removed', containerName(removeTarget.names))
          setRemoveTarget(null)
        },
        onError: (err) => {
          toast.error('Remove failed', getApiErrorMessage(err))
          setRemoveTarget(null)
        },
      },
    )
  }

  return (
    <>
      <PageHeader
        title="Containers"
        description="Running and stopped containers on the engine"
        actions={
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => setCreateOpen(true)}
          >
            Create container
          </Button>
        }
      />

      {isLoading && <LoadingState label="Loading containers…" />}

      {isError && (
        <div className={pageStyles.errorPanel}>{getApiErrorMessage(error)}</div>
      )}

      {!isLoading && !isError && data && data.length === 0 && (
        <EmptyState
          icon={<ContainerIcon size={26} />}
          title="No containers"
          message="Create a container from an image to get started."
          action={
            <Button variant="primary" onClick={() => setCreateOpen(true)}>
              Create container
            </Button>
          }
        />
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <Table
          clickable
          headers={['Name', 'State', 'Status', 'Ports', 'Created', '']}
        >
          {data.map((container) => {
            const running = isRunning(container.state)
            const paused = isPaused(container.state)
            return (
              <tr
                key={container.id}
                onClick={() => setSelected(container)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSelected(container)
                  }
                }}
              >
                <td className={tableStyles.primaryCell}>
                  <div className={drawerStyles.namesCell}>
                    <span>{containerName(container.names)}</span>
                    <span className={drawerStyles.nameImage}>
                      {container.image}
                    </span>
                  </div>
                </td>
                <td>
                  <StatusBadge state={container.state} />
                </td>
                <td className={tableStyles.muted}>{container.status}</td>
                <td className={tableStyles.mono}>
                  {formatPorts(container.ports)}
                </td>
                <td className={tableStyles.muted}>
                  {relativeTime(container.created)}
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className={drawerStyles.rowActionsCell}>
                    {running || paused ? (
                      <IconButton
                        label="Stop"
                        onClick={() => runAction(container, 'stop')}
                      >
                        <Power size={16} aria-hidden />
                      </IconButton>
                    ) : (
                      <IconButton
                        label="Start"
                        onClick={() => runAction(container, 'start')}
                      >
                        <Play size={16} aria-hidden />
                      </IconButton>
                    )}
                    <IconButton
                      label="Restart"
                      onClick={() => runAction(container, 'restart')}
                    >
                      <RotateCw size={16} aria-hidden />
                    </IconButton>
                    <IconButton
                      label={paused ? 'Unpause' : 'Pause'}
                      disabled={!running && !paused}
                      onClick={() =>
                        runAction(container, paused ? 'unpause' : 'pause')
                      }
                    >
                      <Pause size={16} aria-hidden />
                    </IconButton>
                    <IconButton
                      label="Remove"
                      danger
                      onClick={() => setRemoveTarget(container)}
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

      <CreateContainerModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {selected && (
        <ContainerDetailDrawer
          container={selected}
          onClose={() => setSelected(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        title="Remove container"
        message={`Remove container "${
          removeTarget ? containerName(removeTarget.names) : ''
        }"? It will be force-removed.`}
        confirmLabel="Remove"
        danger
        busy={removeContainer.isPending}
        onConfirm={confirmRemove}
        onCancel={() => setRemoveTarget(null)}
      />
    </>
  )
}
