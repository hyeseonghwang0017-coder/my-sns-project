import React, { useState, useEffect } from 'react';
import debugLogger from '../utils/debugLogger';

function DebugLogs() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    // 주기적으로 로그 업데이트
    const interval = setInterval(() => {
      setLogs(debugLogger.getLogs());
    }, 1000);

    setLogs(debugLogger.getLogs());

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', fontSize: '12px' }}>
      <h2>🔍 디버그 로그</h2>
      <button
        onClick={() => debugLogger.clearLogs()}
        style={{
          padding: '8px 12px',
          backgroundColor: '#ff6b6b',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '10px'
        }}
      >
        로그 초기화
      </button>

      <div
        style={{
          backgroundColor: '#1e1e1e',
          color: '#00ff00',
          padding: '10px',
          borderRadius: '4px',
          maxHeight: '500px',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}
      >
        {logs.length === 0 ? (
          <div>로그가 없습니다.</div>
        ) : (
          logs.map((log, idx) => (
            <div key={idx} style={{ marginBottom: '8px' }}>
              <span style={{ color: log.level === 'error' ? '#ff6b6b' : '#00ff00' }}>
                [{log.timestamp}] [{log.tag}] {log.message}
              </span>
              {log.data && (
                <div style={{ color: '#888', marginLeft: '20px', fontSize: '11px' }}>
                  {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <h3>💡 로그 확인 방법:</h3>
        <ol>
          <li>로그인/회원가입 시 FCM 토큰 저장 여부 확인</li>
          <li>댓글/좋아요 발생 시 메시지 수신 여부 확인</li>
          <li>에러 발생 시 상세 정보 확인</li>
        </ol>
      </div>
    </div>
  );
}

export default DebugLogs;
