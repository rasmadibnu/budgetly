self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("budgetly-shell-v1").then((cache) =>
      cache.addAll(["/dashboard", "/transactions", "/goals", "/budgets", "/invoice", "/settings"])
    )
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/_next/") ||
    url.pathname === "/sw.js" ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  if (request.mode !== "navigate") {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }
          const clone = response.clone();
          caches.open("budgetly-runtime-v1").then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match("/dashboard"));
    })
  );
});
