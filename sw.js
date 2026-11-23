// إعدادات كاش اللعبة الأصلية PWA للتشغيل السلس دون إنترنت (إصدار متوافق v15 - إصلاح تحقق الاشتراك)
const CACHE_NAME = 'chicken-game-v15';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './privacy.html',
  './terms.html',
  './contact.html',
  './manifest.json',
  './ads.txt',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-192.png',
  './icon-maskable-512.png',
  './screenshot-desktop.png',
  './screenshot-mobile.png',
  './css/style.css',
  './js/audio.js',
  './js/entities.js',
  './js/levels.js',
  './js/security.js',
  './js/admin.js',
  './js/ads.js',
  './js/features.js',
  './js/vouchers.js',
  './js/withdraw.js',
  './js/referral.js',
  './js/winners.js',
  './js/dhikr.js',
  './js/game.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch((err) => {
      console.warn('PWA Cache install warning:', err);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // عدم اعتراض الطلبات غير المدعومة أو غير الـ GET
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  
  // تمرير طلبات شبكات الإعلانات والـ APIs الخارجية مباشرة عبر الشبكة دون تخزين
  if (url.origin !== self.location.origin || url.pathname.includes('/act/') || url.hostname.includes('google') || url.hostname.includes('alwingulla') || url.hostname.includes('3nbf4') || url.hostname.includes('quge5')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // تحديث في الخلفية (Stale-while-revalidate)
        fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(e.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
        return response;
      }).catch(async () => {
        // حماية ضد رمي خطأ TypeError عند انقطاع الإنترنت
        if (e.request.mode === 'navigate' || (e.request.headers.get('accept') && e.request.headers.get('accept').includes('text/html'))) {
          const fallback = await caches.match('./index.html');
          if (fallback) return fallback;
        }
        return new Response('Offline - No connection', { status: 503, statusText: 'Service Unavailable' });
      });
    })
  );
});
