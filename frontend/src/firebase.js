import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyDIaYW8cllMNuwNGFoT4GXxgZz0a3-iNZc",
  authDomain: "ggame-a9c4c.firebaseapp.com",
  projectId: "ggame-a9c4c",
  storageBucket: "ggame-a9c4c.firebasestorage.app",
  messagingSenderId: "208111882619",
  appId: "1:208111882619:web:89dd77ff9eb36858bc2dde",
  measurementId: "G-TZPYZSLGDG"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);

// 메시징 인스턴스
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };
