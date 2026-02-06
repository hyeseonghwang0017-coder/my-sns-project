import React, { useState, useEffect } from 'react';
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead, deleteNotification, deleteAllNotifications } from '../services/api';
import { useNavigate } from 'react-router-dom';

function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
    // 3초마다 알림 업데이트
    const interval = setInterval(fetchNotifications, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [notifs, unreadData] = await Promise.all([
        getNotifications(),
        getUnreadNotificationCount()
      ]);
      setNotifications(notifs);
      setUnreadCount(unreadData.unread_count);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleNotificationClick = async (notification) => {
    // 읽음 표시
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
    }

    // 해당 게시글로 이동
    if (notification.post_id) {
      navigate('/', { state: { highlightPostId: notification.post_id } });
    } else if (notification.type === 'guestbook') {
      // 프로필 페이지로 이동
      navigate(`/profile/${notification.actor_id}`);
    }

    setShowDropdown(false);
    fetchNotifications();
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'comment':
        return '💬';
      case 'reply':
        return '↩️';
      case 'like':
        return '❤️';
      case 'guestbook':
        return '📝';
      default:
        return '🔔';
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          padding: '5px',
        }}
        title="알림"
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-5px',
              right: '-5px',
              backgroundColor: '#ff4444',
              color: 'white',
              borderRadius: '50%',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '40px',
            right: '0',
            backgroundColor: 'white',
            border: '1px solid #ddd',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            width: '350px',
            maxHeight: '400px',
            overflowY: 'auto',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #eee',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontWeight: 'bold', fontSize: '14px' }}>알림</div>
            {notifications.length > 0 && (
              <button
                onClick={async () => {
                  await deleteAllNotifications();
                  setNotifications([]);
                  setShowDropdown(false);
                  fetchNotifications();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '12px',
                  textDecoration: 'underline',
                  padding: '0',
                }}
                title="모든 알림 삭제"
              >
                모두 지우기
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div
              style={{
                padding: '20px',
                textAlign: 'center',
                color: '#888',
                fontSize: '14px',
              }}
            >
              알림이 없습니다
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  backgroundColor: notification.is_read ? 'white' : '#f0f8ff',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = notification.is_read
                    ? 'white'
                    : '#f0f8ff';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', marginBottom: '4px' }}>
                      <span style={{ marginRight: '8px' }}>{getNotificationIcon(notification.type)}</span>
                      <strong>{notification.actor_display_name}</strong>
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
                      {notification.message}
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(notification.created_at).toLocaleString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleDeleteNotification(e, notification.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#999',
                      cursor: 'pointer',
                      fontSize: '16px',
                      padding: '0 4px',
                    }}
                    title="삭제"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
