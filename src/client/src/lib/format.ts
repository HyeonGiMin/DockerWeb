import type { PortMapping } from '../types'

const KIB = 1024
const UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'] as const

/** Format a byte count using binary units (KiB/MiB/GiB). */
export function formatBytes(bytes: number, fractionDigits = 1): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(KIB)),
    UNITS.length - 1,
  )
  const value = bytes / KIB ** exponent
  const digits = exponent === 0 ? 0 : fractionDigits
  return `${value.toFixed(digits)} ${UNITS[exponent]}`
}

const RELATIVE_DIVISIONS: { amount: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'second' },
  { amount: 60, unit: 'minute' },
  { amount: 24, unit: 'hour' },
  { amount: 7, unit: 'day' },
  { amount: 4.34524, unit: 'week' },
  { amount: 12, unit: 'month' },
  { amount: Number.POSITIVE_INFINITY, unit: 'year' },
]

const relativeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' })

/** Render an ISO-8601 timestamp as a human relative string (e.g. "3 hours ago"). */
export function relativeTime(iso: string | undefined | null): string {
  if (!iso) {
    return '—'
  }

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  let duration = (date.getTime() - Date.now()) / 1000
  for (const division of RELATIVE_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return relativeFormatter.format(Math.round(duration), division.unit)
    }
    duration /= division.amount
  }
  return relativeFormatter.format(Math.round(duration), 'year')
}

/** Strip an optional "sha256:" prefix and truncate an id to 12 chars. */
export function truncateId(id: string, length = 12): string {
  if (!id) {
    return ''
  }
  const cleaned = id.startsWith('sha256:') ? id.slice('sha256:'.length) : id
  return cleaned.slice(0, length)
}

/** Format a single port mapping as "host:container/proto" or "container/proto". */
export function formatPort(port: PortMapping): string {
  const proto = port.type || 'tcp'
  if (port.publicPort != null) {
    const host = port.ip && port.ip !== '0.0.0.0' ? `${port.ip}:` : ''
    return `${host}${port.publicPort}→${port.privatePort}/${proto}`
  }
  return `${port.privatePort}/${proto}`
}

/** Format a list of port mappings, collapsing duplicates. */
export function formatPorts(ports: PortMapping[]): string {
  if (!ports || ports.length === 0) {
    return '—'
  }
  return Array.from(new Set(ports.map(formatPort))).join(', ')
}

/** Best-effort container display name (drops the leading slash Docker adds). */
export function containerName(names: string[]): string {
  const first = names?.[0] ?? ''
  return first.startsWith('/') ? first.slice(1) : first
}
