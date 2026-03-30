self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("budgetly-shell-v1").then((cache) =>
      cache.addAll(["/dashboard", "/transactions", "/goals", "/budgets", "/invoice", "/settings"])
    )
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open("budgetly-runtime-v1").then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match("/dashboard"));
    })
  );
});
