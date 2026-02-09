import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰을 요청 헤더에 자동으로 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // 명시적으로 Content-Type 설정 (폼데이터가 아닌 JSON)
  if (!config.headers['Content-Type']) {
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

// 에러 응답 처리
api.interceptors.response.use(
  response => response,
  error => {
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);

// 회원가입
export const signup = async (userData) => {
  try {
    const response = await api.post('/users/signup', userData);
    return response.data;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Signup error:', error.response?.data);
    }
    throw error;
  }
};

// 로그인
export const login = async (credentials) => {
  const response = await api.post('/users/login', credentials);
  return response.data;
};

// 내 프로필 조회
export const getMyProfile = async () => {
  const response = await api.get('/users/me');
  return response.data;
};

// 내 프로필 수정
export const updateMyProfile = async (payload) => {
  const response = await api.put('/users/me', payload);
  return response.data;
};

// 모든 유저 목록 조회
export const getAllUsers = async (limit = 50) => {
  const response = await api.get('/users/list', { params: { limit } });
  return response.data;
};

// 게시글 목록
export const getPosts = async (page = 1, limit = 10, category = null) => {
  const params = { page, limit };
  if (category) {
    params.category = category;
  }
  const response = await api.get('/posts', { params });
  return response.data;
};

// 게시글 총 개수
export const getPostsCount = async () => {
  const response = await api.get('/posts/meta/count');
  return response.data;
};

// 게시글 작성
export const createPost = async (payload) => {
  const response = await api.post('/posts', payload);
  return response.data;
};

// 게시글 수정
export const updatePost = async (postId, payload) => {
  const response = await api.put(`/posts/${postId}`, payload);
  return response.data;
};

// 게시글 삭제
export const deletePost = async (postId) => {
  const response = await api.delete(`/posts/${postId}`);
  return response.data;
};

// 게시글 좋아요
export const likePost = async (postId) => {
  const response = await api.post(`/posts/${postId}/like`);
  return response.data;
};

// 게시글 좋아요 취소
export const unlikePost = async (postId) => {
  const response = await api.delete(`/posts/${postId}/like`);
  return response.data;
};

// 댓글 목록
export const getPostComments = async (postId) => {
  const response = await api.get(`/posts/${postId}/comments`);
  return response.data;
};

// 댓글 작성 (대댓글 포함)
export const createComment = async (postId, payload) => {
  const response = await api.post(`/posts/${postId}/comments`, payload);
  return response.data;
};

// 댓글 수정
export const updateComment = async (postId, commentId, payload) => {
  const response = await api.put(`/posts/${postId}/comments/${commentId}`, payload);
  return response.data;
};

// 댓글 삭제
export const deleteComment = async (postId, commentId) => {
  const response = await api.delete(`/posts/${postId}/comments/${commentId}`);
  return response.data;
};

// 이미지 업로드 (Cloudinary)
export const uploadImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/uploads/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

// 프로필 조회
export const getUserProfile = async (userId) => {
  const response = await api.get(`/profiles/${userId}`);
  return response.data;
};

// 프로필 사진 업데이트
export const updateProfileImage = async (userId, imageUrl) => {
  const response = await api.put(`/profiles/${userId}/profile-image`, { image_url: imageUrl }, {
    params: { image_url: imageUrl }
  });
  return response.data;
};

// 헤더 이미지 업데이트
export const updateHeaderImage = async (userId, imageUrl) => {
  const response = await api.put(`/profiles/${userId}/header-image`, { image_url: imageUrl }, {
    params: { image_url: imageUrl }
  });
  return response.data;
};

// 닉네임 색깔 업데이트
export const updateDisplayNameColor = async (userId, color) => {
  const response = await api.put(`/profiles/${userId}/display-name-color`, { color });
  return response.data;
};

// 사용자 게시글 조회
export const getUserPosts = async (userId) => {
  const response = await api.get(`/profiles/${userId}/posts`);
  return response.data;
};

// 방명록 조회
export const getGuestbook = async (userId) => {
  const response = await api.get(`/profiles/${userId}/guestbook`);
  return response.data;
};

// 방명록 작성
export const createGuestbookEntry = async (userId, content) => {
  const response = await api.post(`/profiles/${userId}/guestbook`, { content });
  return response.data;
};

// 방명록 수정
export const updateGuestbookEntry = async (userId, entryId, content) => {
  const response = await api.put(`/profiles/${userId}/guestbook/${entryId}`, { content });
  return response.data;
};

// 방명록 삭제
export const deleteGuestbookEntry = async (userId, entryId) => {
  const response = await api.delete(`/profiles/${userId}/guestbook/${entryId}`);
  return response.data;
};

// 알림 목록 조회
export const getNotifications = async () => {
  const response = await api.get('/notifications');
  return response.data;
};

// 읽지 않은 알림 개수
export const getUnreadNotificationCount = async () => {
  const response = await api.get('/notifications/unread/count');
  return response.data;
};

// 알림 읽음 표시
export const markNotificationAsRead = async (notificationId) => {
  const response = await api.put(`/notifications/${notificationId}`, { is_read: true });
  return response.data;
};

// 알림 삭제
export const deleteNotification = async (notificationId) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};

// 모든 알림 삭제
export const deleteAllNotifications = async () => {
  const response = await api.delete('/notifications');
  return response.data;
};

export default api;