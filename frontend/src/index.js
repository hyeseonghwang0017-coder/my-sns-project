import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

// PWA: Firebase Messaging Service Worker 등록
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = `${process.env.PUBLIC_URL || ''}/firebase-messaging-sw.js`;
    console.log('[index.js] Service Worker 등록 시작:', swPath);
    
    navigator.serviceWorker
      .register(swPath, {
        scope: '/',
        updateViaCache: 'none' // 항상 최신 버전 가져오기
      })
      .then((registration) => {
        console.log('✅ Firebase Messaging Service Worker registered:', registration);
        console.log('✅ Service Worker scope:', registration.scope);
        console.log('✅ Service Worker state:', registration.installing || registration.waiting || registration.active);
        
        // 업데이트 확인
        registration.onupdatefound = () => {
          const newWorker = registration.installing;
          console.log('[index.js] 새 Service Worker 발견');
          
          newWorker.onstatechange = () => {
            if (newWorker.state === 'activated') {
              console.log('[index.js] Service Worker 활성화됨');
            }
          };
        };
      })
      .catch((error) => {
        console.error('❌ Service Worker 등록 실패:', error);
        console.error('❌ Error details:', error.message);
      });
  });
} else {
  console.warn('⚠️ Service Worker를 지원하지 않는 브라우저');
}
