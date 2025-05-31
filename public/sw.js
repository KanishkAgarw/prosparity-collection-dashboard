
const CACHE_NAME = 'prosparity-v2';
const STATIC_CACHE = 'prosparity-static-v2';
const DYNAMIC_CACHE = 'prosparity-dynamic-v2';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/src/main.tsx',
  '/src/index.css',
  '/manifest.json',
  '/lovable-uploads/879123ce-9339-4aec-90c9-3857e3b77417.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - implement network-first strategy for API calls, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip Supabase API calls - always go to network
  if (request.url.includes('supabase.co')) {
    return;
  }

  // Skip chrome-extension requests
  if (request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    // For navigation requests (pages)
    request.mode === 'navigate' 
      ? handleNavigationRequest(request)
      : // For static assets (CSS, JS, images)
        request.destination === 'style' || 
        request.destination === 'script' || 
        request.destination === 'image'
      ? handleStaticAssetRequest(request)
      : // For other requests, try network first
        handleDynamicRequest(request)
  );
});

// Handle navigation requests (pages) - network first, fallback to cache
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || caches.match('/');
  }
}

// Handle static assets - cache first
async function handleStaticAssetRequest(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    console.log('Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Handle dynamic requests - network first with cache fallback
async function handleDynamicRequest(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(DYNAMIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
}
