/* global self, caches */
const CACHE_PREFIX = "summit-stories-pwa-";
const CACHE_NAME = `${CACHE_PREFIX}v1`;
const OFFLINE_URL = "/offline.html";
const PRE_CACHE = [
  OFFLINE_URL,
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
  "/images/logo.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRE_CACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

async function staticAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    await cache.put(request, response.clone());
    // Keep runtime entries bounded while retaining the offline assets.
    const runtime = (await cache.keys()).filter(
      (key) => !PRE_CACHE.includes(new URL(key.url).pathname),
    );
    await Promise.all(
      runtime
        .slice(0, Math.max(0, runtime.length - 80))
        .map((key) => cache.delete(key)),
    );
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Authentication, APIs, and React Server Component responses always use the
  // network. Their existing cache and invalidation rules remain authoritative.
  if (url.pathname.startsWith("/api/") || request.headers.has("RSC")) return;
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const fallback = await caches.match(OFFLINE_URL);
        return (
          fallback ??
          new Response("You are offline. Reconnect to open Summit Stories.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
    return;
  }
  if (
    url.pathname.startsWith("/_next/static/") ||
    PRE_CACHE.includes(url.pathname)
  ) {
    event.respondWith(staticAsset(request));
  }
});
