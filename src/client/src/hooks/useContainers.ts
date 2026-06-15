import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { containersApi } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import type { ContainerAction, CreateContainerRequest } from '../types'

const CONTAINERS_REFETCH_MS = 5000

export function useContainers(all = true) {
  return useQuery({
    queryKey: [...queryKeys.containers, { all }],
    queryFn: () => containersApi.list(all),
    refetchInterval: CONTAINERS_REFETCH_MS,
  })
}

export function useContainerInspect(id: string | null) {
  return useQuery({
    queryKey: queryKeys.containerInspect(id ?? ''),
    queryFn: () => containersApi.inspect(id as string),
    enabled: Boolean(id),
  })
}

function useContainersInvalidate() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.containers })
    queryClient.invalidateQueries({ queryKey: queryKeys.systemInfo })
  }
}

export function useContainerAction() {
  const invalidate = useContainersInvalidate()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: ContainerAction }) =>
      containersApi.action(id, action),
    onSuccess: invalidate,
  })
}

export function useCreateContainer() {
  const invalidate = useContainersInvalidate()
  return useMutation({
    mutationFn: (body: CreateContainerRequest) => containersApi.create(body),
    onSuccess: invalidate,
  })
}

export function useRemoveContainer() {
  const invalidate = useContainersInvalidate()
  return useMutation({
    mutationFn: ({
      id,
      force,
      removeVolumes,
    }: {
      id: string
      force?: boolean
      removeVolumes?: boolean
    }) => containersApi.remove(id, force, removeVolumes),
    onSuccess: invalidate,
  })
}

export function usePruneContainers() {
  const invalidate = useContainersInvalidate()
  return useMutation({
    mutationFn: () => containersApi.prune(),
    onSuccess: invalidate,
  })
}
