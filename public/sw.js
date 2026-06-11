import { precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";

// Skip waiting and claim clients immediately
self.skipWaiting();
clientsClaim();

// Precache assets compiled by the build process
precacheAndRoute(self.__WB_MANIFEST || []);

const OFFLINE_CACHE_NAME = "offline-html-cache-v1";
const OFFLINE_URL = "/offline.html";

// Install event: cache the offline page at startup/installation time
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(OFFLINE_CACHE_NAME).then((cache) => {
      // Force fetch from network to ensure we get the latest page
      return cache.add(new Request(OFFLINE_URL, { cache: "reload" }));
    })
  );
});

// Activate event: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== OFFLINE_CACHE_NAME && !cacheName.startsWith("workbox-precache")) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event listener
self.addEventListener("fetch", (event) => {
  // Only handle GET navigation requests (page loads)
  if (event.request.method === "GET" && event.request.mode === "navigate") {
    const url = new URL(event.request.url);
    console.log("[SW] Intercepted navigation request:", url.href);

    // If requesting the offline page itself, serve it from cache
    if (url.pathname === "/offline" || url.pathname === "/offline.html") {
      console.log("[SW] Serving offline page from cache for:", url.href);
      event.respondWith(
        caches.match(OFFLINE_URL).then((cachedResponse) => {
          if (cachedResponse) {
            console.log("[SW] Found cached offline page:", OFFLINE_URL);
            return cachedResponse;
          }
          console.warn("[SW] Cached offline page not found, fetching...");
          return fetch(event.request);
        })
      );
      return;
    }

    // If we are offline, redirect immediately to avoid disk cache loading
    if (!navigator.onLine) {
      const targetUrl = url.pathname + url.search;
      const redirectAbsoluteUrl = new URL(
        `/offline?_next=${encodeURIComponent(targetUrl)}`,
        self.location.href
      ).href;
      console.log("[SW] Offline: Redirecting directly to:", redirectAbsoluteUrl);
      event.respondWith(Promise.resolve(Response.redirect(redirectAbsoluteUrl, 302)));
      return;
    }

    // Try navigation from live SSR server first.
    // If it fails (offline), redirect to /offline?_next=<path>
    console.log("[SW] Online: Attempting network fetch for:", url.href);
    event.respondWith(
      fetch(event.request).catch((error) => {
        const targetUrl = url.pathname + url.search;
        const redirectAbsoluteUrl = new URL(
          `/offline?_next=${encodeURIComponent(targetUrl)}`,
          self.location.href
        ).href;
        console.log("[SW] Network fetch failed, redirecting to:", redirectAbsoluteUrl);
        return Response.redirect(redirectAbsoluteUrl, 302);
      })
    );
  }
});

// Listener for update prompt skip waiting message
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
