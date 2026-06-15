export interface VolumeDto {
  name: string
  driver: string
  mountpoint: string
  createdAt?: string
  scope: string
  labels: Record<string, string>
}

export interface CreateVolumeRequest {
  name?: string
  driver?: string
  labels?: Record<string, string>
}
