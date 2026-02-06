import React, { useEffect, useState } from 'react';
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
} from '../services/api';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from '../components/NotificationBell';
import AvatarBubble from '../components/AvatarBubble';

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
        marginTop: '10px',
        marginLeft: isReply ? 24 : 0,
        padding: '12px',
        borderRadius: '10px',
        backgroundColor: isReply ? '#f7f9fc' : '#ffffff',
        border: '1px solid #e6e8eb',
        boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      {isDeleted ? (
        <>
          <p style={{ margin: '10px 0', color: '#9aa0a6', fontStyle: 'italic' }}>삭제된 댓글입니다.</p>
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
        </>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AvatarBubble
                  profileImage={comment.author_profile_image}
                  displayName={comment.author_display_name || comment.author_username}
                  userId={comment.author_id}
                  size="36px"
                />
                <strong>{comment.author_display_name || comment.author_username}</strong>
              </div>
              <span style={{ marginLeft: '36px', color: '#9aa0a6', fontSize: '12px' }}>
                {new Date(comment.created_at).toLocaleString()}
              </span>
              {comment.updated_at && (
                <span style={{ marginLeft: '8px', color: '#9aa0a6', fontSize: '12px' }}>
                  (수정됨)
                </span>
              )}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setReplyingTo(comment.id)} style={{ cursor: 'pointer', color: '#2563eb', background: 'none', border: 'none' }}>
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
                      <button onClick={() => setIsEditing(false)} style={{ cursor: 'pointer', color: '#6b7280', background: 'none', border: 'none' }}>
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => setIsEditing(true)} style={{ cursor: 'pointer', color: '#6b7280', background: 'none', border: 'none' }}>
                        수정
                      </button>
                      <button onClick={() => onCommentDelete(postId, comment.id)} style={{ cursor: 'pointer', color: '#ef4444', background: 'none', border: 'none' }}>
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
              style={{ width: '100%', minHeight: '60px', padding: '8px', marginTop: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
          ) : (
            <p style={{ margin: '10px 0 0', whiteSpace: 'pre-wrap', color: '#111827' }}>{comment.content}</p>
          )}

          {comment.image_url && (
            <img
              src={comment.image_url}
              alt="댓글 이미지"
              style={{ marginTop: '10px', maxWidth: '100%', borderRadius: '8px', border: '1px solid #eee' }}
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
                style={{ width: '100%', minHeight: '60px', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
              />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setReplyImageInputs((prev) => ({ ...prev, [comment.id]: file }));
              if (file) {
                setReplyImagePreviews((prev) => ({ ...prev, [comment.id]: URL.createObjectURL(file) }));
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
                style={{ maxWidth: '150px', maxHeight: '150px', borderRadius: '8px', border: '1px solid #ddd' }}
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
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
          )}
              <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
                <button onClick={() => onReplySubmit(postId, comment.id)} style={{ cursor: 'pointer', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px' }}>
                  등록
                </button>
                <button onClick={() => setReplyingTo(null)} style={{ cursor: 'pointer', backgroundColor: '#f3f4f6', border: 'none', padding: '6px 12px', borderRadius: '6px' }}>
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
        </>
      )}
    </div>
  );
}

function Home() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [postContent, setPostContent] = useState('');
  const [postImageFile, setPostImageFile] = useState(null);
  const [editingPostId, setEditingPostId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [error, setError] = useState('');
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
  const navigate = useNavigate();
  const location = useLocation();

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
        const list = await getPosts(1, 1000);
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
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
      }
    };

    fetchProfile();
  }, [navigate]);

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
          const newPosts = await getPosts(currentPage, 1000);
          if (newPosts.length === 0) {
            setHasMore(false);
          } else {
            setPosts((prev) => [...prev, ...newPosts]);
            setHasMore(newPosts.length === 1000);

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
  }, [currentPage, isLoading, hasMore]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    setError('');

    const trimmed = postContent.trim();
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

      const created = await createPost({
        content: trimmed || undefined,
        image_url: imageUrl || undefined,
      });
      setPosts([created, ...posts]);
      setPostContent('');
      setPostImageFile(null);
      setPostImagePreview(null);
    } catch (err) {
      setError(err.response?.data?.detail || '게시글 작성에 실패했습니다.');
    }
  };

  const startEdit = (post) => {
    setEditingPostId(post.id);
    setEditingContent(post.content);
    setError('');
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditingContent('');
    setError('');
  };

  const handleUpdatePost = async (postId) => {
    const trimmed = editingContent.trim();
    if (!trimmed) {
      setError('내용을 입력해주세요.');
      return;
    }

    try {
      const updated = await updatePost(postId, { content: trimmed });
      setPosts(posts.map((post) => (post.id === postId ? updated : post)));
      cancelEdit();
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
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>GGame 홈</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <NotificationBell />
          <button onClick={handleLogout} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            로그아웃
          </button>
        </div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}
      
      <div style={{ backgroundColor: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
        <h2>내 프로필</h2>
        <p><strong>사용자명:</strong> {user.username}</p>
        <p><strong>표시 이름:</strong> {user.display_name}</p>
        <p><strong>이메일:</strong> {user.email}</p>
        {user.bio && <p><strong>소개:</strong> {user.bio}</p>}
        <button
          onClick={() => navigate(`/profile/${user.id}`)}
          style={{ marginTop: '15px', padding: '10px 20px', cursor: 'pointer', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px' }}
        >
          내 프로필 페이지로
        </button>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h2>게시글 작성</h2>
        <form onSubmit={handleCreatePost} style={{ marginTop: '10px' }}>
          <textarea
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            placeholder="내용을 입력하세요"
            style={{ width: '100%', minHeight: '100px', padding: '10px' }}
          />
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
            style={{ marginTop: '8px' }}
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
                  justifyContent: 'center'
                }}
              >
                ×
              </button>
            </div>
          )}
          <button
            type="submit"
            style={{ marginTop: '10px', padding: '10px 20px', cursor: 'pointer' }}
          >
            게시글 작성
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
                    <strong>{post.author_display_name || post.author_username}</strong>
                    <span style={{ marginLeft: '8px', color: '#888', fontSize: '12px' }}>
                      {new Date(post.created_at).toLocaleString()}
                    </span>
                    {post.updated_at && (
                      <span style={{ marginLeft: '8px', color: '#888', fontSize: '12px' }}>
                        (수정됨)
                      </span>
                    )}
                  </div>
                </div>
                {isOwner && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {editingPostId === post.id ? (
                      <>
                        <button onClick={() => handleUpdatePost(post.id)} style={{ cursor: 'pointer' }}>
                          저장
                        </button>
                        <button onClick={cancelEdit} style={{ cursor: 'pointer' }}>
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(post)} style={{ cursor: 'pointer' }}>
                          수정
                        </button>
                        <button onClick={() => handleDeletePost(post.id)} style={{ cursor: 'pointer' }}>
                          삭제
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <button onClick={() => handleToggleLike(post)} style={{ cursor: 'pointer' }}>
                  {liked ? '좋아요 취소' : '좋아요'}
                </button>
                <span>좋아요 {post.likes_count || 0}</span>
              </div>

              {editingPostId === post.id ? (
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  style={{ width: '100%', minHeight: '80px', padding: '10px' }}
                />
              ) : (
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{post.content}</p>
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

                <div style={{ marginTop: '10px' }}>
                  {activeCommentPostId === post.id ? (
                    <>
                      <textarea
                        value={commentInputs[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        placeholder="댓글을 입력하세요"
                        style={{ width: '100%', minHeight: '70px', padding: '8px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
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
                        style={{ marginTop: '8px' }}
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
                              justifyContent: 'center'
                            }}
                          >
                            ×
                          </button>
                        </div>
                      )}
                      <div style={{ marginTop: '6px', display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleCommentSubmit(post.id)}
                          style={{ cursor: 'pointer', backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px' }}
                        >
                          댓글 작성
                        </button>
                        <button
                          onClick={() => {
                            setActiveCommentPostId(null);
                            setExpandedComments((prev) => ({ ...prev, [post.id]: false }));
                          }}
                          style={{ cursor: 'pointer', backgroundColor: '#f3f4f6', border: 'none', padding: '6px 12px', borderRadius: '6px' }}
                        >
                          취소
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setActiveCommentPostId(post.id);
                        setExpandedComments((prev) => ({ ...prev, [post.id]: true }));
                      }}
                      style={{ cursor: 'pointer', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', padding: '6px 12px', borderRadius: '6px' }}
                    >
                      댓글 달기
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