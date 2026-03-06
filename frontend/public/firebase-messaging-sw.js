importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyDIaYW8cllMNuwNGFoT4GXxgZz0a3-iNZc",
  authDomain: "ggame-a9c4c.firebaseapp.com",
  projectId: "ggame-a9c4c",
  storageBucket: "ggame-a9c4c.firebasestorage.app",
  messagingSenderId: "208111882619",
  appId: "1:208111882619:web:89dd77ff9eb36858bc2dde",
  measurementId: "G-TZPYZSLGDG"
});

const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || '새 알림';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});