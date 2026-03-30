self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(keys.filter((key) => key.startsWith("budgetly-")).map((key) => caches.delete(key)));
      await self.clients.claim();
      await self.registration.unregister();
    })
  );
});
