// Service Worker가 로드됐음을 확인
console.log('[Service Worker] 로드 시작:', new Date().toISOString());

importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// 서비스워커 버전 (캐시 무효화용)
const VERSION = '1.1.0';

console.log('[Service Worker] Firebase 스크립트 임포트 완료');

try {
  firebase.initializeApp({
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
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

// 🔴 onBackgroundMessage를 등록하지 않으면 FCM이 자동으로 알림을 표시합니다.
// 수동 처리를 제거하여 중복 알림 문제 해결
// (이전 코드는 중복 표시로 인한 문제 발생)

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] 알림 클릭:', event);
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
