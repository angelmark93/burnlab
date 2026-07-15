// BurnLab service worker — stale-while-revalidate for same-origin GETs,
// plus a best-effort rest-timer notification backstop.
// Bump the CACHE name whenever you deploy an update.
const CACHE = "burnlab-v16";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const network = fetch(request)
        .then((res) => { if (res.ok) cache.put(request, res.clone()); return res; })
        .catch(() => cached);
      return cached || network;
    })
  );
});

/* ---- rest-timer notification backstop ----
   The page schedules its own chime/vibration/Notification while it has any
   execution time. This is a second, independent path: the page hands the SW
   the rest-end timestamp, and the SW fires a real showNotification() itself.
   Browsers can still suspend an idle SW before the timeout runs — this isn't
   a true lock-screen alarm, just a more resilient backstop than page-context
   Notification alone while the tab is merely backgrounded, not fully killed. */
let restTimer = null;

self.addEventListener("message", (e) => {
  const msg = e.data || {};
  if (msg.type === "rest-schedule") {
    if (restTimer) clearTimeout(restTimer);
    const delay = Math.max(0, (msg.end || 0) - Date.now());
    restTimer = setTimeout(() => {
      restTimer = null;
      self.registration.showNotification("Rest complete — GO! 🔥", {
        body: "Next set is waiting.",
        tag: "burnlab-rest",
        icon: "/icons/icon-192.png",
        vibrate: [180, 90, 180],
      });
    }, delay);
  } else if (msg.type === "rest-cancel") {
    if (restTimer) { clearTimeout(restTimer); restTimer = null; }
  }
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if ("focus" in c) return c.focus();
      if (self.clients.openWindow) return self.clients.openWindow("/");
    })
  );
});
