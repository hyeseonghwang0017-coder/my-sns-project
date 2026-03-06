import React, { useState } from 'react';
import { signup } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { messaging, getToken } from '../firebase';
import { Capacitor } from '@capacitor/core';
import debugLogger from '../utils/debugLogger';

function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    display_name: '',
    bio: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const saveFCMToken = async () => {
    try {
      debugLogger.log('Signup', 'FCM 토큰 저장 시작');
      
      // 웹 환경에서만 브라우저 FCM 사용
      if (!Capacitor.isNativePlatform()) {
        debugLogger.log('Signup', '웹 환경 - Firebase FCM 토큰 요청');
        
        const permission = await Notification.requestPermission();
        debugLogger.log('Signup', `Notification 권한: ${permission}`);
        
        if (permission === 'granted') {
          const fcmToken = await getToken(messaging, {
            vapidKey: 'BAbOZ5gCHtpgSUTPojVTImHO9wnQW2ffriHZ3fZ4Ug6yD-gB11oCnH7Ybl2QcmaeI8KhgjYTu4jR_E5rsI3u8zA'
          });
          
          if (fcmToken) {
            debugLogger.log('Signup', '✅ FCM 토큰 획득', { token: fcmToken.substring(0, 20) + '...' });
            
            const response = await fetch('https://my-sns-project.onrender.com/api/users/device-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              },
              body: JSON.stringify({ device_token: fcmToken })
            });
            
            if (response.ok) {
              debugLogger.log('Signup', '✅ FCM 토큰이 저장되었습니다.');
            } else {
              debugLogger.error('Signup', 'FCM 토큰 저장 실패', { status: response.status });
            }
          }
        } else {
          debugLogger.log('Signup', '⚠️ Notification 권한 거부됨');
        }
      } else {
        debugLogger.log('Signup', '모바일 환경 - Capacitor FCM 사용 (자동 처리됨)');
      }
    } catch (err) {
      debugLogger.error('Signup', 'FCM 토큰 저장 중 오류', { error: err.message });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      debugLogger.log('Signup', '회원가입 시도 시작');
      
      const data = await signup(formData);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      debugLogger.log('Signup', '✅ 회원가입 성공', { userId: data.user?.id });
      
      // 회원가입 후 FCM 토큰 저장
      await saveFCMToken();
      
      navigate('/');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || '회원가입에 실패했습니다.';
      debugLogger.error('Signup', '회원가입 실패', { error: errorMsg });
      setError(errorMsg);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h2>회원가입</h2>
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>사용자명:</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            minLength="3"
            maxLength="20"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>이메일:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>비밀번호:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength="6"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>표시 이름:</label>
          <input
            type="text"
            name="display_name"
            value={formData.display_name}
            onChange={handleChange}
            required
            minLength="2"
            maxLength="30"
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label>소개:</label>
          <textarea
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            style={{ width: '100%', padding: '8px', marginTop: '5px', minHeight: '80px' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', cursor: 'pointer', borderRadius: '8px', fontSize: '16px', fontWeight: '600', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'} onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}>
          ✨ 회원가입
        </button>
      </form>
      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        이미 계정이 있으신가요? <a href="/login" style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '600' }}>🔑 로그인</a>
      </p>
    </div>
  );
}

export default Signup;