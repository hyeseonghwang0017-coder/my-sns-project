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
    // ⚠️ 주의: 서비스워커 또는 Capacitor가 이미 알림을 자동으로 표시
    let unsubscribe;
    try {
      unsubscribe = onMessage(messaging, (payload) => {
        debugLogger.log('App', '📨 포그라운드 메시지 수신 (로그만)', {
          title: payload.notification?.title,
          body: payload.notification?.body
        });
        
        // 🔴 중복 알림 방지: 메시지 수신 시 아무것도 하지 않음
        // 서비스워커와 Capacitor에서 이미 알림을 자동으로 표시함
        console.log('[App.js] 메시지 처리 완료 (자동 표시)');
      });
    } catch (err) {
      debugLogger.log('App', '웹 메시지 리스너 설정 실패 (선택사항)', { message: err.message });
    }

    // cleanup: 컴포넌트 언마운트 시 리스너 제거
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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
