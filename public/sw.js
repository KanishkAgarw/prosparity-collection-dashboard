
const CACHE_NAME = 'prosparity-v2';
const API_CACHE_NAME = 'prosparity-api-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/lovable-uploads/879123ce-9339-4aec-90c9-3857e3b77417.png'
];

// Install event - cache static resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting()) // Activate immediately
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch event - enhanced caching strategy
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);

  // Handle Supabase API calls with network-first strategy
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      networkFirstWithCache(event.request, API_CACHE_NAME, 30000) // 30 second cache
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (url.pathname.includes('.js') || url.pathname.includes('.css') || url.pathname.includes('.png')) {
    event.respondWith(
      cacheFirstWithNetworkFallback(event.request, CACHE_NAME)
    );
    return;
  }

  // Handle HTML pages with network-first strategy
  event.respondWith(
    networkFirstWithCache(event.request, CACHE_NAME, 5000) // 5 second cache for HTML
  );
});

// Network-first with cache fallback strategy
async function networkFirstWithCache(request, cacheName, maxAge = 60000) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      const responseClone = response.clone();
      
      // Add timestamp to cached response for age checking
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cache-timestamp': Date.now().toString()
        }
      });
      
      cache.put(request, responseWithTimestamp);
    }
    
    return response;
  } catch (error) {
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      const cacheTimestamp = cachedResponse.headers.get('sw-cache-timestamp');
      const age = Date.now() - parseInt(cacheTimestamp || '0');
      
      // Return cached response if within maxAge
      if (age < maxAge) {
        return cachedResponse;
      }
    }
    
    throw error;
  }
}

// Cache-first with network fallback strategy
async function cacheFirstWithNetworkFallback(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.warn('Network and cache failed for:', request.url);
    throw error;
  }
}

// Background sync for when the app comes back online
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background data synchronization here
  console.log('Background sync triggered');
}
