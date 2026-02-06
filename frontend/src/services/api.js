import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL 
  ? `${process.env.REACT_APP_API_URL}/api`
  : 'http://127.0.0.1:8000/api';

console.log('API_URL:', API_URL);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

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
  return config;
});

// 회원가입
export const signup = async (userData) => {
  console.log('Signup request to:', API_URL + '/users/signup');
  console.log('Signup data:', userData);
  try {
    const response = await api.post('/users/signup', userData);
    console.log('Signup response:', response);
    return response.data;
  } catch (error) {
    console.error('Signup error:', error);
    console.error('Error response:', error.response);
    console.error('Error data:', error.response?.data);
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

// 게시글 목록
export const getPosts = async (page = 1, limit = 10) => {
  const response = await api.get('/posts', { params: { page, limit } });
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