import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/senior.css';
import {
  FaUserShield,
  FaHandHoldingHeart,
  FaTruck,
  FaBroom,
  FaTools,
  FaRegBuilding,
  FaShoppingCart,
  FaSearch,
} from 'react-icons/fa';
import axios from 'axios';

// API 기본 주소
const BASE_URL = 'http://localhost:8000';

// 카테고리 버튼 정의 (검색 버튼만 path 가짐)
const categories = [
  { id: 1, name: '경비·보안·안전', icon: <FaUserShield className="senior-icon" /> },
  { id: 2, name: '돌봄·복지·교육', icon: <FaHandHoldingHeart className="senior-icon" /> },
  { id: 3, name: '운전·배송·이동 서비스', icon: <FaTruck className="senior-icon" /> },
  { id: 4, name: '청소·환경 미화', icon: <FaBroom className="senior-icon" /> },
  { id: 5, name: '생산·기술·제조 보조', icon: <FaTools className="senior-icon" /> },
  { id: 6, name: '사무·행정·고객 응대', icon: <FaRegBuilding className="senior-icon" /> },
  { id: 7, name: '판매·서비스업', icon: <FaShoppingCart className="senior-icon" /> },
  { id: 8, name: '검색', icon: <FaSearch className="senior-icon" />, path: '/search-frontend?from_mode=1' },
];

export default function SeniorPage() {
  const navigate = useNavigate();

  // 상태 정의
  const [keyword, setKeyword] = useState('시니어 추천 일자리');
  const [jobList, setjobList] = useState([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [videosByCategory, setVideosByCategory] = useState({});
  const [categorySummaries, setCategorySummaries] = useState({});
  const [loadingCategorySummary, setLoadingCategorySummary] = useState(null);

  // 영상 검색
  const fetchVideos = async (kw) => {
    setLoadingVideos(true);
    setVideoError('');
    try {
      const res = await axios.get(
        `${BASE_URL}/senior-category-search?keyword=${encodeURIComponent(kw)}`
      );
      setVideosByCategory(res.data || {});
    } catch (err) {
      setVideoError('유튜브 검색 실패!');
    } finally {
      setLoadingVideos(false);
    }
  };

  // 카테고리별 요약
  const fetchCategorySummary = async (categoryId) => {
    if (loadingCategorySummary) return;
    setLoadingCategorySummary(categoryId);
    try {
      const videoIds = videosByCategory[categoryId].videos.map(
        (v) => v.video_id
      );
      const response = await axios.post(
        `${BASE_URL}/compare-category`,
        {
          video_data_list: videoIds.map((video_id) => ({
            video_id,
            keyword,
            category: categoryId,
          })),
          category_name: categoryId,
        }
      );
      setCategorySummaries((prev) => ({
        ...prev,
        [categoryId]:
          response.data.comparison ||
          '이 카테고리의 영상들에 대한 요약 정보를 찾을 수 없습니다.',
      }));
    } catch (error) {
      setCategorySummaries((prev) => ({
        ...prev,
        [categoryId]: '카테고리 요약 정보를 가져오는 중 오류가 발생했습니다.',
      }));
    } finally {
      setLoadingCategorySummary(null);
    }
  };

  // 처음 마운트 시 검색
  useEffect(() => {
    fetchVideos(keyword);
  }, [keyword]);

  // 카테고리 ID를 한글명으로
  const getCategoryDisplayName = (categoryId) => {
    const map = {
      pros_cons: '취업 정보',
      how_to: '준비방법',
      review: '후기',
    };
    return map[categoryId] || categoryId;
  };

  const handleCategoryClick = (category) => {
    if (category.path) navigate(category.path);
    else
      navigate(
        `/senior-results/${category.id}?name=${encodeURIComponent(
          category.name
        )}`
      );
  };

  return (
    <div className="senior-container">
      <h1 className="senior-title">고령자 직무 추천</h1>

    <div className="job-postings-section">
      <div className="senior-data-grid">
        {jobList.map((job) => (
          <div key={job.id} className="senior-data-box">
            <p className="data-category">{job.category}</p>
            <a
              href={job.link}
              className="data-title"
              target="_blank"
              rel="noopener noreferrer"
            >
              {job.title}
            </a>
            <p className="data-description">{job.description}</p>
          </div>
        ))}
      </div>
    </div>
      <div className="senior-grid">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="senior-box"
            onClick={() => handleCategoryClick(cat)}
          >
            {cat.icon} {cat.name}
          </div>
        ))}
      </div>

      {loadingVideos && (
        <div className="loading-container">
          <div className="loader" />
          <p className="loading-text">유튜브 동영상 검색 중...</p>
        </div>
      )}

      {!loadingVideos && videoError && (
        <div className="error-container">
          <p className="error-message">{videoError}</p>
        </div>
      )}

      {!loadingVideos && !videoError &&
        Object.keys(videosByCategory).length > 0 && (
          <div className="results-section">
            {Object.entries(videosByCategory).map(
              ([categoryId, { videos }]) => (
                <div key={categoryId} className="category-section">
                  <div className="category-header">
                    <h3 className="category-title">
                      {getCategoryDisplayName(categoryId)}
                    </h3>
                    <button
                      onClick={() => fetchCategorySummary(categoryId)}
                      className="category-summary-button"
                      disabled={loadingCategorySummary === categoryId}
                    >
                      {loadingCategorySummary === categoryId
                        ? '요약 불러오는 중...'
                        : '이 카테고리 요약 보기'}
                    </button>
                  </div>

                  {categorySummaries[categoryId] && (
                    <div className="category-summary">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: categorySummaries[categoryId],
                        }}
                      />
                    </div>
                  )}

                  <div className="videos-grid">
                    {videos.map((video) => (
                      <div key={video.video_id} className="video-card">
                        <div className="video-content">
                          <img
                            src={video.thumbnails?.default?.url || ''}
                            alt="thumbnail"
                            className="video-thumbnail"
                          />
                          <div className="video-info">
                            <h3 className="video-title">{video.title}</h3>
                            <p className="channel-name">{video.channel}</p>
                            <div className="video-stats">
                              <span>
                                조회수: {video.view_count.toLocaleString()}
                              </span>
                              <span>
                                좋아요: {video.like_count.toLocaleString()}
                              </span>
                            </div>
                            <a
                              href={video.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="video-link"
                            >
                              YouTube에서 보기
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
    </div>
  );
}

