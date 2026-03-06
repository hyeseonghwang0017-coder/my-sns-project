// 디버그 로깅 유틸리티 - 모바일에서 개발자 도구 없이도 문제 추적 가능
const MAX_LOGS = 100;
let logs = [];

const debugLogger = {
  log: (tag, message, data) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] [${tag}] ${message}`;
    
    console.log(logEntry, data || '');
    
    logs.push({
      timestamp,
      tag,
      message,
      data,
      level: 'log'
    });
    
    if (logs.length > MAX_LOGS) {
      logs.shift();
    }
    
    // 로컬 스토리지에 최근 로그 저장
    try {
      localStorage.setItem('debug_logs', JSON.stringify(logs.slice(-20)));
    } catch (err) {
      // 스토리지 오류 무시
    }
  },
  
  error: (tag, message, data) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] [${tag}] ❌ ${message}`;
    
    console.error(logEntry, data || '');
    
    logs.push({
      timestamp,
      tag,
      message,
      data,
      level: 'error'
    });
    
    if (logs.length > MAX_LOGS) {
      logs.shift();
    }
    
    try {
      localStorage.setItem('debug_logs', JSON.stringify(logs.slice(-20)));
    } catch (err) {
      // 스토리지 오류 무시
    }
  },
  
  getLogs: () => {
    try {
      return JSON.parse(localStorage.getItem('debug_logs') || '[]');
    } catch {
      return [];
    }
  },
  
  clearLogs: () => {
    logs = [];
    localStorage.removeItem('debug_logs');
  }
};

export default debugLogger;
