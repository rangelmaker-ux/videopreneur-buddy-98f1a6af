const CACHE_NAME = "vmi-cache-v1";
const ASSETS = [
  "/",
  "/index.html",
  "/favicon.png",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png"
];

// Install SW and cache basic assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate SW and clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch handler: Network-first falling back to cache
self.addEventListener("fetch", (e) => {
  // Only handle GET requests and skip Supabase API/Auth calls
  if (e.request.method !== "GET" || e.request.url.includes("supabase.co")) {
    return;
  }
  
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Cache successful responses
        if (res.status === 200 && res.type === "basic") {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
        }
        return res;
      })
      .catch(() => {
        return caches.match(e.request);
      })
  );
});

// Listen to push events (for future background push notifications)
self.addEventListener("push", (e) => {
  let data = { title: "Compromisso Agendado", body: "Você tem um compromisso em breve." };
  if (e.data) {
    try {
      data = e.data.json();
    } catch {
      data = { title: "Compromisso Agendado", body: e.data.text() };
    }
  }
  
  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/favicon.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click: focus or open app window
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === "/" && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});
