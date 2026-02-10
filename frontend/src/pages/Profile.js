import React, { useEffect, useState } from 'react';
import linkifyHtml from 'linkify-html';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getUserProfile,
  getUserPosts,
  getGuestbook,
  createGuestbookEntry,
  updateGuestbookEntry,
  deleteGuestbookEntry,
  uploadImage,
  updateProfileImage,
  updateHeaderImage,
  updateDisplayNameColor,
  updateMyProfile,
} from '../services/api';
import NotificationBell from '../components/NotificationBell';
import AvatarBubble from '../components/AvatarBubble';

function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [guestbook, setGuestbook] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [guestbookInput, setGuestbookInput] = useState('');
  const [editingEntryId, setEditingEntryId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState(null);
  const [headerImageFile, setHeaderImageFile] = useState(null);
  const [headerImagePreview, setHeaderImagePreview] = useState(null);
  const [displayNameColor, setDisplayNameColor] = useState('#000000');
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const postsPerPage = 10;
  const totalPages = Math.ceil(posts.length / postsPerPage);
  const displayedPosts = posts.slice((currentPage - 1) * postsPerPage, currentPage * postsPerPage);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setCurrentUser(userData);

    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const profileData = await getUserProfile(userId);
        setProfile(profileData);
        setDisplayNameColor(profileData.display_name_color || '#000000');
        setEditDisplayName(profileData.display_name || '');
        setEditUsername(profileData.username || '');
        setEditBio(profileData.bio || '');

        const postsData = await getUserPosts(userId);
        setPosts(postsData);

        const guestbookData = await getGuestbook(userId);
        setGuestbook(guestbookData);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setError('프로필을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, navigate]);

  const handleProfileImageUpload = async () => {
    if (!profileImageFile) return;

    try {
      const uploaded = await uploadImage(profileImageFile);
      await updateProfileImage(userId, uploaded.url);
      setProfile({ ...profile, profile_image: uploaded.url });
      setProfileImageFile(null);
      setProfileImagePreview(null);
      setError('');
    } catch (err) {
      setError('프로필 사진 업로드에 실패했습니다.');
    }
  };

  const handleHeaderImageUpload = async () => {
    if (!headerImageFile) return;

    try {
      const uploaded = await uploadImage(headerImageFile);
      await updateHeaderImage(userId, uploaded.url);
      setProfile({ ...profile, header_image: uploaded.url });
      setHeaderImageFile(null);
      setHeaderImagePreview(null);
      setError('');
    } catch (err) {
      setError('헤더 이미지 업로드에 실패했습니다.');
    }
  };

  const handleProfileUpdate = async () => {
    if (!editDisplayName.trim() || !editUsername.trim()) {
      setError('닉네임과 @이름을 입력해주세요.');
      return;
    }

    try {
      const updated = await updateMyProfile({
        display_name: editDisplayName.trim(),
        username: editUsername.trim(),
        bio: editBio.trim() || null,
      });

      setProfile({
        ...profile,
        display_name: updated.display_name,
        username: updated.username,
        bio: updated.bio,
      });

      if (currentUser && currentUser.id === updated.id) {
        const nextUser = { ...currentUser, display_name: updated.display_name, username: updated.username, bio: updated.bio };
        setCurrentUser(nextUser);
        localStorage.setItem('user', JSON.stringify(nextUser));
      }

      const [postsData, guestbookData] = await Promise.all([
        getUserPosts(userId),
        getGuestbook(userId),
      ]);
      setPosts(postsData);
      setGuestbook(guestbookData);

      setIsEditingProfile(false);
      setError('');
    } catch (err) {
      const message = err.response?.data?.detail || '프로필 수정에 실패했습니다.';
      setError(message);
    }
  };

  const handleGuestbookSubmit = async (e) => {
    e.preventDefault();
    if (!guestbookInput.trim()) {
      setError('방명록 내용을 입력해주세요.');
      return;
    }

    try {
      const newEntry = await createGuestbookEntry(userId, guestbookInput);
      setGuestbook([newEntry, ...guestbook]);
      setGuestbookInput('');
      setError('');
    } catch (err) {
      setError('방명록 작성에 실패했습니다.');
    }
  };

  const handleGuestbookUpdate = async (entryId) => {
    if (!editingContent.trim()) {
      setError('방명록 내용을 입력해주세요.');
      return;
    }

    try {
      const updated = await updateGuestbookEntry(userId, entryId, editingContent);
      setGuestbook(guestbook.map(entry => entry.id === entryId ? updated : entry));
      setEditingEntryId(null);
      setEditingContent('');
      setError('');
    } catch (err) {
      setError('방명록 수정에 실패했습니다.');
    }
  };

  const handleGuestbookDelete = async (entryId) => {
    if (!window.confirm('정말 이 방명록을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await deleteGuestbookEntry(userId, entryId);
      setGuestbook(guestbook.filter(entry => entry.id !== entryId));
      setError('');
    } catch (err) {
      setError('방명록 삭제에 실패했습니다.');
    }
  };

  const handleDisplayNameColorChange = async (color) => {
    try {
      setDisplayNameColor(color);
      await updateDisplayNameColor(userId, color);
      setProfile({ ...profile, display_name_color: color });
      setError('');
    } catch (err) {
      setError('닉네임 색깔 변경에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '20px', textAlign: 'center' }}>
        <h2>Loading...</h2>
        <p>프로필을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (!profile || !currentUser) {
    return (
      <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '20px', textAlign: 'center' }}>
        <h2>프로필을 찾을 수 없습니다</h2>
        <button onClick={() => navigate('/')} style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px' }}>
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const isOwnProfile = currentUser.id === userId;

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>👤 프로필</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <NotificationBell />
          <button onClick={() => navigate('/')} style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', transition: 'all 0.2s' }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}>
            🏠 홈으로
          </button>
        </div>
      </div>

      {error && <div style={{ color: '#ef4444', marginBottom: '15px', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>{error}</div>}

      {/* 프로필 섹션 */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', marginBottom: '30px', border: '1px solid #e5e7eb', overflow: 'hidden', position: 'relative' }}>
        {/* 헤더 이미지 섹션 */}
        <div style={{ position: 'relative', width: '100%', height: '200px', backgroundColor: profile.header_image ? 'transparent' : '#94a3b8' }}>
          {profile.header_image ? (
            <img
              src={profile.header_image}
              alt="헤더"
              style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }}
            />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '48px', pointerEvents: 'none' }}>
              🌟
            </div>
          )}
          {isOwnProfile && (
            <div style={{ position: 'absolute', bottom: '10px', right: '10px', zIndex: 20, pointerEvents: 'auto' }}>
              <input
                id="header-image-input"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  setHeaderImageFile(file);
                  if (file) {
                    setHeaderImagePreview(URL.createObjectURL(file));
                  } else {
                    setHeaderImagePreview(null);
                  }
                }}
                style={{ display: 'none' }}
              />
              <button
                onClick={() => document.getElementById('header-image-input').click()}
                style={{ 
                  padding: '8px 12px', 
                  cursor: 'pointer', 
                  backgroundColor: 'rgba(0, 0, 0, 0.6)', 
                  color: '#fff', 
                  border: 'none', 
                  borderRadius: '6px', 
                  fontWeight: '600', 
                  fontSize: '12px', 
                  backdropFilter: 'blur(4px)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.6)'}
              >
                📷 헤더 변경
              </button>
            </div>
          )}
        </div>

        {/* 헤더 이미지 미리보기 및 저장 */}
        {isOwnProfile && headerImagePreview && (
          <div style={{ padding: '15px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', position: 'relative', zIndex: 20, pointerEvents: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src={headerImagePreview}
                alt="헤더 미리보기"
                style={{ width: '100px', height: '50px', borderRadius: '6px', objectFit: 'cover' }}
              />
              <button
                onClick={handleHeaderImageUpload}
                style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
              >
                💾 헤더 저장
              </button>
              <button
                onClick={() => {
                  setHeaderImageFile(null);
                  setHeaderImagePreview(null);
                }}
                style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#4b5563'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#6b7280'}
              >
                ❌ 취소
              </button>
            </div>
          </div>
        )}

        {/* 프로필 정보 섹션 */}
        <div style={{ padding: '30px', position: 'relative', marginTop: '-50px' }}>
          <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
            <div style={{ position: 'relative' }}>
              {profile.profile_image ? (
                <img
                  src={profile.profile_image}
                  alt="프로필"
                  style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '5px solid #fff', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}
                />
              ) : (
                <div
                  style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    backgroundColor: '#e9eef5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    color: '#4b5563',
                    border: '5px solid #fff',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {profile.display_name.slice(0, 1)}
                </div>
              )}
              {isOwnProfile && (
                <div style={{ marginTop: '15px' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setProfileImageFile(file);
                      if (file) {
                        setProfileImagePreview(URL.createObjectURL(file));
                      } else {
                        setProfileImagePreview(null);
                      }
                    }}
                    style={{ fontSize: '12px' }}
                  />
                  {profileImagePreview && (
                    <div style={{ marginTop: '10px' }}>
                      <img
                        src={profileImagePreview}
                        alt="미리보기"
                        style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <button
                        onClick={handleProfileImageUpload}
                        style={{ display: 'block', marginTop: '8px', padding: '8px 12px', cursor: 'pointer', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '12px', transition: 'all 0.2s' }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#059669'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#10b981'}
                      >
                        💾 저장
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ flex: 1, marginTop: '50px' }}>
              {isOwnProfile && isEditingProfile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>닉네임</label>
                    <input
                      value={editDisplayName}
                      onChange={(e) => setEditDisplayName(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>@이름</label>
                    <input
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>소개</label>
                    <textarea
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={handleProfileUpdate}
                      style={{ padding: '10px 16px', cursor: 'pointer', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600' }}
                    >
                      💾 저장
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingProfile(false);
                        setEditDisplayName(profile.display_name || '');
                        setEditUsername(profile.username || '');
                        setEditBio(profile.bio || '');
                      }}
                      style={{ padding: '10px 16px', cursor: 'pointer', backgroundColor: '#6b7280', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600' }}
                    >
                      ❌ 취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ color: displayNameColor, margin: 0 }}>{profile.display_name}</h2>
                    {isOwnProfile && (
                      <button
                        onClick={() => setIsEditingProfile(true)}
                        style={{ padding: '6px 10px', cursor: 'pointer', backgroundColor: '#f3f4f6', border: '1px solid #e5e7eb', borderRadius: '6px', fontWeight: '600', fontSize: '12px' }}
                      >
                        ✏️ 프로필 편집
                      </button>
                    )}
                  </div>
                  <p style={{ color: '#666', marginTop: '5px' }}>@{profile.username}</p>
                  {profile.bio && <p style={{ marginTop: '15px', fontSize: '16px' }}>{profile.bio}</p>}
                  <p style={{ marginTop: '10px', color: '#888', fontSize: '14px' }}>
                    가입일: {new Date(profile.created_at).toLocaleDateString()}
                  </p>
                </>
              )}
              {isOwnProfile && (
                <div style={{ marginTop: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>닉네임 색상:</label>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    {['#000000', '#ef4444', '#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'].map((color) => (
                      <button
                        key={color}
                        onClick={() => handleDisplayNameColorChange(color)}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: color,
                          border: displayNameColor === color ? '3px solid #000' : '2px solid #ccc',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 탭 섹션 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* 게시글 목록 */}
        <div>
          <h2>📝 게시글 ({posts.length})</h2>
          {posts.length === 0 && <p style={{ color: '#888' }}>📭 작성한 게시글이 없습니다.</p>}
          {displayedPosts.map((post) => (
            <div
              key={post.id}
              onClick={() => navigate('/', { state: { highlightPostId: post.id } })}
              style={{
                border: '1px solid #ddd',
                padding: '15px',
                borderRadius: '8px',
                marginTop: '15px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
                e.currentTarget.style.borderColor = '#2563eb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.borderColor = '#ddd';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <AvatarBubble
                  profileImage={post.author_profile_image}
                  displayName={post.author_display_name || post.author_username}
                  userId={post.author_id}
                  size="40px"
                />
                <div>
                  <strong>{post.author_display_name || post.author_username}</strong>
                  <div style={{ color: '#888', fontSize: '12px' }}>
                    {new Date(post.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                  </div>
                </div>
              </div>
              <div
                className="post-content"
                style={{ whiteSpace: 'pre-wrap' }}
                dangerouslySetInnerHTML={{
                  __html: linkifyHtml(post.content || '', {
                    target: '_blank',
                    rel: 'noopener noreferrer',
                  })
                }}
              />
              {post.image_url && (
                <img
                  src={post.image_url}
                  alt="게시글"
                  style={{ marginTop: '10px', maxWidth: '100%', borderRadius: '8px' }}
                />
              )}
              <div style={{ marginTop: '10px', color: '#888', fontSize: '12px' }}>
                좋아요 {post.likes_count}
              </div>
            </div>
          ))}

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', gap: '8px', flexWrap: 'wrap' }}>
              {currentPage > 1 && (
                <button
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f3f4f6';
                    e.target.style.borderColor = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                >
                  ◀ 이전
                </button>
              )}

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const maxVisible = 5;
                const isVisible =
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - Math.floor(maxVisible / 2) &&
                    pageNum <= currentPage + Math.floor(maxVisible / 2));

                if (!isVisible) {
                  if (pageNum === currentPage - Math.floor(maxVisible / 2) - 1) {
                    return <span key="ellipsis-start">...</span>;
                  }
                  if (pageNum === currentPage + Math.floor(maxVisible / 2) + 1) {
                    return <span key="ellipsis-end">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    style={{
                      padding: '10px 12px',
                      cursor: 'pointer',
                      border: currentPage === pageNum ? '2px solid #2563eb' : '1px solid #e5e7eb',
                      borderRadius: '6px',
                      backgroundColor: currentPage === pageNum ? '#dbeafe' : '#fff',
                      fontWeight: currentPage === pageNum ? '700' : '600',
                      color: currentPage === pageNum ? '#2563eb' : '#6b7280',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (currentPage !== pageNum) {
                        e.target.style.backgroundColor = '#f3f4f6';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentPage !== pageNum) {
                        e.target.style.backgroundColor = '#fff';
                      }
                    }}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {currentPage < totalPages && (
                <button
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  style={{
                    padding: '10px 12px',
                    cursor: 'pointer',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px',
                    backgroundColor: '#fff',
                    fontWeight: '600',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f3f4f6';
                    e.target.style.borderColor = '#2563eb';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#fff';
                    e.target.style.borderColor = '#e5e7eb';
                  }}
                >
                  다음 ▶
                </button>
              )}
            </div>
          )}
        </div>

        {/* 방명록 */}
        <div>
          <h2>📖 방명록 ({guestbook.length})</h2>
          <form onSubmit={handleGuestbookSubmit} style={{ marginTop: '15px' }}>
            <textarea
              value={guestbookInput}
              onChange={(e) => setGuestbookInput(e.target.value)}
              placeholder="방명록을 남겨주세요"
              style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <button
              type="submit"
              style={{ marginTop: '10px', padding: '10px 16px', cursor: 'pointer', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '600', transition: 'all 0.2s' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
            >
              📝 방명록 작성
            </button>
          </form>

          {guestbook.length === 0 && <p style={{ color: '#888', marginTop: '15px' }}>📭 아직 방명록이 없습니다.</p>}
          {guestbook.map((entry) => (
            <div key={entry.id} style={{ border: '1px solid #ddd', padding: '12px', borderRadius: '8px', marginTop: '15px', backgroundColor: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {entry.author_profile_image ? (
                    <img
                      src={entry.author_profile_image}
                      alt="프로필"
                      style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: '#e9eef5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        color: '#4b5563',
                      }}
                    >
                      {entry.author_display_name.slice(0, 1)}
                    </div>
                  )}
                  <div>
                    {entry.author_id === currentUser.id ? (
                      <strong
                        style={{ cursor: 'pointer', color: entry.author_display_name_color || '#000000', transition: 'all 0.2s' }}
                        onClick={() => navigate(`/profile/${entry.author_id}`)}
                        onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
                      >
                        {entry.author_display_name}
                      </strong>
                    ) : (
                      <strong
                        style={{ cursor: 'pointer', color: entry.author_display_name_color || '#2563eb', transition: 'all 0.2s' }}
                        onClick={() => navigate(`/profile/${entry.author_id}`)}
                        onMouseEnter={(e) => (e.target.style.textDecoration = 'underline')}
                        onMouseLeave={(e) => (e.target.style.textDecoration = 'none')}
                      >
                        {entry.author_display_name}
                      </strong>
                    )}
                    <span style={{ marginLeft: '8px', color: '#888', fontSize: '12px' }}>
                      {new Date(entry.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}
                    </span>
                  </div>
                </div>
                {entry.author_id === currentUser.id && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {editingEntryId === entry.id ? (
                      <>
                        <button
                          onClick={() => handleGuestbookUpdate(entry.id)}
                          style={{ cursor: 'pointer', color: '#10b981', background: 'none', border: 'none', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                          ✅ 저장
                        </button>
                        <button
                          onClick={() => setEditingEntryId(null)}
                          style={{ cursor: 'pointer', color: '#6b7280', background: 'none', border: 'none', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                          ❌ 취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingEntryId(entry.id);
                            setEditingContent(entry.content);
                          }}
                          style={{ cursor: 'pointer', color: '#2563eb', background: 'none', border: 'none', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                          ✏️ 수정
                        </button>
                        <button
                          onClick={() => handleGuestbookDelete(entry.id)}
                          style={{ cursor: 'pointer', color: '#ef4444', background: 'none', border: 'none', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}
                          onMouseEnter={(e) => e.target.style.opacity = '0.7'}
                          onMouseLeave={(e) => e.target.style.opacity = '1'}
                        >
                          🗑️ 삭제
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
              {editingEntryId === entry.id ? (
                <textarea
                  value={editingContent}
                  onChange={(e) => setEditingContent(e.target.value)}
                  style={{ width: '100%', minHeight: '60px', padding: '8px', marginTop: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
              ) : (
                <p style={{ marginTop: '10px', whiteSpace: 'pre-wrap' }}>{entry.content}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Profile;
