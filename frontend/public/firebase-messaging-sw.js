// Service Worker가 로드됐음을 확인
console.log('[Service Worker] 로드 시작:', new Date().toISOString());

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// 서비스워커 버전 (캐시 무효화용)
const VERSION = '1.1.0';

console.log('[Service Worker] Firebase 스크립트 임포트 완료');

try {
  firebase.initializeApp({
    apiKey: "AIzaSyDIaYW8cllMNuwNGFoT4GXxgZz0a3-iNZc",
    authDomain: "ggame-a9c4c.firebaseapp.com",
    projectId: "ggame-a9c4c",
    storageBucket: "ggame-a9c4c.firebasestorage.app",
    messagingSenderId: "208111882619",
    appId: "1:208111882619:web:89dd77ff9eb36858bc2dde",
    measurementId: "G-TZPYZSLGDG"
  });
  console.log('[Service Worker] Firebase 초기화 완료');
} catch (error) {
  console.error('[Service Worker] Firebase 초기화 실패:', error);
}

let messaging = null;
try {
  messaging = firebase.messaging();
  console.log('[Service Worker] Messaging 초기화 완료');
} catch (error) {
  console.error('[Service Worker] Messaging 초기화 실패:', error);
}

// 백그라운드 메시지 처리 (한 번만 표시)
if (messaging) {
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    // 중복 방지: 이미 표시된 알림은 무시
    if (!payload.notification) {
      console.log('[firebase-messaging-sw.js] 알림 데이터 없음');
      return;
    }
    
    const notificationTitle = payload.notification.title || '새 알림';
    const notificationOptions = {
      body: payload.notification.body || '',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      data: payload.data || {},
      tag: `notification-${Date.now()}`, // 각 알림에 고유 태그
      requireInteraction: false
    };

    console.log('[firebase-messaging-sw.js] 알림 표시 시도:', notificationTitle);
    
    try {
      self.registration.showNotification(notificationTitle, notificationOptions);
      console.log('[firebase-messaging-sw.js] 알림 표시 성공');
    } catch (error) {
      console.error('[firebase-messaging-sw.js] 알림 표시 실패:', error);
    }
  });
  console.log('[Service Worker] onBackgroundMessage 핸들러 등록 완료');
} else {
  console.error('[Service Worker] messaging이 초기화되지 않음');
}

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] 알림 클릭:', event);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
