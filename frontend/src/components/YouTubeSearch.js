import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search } from 'lucide-react';
import '../styles/YouTubeSearch.css';
import JobSlider from '../components/JobSlider';

function YouTubeSearch() {
    const [keyword, setKeyword] = useState('');
    const [videosByCategory, setVideosByCategory] = useState({});
    const [categorySummaries, setCategorySummaries] = useState({});
    const [loadingVideos, setLoadingVideos] = useState(false);
    const [loadingJobs, setLoadingJobs] = useState(false);
    const [loadingCategorySummary, setLoadingCategorySummary] = useState(null);
    const [jobListings, setJobListings] = useState([]);
    const [error, setError] = useState('');
    const [videoError, setVideoError] = useState('');
    const [jobError, setJobError] = useState('');
    const [searchInitiated, setSearchInitiated] = useState(false);

    // Axios 기본 설정
    const BASE_URL = 'http://localhost:8000';

    const handleSearch = async () => {
        // 검색어 유효성 검사
        if (!keyword.trim()) {
            setError('검색어를 입력해주세요.');
            return;
        }

        // 상태 초기화
        setError('');
        setVideoError('');
        setJobError('');
        setSearchInitiated(true);
        setVideosByCategory({});
        setJobListings([]);
        setCategorySummaries({});
        
        // 유튜브 비디오 검색
        await fetchYouTubeVideos();
        
        // 채용정보 검색
        await fetchJobListings();
    };

    const fetchYouTubeVideos = async () => {
        setLoadingVideos(true);
        try {
            console.log('유튜브 검색 요청 시작');
            const response = await axios.get(
                `${BASE_URL}/search-categories?keyword=${encodeURIComponent(keyword)}`
            );
            
            console.log('유튜브 검색 응답 받음:', response.status);
            if (response && response.data) {
                setVideosByCategory(response.data);
                if (Object.keys(response.data).length === 0) {
                    setVideoError('유튜브 검색 결과가 없습니다.');
                }
            }
        } catch (error) {
            console.error('YouTube search error:', error);
            setVideoError('유튜브 검색 결과를 가져오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoadingVideos(false);
        }
    };

    const fetchJobListings = async () => {
        setLoadingJobs(true);
        try {
            console.log('채용 정보 검색 요청 시작');
            const response = await axios.get(
                `${BASE_URL}/jobs?keyword=${encodeURIComponent(keyword)}`
            );
            
            console.log('채용 정보 검색 응답 받음:', response.status);
            if (response && response.data && response.data.jobs) {
                setJobListings(response.data.jobs);
                if (response.data.jobs.length === 0) {
                    setJobError('채용 정보 검색 결과가 없습니다.');
                }
            }
        } catch (error) {
            console.error('Jobs search error:', error);
            setJobError('채용 정보를 가져오는 데 실패했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoadingJobs(false);
        }
    };

    // 검색 완료 후 결과가 없는 경우 에러 메시지 표시
    useEffect(() => {
        if (searchInitiated && !loadingVideos && !loadingJobs) {
            const hasVideos = Object.keys(videosByCategory).length > 0;
            const hasJobs = jobListings.length > 0;
            
            if (!hasVideos && !hasJobs && !videoError && !jobError) {
                setError('검색 결과가 없습니다.');
            }
        }
    }, [loadingVideos, loadingJobs, videosByCategory, jobListings, searchInitiated, videoError, jobError]);

    const fetchCategorySummary = async (categoryId) => {
        if (loadingCategorySummary) return;
        
        setLoadingCategorySummary(categoryId);
        try {
            // 해당 카테고리의 모든 영상 ID 수집
            const videoIds = videosByCategory[categoryId].videos.map(video => video.video_id);
            
            const response = await axios.post(`${BASE_URL}/compare-category`, {
                video_data_list: videoIds.map(videoId => ({
                    video_id: videoId,
                    keyword: keyword,
                    category: categoryId
                })),
                category_name: categoryId
            });
            
            setCategorySummaries(prev => ({
                ...prev,
                [categoryId]: response.data.comparison || '이 카테고리의 영상들에 대한 요약 정보를 찾을 수 없습니다.'
            }));
        } catch (error) {
            console.error('Category Summary error:', error);
            setCategorySummaries(prev => ({
                ...prev,
                [categoryId]: '카테고리 요약 정보를 가져오는 중 오류가 발생했습니다.'
            }));
        } finally {
            setLoadingCategorySummary(null);
        }
    };

    // 카테고리 이름을 사용자 친화적으로 표시
    const getCategoryDisplayName = (categoryId) => {
        const categoryMap = {
            "pros_cons": "장단점",
            "how_to": "준비방법",
            "review": "후기"
        };
        return categoryMap[categoryId] || categoryId;
    };

    return (
        <div className="search-container">
            <div className="search-wrapper">
                <div className="search-section">
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="검색어를 입력하세요"
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="search-input"
                            disabled={loadingVideos || loadingJobs}
                        />
                        <button
                            onClick={handleSearch}
                            className="search-button"
                            disabled={loadingVideos || loadingJobs}
                        >
                            <Search size={24} />
                        </button>
                    </div>
                    {error && <p className="error-message">{error}</p>}
                </div>

                <div className="results-container">
                    {/* 유튜브 영역 */}
                    <div className="youtube-results-section">
                        {/* 유튜브 로딩 표시 */}
                        {loadingVideos && (
                            <div className="loading-container">
                                <div className="loader"></div>
                                <p className="loading-text">유튜브 동영상 검색 중...</p>
                            </div>
                        )}

                        {/* 유튜브 에러 표시 */}
                        {!loadingVideos && videoError && (
                            <div className="error-container">
                                <p className="error-message">{videoError}</p>
                            </div>
                        )}

                        {/* 유튜브 결과 표시 */}
                        {!loadingVideos && !videoError && Object.keys(videosByCategory).length > 0 && (
                            <div className="results-section">                                
                                {Object.keys(videosByCategory).map((categoryId) => (
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
                    </div>

                    {/* 채용정보 영역 */}
                    <div className="jobs-results-section">
                        {/* 채용정보 로딩 표시 */}
                        {loadingJobs && (
                            <div className="loading-container">
                                <div className="loader"></div>
                                <p className="loading-text">채용 정보 검색 중...</p>
                            </div>
                        )}

                        {/* 채용정보 에러 표시 */}
                        {!loadingJobs && jobError && (
                            <div className="error-container">
                                <p className="error-message">{jobError}</p>
                            </div>
                        )}

                        {/* 채용정보 결과 표시 */}
                        {!loadingJobs && !jobError && jobListings.length > 0 && (
                            <JobSlider jobListings={jobListings} />
                        )}
                    </div>

                    {/* 검색 시작 전 상태 */}
                    {!searchInitiated && !error && (
                        <div className="no-results">
                            <p>검색어를 입력하고 검색 버튼을 클릭하거나 Enter를 눌러주세요.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default YouTubeSearch;