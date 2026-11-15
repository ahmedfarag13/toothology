// Toothology service worker: app shell offline, fresh HTML when online, never caches the API or videos.
const V = 'tt-v1';
const SHELL = ['/', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/') || u.pathname.startsWith('/clips/')) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(r => { caches.open(V).then(c => c.put('/', r.clone())); return r; }).catch(() => caches.match('/')));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok && (u.pathname.startsWith('/posters/') || u.pathname.startsWith('/icons/'))) { const c = r.clone(); caches.open(V).then(x => x.put(e.request, c)); }
    return r;
  })));
});
