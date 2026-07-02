// Service Worker — Sacaita Montgomery
// Estratégia: cache-first para assets estáticos, network-first para navegação (HTML),
// com fallback offline e limpeza automática de caches antigos.

const CACHE_VERSION = "v1";
const CACHE_NAME = `sacaita-cache-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./sobre.html",
  "./servicos.html",
  "./formacao.html",
  "./certificacoes.html",
  "./biblioteca.html",
  "./videos.html",
  "./comunidade.html",
  "./apoiar.html",
  "./contacto.html",
  "./offline.html",
  "./manifest.json",
  "./favicon.png",
  "./og-image.png",
  "./your-photo-transparent.png"
];

// Instala e faz pré-cache dos ficheiros essenciais
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// Ativa e remove caches antigos (atualização automática)
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("sacaita-cache-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Estratégia de fetch
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Ignora pedidos que não sejam GET (ex: POST de formulários)
  if (request.method !== "GET") return;

  // Navegação de páginas (HTML): network-first, com fallback para cache e depois offline.html
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("./offline.html"))
        )
    );
    return;
  }

  // Restantes assets (CSS, imagens, fontes): cache-first, com atualização em segundo plano
  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
