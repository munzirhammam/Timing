const CACHE_NAME = "seasonal-star-calendar-v7";
const BASE_URL = new URL("./", self.location.href).href;
const appUrl = (path = "") => new URL(path, BASE_URL).href;
const APP_SHELL = [
  appUrl(),
  appUrl("manifest.webmanifest"),
  appUrl("favicon.svg"),
  appUrl("icon-192.png"),
  appUrl("icon-512.png"),
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(APP_SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_URLS" || !Array.isArray(event.data.urls)) return;

  const urls = [...new Set(event.data.urls)]
    .map((value) => {
      try {
        return new URL(value, self.location.origin);
      } catch {
        return null;
      }
    })
    .filter((url) => url && url.origin === self.location.origin)
    .map((url) => url.href);

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(
        urls.map(async (url) => {
          const response = await fetch(url, { cache: "reload" });
          if (response.ok) await cache.put(url, response.clone());
        }),
      ))
      .then(() => event.ports[0]?.postMessage({ type: "CACHE_COMPLETE" })),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(BASE_URL, copy));
          return response;
        })
        .catch(async () => (await caches.match(request)) || (await caches.match(BASE_URL))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
