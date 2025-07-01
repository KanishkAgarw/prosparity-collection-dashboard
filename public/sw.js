
const CACHE_NAME = 'prosparity-v4';
const API_CACHE_NAME = 'prosparity-api-v3';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/lovable-uploads/879123ce-9339-4aec-90c9-3857e3b77417.png'
];

// Track ongoing requests to prevent duplicate fetches
const ongoingRequests = new Map();

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(urlsToCache.filter(url => url !== '/static/js/bundle.js' && url !== '/static/css/main.css'));
      })
      .then(() => {
        console.log('Service Worker installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker installation failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated successfully');
      return self.clients.claim();
    })
  );
});

// Fetch event - improved caching strategy with proper response handling
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  const requestKey = `${event.request.method}:${event.request.url}`;

  // Handle Supabase API calls with network-first strategy and deduplication
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      (async () => {
        try {
          // Check if there's already an ongoing request for this URL
          if (ongoingRequests.has(requestKey)) {
            console.log('Deduplicating request:', requestKey);
            return await ongoingRequests.get(requestKey);
          }

          // Create the network request promise
          const networkPromise = fetch(event.request.clone())
            .then((response) => {
              // Always clone the response before using it
              const responseClone = response.clone();
              
              // Don't cache failed responses or responses that are not ok
              if (response.ok && response.status === 200) {
                caches.open(API_CACHE_NAME)
                  .then(cache => {
                    // Clone again for caching to avoid "body already read" error
                    cache.put(event.request.clone(), responseClone.clone());
                  })
                  .catch(err => console.log('Cache put failed:', err));
              }
              
              return response;
            })
            .catch((error) => {
              console.log('Network request failed:', error);
              // Try cache as fallback
              return caches.match(event.request.clone());
            })
            .finally(() => {
              // Clean up ongoing request tracking
              ongoingRequests.delete(requestKey);
            });

          // Store the ongoing request
          ongoingRequests.set(requestKey, networkPromise);
          
          return await networkPromise;
        } catch (error) {
          console.error('Service worker fetch error:', error);
          // Try cache as last resort
          const cachedResponse = await caches.match(event.request.clone());
          return cachedResponse || new Response('Network error', { status: 503 });
        }
      })()
    );
    return;
  }

  // Handle other requests with cache-first strategy for static assets
  if (url.pathname.includes('.js') || url.pathname.includes('.css') || url.pathname.includes('.png') || url.pathname.includes('.ico')) {
    event.respondWith(
      caches.match(event.request.clone())
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request.clone()).then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request.clone(), responseClone))
                .catch(err => console.log('Static cache put failed:', err));
            }
            return response;
          });
        })
        .catch(() => {
          return new Response('Asset not found', { status: 404 });
        })
    );
    return;
  }

  // For HTML pages, try network first with cache fallback
  event.respondWith(
    fetch(event.request.clone())
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request.clone(), responseClone))
            .catch(err => console.log('HTML cache put failed:', err));
        }
        return response;
      })
      .catch(() => {
        return caches.match('/').then(response => response || new Response('Offline', { status: 503 }));
      })
  );
});

// Handle errors gracefully
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
  event.preventDefault();
});

// Clean up ongoing requests periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, promise] of ongoingRequests.entries()) {
    // Remove requests older than 30 seconds (they're likely stale)
    if (promise.timestamp && now - promise.timestamp > 30000) {
      ongoingRequests.delete(key);
    }
  }
}, 30000);
