const CACHE_NAME = 'budget-2025-v3'
const urlsToCache = [
  '/',
  '/dashboard',
  '/transactions',
  '/budgets',
  '/loans',
  '/sip',
  '/stocks',
  '/bank-accounts',
  '/reports',
  '/settings',
  '/login',
  '/register'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )
  self.skipWaiting()
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  return self.clients.claim()
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip API routes (data is stored in MongoDB and synced via IndexedDB)
  if (url.pathname.startsWith('/api/')) {
    return
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip different-origin requests
  if (!url.origin.startsWith(self.location.origin)) {
    return
  }

  // Handle navigation requests (page loads)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful navigation responses
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse
            }
            // Fallback to index page if no cache
            return caches.match('/')
          })
        })
    )
    return
  }

  // Handle static assets and other GET requests
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached version if available
      if (cachedResponse) {
        return cachedResponse
      }

      // Fetch from network
      return fetch(request).then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response
        }

        // Clone the response for caching
        const responseToCache = response.clone()

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache)
        })

        return response
      })
    })
  )
})

