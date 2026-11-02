// 1. إعدادات شبكة إعلانات Monetag (محمية ضد الحظر وانقطاع الاتصال)
self.options = {
    "domain": "5gvci.com",
    "zoneId": 12130138
};
self.lary = "";
try {
    importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw');
} catch (e) {
    console.warn('Monetag SW script bypassed or blocked by ad-blocker:', e);
}

// 2. إصدار الكاش المحدث لتخطي النسخ المعطوبة وتفعيل معايير المتاجر Store-Ready
const CACHE_NAME = 'chicken-game-v5';

// قائمة أصول التطبيق PWA المعتمدة للتشغيل دون اتصال
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
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

// مرحلة التثبيت: تحميل الأصول الأساسية في الكاش
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch((err) => {
      console.warn('PWA Cache install warning:', err);
    })
  );
});

// مرحلة التفعيل: مسح جميع الكاشات القديمة فوراً
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// مرحلة جلب الموارد: استراتيجية Network-First للـ HTML و Stale-While-Revalidate للملفات الثابتة
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // استثناء الإعلانات والروابط الخارجية
  if (url.origin !== self.location.origin || url.pathname.includes('/act/') || url.hostname.includes('google') || url.hostname.includes('alwingulla') || url.hostname.includes('5gvci')) {
    return;
  }

  // 1. التنقل ومستند HTML (Network-First)
  if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(e.request).then((cached) => cached || caches.match('./index.html') || caches.match('./'));
        })
    );
    return;
  }

  // 2. الملفات الثابتة (Stale-While-Revalidate)
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
