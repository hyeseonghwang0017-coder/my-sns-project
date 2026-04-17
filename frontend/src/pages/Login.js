import React, { useState } from 'react';
import { login, formatAxiosError } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { messaging, getToken } from '../firebase';
import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import debugLogger from '../utils/debugLogger';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [autoLogin, setAutoLogin] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const saveFCMToken = async () => {
    try {
      debugLogger.log('Login', 'FCM 토큰 저장 시작');
      
      let fcmToken = null;
      
      // 모바일 환경 (Capacitor)
      if (Capacitor.isNativePlatform()) {
        debugLogger.log('Login', '📱 모바일 환경 - Capacitor FCM 토큰 요청');
        try {
          const result = await FirebaseMessaging.getToken();
          fcmToken = result.token;
          debugLogger.log('Login', '✅ Capacitor FCM 토큰 획득', { token: fcmToken?.substring(0, 20) + '...' });
        } catch (err) {
          debugLogger.error('Login', 'Capacitor FCM 토큰 획득 실패', { error: err.message });
          return;
        }
      }
      // 웹 환경
      else {
        debugLogger.log('Login', '🌐 웹 환경 - Firebase FCM 토큰 요청');
        
        const permission = await Notification.requestPermission();
        debugLogger.log('Login', `Notification 권한: ${permission}`);
        
        if (permission === 'granted') {
          fcmToken = await getToken(messaging, {
            vapidKey: 'BAbOZ5gCHtpgSUTPojVTImHO9wnQW2ffriHZ3fZ4Ug6yD-gB11oCnH7Ybl2QcmaeI8KhgjYTu4jR_E5rsI3u8zA'
          });
          debugLogger.log('Login', '✅ 웹 FCM 토큰 획득', { token: fcmToken?.substring(0, 20) + '...' });
        } else {
          debugLogger.log('Login', '⚠️ Notification 권한 거부됨');
          return;
        }
      }
      
      // 토큰이 있으면 서버에 저장
      if (fcmToken) {
        const authToken = localStorage.getItem('token') || sessionStorage.getItem('token');
        const response = await fetch('https://my-sns-project.onrender.com/api/users/device-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({ device_token: fcmToken })
        });
        
        if (response.ok) {
          const data = await response.json();
          debugLogger.log('Login', '✅ FCM 토큰이 저장되었습니다.', data);
        } else {
          const errData = await response.json().catch(() => ({}));
          debugLogger.error('Login', 'FCM 토큰 저장 실패', { 
            status: response.status,
            detail: errData.detail || errData.message
          });
        }
      }
    } catch (err) {
      debugLogger.error('Login', 'FCM 토큰 저장 중 오류', { error: err.message });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      debugLogger.log('Login', '로그인 시도 시작');
      
      const data = await login({ email, password });
      if (autoLogin) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.setItem('token', data.access_token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
      }
      
      debugLogger.log('Login', '✅ 로그인 성공', { userId: data.user?.id });
      
      // 로그인 후 FCM 토큰 저장
      await saveFCMToken();
      
      navigate('/');
    } catch (err) {
      const errorMsg = formatAxiosError(err) || '로그인에 실패했습니다.';
      debugLogger.error('Login', '로그인 실패', { error: errorMsg });
      setError(errorMsg);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>GGame 홈</h1>
      <h2>로그인</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
          <input
            type="checkbox"
            id="autoLogin"
            checked={autoLogin}
            onChange={() => setAutoLogin((prev) => !prev)}
            style={{ marginRight: '8px' }}
          />
          <label htmlFor="autoLogin" style={{ fontSize: '15px', color: '#333', cursor: 'pointer' }}>
            자동로그인 (브라우저/앱을 꺼도 유지)
          </label>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>이메일:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>비밀번호:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <button 
          type="submit" 
          style={{ 
            width: '100%', 
            padding: '12px', 
            backgroundColor: '#2563eb', 
            color: 'white', 
            border: 'none', 
            cursor: 'pointer', 
            borderRadius: '8px', 
            fontSize: '16px', 
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
        >
          🔑 로그인
        </button>
      </form>
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        계정이 없으신가요? <a href="/signup" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>✨ 회원가입</a>
      </p>
    </div>
  );
}

export default Login;