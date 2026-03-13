import React, { useEffect } from 'react';
import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Profile from './pages/Profile';
import AllPosts from './pages/AllPosts';
import DebugLogs from './pages/DebugLogs';
import initializeCapacitorFCM from './utils/capacitorFCM';
import { messaging, onMessage } from './firebase';
import debugLogger from './utils/debugLogger';

function App() {
  useEffect(() => {
    // 앱 시작 시 FCM 초기화
    debugLogger.log('App', '🚀 앱 시작');
    initializeCapacitorFCM().catch(err => {
      debugLogger.error('App', 'FCM 초기화 실패', { error: err.message });
    });

    // 웹 환경에서 포그라운드 메시지 수신
    try {
      onMessage(messaging, (payload) => {
        debugLogger.log('App', '📨 포그라운드 메시지 수신', {
          title: payload.notification?.title,
          body: payload.notification?.body
        });
        
        // 포그라운드에서 받은 메시지를 브라우저 알림으로 표시
        if (payload.notification) {
          const notificationTitle = payload.notification.title || '새 알림';
          const notificationOptions = {
            body: payload.notification.body || '',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: `notification-${Date.now()}`
          };
          
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.ready.then(registration => {
              registration.showNotification(notificationTitle, notificationOptions);
            });
          }
        }
      });
    } catch (err) {
      debugLogger.log('App', '웹 메시지 리스너 설정 (선택사항)', { message: err.message });
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/profile/:userId" element={<Profile />} />
        <Route path="/posts" element={<AllPosts />} />
        <Route path="/debug-logs" element={<DebugLogs />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
