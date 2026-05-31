// Service Worker LaporCAM PWA
const CACHE_NAME = 'laporcam-v12';
const urlsToCache = [
  '/app_cam_laporan/',
  '/app_cam_laporan/index.html',
  '/app_cam_laporan/style.css',
  '/app_cam_laporan/style-mobile.css',
  '/app_cam_laporan/app.js',
  '/app_cam_laporan/js/state.js',
  '/app_cam_laporan/js/step1_data.js',
  '/app_cam_laporan/js/step2_tmpl.js',
  '/app_cam_laporan/js/step3_photo.js',
  '/app_cam_laporan/js/step4_pdf.js',
  '/app_cam_laporan/js/voice.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
