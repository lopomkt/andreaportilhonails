const CACHE_NAME = 'ap-nails-crm-v2';
const STATIC_CACHE = 'ap-nails-static-v2';
const DYNAMIC_CACHE = 'ap-nails-dynamic-v2';

// App Shell - recursos essenciais para funcionalidade offline
const APP_SHELL = [
  '/',
  '/index.html',
  '/src/index.css',
  '/lovable-uploads/f1b44926-72e3-4b1b-8d5b-3c987513bee9.png'
];

// URLs que NUNCA devem ser cacheadas (sempre usar network)
const NEVER_CACHE_URLS = [
  'supabase.co',
  'supabase.io',
  'lovableproject.com',
  '/api/',
  'rest/v1/',
  'auth/v1/',
  'storage/v1/'
];

self.addEventListener('install', event => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Service Worker: Caching App Shell');
        return cache.addAll(APP_SHELL);
      })
      .then(() => {
        console.log('Service Worker: App Shell cached successfully');
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('Service Worker: Error caching app shell', err);
      })
  );
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Claiming clients');
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // NEVER cache or interfere with API calls - let them pass through completely
  if (NEVER_CACHE_URLS.some(apiUrl => request.url.includes(apiUrl))) {
    // For ALL API calls (GET, POST, PUT, DELETE, PATCH), bypass service worker completely
    return;
  }

  // Skip non-GET requests for non-API calls
  if (request.method !== 'GET') {
    return;
  }

  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone response for caching
          const responseClone = response.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => {
          // Fallback to cached app shell
          return caches.match('/') || caches.match('/index.html');
        })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  if (request.destination === 'image' || 
      request.destination === 'style' || 
      request.destination === 'script' ||
      request.destination === 'font') {
    event.respondWith(cacheFirstStrategy(request));
    return;
  }

  // Default: try cache first, then network
  event.respondWith(
    caches.match(request)
      .then(response => {
        return response || fetch(request)
          .then(fetchResponse => {
            const responseClone = fetchResponse.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => cache.put(request, responseClone));
            return fetchResponse;
          });
      })
      .catch(() => {
        // Fallback for offline
        if (request.destination === 'document') {
          return caches.match('/');
        }
      })
  );
});

// Cache-first strategy for static assets
function cacheFirstStrategy(request) {
  return caches.match(request)
    .then(response => {
      if (response) {
        return response;
      }
      return fetch(request)
        .then(fetchResponse => {
          const responseClone = fetchResponse.clone();
          caches.open(STATIC_CACHE)
            .then(cache => cache.put(request, responseClone));
          return fetchResponse;
        });
    });
}

// Network-first strategy for non-API calls only
function networkFirstStrategy(request) {
  return fetch(request)
    .then(response => {
      const responseClone = response.clone();
      caches.open(DYNAMIC_CACHE)
        .then(cache => cache.put(request, responseClone));
      return response;
    })
    .catch(() => {
      return caches.match(request);
    });
}

// Stale-while-revalidate strategy for non-API calls only
function staleWhileRevalidateStrategy(request) {
  return caches.match(request)
    .then(response => {
      const fetchPromise = fetch(request)
        .then(fetchResponse => {
          const responseClone = fetchResponse.clone();
          caches.open(DYNAMIC_CACHE)
            .then(cache => cache.put(request, responseClone));
          return fetchResponse;
        });
      
      return response || fetchPromise;
    });
}

// Handle background sync
self.addEventListener('sync', event => {
  console.log('Service Worker: Background sync', event.tag);
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Implement background sync logic here
  // For example, sync offline data when connection is restored
  return Promise.resolve();
}

// Handle push notifications
self.addEventListener('push', event => {
  console.log('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação',
    icon: '/lovable-uploads/f1b44926-72e3-4b1b-8d5b-3c987513bee9.png',
    badge: '/lovable-uploads/f1b44926-72e3-4b1b-8d5b-3c987513bee9.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir App',
        icon: '/lovable-uploads/f1b44926-72e3-4b1b-8d5b-3c987513bee9.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/lovable-uploads/f1b44926-72e3-4b1b-8d5b-3c987513bee9.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('AP Nails CRM', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Handle app install prompt
self.addEventListener('appinstalled', event => {
  console.log('Service Worker: App was installed');
});