import { useRef, useState } from 'react'
import {
  Boxes,
  Download,
  Tag as TagIcon,
  Trash2,
  Upload,
} from 'lucide-react'
import { PageHeader } from '../components/layout'
import {
  Badge,
  Button,
  Checkbox,
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
  useImages,
  useImportImage,
  usePruneImages,
  usePullImage,
  useRemoveImage,
  useTagImage,
} from '../hooks/useImages'
import { getApiErrorMessage } from '../lib/api'
import { formatBytes, relativeTime, truncateId } from '../lib/format'
import type { ImageDto } from '../types'
import styles from './page.module.css'

function imageLabel(image: ImageDto): string {
  if (image.repoTags.length > 0 && image.repoTags[0] !== '<none>:<none>') {
    return image.repoTags[0]
  }
  return truncateId(image.id)
}

export function ImagesPage() {
  const toast = useToast()
  const { data, isLoading, isError, error } = useImages()
  const pullImage = usePullImage()
  const tagImage = useTagImage()
  const removeImage = useRemoveImage()
  const pruneImages = usePruneImages()
  const importImage = useImportImage()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const onImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Reset so selecting the same file again still fires onChange.
    event.target.value = ''
    if (!file) {
      return
    }
    importImage.mutate(file, {
      onSuccess: () => toast.success('Image import started', file.name),
      onError: (err) => toast.error('Import failed', getApiErrorMessage(err)),
    })
  }

  const [pullOpen, setPullOpen] = useState(false)
  const [pullName, setPullName] = useState('')
  const [pullTag, setPullTag] = useState('latest')

  const [tagTarget, setTagTarget] = useState<ImageDto | null>(null)
  const [repository, setRepository] = useState('')
  const [newTag, setNewTag] = useState('latest')

  const [removeTarget, setRemoveTarget] = useState<ImageDto | null>(null)
  const [forceRemove, setForceRemove] = useState(false)

  const submitPull = () => {
    if (!pullName.trim()) {
      toast.error('Image required', 'Provide an image name to pull.')
      return
    }
    pullImage.mutate(
      { image: pullName.trim(), tag: pullTag.trim() || undefined },
      {
        onSuccess: () => {
          toast.success('Image pulled', pullName.trim())
          setPullOpen(false)
          setPullName('')
          setPullTag('latest')
        },
        onError: (err) => toast.error('Pull failed', getApiErrorMessage(err)),
      },
    )
  }

  const submitTag = () => {
    if (!tagTarget || !repository.trim()) {
      toast.error('Repository required', 'Provide a target repository.')
      return
    }
    tagImage.mutate(
      {
        id: tagTarget.id,
        body: { repository: repository.trim(), tag: newTag.trim() || 'latest' },
      },
      {
        onSuccess: () => {
          toast.success('Image tagged')
          setTagTarget(null)
          setRepository('')
          setNewTag('latest')
        },
        onError: (err) => toast.error('Tag failed', getApiErrorMessage(err)),
      },
    )
  }

  const confirmRemove = () => {
    if (!removeTarget) {
      return
    }
    removeImage.mutate(
      { id: removeTarget.id, force: forceRemove },
      {
        onSuccess: () => {
          toast.success('Image removed', imageLabel(removeTarget))
          setRemoveTarget(null)
          setForceRemove(false)
        },
        onError: (err) => {
          toast.error('Remove failed', getApiErrorMessage(err))
          setRemoveTarget(null)
        },
      },
    )
  }

  const runPrune = () => {
    pruneImages.mutate(undefined, {
      onSuccess: (result) =>
        toast.success(
          'Dangling images pruned',
          `${result.deletedCount} removed · ${formatBytes(result.spaceReclaimed)} reclaimed`,
        ),
      onError: (err) => toast.error('Prune failed', getApiErrorMessage(err)),
    })
  }

  return (
    <>
      <PageHeader
        title="Images"
        description="Local image cache on the Docker engine"
        actions={
          <>
            <Button onClick={runPrune} disabled={pruneImages.isPending}>
              Prune dangling
            </Button>
            <Button
              icon={<Upload size={16} />}
              onClick={() => fileInputRef.current?.click()}
              disabled={importImage.isPending}
            >
              {importImage.isPending ? 'Importing…' : 'Import'}
            </Button>
            <Button
              variant="primary"
              icon={<Download size={16} />}
              onClick={() => setPullOpen(true)}
            >
              Pull image
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".tar"
              onChange={onImportFile}
              hidden
            />
          </>
        }
      />

      {isLoading && <LoadingState label="Loading images…" />}

      {isError && (
        <div className={styles.errorPanel}>{getApiErrorMessage(error)}</div>
      )}

      {!isLoading && !isError && data && data.length === 0 && (
        <EmptyState
          icon={<Boxes size={26} />}
          title="No images"
          message="Pull an image from a registry to get started."
          action={
            <Button variant="primary" onClick={() => setPullOpen(true)}>
              Pull image
            </Button>
          }
        />
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <Table headers={['Repository : Tag', 'Image ID', 'Size', 'Created', '']}>
          {data.map((image) => (
            <tr key={image.id}>
              <td className={tableStyles.primaryCell}>
                <div className={styles.tagList}>
                  {image.repoTags.length > 0 ? (
                    image.repoTags.map((tag) => (
                      <span key={tag} className={styles.tag}>
                        {tag}
                      </span>
                    ))
                  ) : (
                    <span className={tableStyles.muted}>&lt;none&gt;</span>
                  )}
                  {image.dangling && <Badge tone="neutral">dangling</Badge>}
                </div>
              </td>
              <td className={tableStyles.mono}>{truncateId(image.id)}</td>
              <td>{formatBytes(image.size)}</td>
              <td className={tableStyles.muted}>{relativeTime(image.created)}</td>
              <td>
                <div className={tableStyles.actions}>
                  <IconButton
                    label="Tag image"
                    onClick={() => {
                      setTagTarget(image)
                      setRepository('')
                      setNewTag('latest')
                    }}
                  >
                    <TagIcon size={16} aria-hidden />
                  </IconButton>
                  <IconButton
                    label="Remove image"
                    danger
                    onClick={() => {
                      setRemoveTarget(image)
                      setForceRemove(false)
                    }}
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
        open={pullOpen}
        title="Pull image"
        onClose={() => setPullOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPullOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submitPull}
              disabled={pullImage.isPending}
            >
              {pullImage.isPending ? 'Pulling…' : 'Pull'}
            </Button>
          </>
        }
      >
        <Field label="Image" hint="Repository name, e.g. nginx or library/redis">
          {(id) => (
            <TextInput
              id={id}
              value={pullName}
              onChange={(e) => setPullName(e.target.value)}
              placeholder="nginx"
            />
          )}
        </Field>
        <Field label="Tag">
          {(id) => (
            <TextInput
              id={id}
              value={pullTag}
              onChange={(e) => setPullTag(e.target.value)}
              placeholder="latest"
            />
          )}
        </Field>
      </Modal>

      <Modal
        open={Boolean(tagTarget)}
        title="Tag image"
        onClose={() => setTagTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTagTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={submitTag}
              disabled={tagImage.isPending}
            >
              {tagImage.isPending ? 'Tagging…' : 'Add tag'}
            </Button>
          </>
        }
      >
        <Field label="Source">
          {() => (
            <p className={styles.mono}>
              {tagTarget ? imageLabel(tagTarget) : ''}
            </p>
          )}
        </Field>
        <Field label="Repository">
          {(id) => (
            <TextInput
              id={id}
              value={repository}
              onChange={(e) => setRepository(e.target.value)}
              placeholder="myrepo/myimage"
            />
          )}
        </Field>
        <Field label="Tag">
          {(id) => (
            <TextInput
              id={id}
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="latest"
            />
          )}
        </Field>
      </Modal>

      <Modal
        open={Boolean(removeTarget)}
        title="Remove image"
        onClose={() => setRemoveTarget(null)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setRemoveTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={confirmRemove}
              disabled={removeImage.isPending}
            >
              {removeImage.isPending ? 'Removing…' : 'Remove'}
            </Button>
          </>
        }
      >
        <p className={styles.mono} style={{ marginBottom: 'var(--space-4)' }}>
          {removeTarget ? imageLabel(removeTarget) : ''}
        </p>
        <Checkbox
          checked={forceRemove}
          onChange={setForceRemove}
          label="Force removal (remove even if used by stopped containers)"
        />
      </Modal>
    </>
  )
}
