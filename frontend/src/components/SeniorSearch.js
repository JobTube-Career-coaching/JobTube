
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/YouTubeSearch.css';
import JobSliderSenior from './JobSliderSenior';
import { Search } from 'lucide-react';
import { useLocation } from 'react-router-dom';

function SeniorSearch() {
  const [keyword, setKeyword] = useState('');
  const [jobListings, setJobListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modestr, setModeStr] = useState('');
  const [mode2, SetMode2] = useState("default");
  const [videosByCategory, setVideosByCategory] = useState({});
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [videoError, setVideoError] = useState('');
  const [categorySummaries, setCategorySummaries] = useState({});
  const [loadingCategorySummary, setLoadingCategorySummary] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode_ = params.get('from_mode');
    if (mode_ === '1') {
      setModeStr('[고령자 모드]');
      SetMode2("senior");
    } else if (mode_ === '2') {
      setModeStr('[장애인 모드]');
      SetMode2("disabled");
    } else {
      setModeStr('[일반 모드]');
    }
  }, [location.search]);

  const getCategoryDisplayName = (categoryId) => `카테고리 ${categoryId}`;

  const fetchCategorySummary = async (categoryId) => {
    setLoadingCategorySummary(categoryId);
    try {
      const res = await axios.get(`http://localhost:8000/summary?categoryId=${categoryId}`);
      setCategorySummaries(prev => ({ ...prev, [categoryId]: res.data.summary }));
    } catch (err) {
      console.error("요약 실패:", err);
    } finally {
      setLoadingCategorySummary(null);
    }
  };

  const fetchVideos = async (keyword) => {
    setLoadingVideos(true);
    setVideoError('');
    try {
      const res = await axios.get(`http://localhost:8000/${mode2}-category-search?keyword=${encodeURIComponent(keyword)}`);
      setVideosByCategory(res.data || {});
    } catch (err) {
      setVideoError('유튜브 검색 실패!');
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleSearch = async (inputKeyword) => {
    const searchKeyword = inputKeyword || keyword;
    if (!searchKeyword.trim()) {
      setError('검색어를 입력해주세요.');
      return;
    }

    setError('');
    setLoading(true);
    setJobListings([]);
    setVideosByCategory({});
    fetchVideos(searchKeyword);

    const url = `http://localhost:8000/start-crawling-${mode2}-dynamic?id=-1&keyword=${encodeURIComponent(searchKeyword)}`;

    try {
      const startRes = await axios.post(url);
      const taskId = startRes.data?.task_id;
      if (!taskId) throw new Error("task_id를 받지 못했어요!");

      const maxTries = 100;
      let tries = 0;
      let result = [];

      while (tries < maxTries) {
        const res = await axios.get(`http://localhost:8000/crawl-progress-${mode2}?task_id=${taskId}`);
        const dataRes = await axios.get(`http://localhost:8000/crawl-data-${mode2}?task_id=${taskId}`);
        let rawData = dataRes?.data?.data || [];

        if (!Array.isArray(rawData)) {
          const firstKey = Object.keys(rawData)[0];
          if (firstKey && Array.isArray(rawData[firstKey]?.data)) {
            rawData = rawData[firstKey].data;
          } else {
            rawData = [];
          }
        }

        if (rawData.length > 0) {
          result = rawData;
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));
        tries++;
      }

      if (result.length > 0) {
        setJobListings(result);
      } else {
        setError('관련된 직무가 없습니다.');
      }

    } catch (error) {
      console.error('Search error:', error);
      setError('서버에 연결할 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="search-container">
      <div className="search-wrapper">
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder={`직무 키워드를 입력하세요 ${modestr}`}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="search-input"
              disabled={loading}
            />
            <button
              onClick={() => handleSearch()}
              className="search-button"
              disabled={loading}
            >
              <Search size={24} />
            </button>
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>
      </div>

      {loadingVideos && (
        <div className="loading-container">
          <div className="loader"></div>
          <p className="loading-text">유튜브 동영상 검색 중...</p>
        </div>
      )}

      {!loadingVideos && videoError && (
        <div className="error-container">
          <p className="error-message">{videoError}</p>
        </div>
      )}

      {!loadingVideos && !videoError && Object.keys(videosByCategory).length > 0 && (
        <div className="results-section">
          {Object.keys(videosByCategory).map((categoryId) => (
            <div key={categoryId} className="category-section">
              <div className="category-header">
                <h3 className="category-title">{getCategoryDisplayName(categoryId)}</h3>
                <button
                  onClick={() => fetchCategorySummary(categoryId)}
                  className="category-summary-button"
                  disabled={loadingCategorySummary === categoryId}
                >
                  {loadingCategorySummary === categoryId ? '요약 불러오는 중...' : '이 카테고리 요약 보기'}
                </button>
              </div>

              {categorySummaries[categoryId] && (
                <div className="category-summary">
                  <div dangerouslySetInnerHTML={{ __html: categorySummaries[categoryId] }} />
                </div>
              )}

              <div className="videos-grid">
                {videosByCategory[categoryId].videos.map((video) => (
                  <div key={video.video_id} className="video-card">
                    <div className="video-content">
                      <img
                        src={video.thumbnails?.default?.url || 'placeholder-image.jpg'}
                        alt="thumbnail"
                        className="video-thumbnail"
                      />
                      <div className="video-info">
                        <h3 className="video-title">{video.title}</h3>
                        <p className="channel-name">{video.channel}</p>
                        <div className="video-stats">
                          <span>조회수: {video.view_count.toLocaleString()}</span>
                          <span>좋아요: {video.like_count.toLocaleString()}</span>
                        </div>
                        <div className="video-actions">
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
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="loading-container">
          <div className="loader"></div>
          <p className="loading-text">검색 중...</p>
        </div>
      )}

      {!loading && jobListings.length > 0 && (
        <JobSliderSenior Name={modestr} jobListings={jobListings} />
      )}

      {!loading && !error && jobListings.length === 0 && keyword && (
        <div className="no-results">
          <p>검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}

export default SeniorSearch;
