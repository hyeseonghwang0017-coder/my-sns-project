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
import debugLogger from './utils/debugLogger';

function App() {
  useEffect(() => {
    // 앱 시작 시 FCM 초기화
    debugLogger.log('App', '🚀 앱 시작');
    initializeCapacitorFCM().catch(err => {
      debugLogger.error('App', 'FCM 초기화 실패', { error: err.message });
    });
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
