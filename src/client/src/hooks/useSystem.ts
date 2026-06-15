import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { settingsApi, systemApi } from '../lib/api'
import { queryKeys } from '../lib/queryKeys'

const SYSTEM_REFETCH_MS = 5000

export function useSystemInfo() {
  return useQuery({
    queryKey: queryKeys.systemInfo,
    queryFn: systemApi.info,
    refetchInterval: SYSTEM_REFETCH_MS,
  })
}

export function usePing() {
  return useQuery({
    queryKey: queryKeys.ping,
    queryFn: systemApi.ping,
    refetchInterval: SYSTEM_REFETCH_MS,
  })
}

export function useConnection() {
  return useQuery({
    queryKey: queryKeys.connection,
    queryFn: settingsApi.getConnection,
  })
}

export function useUpdateConnection() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: settingsApi.updateConnection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.connection })
      queryClient.invalidateQueries({ queryKey: queryKeys.ping })
      queryClient.invalidateQueries({ queryKey: queryKeys.systemInfo })
    },
  })
}
