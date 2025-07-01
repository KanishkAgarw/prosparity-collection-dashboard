
const CACHE_NAME = 'prosparity-v5';
const API_CACHE_NAME = 'prosparity-api-v4';
const urlsToCache = [
  '/',
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
        return cache.addAll(urlsToCache);
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

// Fetch event - simplified and more reliable caching strategy
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  const requestKey = `${event.request.method}:${event.request.url}`;

  // Handle Supabase API calls with network-first strategy
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      (async () => {
        try {
          // Check if there's already an ongoing request for this URL
          if (ongoingRequests.has(requestKey)) {
            console.log('Waiting for ongoing request:', requestKey);
            return await ongoingRequests.get(requestKey);
          }

          // Create the network request promise
          const networkPromise = (async () => {
            try {
              const response = await fetch(event.request);
              
              // Always clone the response before using it
              const responseClone = response.clone();
              
              // Cache successful responses
              if (response.ok && response.status === 200) {
                try {
                  const cache = await caches.open(API_CACHE_NAME);
                  // Clone the request as well to avoid issues
                  await cache.put(event.request.clone(), responseClone.clone());
                } catch (cacheError) {
                  console.log('Cache put failed:', cacheError);
                }
              }
              
              return response;
            } catch (networkError) {
              console.log('Network request failed, trying cache:', networkError);
              // Try cache as fallback
              const cachedResponse = await caches.match(event.request);
              if (cachedResponse) {
                return cachedResponse;
              }
              throw networkError;
            }
          })();

          // Store the ongoing request
          ongoingRequests.set(requestKey, networkPromise);
          
          const result = await networkPromise;
          
          // Clean up ongoing request tracking
          ongoingRequests.delete(requestKey);
          
          return result;
        } catch (error) {
          console.error('Service worker fetch error:', error);
          ongoingRequests.delete(requestKey);
          
          // Try cache as last resort
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          
          return new Response('Network error', { status: 503 });
        }
      })()
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (url.pathname.includes('.js') || url.pathname.includes('.css') || url.pathname.includes('.png') || url.pathname.includes('.ico')) {
    event.respondWith(
      (async () => {
        try {
          const cachedResponse = await caches.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }
          
          const response = await fetch(event.request);
          if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            await cache.put(event.request.clone(), response.clone());
          }
          return response;
        } catch (error) {
          console.error('Static asset fetch failed:', error);
          return new Response('Asset not found', { status: 404 });
        }
      })()
    );
    return;
  }

  // For HTML pages, try network first with cache fallback
  event.respondWith(
    (async () => {
      try {
        const response = await fetch(event.request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request.clone(), response.clone());
        }
        return response;
      } catch (error) {
        const cachedResponse = await caches.match('/');
        return cachedResponse || new Response('Offline', { status: 503 });
      }
    })()
  );
});

// Clean up ongoing requests periodically
setInterval(() => {
  if (ongoingRequests.size > 50) {
    console.log('Cleaning up ongoing requests map');
    ongoingRequests.clear();
  }
}, 60000);
