import React, { useEffect, useRef } from 'react';
import './LikeListPopup.css';

function LikeListPopup({ users, onClose, anchorRef }) {
  const popupRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target) &&
        (!anchorRef || !anchorRef.current.contains(event.target))
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, anchorRef]);

  return (
    <div className="like-list-popup" ref={popupRef}>
      <div className="like-list-title">마음을 누른 사람</div>
      <ul className="like-list-users">
        {users.length === 0 ? (
          <li className="like-list-empty">아직 아무도 마음을 누르지 않았어요.</li>
        ) : (
          users.map((user) => (
            <li key={user.id} className="like-list-user">
              <img src={user.avatarUrl} alt={user.username} className="like-list-avatar" />
              <span className="like-list-username">{user.username}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default LikeListPopup;
