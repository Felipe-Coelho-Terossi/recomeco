/* Cache-first: depois da 1ª visita o app abre offline. Mude VERSION ao publicar uma atualização. */
var VERSION = 'recomeco-v2';
var FILES = ['./', 'index.html', 'core.js', 'css/fonts.css', 'css/tokens.css', 'css/base.css', 'css/views.css', 'js/main.js', 'js/util.js', 'js/icons.js', 'js/store.js', 'js/ui.js', 'js/views/hoje.js', 'js/views/semana.js', 'js/views/compras.js', 'js/views/evolucao.js', 'js/views/treino.js', 'js/views/ajustes.js', 'fonts/barlow-condensed-latin-600-normal.woff2', 'fonts/barlow-condensed-latin-700-normal.woff2', 'fonts/barlow-latin-400-normal.woff2', 'fonts/barlow-latin-500-normal.woff2', 'fonts/barlow-latin-600-normal.woff2', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
    return hit || fetch(e.request).then(function (res) {
      var copy = res.clone();
      if (res.ok && new URL(e.request.url).origin === location.origin) caches.open(VERSION).then(function (c) { c.put(e.request, copy); });
      return res;
    }).catch(function () { return caches.match('index.html'); });
  }));
});
