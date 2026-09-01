const CACHE_NAME = 'a-little-world-with-us-v1'
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/dashboard/chat',
  '/dashboard/vault',
]

// Install: Cache core pages
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

// Fetch: Cache-first strategy for navigation, network for APIs
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests and Supabase realtime WebSocket
  if (request.method !== 'GET' || url.protocol === 'wss:') {
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request)
        .then((response) => {
          // Cache successful GET requests for static assets
          if (response.ok && (url.pathname.startsWith('/_next/') || url.pathname === '/')) {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          }
          return response
        })
        .catch(() => cached)
    })
  )
})

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  )
  self.clients.claim()
})