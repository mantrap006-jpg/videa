const CACHE_NAME = "videa-shell-v6";
const OFFLINE_URL = "/offline.html";
const ICON_URL = "/favicon.png";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      const results = await Promise.allSettled([
        cache.add(OFFLINE_URL),
        cache.add(ICON_URL)
      ]);
      if (results.every((result) => result.status === "rejected")) {
        throw new Error("Videa offline assets could not be cached");
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key.startsWith("videa-shell-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const offline = await caches.match(OFFLINE_URL);
        return offline || new Response(
          "You are offline. Reconnect to the internet and reload Videa.",
          { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
        );
      })
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/") || url.pathname === ICON_URL) {
    event.respondWith(
      caches.match(request).then(async (cached) => {
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          cache.put(request, response.clone()).catch(() => {});
        }
        return response;
      })
    );
  }
});
