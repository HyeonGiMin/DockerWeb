export type ConnectionMode = 'Local' | 'Remote'

export interface ConnectionInfo {
  mode: ConnectionMode
  endpoint: string
  tlsEnabled: boolean
}

export interface PingResult {
  ok: boolean
  connection: ConnectionInfo
}

export interface PruneResult {
  deletedCount: number
  spaceReclaimed: number
}

export interface ProblemDetails {
  title?: string
  detail?: string
  status?: number
}
