export interface SystemInfoDto {
  name: string
  serverVersion: string
  apiVersion: string
  os: string
  architecture: string
  ncpu: number
  memTotal: number
  containers: number
  containersRunning: number
  containersPaused: number
  containersStopped: number
  images: number
  dockerRootDir: string
}
