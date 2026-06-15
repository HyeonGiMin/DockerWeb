export interface NetworkDto {
  id: string
  name: string
  driver: string
  scope: string
  internal: boolean
  created: string
  containerCount: number
  labels: Record<string, string>
}

export interface CreateNetworkRequest {
  name: string
  driver?: string
  internal?: boolean
}
