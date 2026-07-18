const CACHE_PREFIX = 'alemah-shell-'
const CACHE_NAME = `${CACHE_PREFIX}v2`
const OFFLINE_URL = '/offline.html'
const PRIVATE_PATHS = /\/(api|admin|auth|checkout|account|orders|login|create-account|forgot-password|logout)(\/|$)/

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL)))
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.origin !== self.location.origin || PRIVATE_PATHS.test(url.pathname)) return

  if (request.destination === 'image' || request.destination === 'font' || request.destination === 'style' || request.destination === 'script') {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached || fetch(request).then(async (response) => {
          if (!response.ok) return response

          const cache = await caches.open(CACHE_NAME)
          await cache.put(request, response.clone())
          return response
        }),
      ),
    )
    return
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)))
  }
})
