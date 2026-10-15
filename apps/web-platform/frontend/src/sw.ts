import { defaultCache } from '@serwist/next/worker'
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist'
import { Serwist } from 'serwist'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: WorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
})

serwist.addEventListeners()

type PushWorkerEvent = {
  data: { json(): unknown } | null
  waitUntil(promise: Promise<unknown>): void
}
type PushClickEvent = {
  notification: { close(): void; data?: unknown }
  waitUntil(promise: Promise<unknown>): void
}
type PushWindowClient = {
  focus(): Promise<unknown>
  navigate(url: string): Promise<unknown>
}

const pushWorker = self as unknown as {
  addEventListener(type: 'push', listener: (event: PushWorkerEvent) => void): void
  addEventListener(type: 'notificationclick', listener: (event: PushClickEvent) => void): void
  registration: { showNotification(title: string, options: NotificationOptions): Promise<unknown> }
  location: { origin: string }
  clients: {
    matchAll(options: { type: 'window'; includeUncontrolled: boolean }): Promise<PushWindowClient[]>
    openWindow(url: string): Promise<unknown>
  }
}

pushWorker.addEventListener('push', (event) => {
  const payload = event.data?.json() as
    | { title?: string; body?: string; url?: string; tag?: string }
    | undefined
  const title = payload?.title || 'သတိပေးချက်'
  const options: NotificationOptions = {
    body: payload?.body || '',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: payload?.tag,
    data: { url: payload?.url || '/reminders' },
  }
  event.waitUntil(pushWorker.registration.showNotification(title, options))
})

pushWorker.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = new URL(
    (event.notification.data as { url?: string } | undefined)?.url || '/reminders',
    pushWorker.location.origin
  ).href
  event.waitUntil(
    pushWorker.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients[0]
      if (existing) {
        void existing.navigate(target)
        return existing.focus()
      }
      return pushWorker.clients.openWindow(target)
    })
  )
})
