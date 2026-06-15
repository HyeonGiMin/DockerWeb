import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import {
  Button,
  Checkbox,
  Field,
  Modal,
  Select,
  TextInput,
  formStyles,
  useToast,
} from '../ui'
import { useCreateContainer } from '../../hooks/useContainers'
import { getApiErrorMessage } from '../../lib/api'
import type {
  CreatePortMapping,
  CreateVolumeBind,
  RestartPolicy,
} from '../../types'

interface CreateContainerModalProps {
  open: boolean
  onClose: () => void
}

interface PortRow {
  containerPort: string
  hostPort: string
  protocol: 'tcp' | 'udp'
}

interface VolumeRow {
  source: string
  target: string
}

const RESTART_POLICIES: RestartPolicy[] = [
  'no',
  'always',
  'unless-stopped',
  'on-failure',
]

const emptyPort = (): PortRow => ({
  containerPort: '',
  hostPort: '',
  protocol: 'tcp',
})
const emptyVolume = (): VolumeRow => ({ source: '', target: '' })

export function CreateContainerModal({
  open,
  onClose,
}: CreateContainerModalProps) {
  const toast = useToast()
  const createContainer = useCreateContainer()

  const [image, setImage] = useState('')
  const [name, setName] = useState('')
  const [ports, setPorts] = useState<PortRow[]>([])
  const [envVars, setEnvVars] = useState<string[]>([])
  const [volumes, setVolumes] = useState<VolumeRow[]>([])
  const [restartPolicy, setRestartPolicy] = useState<RestartPolicy>('no')
  const [autoStart, setAutoStart] = useState(true)

  const reset = () => {
    setImage('')
    setName('')
    setPorts([])
    setEnvVars([])
    setVolumes([])
    setRestartPolicy('no')
    setAutoStart(true)
  }

  const close = () => {
    reset()
    onClose()
  }

  const submit = () => {
    if (!image.trim()) {
      toast.error('Image required', 'Provide an image to run.')
      return
    }

    const mappedPorts: CreatePortMapping[] = ports
      .filter((p) => p.containerPort.trim())
      .map((p) => ({
        containerPort: Number(p.containerPort),
        hostPort: p.hostPort.trim() ? Number(p.hostPort) : undefined,
        protocol: p.protocol,
      }))

    const mappedVolumes: CreateVolumeBind[] = volumes
      .filter((v) => v.source.trim() && v.target.trim())
      .map((v) => ({ source: v.source.trim(), target: v.target.trim() }))

    const env = envVars.map((e) => e.trim()).filter(Boolean)

    createContainer.mutate(
      {
        image: image.trim(),
        name: name.trim() || undefined,
        ports: mappedPorts.length ? mappedPorts : undefined,
        env: env.length ? env : undefined,
        volumes: mappedVolumes.length ? mappedVolumes : undefined,
        restartPolicy,
        autoStart,
      },
      {
        onSuccess: (result) => {
          toast.success(
            'Container created',
            result.warnings.length
              ? result.warnings.join('; ')
              : name.trim() || image.trim(),
          )
          close()
        },
        onError: (err) => toast.error('Create failed', getApiErrorMessage(err)),
      },
    )
  }

  return (
    <Modal
      open={open}
      title="Create container"
      onClose={close}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={submit}
            disabled={createContainer.isPending}
          >
            {createContainer.isPending ? 'Creating…' : 'Create'}
          </Button>
        </>
      }
    >
      <Field label="Image" hint="e.g. nginx:latest">
        {(id) => (
          <TextInput
            id={id}
            value={image}
            onChange={(e) => setImage(e.target.value)}
            placeholder="nginx:latest"
          />
        )}
      </Field>

      <Field label="Name" hint="Optional container name">
        {(id) => (
          <TextInput
            id={id}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="my-container"
          />
        )}
      </Field>

      <hr className={formStyles.sep} />

      <span className={formStyles.label}>Port mappings</span>
      <div className={formStyles.rowList}>
        {ports.map((port, index) => (
          <div key={index} className={formStyles.rowItem}>
            <TextInput
              className={formStyles.rowNarrow}
              value={port.hostPort}
              onChange={(e) =>
                setPorts((rows) =>
                  rows.map((r, i) =>
                    i === index ? { ...r, hostPort: e.target.value } : r,
                  ),
                )
              }
              placeholder="host"
              inputMode="numeric"
              aria-label="Host port"
            />
            <TextInput
              className={formStyles.rowNarrow}
              value={port.containerPort}
              onChange={(e) =>
                setPorts((rows) =>
                  rows.map((r, i) =>
                    i === index ? { ...r, containerPort: e.target.value } : r,
                  ),
                )
              }
              placeholder="container"
              inputMode="numeric"
              aria-label="Container port"
            />
            <Select
              value={port.protocol}
              onChange={(e) =>
                setPorts((rows) =>
                  rows.map((r, i) =>
                    i === index
                      ? { ...r, protocol: e.target.value as 'tcp' | 'udp' }
                      : r,
                  ),
                )
              }
              aria-label="Protocol"
            >
              <option value="tcp">tcp</option>
              <option value="udp">udp</option>
            </Select>
            <button
              type="button"
              className={formStyles.removeRow}
              onClick={() =>
                setPorts((rows) => rows.filter((_, i) => i !== index))
              }
              aria-label="Remove port mapping"
            >
              <X size={15} aria-hidden />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={formStyles.addRow}
        onClick={() => setPorts((rows) => [...rows, emptyPort()])}
      >
        <Plus size={14} aria-hidden /> Add port
      </button>

      <hr className={formStyles.sep} />

      <span className={formStyles.label}>Environment variables</span>
      <div className={formStyles.rowList}>
        {envVars.map((value, index) => (
          <div key={index} className={formStyles.rowItem}>
            <TextInput
              value={value}
              onChange={(e) =>
                setEnvVars((rows) =>
                  rows.map((r, i) => (i === index ? e.target.value : r)),
                )
              }
              placeholder="KEY=value"
              aria-label="Environment variable"
            />
            <button
              type="button"
              className={formStyles.removeRow}
              onClick={() =>
                setEnvVars((rows) => rows.filter((_, i) => i !== index))
              }
              aria-label="Remove environment variable"
            >
              <X size={15} aria-hidden />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={formStyles.addRow}
        onClick={() => setEnvVars((rows) => [...rows, ''])}
      >
        <Plus size={14} aria-hidden /> Add variable
      </button>

      <hr className={formStyles.sep} />

      <span className={formStyles.label}>Volume binds</span>
      <div className={formStyles.rowList}>
        {volumes.map((volume, index) => (
          <div key={index} className={formStyles.rowItem}>
            <TextInput
              value={volume.source}
              onChange={(e) =>
                setVolumes((rows) =>
                  rows.map((r, i) =>
                    i === index ? { ...r, source: e.target.value } : r,
                  ),
                )
              }
              placeholder="source / volume name"
              aria-label="Volume source"
            />
            <TextInput
              value={volume.target}
              onChange={(e) =>
                setVolumes((rows) =>
                  rows.map((r, i) =>
                    i === index ? { ...r, target: e.target.value } : r,
                  ),
                )
              }
              placeholder="/container/path"
              aria-label="Volume target"
            />
            <button
              type="button"
              className={formStyles.removeRow}
              onClick={() =>
                setVolumes((rows) => rows.filter((_, i) => i !== index))
              }
              aria-label="Remove volume bind"
            >
              <X size={15} aria-hidden />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={formStyles.addRow}
        onClick={() => setVolumes((rows) => [...rows, emptyVolume()])}
      >
        <Plus size={14} aria-hidden /> Add volume
      </button>

      <hr className={formStyles.sep} />

      <Field label="Restart policy">
        {(id) => (
          <Select
            id={id}
            value={restartPolicy}
            onChange={(e) => setRestartPolicy(e.target.value as RestartPolicy)}
          >
            {RESTART_POLICIES.map((policy) => (
              <option key={policy} value={policy}>
                {policy}
              </option>
            ))}
          </Select>
        )}
      </Field>

      <Checkbox
        checked={autoStart}
        onChange={setAutoStart}
        label="Start container immediately after creation"
      />
    </Modal>
  )
}
