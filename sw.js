// sw.js
const CACHE_NAME = 'pwa-reader-v1';
const CACHED_FILES = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/sw.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.11.338/pdf.min.js',
    'https://unpkg.com/tesseract.js@3.0.3/dist/tesseract.min.js',
    '/tessdata/chi_sim.traineddata'  // 需手动下载并放入项目目录
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(CACHED_FILES))
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then(res => res || fetch(e.request))
    );
});
