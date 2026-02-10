/**
 * UTC 타임스탬프를 한국 시간(KST)으로 변환하는 유틸리티
 */

export const formatToKST = (utcDateString) => {
  if (!utcDateString) return '';
  
  try {
    // UTC 문자열을 Date 객체로 변환
    const utcDate = new Date(utcDateString);
    
    // 한국 시간(KST)으로 포매팅
    const options = {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };
    
    return utcDate.toLocaleString('ko-KR', options);
  } catch (error) {
    console.error('Date formatting error:', error);
    return utcDateString;
  }
};

export const formatToKSTShort = (utcDateString) => {
  if (!utcDateString) return '';
  
  try {
    const utcDate = new Date(utcDateString);
    
    // toLocaleString으로 한국 시간 형식으로 얻기
    const dateStr = utcDate.toLocaleString('ko-KR', {
      timeZone: 'Asia/Seoul'
    });
    
    return dateStr;
  } catch (error) {
    console.error('Date formatting error:', error);
    return utcDateString;
  }
};

export const formatToKSTDate = (utcDateString) => {
  if (!utcDateString) return '';
  
  try {
    const utcDate = new Date(utcDateString);
    const options = {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    return utcDate.toLocaleString('ko-KR', options);
  } catch (error) {
    console.error('Date formatting error:', error);
    return utcDateString;
  }
};

export const getTimeAgoKST = (utcDateString) => {
  if (!utcDateString) return '';
  
  try {
    const utcDate = new Date(utcDateString);
    const now = new Date();
    
    // UTC 기준 시간 차이 계산
    const diffMs = now - utcDate;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    
    // 7일 이상이면 정확한 날짜 표시
    return formatToKSTDate(utcDateString);
  } catch (error) {
    console.error('Time ago calculation error:', error);
    return utcDateString;
  }
};
