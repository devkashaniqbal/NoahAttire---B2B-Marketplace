// Firebase Messaging Service Worker
// This file must be at the root so the browser can register it as a service worker.
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// These values are injected at runtime via the NEXT_PUBLIC_ env vars.
// They are read from the query string when the service worker is registered.
const urlParams = new URL(self.location).searchParams;

firebase.initializeApp({
  apiKey:            urlParams.get('apiKey'),
  authDomain:        urlParams.get('authDomain'),
  projectId:         urlParams.get('projectId'),
  storageBucket:     urlParams.get('storageBucket'),
  messagingSenderId: urlParams.get('messagingSenderId'),
  appId:             urlParams.get('appId'),
});

const messaging = firebase.messaging();

// Handle background notifications
messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  if (!title) return;
  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data,
  });
});

// Open app when notification is clicked
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const inquiryId = event.notification.data?.inquiryId;
  const url = inquiryId ? `/buyer/dashboard` : '/';
  event.waitUntil(clients.openWindow(url));
});
