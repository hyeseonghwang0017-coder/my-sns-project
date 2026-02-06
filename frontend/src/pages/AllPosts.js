import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts, getPostsCount } from '../services/api';
import AvatarBubble from '../components/AvatarBubble';

function AllPosts() {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const postsPerPage = 10;
  const totalPages = Math.ceil(totalPosts / postsPerPage);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchPosts = async () => {
      try {
        const [postsData, countData] = await Promise.all([
          getPosts(currentPage, postsPerPage),
          getPostsCount()
        ]);
        setPosts(postsData);
        setTotalPosts(countData.total);
      } catch (err) {
        setError('게시글을 불러오는데 실패했습니다.');
      }
    };

    fetchPosts();
  }, [currentPage, navigate, postsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    const pages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // 이전 버튼
    if (currentPage > 1) {
      pages.push(
        <button
          key="prev"
          onClick={() => handlePageChange(currentPage - 1)}
          style={{
            padding: '8px 12px',
            margin: '0 4px',
            cursor: 'pointer',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#fff',
          }}
        >
          이전
        </button>
      );
    }

    // 페이지 번호
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          style={{
            padding: '8px 12px',
            margin: '0 4px',
            cursor: 'pointer',
            border: currentPage === i ? '2px solid #2563eb' : '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: currentPage === i ? '#eff6ff' : '#fff',
            fontWeight: currentPage === i ? 'bold' : 'normal',
            color: currentPage === i ? '#2563eb' : '#000',
          }}
        >
          {i}
        </button>
      );
    }

    // 다음 버튼
    if (currentPage < totalPages) {
      pages.push(
        <button
          key="next"
          onClick={() => handlePageChange(currentPage + 1)}
          style={{
            padding: '8px 12px',
            margin: '0 4px',
            cursor: 'pointer',
            border: '1px solid #ddd',
            borderRadius: '4px',
            backgroundColor: '#fff',
          }}
        >
          다음
        </button>
      );
    }

    return pages;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>전체 게시글</h1>
        <button onClick={() => navigate('/')} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          홈으로
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>}

      <div style={{ marginBottom: '20px', color: '#666' }}>
        총 {totalPosts}개의 게시글 (페이지 {currentPage} / {totalPages})
      </div>

      {posts.length === 0 && <p>게시글이 없습니다.</p>}
      
      {posts.map((post) => (
        <div
          key={post.id}
          onClick={() => navigate('/', { state: { highlightPostId: post.id } })}
          style={{
            border: '1px solid #ddd',
            padding: '15px',
            borderRadius: '8px',
            marginBottom: '15px',
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
              </div>
            </div>
          </div>

          <p style={{ margin: '10px 0', whiteSpace: 'pre-wrap' }}>{post.content}</p>

          {post.image_url && (
            <img
              src={post.image_url}
              alt="게시글"
              style={{ marginTop: '10px', maxWidth: '100%', borderRadius: '8px' }}
            />
          )}

          <div style={{ marginTop: '10px', color: '#888', fontSize: '14px' }}>
            좋아요 {post.likes_count || 0}
          </div>
        </div>
      ))}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px', flexWrap: 'wrap' }}>
          {renderPagination()}
        </div>
      )}
    </div>
  );
}

export default AllPosts;
