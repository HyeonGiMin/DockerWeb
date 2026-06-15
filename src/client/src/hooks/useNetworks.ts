import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { networksApi } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'
import type { CreateNetworkRequest } from '../types'

export function useNetworks() {
  return useQuery({
    queryKey: queryKeys.networks,
    queryFn: networksApi.list,
    refetchOnWindowFocus: true,
  })
}

function useNetworksInvalidate() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.networks })
  }
}

export function useCreateNetwork() {
  const invalidate = useNetworksInvalidate()
  return useMutation({
    mutationFn: (body: CreateNetworkRequest) => networksApi.create(body),
    onSuccess: invalidate,
  })
}

export function useRemoveNetwork() {
  const invalidate = useNetworksInvalidate()
  return useMutation({
    mutationFn: (id: string) => networksApi.remove(id),
    onSuccess: invalidate,
  })
}
