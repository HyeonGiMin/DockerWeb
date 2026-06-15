import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr'
import type { StatsDto } from '../types'

const HUB_URL = '/hubs/monitor'

/** Create a hub connection to the monitor hub (not yet started). */
export function createMonitorConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(HUB_URL)
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build()
}

/** Ensure a connection is started; safe to call when already connected. */
async function ensureStarted(connection: HubConnection): Promise<void> {
  if (connection.state === HubConnectionState.Disconnected) {
    await connection.start()
  }
}

export interface StreamHandlers<T> {
  next: (item: T) => void
  error?: (err: unknown) => void
  complete?: () => void
}

/** Subscribe to the StreamStats server stream. Returns a disposer. */
export function subscribeStats(
  connection: HubConnection,
  containerId: string,
  handlers: StreamHandlers<StatsDto>,
): () => void {
  let subscription: { dispose: () => void } | undefined
  let disposed = false

  ensureStarted(connection)
    .then(() => {
      if (disposed) {
        return
      }
      subscription = connection.stream('StreamStats', containerId).subscribe({
        next: handlers.next,
        error: (err) => handlers.error?.(err),
        complete: () => handlers.complete?.(),
      })
    })
    .catch((err) => handlers.error?.(err))

  return () => {
    disposed = true
    subscription?.dispose()
  }
}

/** Subscribe to the StreamLogs server stream (one string per line). Returns a disposer. */
export function subscribeLogs(
  connection: HubConnection,
  containerId: string,
  tail: number,
  handlers: StreamHandlers<string>,
): () => void {
  let subscription: { dispose: () => void } | undefined
  let disposed = false

  ensureStarted(connection)
    .then(() => {
      if (disposed) {
        return
      }
      subscription = connection
        .stream('StreamLogs', containerId, tail)
        .subscribe({
          next: handlers.next,
          error: (err) => handlers.error?.(err),
          complete: () => handlers.complete?.(),
        })
    })
    .catch((err) => handlers.error?.(err))

  return () => {
    disposed = true
    subscription?.dispose()
  }
}
