import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { imagesApi } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import type { PullImageRequest, TagImageRequest } from '../types'

export function useImages() {
  return useQuery({
    queryKey: queryKeys.images,
    queryFn: imagesApi.list,
    refetchOnWindowFocus: true,
  })
}

function useImagesInvalidate() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.images })
    queryClient.invalidateQueries({ queryKey: queryKeys.systemInfo })
  }
}

export function usePullImage() {
  const invalidate = useImagesInvalidate()
  return useMutation({
    mutationFn: (body: PullImageRequest) => imagesApi.pull(body),
    onSuccess: invalidate,
  })
}

export function useTagImage() {
  const invalidate = useImagesInvalidate()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: TagImageRequest }) =>
      imagesApi.tag(id, body),
    onSuccess: invalidate,
  })
}

export function useRemoveImage() {
  const invalidate = useImagesInvalidate()
  return useMutation({
    mutationFn: ({ id, force }: { id: string; force?: boolean }) =>
      imagesApi.remove(id, force),
    onSuccess: invalidate,
  })
}

export function usePruneImages() {
  const invalidate = useImagesInvalidate()
  return useMutation({
    mutationFn: () => imagesApi.prune(),
    onSuccess: invalidate,
  })
}

export function useImportImage() {
  const invalidate = useImagesInvalidate()
  return useMutation({
    mutationFn: (file: File) => imagesApi.import(file),
    onSuccess: invalidate,
  })
}
