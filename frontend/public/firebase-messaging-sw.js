importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// 서비스워커 버전 (캐시 무효화용)
const VERSION = '1.1.0';

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

// 백그라운드 메시지 처리 (한 번만 표시)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // 중복 방지: 이미 표시된 알림은 무시
  if (!payload.notification) {
    return;
  }
  
  const notificationTitle = payload.notification.title || '새 알림';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/logo192.png',
    badge: '/logo192.png',
    data: payload.data,
    tag: `notification-${Date.now()}` // 각 알림에 고유 태그
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