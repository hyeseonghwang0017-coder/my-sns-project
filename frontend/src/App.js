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
    // ⚠️ 주의: 서비스워커가 이미 알림을 표시하므로, 포그라운드에서는 로그만 기록
    try {
      onMessage(messaging, (payload) => {
        debugLogger.log('App', '📨 포그라운드 메시지 수신', {
          title: payload.notification?.title,
          body: payload.notification?.body
        });
        
        // 🔴 중복 알림 방지: 포그라운드에서는 수동으로 알림을 표시하지 않음
        // 서비스워커(firebase-messaging-sw.js)에서 자동으로 표시됨
        console.log('[App.js] 포그라운드 메시지 처리 완료 (서비스워커에서 표시)');
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
