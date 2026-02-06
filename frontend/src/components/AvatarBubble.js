import React from "react";
import { useNavigate } from "react-router-dom";

const AvatarBubble = ({ profileImage, displayName, userId, size = "40px" }) => {
  const navigate = useNavigate();

  const handleAvatarClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (userId) {
      navigate(`/profile/${userId}`);
    }
  };

  // Get initials from display name
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    return parts.map((part) => part[0]).join("").toUpperCase().slice(0, 2);
  };

  const initials = getInitials(displayName);

  return (
    <div
      onClick={handleAvatarClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: profileImage ? "transparent" : "#e0e0e0",
        overflow: "hidden",
        cursor: userId ? "pointer" : "default",
        marginRight: "8px",
        flexShrink: 0,
        border: "2px solid #f0f0f0",
        fontSize: `${parseInt(size) * 0.4}px`,
        fontWeight: "600",
        color: "#666",
      }}
    >
      {profileImage ? (
        <img
          src={profileImage}
          alt={displayName}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
};

export default AvatarBubble;
