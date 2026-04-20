// service-worker.js
const CACHE_NAME = 'noveo-media-cache-v3';
const MEDIA_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp4', '.webm', '.mp3', '.ogg'];
const OFFLINE_ASSETS = [
    '/ic_launcher.png',
    '/manifest.json',
    '/static/emoji/emoji_pretty.json',
    '/static/models/telegram_star.obj',
    '/static/audio/message-received.wav'
];

// Check if URL is a media file
function isMediaUrl(url) {
    return MEDIA_EXTENSIONS.some(ext => url.toLowerCase().includes(ext));
}

// Install event - cache shell resources
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_ASSETS)).catch(() => {})
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// Fetch event - cache media files
self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Only cache media files (images, videos, audio)
    if (!isMediaUrl(url)) {
        return; // Let browser handle non-media requests normally
    }

    event.respondWith(
        caches.open(CACHE_NAME).then(cache => {
            return cache.match(event.request).then(cachedResponse => {
                if (cachedResponse) {
                    // Return cached media immediately
                    return cachedResponse;
                }

                // Fetch from network and cache it
                return fetch(event.request).then(networkResponse => {
                    // Only cache successful responses
                    if (networkResponse && networkResponse.status === 200) {
                        cache.put(event.request, networkResponse.clone());
                    }
                    return networkResponse;
                }).catch(error => {
                    console.error('Fetch failed for:', url, error);
                    throw error;
                });
            });
        })
    );
});

// Message event - for manual cache clearing and local notification bridge
self.addEventListener('message', (event) => {
    if (!event.data || typeof event.data !== 'object') return;

    if (event.data.action === 'clearCache') {
        event.waitUntil(
            caches.delete(CACHE_NAME).then(() => {
                console.log('Service Worker: Cache cleared');
            })
        );
        return;
    }

    if (event.data.action === 'notify') {
        const payload = event.data.payload || {};
        const title = String(payload.title || 'Noveo');
        const body = String(payload.body || 'New activity');
        const icon = String(payload.icon || '/ic_launcher.png');
        const tag = String(payload.tag || `local-${Date.now()}`);

        event.waitUntil(
            self.registration.showNotification(title, {
                body,
                icon,
                badge: icon,
                tag,
                renotify: false,
                data: payload.data || {}
            })
        );
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
            for (const client of clients) {
                if ('focus' in client) return client.focus();
            }
            if (self.clients.openWindow) return self.clients.openWindow('/');
            return null;
        })
    );
});

self.addEventListener('push', (event) => {
    let payload = {};
    try {
        payload = event.data ? event.data.json() : {};
    } catch (_) {
        payload = { body: event.data ? event.data.text() : 'New activity' };
    }

    const title = String(payload.title || 'Noveo');
    const body = String(payload.body || 'New activity');
    const icon = String(payload.icon || '/ic_launcher.png');
    const tag = String(payload.tag || `push-${Date.now()}`);

    event.waitUntil(
        self.registration.showNotification(title, {
            body,
            icon,
            badge: icon,
            tag,
            renotify: false,
            data: payload.data || {}
        })
    );
});
