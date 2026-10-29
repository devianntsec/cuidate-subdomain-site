const VERSION = "cuidate-v1";
const PRECACHE = [
  "./",
  "./index.html",
  "./404.html",
  "./favicon.svg",
  "./manifest.webmanifest",
  "./css/style.css",
  "./fonts/azeret-mono-latin-var.woff2",
  "./fonts/inter-latin-var.woff2",
  "./fonts/jetbrains-mono-latin-var.woff2",
  "./js/main.js",
  "./js/waves.js",
  "./js/lib/dom.js",
  "./js/lib/storage.js",
  "./js/modules/checklist.js",
  "./js/modules/finder.js",
  "./js/modules/quiz.js",
  "./js/modules/scrollspy.js",
  "./js/modules/stepper.js",
  "./js/modules/tabs.js",
  "./js/modules/timeline.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (key !== VERSION) await caches.delete(key);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          const cache = await caches.open(VERSION);
          cache.put("./index.html", fresh.clone());
          return fresh;
        } catch {
          return (await caches.match("./index.html")) ?? Response.error();
        }
      })(),
    );
    return;
  }

  
  event.respondWith(
    (async () => {
      const cache = await caches.open(VERSION);
      const cached = await cache.match(request, { ignoreSearch: true });
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        })
        .catch(() => undefined);
      return cached ?? (await network) ?? Response.error();
    })(),
  );
});
