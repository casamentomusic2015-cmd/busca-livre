const CACHE_NAME = 'busca-livre-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Instala e cacheia assets estáticos
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Limpa caches antigos na ativação
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Estratégia: Network first para API, Cache first para estáticos
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignora requisições não-GET e extensões de navegador
  if (event.request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // API: network first, sem cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(
          JSON.stringify({ error: 'Sem conexão. Verifique sua internet.' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // Navegação (HTML): network first com fallback offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => offlinePage())
    );
    return;
  }

  // Assets estáticos: cache first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});

function offlinePage() {
  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sem conexão — Busca Livre</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, sans-serif;
      background: #0a0a0a;
      color: #f5f5f5;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      text-align: center;
      gap: 1rem;
    }
    h1 { font-size: 1.5rem; color: #FFE600; }
    p { color: #888; font-size: 0.9rem; max-width: 320px; line-height: 1.6; }
    button {
      margin-top: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #FFE600;
      color: #000;
      border: none;
      border-radius: 0.75rem;
      font-weight: bold;
      cursor: pointer;
      font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <h1>Sem conexão</h1>
  <p>
    Verifique sua conexão com a internet.<br />
    Suas buscas recentes ainda estão disponíveis ao voltar online.
  </p>
  <button onclick="window.location.reload()">Tentar novamente</button>
</body>
</html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}
