const CACHE_NAME = 'budget-2025-v4'
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

// Maximum age for cached pages (24 hours)
const MAX_AGE = 24 * 60 * 60 * 1000

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker')
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache).catch((error) => {
        console.error('[SW] Cache addAll failed:', error)
      })
    })
  )
  // Skip waiting to activate immediately
  self.skipWaiting()
})

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker')
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('[SW] Cleaning old caches:', cacheNames.filter(name => name !== CACHE_NAME))
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  // Take control of all pages immediately
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
  // Use Network First strategy for HTML/JS/CSS to get fresh updates
  const isAppAsset = url.pathname.endsWith('.html') ||
                     url.pathname.endsWith('.js') ||
                     url.pathname.endsWith('.css') ||
                     url.pathname === '/' ||
                     urlsToCache.includes(url.pathname)

  if (isAppAsset) {
    // Network first for app assets to ensure fresh content
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache the fresh response
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
          return caches.match(request)
        })
    )
  } else {
    // Cache first for other assets (images, fonts, etc.)
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }

        return fetch(request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response
          }

          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })

          return response
        })
      })
    )
  }
})

