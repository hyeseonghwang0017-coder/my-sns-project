import React, { useEffect, useState } from 'react';
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
  const [error, setError] = useState('');
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
        const profileData = await getUserProfile(userId);
        setProfile(profileData);

        const postsData = await getUserPosts(userId);
        setPosts(postsData);

        const guestbookData = await getGuestbook(userId);
        setGuestbook(guestbookData);
      } catch (err) {
        setError('프로필을 불러오는데 실패했습니다.');
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

  if (!profile || !currentUser) {
    return <div>Loading...</div>;
  }

  const isOwnProfile = currentUser.id === userId;

  return (
    <div style={{ maxWidth: '1000px', margin: '20px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>프로필</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <NotificationBell />
          <button onClick={() => navigate('/')} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            홈으로
          </button>
        </div>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

      {/* 프로필 섹션 */}
      <div style={{ backgroundColor: '#f5f5f5', padding: '30px', borderRadius: '12px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
          <div>
            {profile.profile_image ? (
              <img
                src={profile.profile_image}
                alt="프로필"
                style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #ddd' }}
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
                  border: '3px solid #ddd'
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
                      style={{ display: 'block', marginTop: '8px', padding: '5px 10px', cursor: 'pointer' }}
                    >
                      저장
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h2>{profile.display_name}</h2>
            <p style={{ color: '#666', marginTop: '5px' }}>@{profile.username}</p>
            {profile.bio && <p style={{ marginTop: '15px', fontSize: '16px' }}>{profile.bio}</p>}
            <p style={{ marginTop: '10px', color: '#888', fontSize: '14px' }}>
              가입일: {new Date(profile.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* 탭 섹션 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* 게시글 목록 */}
        <div>
          <h2>게시글 ({posts.length})</h2>
          {posts.length === 0 && <p style={{ color: '#888' }}>작성한 게시글이 없습니다.</p>}
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
                    {new Date(post.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <p style={{ whiteSpace: 'pre-wrap' }}>{post.content}</p>
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
                    padding: '8px 12px',
                    cursor: 'pointer',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                  }}
                >
                  이전
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
                      padding: '8px 12px',
                      cursor: 'pointer',
                      border: currentPage === pageNum ? '2px solid #2563eb' : '1px solid #ddd',
                      borderRadius: '4px',
                      backgroundColor: currentPage === pageNum ? '#eff6ff' : '#fff',
                      fontWeight: currentPage === pageNum ? 'bold' : 'normal',
                      color: currentPage === pageNum ? '#2563eb' : '#000',
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
                    padding: '8px 12px',
                    cursor: 'pointer',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                  }}
                >
                  다음
                </button>
              )}
            </div>
          )}
        </div>

        {/* 방명록 */}
        <div>
          <h2>방명록 ({guestbook.length})</h2>
          <form onSubmit={handleGuestbookSubmit} style={{ marginTop: '15px' }}>
            <textarea
              value={guestbookInput}
              onChange={(e) => setGuestbookInput(e.target.value)}
              placeholder="방명록을 남겨주세요"
              style={{ width: '100%', minHeight: '80px', padding: '10px', borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
            <button
              type="submit"
              style={{ marginTop: '8px', padding: '8px 16px', cursor: 'pointer', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '6px' }}
            >
              방명록 작성
            </button>
          </form>

          {guestbook.length === 0 && <p style={{ color: '#888', marginTop: '15px' }}>아직 방명록이 없습니다.</p>}
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
                    <strong>{entry.author_display_name}</strong>
                    <span style={{ marginLeft: '8px', color: '#888', fontSize: '12px' }}>
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                {entry.author_id === currentUser.id && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {editingEntryId === entry.id ? (
                      <>
                        <button onClick={() => handleGuestbookUpdate(entry.id)} style={{ cursor: 'pointer', color: '#2563eb', background: 'none', border: 'none' }}>
                          저장
                        </button>
                        <button onClick={() => setEditingEntryId(null)} style={{ cursor: 'pointer', color: '#6b7280', background: 'none', border: 'none' }}>
                          취소
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => {
                            setEditingEntryId(entry.id);
                            setEditingContent(entry.content);
                          }}
                          style={{ cursor: 'pointer', color: '#6b7280', background: 'none', border: 'none' }}
                        >
                          수정
                        </button>
                        <button onClick={() => handleGuestbookDelete(entry.id)} style={{ cursor: 'pointer', color: '#ef4444', background: 'none', border: 'none' }}>
                          삭제
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
