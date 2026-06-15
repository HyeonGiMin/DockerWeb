export interface PortMapping {
  privatePort: number
  publicPort?: number
  type: string
  ip?: string
}

export interface ContainerDto {
  id: string
  names: string[]
  image: string
  imageId: string
  command: string
  created: string
  state: string
  status: string
  ports: PortMapping[]
  labels: Record<string, string>
}

export type RestartPolicy = 'no' | 'always' | 'unless-stopped' | 'on-failure'

export interface CreatePortMapping {
  containerPort: number
  hostPort?: number
  protocol?: 'tcp' | 'udp'
}

export interface CreateVolumeBind {
  source: string
  target: string
  readOnly?: boolean
}

export interface CreateContainerRequest {
  image: string
  name?: string
  cmd?: string[]
  env?: string[]
  ports?: CreatePortMapping[]
  volumes?: CreateVolumeBind[]
  restartPolicy?: RestartPolicy
  autoStart?: boolean
}

export interface CreateContainerResponse {
  id: string
  warnings: string[]
}

export interface ContainerLogs {
  logs: string
}

export type ContainerAction =
  | 'start'
  | 'stop'
  | 'restart'
  | 'kill'
  | 'pause'
  | 'unpause'
