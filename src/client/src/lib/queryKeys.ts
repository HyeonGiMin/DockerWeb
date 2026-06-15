export const queryKeys = {
  systemInfo: ['system', 'info'] as const,
  ping: ['system', 'ping'] as const,
  connection: ['settings', 'connection'] as const,
  images: ['images'] as const,
  containers: ['containers'] as const,
  containerInspect: (id: string) => ['containers', id, 'inspect'] as const,
  volumes: ['volumes'] as const,
  networks: ['networks'] as const,
}
