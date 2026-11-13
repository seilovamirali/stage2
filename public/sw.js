self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const payload = { title: "Stage 2", body: "Сегодня остались привычки", url: "/stage2/today" };
  try {
    if (event.data) Object.assign(payload, event.data.json());
  } catch {
    // A plain-text payload still shows the fallback text.
  }
  event.waitUntil(self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: "/stage2/icon-192.png",
    badge: "/stage2/icon-192.png",
    data: { url: payload.url },
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/stage2/today";
  event.waitUntil(self.clients.openWindow(url));
});
