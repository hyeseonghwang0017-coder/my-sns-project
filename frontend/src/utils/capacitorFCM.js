import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Capacitor } from '@capacitor/core';
import debugLogger from '../utils/debugLogger';

/**
 * Capacitor 환경에서 Firebase FCM 초기화
 * 모바일 앱에서 푸시 알림을 받기 위한 설정
 */
export const initializeCapacitorFCM = async () => {
  debugLogger.log('FCM', '⚙️ Capacitor FCM 초기화 시작');
  
  try {
    // Capacitor 앱 환경에서만 실행
    if (!Capacitor.isNativePlatform()) {
      debugLogger.log('FCM', '웹 환경 감지 - FCM 스킵');
      return null;
    }

    // Android에서 알림 권한 요청 (API 33+)
    try {
      const permResult = await FirebaseMessaging.requestPermissions();
      debugLogger.log('FCM', '✅ 알림 권한 요청 완료', { granted: permResult.receive });
    } catch (permErr) {
      debugLogger.error('FCM', '알림 권한 요청 실패', { error: permErr.message });
    }

    // FCM 토큰 요청
    const result = await FirebaseMessaging.getToken();
    const deviceToken = result.token;
    
    debugLogger.log('FCM', '✅ FCM 토큰 획득 성공', { token: deviceToken?.substring(0, 20) + '...' });
    
    // FCM 토큰이 변경되었을 때
    FirebaseMessaging.addListener('tokenReceived', (event) => {
      debugLogger.log('FCM', '🔄 FCM 토큰 갱신됨', { newToken: event.token?.substring(0, 20) + '...' });
      // 토큰이 변경되면 서버에 업데이트
      saveFCMTokenToServer(event.token);
    });

    // 포그라운드 메시지 수신
    FirebaseMessaging.addListener('messageReceived', (event) => {
      debugLogger.log('FCM', '📨 포그라운드 메시지 수신', {
        title: event.notification?.title,
        body: event.notification?.body
      });
      
      // 포그라운드에서 받은 메시지 처리
      if (event.notification) {
        handleForegroundMessage(event.notification);
      }
    });

    return deviceToken;
  } catch (err) {
    debugLogger.error('FCM', 'FCM 초기화 실패', {
      error: err.message,
      platform: Capacitor.getPlatform()
    });
    return null;
  }
};

/**
 * FCM 토큰을 서버에 저장
 */
const saveFCMTokenToServer = async (token) => {
  try {
    const authToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!authToken) {
      debugLogger.log('FCM', '⚠️ 인증 토큰 없음 - FCM 토큰 저장 스킵');
      return;
    }

    const response = await fetch('https://my-sns-project.onrender.com/api/users/device-token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ device_token: token })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    debugLogger.log('FCM', '✅ FCM 토큰 서버 저장 성공');
  } catch (err) {
    debugLogger.error('FCM', 'FCM 토큰 서버 저장 실패', { error: err.message });
  }
};

/**
 * 포그라운드 메시지 처리
 */
const handleForegroundMessage = (notification) => {
  debugLogger.log('FCM', '🔔 포그라운드 메시지 로그', {
    title: notification.title,
    body: notification.body
  });

  // 🔴 중복 방지: 포그라운드 메시지는 로그만 기록
  // Capacitor Firebase Messaging이 자동으로 알림을 표시합니다
  console.log('[capacitorFCM.js] 포그라운드 메시지 수신 - Capacitor에서 자동 처리');
};

export default initializeCapacitorFCM;
