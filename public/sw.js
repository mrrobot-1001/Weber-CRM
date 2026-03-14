// Service Worker for Weber CRM — handles Web Push notifications
/* eslint-disable no-restricted-globals */

self.addEventListener('push', (event) => {
  let data = { title: 'Weber CRM', body: 'You have a new notification.', link: '/' };

  try {
    data = event.data ? JSON.parse(event.data.text()) : data;
  } catch (_) {
    // keep defaults
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'weber-crm',
      data: { link: data.link || '/' },
      requireInteraction: false,
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = event.notification.data?.link || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Focus an existing tab if one is open
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.navigate(link);
          return;
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) {
        return clients.openWindow(link);
      }
    })
  );
});
