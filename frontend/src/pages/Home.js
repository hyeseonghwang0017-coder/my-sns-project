import React, { useEffect, useState, useRef } from 'react';
import { messaging, getToken, onMessage } from 'src/firebase';
import {
  getMyProfile,
  getPosts,
  createPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  getPostComments,
  createComment,
  updateComment,
  deleteComment,
  uploadImage,
  getAllUsers,
} from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import AvatarBubble from '../components/AvatarBubble';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import EmojiPicker from 'emoji-picker-react';
import linkifyHtml from 'linkify-html';
import { formatToKSTShort } from '../utils/dateFormatter';
import LikeListPopup from '../components/LikeListPopup';

const renderContentWithLinks = (text) => {
  if (!text) return null;

  const linkRegex = /(?:https?:\/\/|www\.)[^\s]+/g;
  const nodes = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    const { index } = match;
    const matchText = match[0];

    if (index > lastIndex) {
      nodes.push(
        <React.Fragment key={`text-${lastIndex}`}>
          {text.slice(lastIndex, index)}
        </React.Fragment>
      );
    }

    const href = matchText.startsWith('http') ? matchText : `https://${matchText}`;
    nodes.push(
      <a
        key={`link-${index}`}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#2563eb', textDecoration: 'underline', wordBreak: 'break-all' }}
      >
        {matchText}
      </a>
    );

    lastIndex = index + matchText.length;
  }

  if (lastIndex < text.length) {
    nodes.push(
      <React.Fragment key={`text-${lastIndex}`}>
        {text.slice(lastIndex)}
      </React.Fragment>
    );
  }

  return nodes;
};

function CommentItem({
  postId,
  comment,
  depth = 0,
  currentUserId,
  replyingTo,
  setReplyingTo,
  replyInputs,
  setReplyInputs,
  replyImageInputs,
  setReplyImageInputs,
  replyImagePreviews,
  setReplyImagePreviews,
  onReplySubmit,
  onCommentUpdate,
  onCommentDelete,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(comment.content);
  const isOwner = comment.author_id === currentUserId;
  const isReply = depth > 0;
  const isDeleted = comment.is_deleted;

  // 삭제된 댓글이고 자식이 없으면 렌더링하지 않음
  if (isDeleted && (!comment.replies || comment.replies.length === 0)) {
    return null;
  }

  return (
    <div
      style={{
        marginLeft: isReply ? '30px' : '0',
        marginTop: '12px',
        padding: '12px',
        backgroundColor: isReply ? '#f9fafb' : '#fff',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AvatarBubble
              profileImage={comment.author_profile_image}
              displayName={comment.author_display_name || comment.author_username}
              userId={comment.author_id}
              size="36px"
            />
            <strong style={{ color: comment.author_display_name_color || '#000000' }}>
              {comment.author_display_name || comment.author_username}
            </strong>
          </div>
          <span style={{ marginLeft: '36px', color: '#9aa0a6', fontSize: '12px' }}>
            {formatToKSTShort(comment.created_at)}
          </span>
          {comment.updated_at && (
            <span style={{ marginLeft: '8px', color: '#9aa0a6', fontSize: '12px' }}>
              (수정됨)
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setReplyingTo(comment.id)}
            style={{ cursor: 'pointer', color: '#2563eb', background: 'none', border: 'none' }}
          >
            답글
          </button>
          {isOwner && (
            <>
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      onCommentUpdate(postId, comment.id, editValue);
                      setIsEditing(false);
                    }}
                    style={{ cursor: 'pointer', color: '#2563eb', background: 'none', border: 'none' }}
                  >
                    저장
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    style={{ cursor: 'pointer', color: '#6b7280', background: 'none', border: 'none' }}
                  >
                    취소
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    style={{ cursor: 'pointer', color: '#6b7280', background: 'none', border: 'none' }}
                  >
                    수정
                  </button>
                  <button
                    onClick={() => onCommentDelete(postId, comment.id)}
                    style={{ cursor: 'pointer', color: '#ef4444', background: 'none', border: 'none' }}
                  >
                    삭제
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {isEditing ? (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          style={{
            width: '100%',
            minHeight: '60px',
            padding: '8px',
            marginTop: '10px',
            borderRadius: '8px',
            border: '1px solid #e5e7eb',
          }}
        />
      ) : (
        <p style={{ margin: '10px 0 0', whiteSpace: 'pre-wrap', color: '#111827' }}>
          {renderContentWithLinks(comment.content)}
        </p>
      )}

      {comment.image_url && (
        <img
          src={comment.image_url}
          alt="댓글 이미지"
          style={{
            marginTop: '10px',
            maxWidth: '100%',
            borderRadius: '8px',
            border: '1px solid #eee',
          }}
        />
      )}

      {replyingTo === comment.id && (
        <div style={{ marginTop: '8px' }}>
          <textarea
            value={replyInputs[comment.id] || ''}
            onChange={(e) =>
              setReplyInputs((prev) => ({ ...prev, [comment.id]: e.target.value }))
            }
            placeholder="답글을 입력하세요"
            style={{
              width: '100%',
              minHeight: '60px',
              padding: '8px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setReplyImageInputs((prev) => ({ ...prev, [comment.id]: file }));
              if (file) {
                setReplyImagePreviews((prev) => ({
                  ...prev,
                  [comment.id]: URL.createObjectURL(file),
                }));
              } else {
                setReplyImagePreviews((prev) => ({ ...prev, [comment.id]: null }));
              }
            }}
            style={{ marginTop: '8px' }}
          />
          {replyImagePreviews[comment.id] && (
            <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
              <img
                src={replyImagePreviews[comment.id]}
                alt="미리보기"
                style={{
                  maxWidth: '150px',
                  maxHeight: '150px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                }}
              />
              <button
                onClick={() => {
                  setReplyImageInputs((prev) => ({ ...prev, [comment.id]: null }));
                  setReplyImagePreviews((prev) => ({ ...prev, [comment.id]: null }));
                }}
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>
          )}
          <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onReplySubmit(postId, comment.id)}
              style={{
                cursor: 'pointer',
                backgroundColor: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
              }}
            >
              등록
            </button>
            <button
              onClick={() => setReplyingTo(null)}
              style={{
                cursor: 'pointer',
                backgroundColor: '#f3f4f6',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
              }}
            >
              취소
            </button>
          </div>
        </div>
      )}

      {comment.replies?.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              postId={postId}
              comment={reply}
              depth={depth + 1}
              currentUserId={currentUserId}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyInputs={replyInputs}
              setReplyInputs={setReplyInputs}
              replyImageInputs={replyImageInputs}
              setReplyImageInputs={setReplyImageInputs}
              replyImagePreviews={replyImagePreviews}
              setReplyImagePreviews={setReplyImagePreviews}
              onReplySubmit={onReplySubmit}
              onCommentUpdate={onCommentUpdate}
              onCommentDelete={onCommentDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Home() {
  // 좋아요 목록 팝업 상태
  const [likeListPopup, setLikeListPopup] = useState({ open: false, users: [], anchor: null });
  const likeButtonRefs = useRef({});
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [postContent, setPostContent] = useState('');
  // 투표 관련 상태
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']); // 최소 2개
  const [pollDuration, setPollDuration] = useState('10'); // 기본 10분
  const [postImageFile, setPostImageFile] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [editingCategory, setEditingCategory] = useState('일상');
  const [error, setError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showEditEmojiPicker, setShowEditEmojiPicker] = useState(false);
  const [commentsByPost, setCommentsByPost] = useState({});
  const [commentInputs, setCommentInputs] = useState({});
  const [commentImageInputs, setCommentImageInputs] = useState({});
  const [replyInputs, setReplyInputs] = useState({});
  const [replyImageInputs, setReplyImageInputs] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [activeCommentPostId, setActiveCommentPostId] = useState(null);
  const [expandedComments, setExpandedComments] = useState({});
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [commentImagePreviews, setCommentImagePreviews] = useState({});
  const [replyImagePreviews, setReplyImagePreviews] = useState({});
  const [highlightedPostId, setHighlightedPostId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [allUsers, setAllUsers] = useState([]);
  const [isMembersCollapsed, setIsMembersCollapsed] = useState(true);
  const postEditorRef = useRef(null);
  const editEditorRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  const categories = ['전체', '공지', '일상', '영화', '게임'];
  const saveDeviceToken = async (token) => {
    try {
      await fetch('https://my-sns-project.onrender.com/api/users/device-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ device_token: token })
      });
      console.log('디바이스 토큰 저장 완료');
    } catch (err) {
      console.error('토큰 저장 실패:', err);
    }
  };  
  const insertEmojiAtCursor = (editorRef, value, setValue, emoji) => {
    const quill = editorRef.current?.getEditor?.();
    if (quill) {
      const range = quill.getSelection(true);
      const index = range ? range.index : quill.getLength();
      quill.insertText(index, emoji, 'user');
      quill.setSelection(index + emoji.length, 0, 'user');
      setValue(quill.root.innerHTML);
      return;
    }
    setValue((value || '') + emoji);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      
      try {
        const profile = await getMyProfile();
        setUser(profile);
            try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const fcmToken = await getToken(messaging, {
          vapidKey: 'BAbOZ5gCHtpgSUTPojVTImHO9wnQW2ffriHZ3fZ4Ug6yD-gB11oCnH7Ybl2QcmaeI8KhgjYTu4jR_E5rsI3u8zA'
        });
        
        if (fcmToken) {
          await saveDeviceToken(fcmToken);
          console.log('FCM 토큰 저장 완료:', fcmToken);
        }
      }
    } catch (err) {
      console.log('FCM 토큰 가져오기 실패:', err);
    }

        const category = selectedCategory === '전체' ? null : selectedCategory;
        const list = await getPosts(1, 1000, category);
        setPosts(list);
        setHasMore(list.length === 1000);

        const commentsList = await Promise.all(
          list.map((post) => getPostComments(post.id).catch(() => []))
        );

        const map = {};
        list.forEach((post, index) => {
          map[post.id] = commentsList[index] || [];
        });
        setCommentsByPost(map);
        
        // 유저 리스트 가져오기
        const users = await getAllUsers(50);
        setAllUsers(users);
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };

    fetchProfile();
  }, [navigate, selectedCategory]);

  // 프로필에서 게시글 클릭 시 하이라이트 처리
  useEffect(() => {
    if (location.state?.highlightPostId && posts.length > 0) {
      const postId = location.state.highlightPostId;
      setHighlightedPostId(postId);
      
      // 게시글로 스크롤
      setTimeout(() => {
        const element = document.getElementById(`post-${postId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      
      // 3초 후 하이라이트 제거
      setTimeout(() => {
        setHighlightedPostId(null);
      }, 3000);
      
      // state 초기화
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, posts, navigate, location.pathname]);

  // 무한 스크롤 감지
  useEffect(() => {
    const handleScroll = () => {
      if (isLoading || !hasMore) return;

      const scrollPosition = window.innerHeight + document.documentElement.scrollTop;
      const threshold = document.documentElement.scrollHeight - 500;

      if (scrollPosition >= threshold) {
        setCurrentPage((prev) => prev + 1);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, hasMore]);

  // 페이지 변경 시 게시글 추가 로드
  useEffect(() => {
    if (currentPage > 1 && !isLoading && hasMore) {
      const loadMorePosts = async () => {
        setIsLoading(true);

        try {
          const category = selectedCategory === '전체' ? null : selectedCategory;
          const newPosts = await getPosts(currentPage, 1000, category);
          if (newPosts.length === 0) {
            setHasMore(false);
          } else {
            setPosts((prev) => [...prev, ...newPosts]);
            setHasMore(newPosts.length === 1000);
              // ...existing code...
            // 새로운 게시글들의 댓글 로드
            const commentsList = await Promise.all(
              newPosts.map((post) => getPostComments(post.id).catch(() => []))
            );

            const newCommentMap = {};
            newPosts.forEach((post, index) => {
              newCommentMap[post.id] = commentsList[index] || [];
            });

            setCommentsByPost((prev) => ({ ...prev, ...newCommentMap }));
          }
        } catch (err) {
          console.error('Failed to load more posts:', err);
        } finally {
          setIsLoading(false);
        }
      };

      loadMorePosts();
    }
  }, [currentPage, isLoading, hasMore, selectedCategory]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setError('');

    // Quill의 HTML 내용에서 실제 텍스트만 추출
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = postContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    const trimmed = textContent.trim();

    if (!trimmed && !postImageFile) {
      setError('내용 또는 이미지를 입력해주세요.');
      return;
    }

    try {
      let imageUrl = null;
      if (postImageFile) {
        const uploaded = await uploadImage(postImageFile);
        imageUrl = uploaded.url;
      }

      // 투표 옵션이 모두 비어있으면 투표 데이터 전송하지 않음
      const filteredPollOptions = showPoll ? pollOptions.map(opt => opt.trim()).filter(opt => opt) : [];

      const created = await createPost({
        content: postContent || undefined,
        image_url: imageUrl || undefined,
        category: selectedCategory === '전체' ? '일상' : selectedCategory,
        poll_options: filteredPollOptions.length > 1 ? filteredPollOptions : undefined,
        poll_duration: filteredPollOptions.length > 1 ? pollDuration : undefined,
      });
      setPosts([created, ...posts]);
      setPostContent('');
      setPostImageFile(null);
      setPostImagePreview(null);
      setShowEmojiPicker(false);
      // 투표 UI 상태 초기화
      setShowPoll(false);
      setPollOptions(['', '']);
      setPollDuration('10');
    } catch (err) {
      setError(err.response?.data?.detail || '게시글 작성에 실패했습니다.');
    }
  };

  const startEdit = (post) => {
    setEditingPostId(post.id);
    setEditingContent(post.content);
    setEditingCategory(post.category || '일상');
    setError('');
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditingContent('');
    setEditingCategory('일상');
    setError('');
  };

  const handleUpdatePost = async (postId) => {
    // Quill의 HTML 내용에서 실제 텍스트만 추출
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editingContent;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    const trimmed = textContent.trim();
    
    if (!trimmed) {
      setError('내용을 입력해주세요.');
      return;
    }

    try {
      const updated = await updatePost(postId, { content: editingContent, category: editingCategory });
      setPosts(posts.map((post) => (post.id === postId ? updated : post)));
      cancelEdit();
      setShowEditEmojiPicker(false);
    } catch (err) {
      setError(err.response?.data?.detail || '게시글 수정에 실패했습니다.');
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) {
      return;
    }
    setError('');
    try {
      await deletePost(postId);
      setPosts(posts.filter((post) => post.id !== postId));
      setCommentsByPost((prev) => {
        const next = { ...prev };
        delete next[postId];
        return next;
      });
    } catch (err) {
      setError(err.response?.data?.detail || '게시글 삭제에 실패했습니다.');
    }
  };

  const handleToggleLike = async (post) => {
    setError('');
    const liked = post.liked_by?.includes(user.id);

    try {
      const updated = liked ? await unlikePost(post.id) : await likePost(post.id);
      setPosts(posts.map((item) => (item.id === post.id ? updated : item)));
    } catch (err) {
      setError(err.response?.data?.detail || '좋아요 처리에 실패했습니다.');
    }
  };

  const buildCommentTree = (comments) => {
    const map = {};
    const roots = [];

    comments.forEach((comment) => {
      map[comment.id] = { ...comment, replies: [] };
    });

    comments.forEach((comment) => {
      if (comment.parent_id && map[comment.parent_id]) {
        map[comment.parent_id].replies.push(map[comment.id]);
      } else {
        roots.push(map[comment.id]);
      }
    });

    return roots;
  };

  const handleCommentSubmit = async (postId) => {
    const content = (commentInputs[postId] || '').trim();
    const imageFile = commentImageInputs[postId];
    if (!content && !imageFile) {
      setError('댓글 내용 또는 이미지를 입력해주세요.');
      return;
    }

    try {
      let imageUrl = null;
      if (imageFile) {
        const uploaded = await uploadImage(imageFile);
        imageUrl = uploaded.url;
      }

      const created = await createComment(postId, {
        content: content || undefined,
        image_url: imageUrl || undefined,
      });
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), created],
      }));
      setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
      setCommentImageInputs((prev) => ({ ...prev, [postId]: null }));
      setCommentImagePreviews((prev) => ({ ...prev, [postId]: null }));
      setActiveCommentPostId(null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || '댓글 작성에 실패했습니다.');
    }
  };

  const handleReplySubmit = async (postId, parentId) => {
    const content = (replyInputs[parentId] || '').trim();
    const imageFile = replyImageInputs[parentId];
    if (!content && !imageFile) {
      setError('답글 내용 또는 이미지를 입력해주세요.');
      return;
    }

    try {
      let imageUrl = null;
      if (imageFile) {
        const uploaded = await uploadImage(imageFile);
        imageUrl = uploaded.url;
      }

      const created = await createComment(postId, {
        content: content || undefined,
        image_url: imageUrl || undefined,
        parent_id: parentId,
      });
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), created],
      }));
      setReplyInputs((prev) => ({ ...prev, [parentId]: '' }));
      setReplyImageInputs((prev) => ({ ...prev, [parentId]: null }));
      setReplyImagePreviews((prev) => ({ ...prev, [parentId]: null }));
      setReplyingTo(null);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || '답글 작성에 실패했습니다.');
    }
  };

  const handleCommentUpdate = async (postId, commentId, content) => {
    const trimmed = content.trim();
    if (!trimmed) {
      setError('댓글 내용을 입력해주세요.');
      return;
    }

    try {
      const updated = await updateComment(postId, commentId, { content: trimmed });
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: (prev[postId] || []).map((comment) =>
          comment.id === commentId ? updated : comment
        ),
      }));
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || '댓글 수정에 실패했습니다.');
    }
  };

  const handleCommentDelete = async (postId, commentId) => {
    if (!window.confirm('정말 이 댓글을 삭제하시겠습니까?')) {
      return;
    }
    try {
      await deleteComment(postId, commentId);
      // 최신 댓글 목록을 다시 조회 (소프트 삭제 상태 반영)
      const updatedComments = await getPostComments(postId);
      setCommentsByPost((prev) => ({
        ...prev,
        [postId]: updatedComments,
      }));
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || '댓글 삭제에 실패했습니다.');
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '20px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', flexWrap: 'wrap', gap: '10px' }}>
        <h1>GGame 홈</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <NotificationBell />
          <button
            onClick={handleLogout}
            style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', transition: 'all 0.2s' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
          >
            👋 로그아웃
          </button>
        </div>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '15px', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>{error}</div>}
      
      <div style={{ backgroundColor: '#f3f4f6', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ marginTop: 0 }}>👤 내 프로필</h2>
        <p><strong>사용자명:</strong> {user.username}</p>
        <p><strong>표시 이름:</strong> {user.display_name}</p>
        <p><strong>이메일:</strong> {user.email}</p>
        {user.bio && <p><strong>소개:</strong> {user.bio}</p>}
        <button
          onClick={() => navigate(`/profile/${user.id}`)}
          style={{ marginTop: '15px', padding: '10px 20px', cursor: 'pointer', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', transition: 'all 0.2s' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
        >
          🔍 내 프로필 페이지로
        </button>
      </div>

      {/* 유저 목록 섹션 */}
      <div style={{ marginTop: '30px', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
          <h2 style={{ marginTop: 0, marginBottom: 0, fontSize: '18px', fontWeight: '700', color: '#111827' }}>
            👥 멤버 목록 ({allUsers.length})
          </h2>
          <button
            type="button"
            onClick={() => setIsMembersCollapsed((prev) => !prev)}
            style={{
              cursor: 'pointer',
              backgroundColor: '#f3f4f6',
              border: '1px solid #e5e7eb',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600'
            }}
          >
            {isMembersCollapsed ? '펼치기' : '접기'}
          </button>
        </div>

        {!isMembersCollapsed && (
          allUsers.length === 0 ? (
            <p style={{ color: '#888', fontSize: '14px', textAlign: 'center', margin: '20px 0' }}>멤버가 없습니다.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allUsers.map((member) => (
                <div
                  key={member.id}
                  onClick={() => navigate(`/profile/${member.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    backgroundColor: member.id === user.id ? '#eff6ff' : 'transparent',
                    border: '1px solid #e5e7eb',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = member.id === user.id ? '#eff6ff' : 'transparent';
                  }}
                >
                  <AvatarBubble
                    profileImage={member.profile_image}
                    displayName={member.display_name || member.username}
                    userId={member.id}
                    size="40px"
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontWeight: '600', 
                      fontSize: '14px',
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {member.display_name || member.username}
                      {member.id === user.id && (
                        <span style={{ 
                          marginLeft: '6px', 
                          fontSize: '12px', 
                          color: '#2563eb',
                          fontWeight: '500'
                        }}>
                          (나)
                        </span>
                      )}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#9ca3af',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      @{member.username}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      <div style={{ marginTop: '30px', backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
        <h2 style={{ marginTop: 0 }}>✍️ 게시글 작성</h2>
        
        {/* 카테고리 선택 탭 */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '15px', 
          padding: '10px', 
          backgroundColor: '#f9fafb', 
          borderRadius: '8px',
          overflowX: 'auto',
          flexWrap: 'wrap'
        }}>
          {categories.map(category => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(category)}
              style={{
                padding: '8px 16px',
                cursor: 'pointer',
                backgroundColor: selectedCategory === category ? '#2563eb' : '#fff',
                color: selectedCategory === category ? '#fff' : '#374151',
                border: selectedCategory === category ? '2px solid #2563eb' : '1px solid #d1d5db',
                borderRadius: '20px',
                fontWeight: selectedCategory === category ? '700' : '500',
                fontSize: '13px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => {
                if (selectedCategory !== category) {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.borderColor = '#9ca3af';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedCategory !== category) {
                  e.target.style.backgroundColor = '#fff';
                  e.target.style.borderColor = '#d1d5db';
                }
              }}
            >
              {category === '공지' ? '📢 ' : category === '일상' ? '📝 ' : category === '영화' ? '🎬 ' : category === '게임' ? '🎮 ' : '📋 '}
              {category}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleCreatePost} style={{ marginTop: '10px' }}>
          <div style={{ position: 'relative', marginBottom: '12px' }}>
            <ReactQuill
              ref={postEditorRef}
              value={postContent}
              onChange={setPostContent}
              placeholder="게시글을 작성해주세요 💭"
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'align': [] }],
                  [{ 'color': [] }, { 'background': [] }],
                  ['link', 'image'],
                ]
              }}
              style={{ width: '100%', minHeight: '220px', borderRadius: '8px', backgroundColor: '#fff' }}
            />
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              style={{
                marginTop: '8px',
                padding: '6px 12px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              😊 이모지
            </button>
            {showEmojiPicker && (
              <div
                style={{
                  position: 'absolute',
                  top: '42px',
                  left: '0',
                  zIndex: 10
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(false)}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      fontSize: '12px'
                    }}
                  >
                    닫기
                  </button>
                </div>
                <EmojiPicker
                  onEmojiClick={(emojiObject) => {
                    insertEmojiAtCursor(postEditorRef, postContent, setPostContent, emojiObject.emoji);
                  }}
                  theme="light"
                />
              </div>
            )}
          </div>
          {/* 투표 UI - 임시 비활성화 */}
          {/* <div style={{ marginBottom: '12px' }}>
            {!showPoll ? (
              <button
                type="button"
                onClick={() => setShowPoll(true)}
                style={{ padding: '6px 12px', backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' }}
              >
                📊 투표 추가
              </button>
            ) : (
              <div style={{ background: '#f9fafb', border: '1px solid #d1d5db', borderRadius: '8px', padding: '16px', marginTop: '8px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <label style={{ fontWeight: '600', fontSize: '14px', marginRight: '10px' }}>투표 종료 시간:</label>
                  <select
                    value={pollDuration}
                    onChange={e => setPollDuration(e.target.value)}
                    style={{ padding: '6px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                  >
                    <option value="10">10분</option>
                    <option value="30">30분</option>
                    <option value="60">1시간</option>
                    <option value="360">6시간</option>
                    <option value="720">12시간</option>
                    <option value="1440">1일</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px', display: 'block' }}>투표 선택지</label>
                  {pollOptions.map((opt, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', marginBottom: '6px' }}>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => {
                          const newOpts = [...pollOptions];
                          newOpts[idx] = e.target.value;
                          setPollOptions(newOpts);
                        }}
                        placeholder={`선택지 ${idx + 1}`}
                        style={{ flex: 1, padding: '6px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '14px' }}
                      />
                      {pollOptions.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                          style={{ marginLeft: '8px', background: '#fee2e2', color: '#ef4444', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptions.length < 10 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      style={{ marginTop: '6px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '14px' }}
                    >
                      + 선택지 추가
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowPoll(false);
                    setPollOptions(['', '']);
                    setPollDuration('10');
                  }}
                  style={{ marginTop: '12px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '14px' }}
                >
                  투표 취소
                </button>
              </div>
            )}
          </div> */}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setPostImageFile(file);
              if (file) {
                setPostImagePreview(URL.createObjectURL(file));
              } else {
                setPostImagePreview(null);
              }
            }}
            style={{ marginTop: '12px', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
          />
          {postImagePreview && (
            <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
              <img
                src={postImagePreview}
                alt="미리보기"
                style={{ maxWidth: '200px', maxHeight: '200px', borderRadius: '8px', border: '1px solid #ddd' }}
              />
              <button
                onClick={() => {
                  setPostImageFile(null);
                  setPostImagePreview(null);
                }}
                style={{
                  position: 'absolute',
                  top: '5px',
                  right: '5px',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}
              >
                ×
              </button>
            </div>
          )}
          <button
            type="submit"
            style={{ marginTop: '12px', padding: '10px 20px', cursor: 'pointer', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', transition: 'all 0.2s' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
          >
            🚀 게시글 작성
          </button>
        </form>
      </div>

      <div style={{ marginTop: '40px' }}>
        <h2>게시글</h2>
        {posts.length === 0 && <p>아직 게시글이 없습니다.</p>}
        {posts.map((post) => {
          const isOwner = post.author_id === user.id;
          const liked = post.liked_by?.includes(user.id);
          const commentTree = buildCommentTree(commentsByPost[post.id] || []);
          const isHighlighted = highlightedPostId === post.id;
          // 좋아요 누른 유저 정보 매핑
          const likeUsers = (post.liked_by || [])
            .map(uid => allUsers.find(u => u.id === uid))
            .filter(Boolean)
            .map(u => ({
              id: u.id,
              username: u.display_name || u.username,
              avatarUrl: u.profile_image
            }));
          return (
            <div
              key={post.id}
              id={`post-${post.id}`}
              style={{
                border: isHighlighted ? '2px solid #2563eb' : '1px solid #ddd',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '15px',
                backgroundColor: isHighlighted ? '#eff6ff' : 'white',
                transition: 'all 0.3s ease',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AvatarBubble
                    profileImage={post.author_profile_image}
                    displayName={post.author_display_name || post.author_username}
                    userId={post.author_id}
                    size="40px"
                  />
                  <div>
                    <strong style={{ color: post.author_display_name_color || '#000000' }}>{post.author_display_name || post.author_username}</strong>
                    <span style={{ marginLeft: '8px', color: '#888', fontSize: '12px' }}>
                      {formatToKSTShort(post.created_at)}
                    </span>
                    {post.updated_at && (
                      <span style={{ marginLeft: '8px', color: '#888', fontSize: '12px' }}>
                        (수정됨)
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {/* 카테고리 뱃지 */}
                  {post.category && post.category !== '전체' && (
                    <span style={{
                      padding: '4px 12px',
                      backgroundColor: 
                        post.category === '공지' ? '#fee2e2' :
                        post.category === '일상' ? '#fef3c7' :
                        post.category === '영화' ? '#dbeafe' :
                        post.category === '게임' ? '#dcfce7' : '#f3f4f6',
                      color:
                        post.category === '공지' ? '#991b1b' :
                        post.category === '일상' ? '#92400e' :
                        post.category === '영화' ? '#1e40af' :
                        post.category === '게임' ? '#166534' : '#374151',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {post.category === '공지' ? '📢 ' : post.category === '일상' ? '📝 ' : post.category === '영화' ? '🎬 ' : post.category === '게임' ? '🎮 ' : ''}
                      {post.category}
                    </span>
                  )}
                  {isOwner && (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {editingPostId === post.id ? (
                        <>
                          <button onClick={() => handleUpdatePost(post.id)} style={{ cursor: 'pointer', color: '#10b981', background: 'none', border: 'none', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.opacity = '0.7'} onMouseLeave={(e) => e.target.style.opacity = '1'}>
                            ✅ 저장
                          </button>
                          <button onClick={cancelEdit} style={{ cursor: 'pointer', color: '#6b7280', background: 'none', border: 'none', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.opacity = '0.7'} onMouseLeave={(e) => e.target.style.opacity = '1'}>
                            ❌ 취소
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(post)} style={{ cursor: 'pointer', color: '#2563eb', background: 'none', border: 'none', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.opacity = '0.7'} onMouseLeave={(e) => e.target.style.opacity = '1'}>
                            ✏️ 수정
                          </button>
                          <button onClick={() => handleDeletePost(post.id)} style={{ cursor: 'pointer', color: '#ef4444', background: 'none', border: 'none', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.opacity = '0.7'} onMouseLeave={(e) => e.target.style.opacity = '1'}>
                            🗑 삭제
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
                <button
                  onClick={() => handleToggleLike(post)}
                  style={{ cursor: 'pointer', color: liked ? '#ef4444' : '#6b7280', background: 'none', border: 'none', fontSize: '12px', transition: 'all 0.2s' }}
                  onMouseEnter={(e) => e.target.style.transform = 'scale(1.2)'}
                  onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                  {liked ? '❤️' : '🤍'} {liked ? '\u00a0좋아요 취소' : '\u00a0좋아요'}
                </button>
                <span
                  ref={el => { likeButtonRefs.current[post.id] = el; }}
                  style={{ color: '#ef4444', fontWeight: '600', fontSize: '12px', cursor: 'pointer', position: 'relative' }}
                  onClick={() => setLikeListPopup({ open: true, users: likeUsers, anchor: post.id })}
                  title="마음 누른 사람 보기"
                >
                  ❤️ {post.likes_count || 0}
                </span>
                {/* 좋아요 목록 팝업 렌더링 */}
                {likeListPopup.open && likeListPopup.anchor === post.id && (
                  <LikeListPopup
                    users={likeListPopup.users}
                    onClose={() => setLikeListPopup({ open: false, users: [], anchor: null })}
                    anchorRef={{ current: likeButtonRefs.current[post.id] }}
                  />
                )}
              </div>

              {editingPostId === post.id ? (
                <>
                  <div style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>카테고리 변경:</label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {categories.filter(cat => cat !== '전체').map(category => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setEditingCategory(category)}
                          style={{
                            padding: '6px 12px',
                            cursor: 'pointer',
                            backgroundColor: editingCategory === category ? '#2563eb' : '#fff',
                            color: editingCategory === category ? '#fff' : '#374151',
                            border: editingCategory === category ? '2px solid #2563eb' : '1px solid #d1d5db',
                            borderRadius: '16px',
                            fontWeight: editingCategory === category ? '600' : '500',
                            fontSize: '12px',
                            transition: 'all 0.2s'
                          }}
                        >
                          {category === '공지' ? '📢 ' : category === '일상' ? '📝 ' : category === '영화' ? '🎬 ' : category === '게임' ? '🎮 ' : ''}
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ position: 'relative', marginBottom: '12px' }}>
                    <ReactQuill
                      ref={editEditorRef}
                      value={editingContent}
                      onChange={setEditingContent}
                      placeholder="내용을 수정하세요"
                      modules={{
                        toolbar: [
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ 'align': [] }],
                          [{ 'color': [] }, { 'background': [] }],
                          ['link', 'image'],
                        ]
                      }}
                      style={{ width: '100%', minHeight: '80px', backgroundColor: '#fff' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditEmojiPicker(!showEditEmojiPicker)}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        backgroundColor: '#f3f4f6',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      😊 이모지
                    </button>
                    {showEditEmojiPicker && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '42px',
                          left: '0',
                          zIndex: 10
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '6px' }}>
                          <button
                            type="button"
                            onClick={() => setShowEditEmojiPicker(false)}
                            style={{
                              cursor: 'pointer',
                              backgroundColor: '#f3f4f6',
                              border: '1px solid #d1d5db',
                              padding: '4px 8px',
                              borderRadius: '6px',
                              fontSize: '12px'
                            }}
                          >
                            닫기
                          </button>
                        </div>
                        <EmojiPicker
                          onEmojiClick={(emojiObject) => {
                            insertEmojiAtCursor(editEditorRef, editingContent, setEditingContent, emojiObject.emoji);
                          }}
                          theme="light"
                        />
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div
                    className="post-content"
                    style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '14px' }}
                    dangerouslySetInnerHTML={{
                      __html: linkifyHtml(post.content || '', {
                        target: '_blank',
                        rel: 'noopener noreferrer',
                      })
                    }}
                  />
                  {/* 투표 UI 표시 */}
                  {/*post.poll_options && post.poll_options.length > 1 && (
                    <div style={{ margin: '16px 0', padding: '12px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <strong>투표:</strong>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {post.poll_options.map((option, idx) => (
                          <li key={idx} style={{ margin: '8px 0' }}>
                            <button style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}>
                              {option}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )} */}
                </>
              )}

              {post.image_url && (
                <img
                  src={post.image_url}
                  alt="게시글 이미지"
                  style={{ marginTop: '10px', maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }}
                />
              )}

              <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0 }}>댓글 {commentTree.length}</h4>
                  {commentTree.length > 0 && (
                    <button
                      onClick={() => {
                        setExpandedComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }));
                        // 댓글 닫을 때 입력창도 같이 닫기
                        if (expandedComments[post.id]) {
                          setActiveCommentPostId(null);
                        }
                      }}
                      style={{ cursor: 'pointer', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', padding: '4px 12px', borderRadius: '6px', fontSize: '13px' }}
                    >
                      {expandedComments[post.id] ? '댓글 닫기' : '댓글 보기'}
                    </button>
                  )}
                </div>

                {expandedComments[post.id] && (
                  <>
                    {commentTree.length === 0 && <p style={{ color: '#888' }}>댓글이 없습니다.</p>}
                    {commentTree.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        postId={post.id}
                        comment={comment}
                        currentUserId={user.id}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        replyInputs={replyInputs}
                        setReplyInputs={setReplyInputs}
                        replyImageInputs={replyImageInputs}
                        setReplyImageInputs={setReplyImageInputs}
                        replyImagePreviews={replyImagePreviews}
                        setReplyImagePreviews={setReplyImagePreviews}
                        onReplySubmit={handleReplySubmit}
                        onCommentUpdate={handleCommentUpdate}
                        onCommentDelete={handleCommentDelete}
                      />
                    ))}
                  </>
                )}

                <div style={{ marginTop: '12px' }}>
                  {activeCommentPostId === post.id ? (
                    <>
                      <textarea
                        value={commentInputs[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        placeholder="댓글을 날려 주세요... 💭"
                        style={{ width: '100%', minHeight: '70px', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb', fontFamily: 'inherit', fontSize: '14px' }}
                      />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          setCommentImageInputs((prev) => ({
                            ...prev,
                            [post.id]: file,
                          }));
                          if (file) {
                            setCommentImagePreviews((prev) => ({
                              ...prev,
                              [post.id]: URL.createObjectURL(file),
                            }));
                          } else {
                            setCommentImagePreviews((prev) => ({
                              ...prev,
                              [post.id]: null,
                            }));
                          }
                        }}
                        style={{ marginTop: '10px', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                      />
                      {commentImagePreviews[post.id] && (
                        <div style={{ marginTop: '10px', position: 'relative', display: 'inline-block' }}>
                          <img
                            src={commentImagePreviews[post.id]}
                            alt="미리보기"
                            style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '8px', border: '1px solid #ddd' }}
                          />
                          <button
                            onClick={() => {
                              setCommentImageInputs((prev) => ({ ...prev, [post.id]: null }));
                              setCommentImagePreviews((prev) => ({ ...prev, [post.id]: null }));
                            }}
                            style={{
                              position: 'absolute',
                              top: '5px',
                              right: '5px',
                              backgroundColor: '#ef4444',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '50%',
                              width: '20px',
                              height: '20px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 'bold'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      )}
                      <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleCommentSubmit(post.id)}
                          style={{ cursor: 'pointer', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
                        >
                          🚀 댓글 등록
                        </button>
                        <button
                          onClick={() => {
                            setActiveCommentPostId(null);
                            setExpandedComments((prev) => ({ ...prev, [post.id]: false }));
                          }}
                          style={{ cursor: 'pointer', backgroundColor: '#f3f4f6', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', transition: 'all 0.2s' }}
                        >
                          ❌ 취소
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveCommentPostId(post.id);
                        setExpandedComments((prev) => ({ ...prev, [post.id]: true }));
                      }}
                      style={{ cursor: 'pointer', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', padding: '8px 16px', borderRadius: '6px', fontWeight: '600', transition: 'all 0.2s' }}
                    >
                      💬 댓글 달기
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* 로딩 인디케이터 */}
        {isLoading && (
          <div style={{ textAlign: 'center', marginTop: '30px', marginBottom: '20px', color: '#888' }}>
            <p>로딩 중...</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;