import axios, { AxiosError } from 'axios'
import type {
  ConnectionInfo,
  ContainerAction,
  ContainerDto,
  ContainerLogs,
  CreateContainerRequest,
  CreateContainerResponse,
  CreateNetworkRequest,
  CreateVolumeRequest,
  ImageDto,
  NetworkDto,
  PingResult,
  ProblemDetails,
  PruneResult,
  PullImageRequest,
  SystemInfoDto,
  TagImageRequest,
  VolumeDto,
} from '../types'
import { clearToken, getToken } from './auth'

export const http = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

const LOGIN_PATH = '/login'

/** Attach the bearer token (when present) to every outgoing request. */
http.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/** On 401, drop the stale token and bounce to the login page. */
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status
    const isLoginCall = error.config?.url?.includes('/auth/login')
    if (status === 401 && !isLoginCall) {
      clearToken()
      if (window.location.pathname !== LOGIN_PATH) {
        window.location.assign(LOGIN_PATH)
      }
    }
    return Promise.reject(error)
  },
)

interface LoginResponse {
  token: string
  expiresAt: string
  username: string
}

export const authApi = {
  /**
   * Exchange credentials for a JWT. Uses a bare axios call so no stale bearer is
   * attached and a 401 here does not trigger the redirect interceptor.
   */
  login: (username: string, password: string) =>
    axios
      .post<LoginResponse>(
        '/api/auth/login',
        { username, password },
        { headers: { 'Content-Type': 'application/json' } },
      )
      .then((r) => r.data),
  me: () => http.get<{ username: string }>('/auth/me').then((r) => r.data),
}

/** Extract a user-friendly message from an RFC7807 ProblemDetails error. */
export function getApiErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const problem = error.response?.data as ProblemDetails | undefined
    if (problem?.detail) {
      return problem.detail
    }
    if (problem?.title) {
      return problem.title
    }
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return 'Unexpected error'
}

interface ConnectionSettingsRequest {
  mode: ConnectionInfo['mode']
  localEndpoint?: string
  remoteEndpoint?: string
  tls?: {
    enabled: boolean
    clientCertPath?: string
    clientCertPassword?: string
  }
}

export const systemApi = {
  info: () => http.get<SystemInfoDto>('/system/info').then((r) => r.data),
  ping: () => http.get<PingResult>('/system/ping').then((r) => r.data),
}

export const settingsApi = {
  getConnection: () =>
    http.get<ConnectionInfo>('/settings/connection').then((r) => r.data),
  updateConnection: (body: ConnectionSettingsRequest) =>
    http
      .put<{ ok: boolean; connection: ConnectionInfo }>(
        '/settings/connection',
        body,
      )
      .then((r) => r.data),
}

export const imagesApi = {
  list: () => http.get<ImageDto[]>('/images').then((r) => r.data),
  pull: (body: PullImageRequest) => http.post('/images/pull', body),
  tag: (id: string, body: TagImageRequest) =>
    http.post(`/images/${id}/tag`, body),
  remove: (id: string, force = false, noprune = false) =>
    http.delete(`/images/${id}`, { params: { force, noprune } }),
  prune: () =>
    http.post<PruneResult>('/images/prune').then((r) => r.data),
  import: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    // `docker load` from a tar. Let axios set the multipart boundary, and
    // disable the timeout because archives can be large.
    return http.post('/images/import', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0,
    })
  },
}

export const containersApi = {
  list: (all = true) =>
    http.get<ContainerDto[]>('/containers', { params: { all } }).then((r) => r.data),
  inspect: (id: string) =>
    http.get<Record<string, unknown>>(`/containers/${id}`).then((r) => r.data),
  create: (body: CreateContainerRequest) =>
    http
      .post<CreateContainerResponse>('/containers', body)
      .then((r) => r.data),
  action: (id: string, action: ContainerAction) =>
    http.post(`/containers/${id}/${action}`),
  remove: (id: string, force = false, removeVolumes = false) =>
    http.delete(`/containers/${id}`, { params: { force, removeVolumes } }),
  logs: (id: string, tail = 200) =>
    http
      .get<ContainerLogs>(`/containers/${id}/logs`, { params: { tail } })
      .then((r) => r.data),
  prune: () =>
    http.post<PruneResult>('/containers/prune').then((r) => r.data),
}

export const volumesApi = {
  list: () => http.get<VolumeDto[]>('/volumes').then((r) => r.data),
  create: (body: CreateVolumeRequest) => http.post('/volumes', body),
  remove: (name: string, force = false) =>
    http.delete(`/volumes/${name}`, { params: { force } }),
  prune: () =>
    http.post<PruneResult>('/volumes/prune').then((r) => r.data),
}

export const networksApi = {
  list: () => http.get<NetworkDto[]>('/networks').then((r) => r.data),
  create: (body: CreateNetworkRequest) => http.post('/networks', body),
  remove: (id: string) => http.delete(`/networks/${id}`),
}
