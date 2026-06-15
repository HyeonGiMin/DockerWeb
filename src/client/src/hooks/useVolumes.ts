import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { volumesApi } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import type { CreateVolumeRequest } from '../types'

export function useVolumes() {
  return useQuery({
    queryKey: queryKeys.volumes,
    queryFn: volumesApi.list,
    refetchOnWindowFocus: true,
  })
}

function useVolumesInvalidate() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.volumes })
  }
}

export function useCreateVolume() {
  const invalidate = useVolumesInvalidate()
  return useMutation({
    mutationFn: (body: CreateVolumeRequest) => volumesApi.create(body),
    onSuccess: invalidate,
  })
}

export function useRemoveVolume() {
  const invalidate = useVolumesInvalidate()
  return useMutation({
    mutationFn: ({ name, force }: { name: string; force?: boolean }) =>
      volumesApi.remove(name, force),
    onSuccess: invalidate,
  })
}

export function usePruneVolumes() {
  const invalidate = useVolumesInvalidate()
  return useMutation({
    mutationFn: () => volumesApi.prune(),
    onSuccess: invalidate,
  })
}
