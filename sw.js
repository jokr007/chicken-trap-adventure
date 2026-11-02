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

// 2. إصدار الكاش المحدث لتخطي النسخ المعطوبة السابقة
const CACHE_NAME = 'chicken-game-v4';

// قائمة الأصول الفعلية الموجودة فقط (تم إزالة أيقونات غير موجودة لتفادي فشل التخزين)
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
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

// مرحلة التثبيت: تحميل وحفظ الأصول الأساسية
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

// مرحلة التفعيل: مسح جميع الكاشات القديمة فوراً والتحكم في كل الصفحات المفتوحة
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// مرحلة جلب الموارد: استراتيجية ذكية تمنع الشاشة السوداء والنسخ القديمة
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);

  // تمرير طلبات شبكات الإعلانات والـ APIs الخارجية والجهات الخارجية دون كاش
  if (url.origin !== self.location.origin || url.pathname.includes('/act/') || url.hostname.includes('google') || url.hostname.includes('alwingulla') || url.hostname.includes('5gvci')) {
    return;
  }

  // أ. لصفحات التنقل ومستند HTML (Network-First): جلب أحدث نسخة دائماً، والرجوع للكاش فقط في حالة انقطاع الإنترنت
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

  // ب. للملفات الثابتة (Stale-While-Revalidate): إرجاع الكاش سريعاً وتحديثه في الخلفية
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
