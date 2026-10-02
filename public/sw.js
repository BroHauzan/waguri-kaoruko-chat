// Service Worker for Waguri Kaoruko AI Chat
// Handles background notifications, notificationclick routing, and push-like alerts

const CACHE_NAME = 'waguri-chat-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Handle incoming messages from the main thread / background queue processor
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, {
        badge: options?.badge || '/favicon.ico',
        icon: options?.icon || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
        body: options?.body || 'Membalas pesanmu...',
        tag: options?.tag || 'chat-notification',
        renotify: true,
        vibrate: [200, 100, 200],
        data: options?.data || {},
        actions: [
          { action: 'open_chat', title: 'Buka Obrolan' },
        ],
      })
    );
  }
});

// Handle click on native notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const characterId = event.notification.data?.characterId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it and tell it to open the character
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (characterId) {
            client.postMessage({
              type: 'NAVIGATE_TO_CHAT',
              characterId,
            });
          }
          return;
        }
      }
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
