import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPosts, getPostsCount } from '../services/api';
import AvatarBubble from '../components/AvatarBubble';

function AllPosts() {
  const [posts, setPosts] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const navigate = useNavigate();
  
  const categories = ['전체', '공지', '일상', '영화', '게임'];
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
        const category = selectedCategory === '전체' ? null : selectedCategory;
        const [postsData, countData] = await Promise.all([
          getPosts(currentPage, postsPerPage, category),
          getPostsCount()
        ]);
        setPosts(postsData);
        setTotalPosts(countData.total);
      } catch (err) {
        setError('게시글을 불러오는데 실패했습니다.');
      }
    };

    fetchPosts();
  }, [currentPage, selectedCategory, navigate, postsPerPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
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
            padding: '10px 12px',
            margin: '0 4px',
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
      );
    }

    // 페이지 번호
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          style={{
            padding: '10px 12px',
            margin: '0 4px',
            cursor: 'pointer',
            border: currentPage === i ? '2px solid #2563eb' : '1px solid #e5e7eb',
            borderRadius: '6px',
            backgroundColor: currentPage === i ? '#dbeafe' : '#fff',
            fontWeight: currentPage === i ? '700' : '600',
            color: currentPage === i ? '#2563eb' : '#6b7280',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            if (currentPage !== i) {
              e.target.style.backgroundColor = '#f3f4f6';
            }
          }}
          onMouseLeave={(e) => {
            if (currentPage !== i) {
              e.target.style.backgroundColor = '#fff';
            }
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
            padding: '10px 12px',
            margin: '0 4px',
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
      );
    }

    return pages;
  };

  return (
    <div style={{ maxWidth: '800px', margin: '20px auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>📰 전체 게시글</h1>
        <button
          onClick={() => navigate('/')}
          style={{ padding: '10px 20px', cursor: 'pointer', backgroundColor: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '600', transition: 'all 0.2s' }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
        >
          🏠 홈으로
        </button>
      </div>

      {/* 카테고리 탭 */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '20px', 
        padding: '10px', 
        backgroundColor: '#f9fafb', 
        borderRadius: '8px',
        overflowX: 'auto',
        flexWrap: 'wrap'
      }}>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => handleCategoryChange(category)}
            style={{
              padding: '10px 20px',
              cursor: 'pointer',
              backgroundColor: selectedCategory === category ? '#2563eb' : '#fff',
              color: selectedCategory === category ? '#fff' : '#374151',
              border: selectedCategory === category ? '2px solid #2563eb' : '1px solid #d1d5db',
              borderRadius: '20px',
              fontWeight: selectedCategory === category ? '700' : '500',
              fontSize: '14px',
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

      {error && <div style={{ color: '#ef4444', marginBottom: '15px', padding: '12px', backgroundColor: '#fee2e2', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>{error}</div>}

      <div style={{ marginBottom: '20px', color: '#666', fontWeight: '500' }}>
        📊 {selectedCategory !== '전체' ? `${selectedCategory} 카테고리` : '전체'} - {posts.length}개의 게시글 (페이지 {currentPage} / {totalPages})
      </div>

      {posts.length === 0 && <p style={{ color: '#888', textAlign: 'center' }}>📭 게시글이 없습니다.</p>}
      
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
                <strong style={{ color: post.author_display_name_color || '#000000' }}>{post.author_display_name || post.author_username}</strong>
                <span style={{ marginLeft: '8px', color: '#888', fontSize: '12px' }}>
                  {new Date(post.created_at).toLocaleString()}
                </span>
              </div>
            </div>
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
