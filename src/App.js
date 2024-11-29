import React, { useState } from 'react';
import axios from 'axios';
import './App.css'; // 스타일링 파일 추가

function App() {
  const [keyword, setKeyword] = useState('');
  const [videos, setVideos] = useState([]);
  const [summaries, setSummaries] = useState({}); // 각 영상별 요약 저장

  const searchVideos = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/search?keyword=${keyword}`);
      setVideos(response.data);
      setSummaries({}); // 검색 시 이전 요약 초기화
    } catch (error) {
      console.error('Error searching videos:', error);
      setVideos([]);
    }
  };

  const fetchSummary = async (videoId) => {
    try {
      const response = await axios.get(`http://localhost:8000/summary/${videoId}`);
      setSummaries((prevSummaries) => ({
        ...prevSummaries,
        [videoId]: response.data.summary,
      }));
    } catch (error) {
      console.error('Error fetching summary:', error);
      setSummaries((prevSummaries) => ({
        ...prevSummaries,
        [videoId]: '요약 정보를 찾을 수 없습니다.',
      }));
    }
  };

  return (
    <div className="App">
      <header className="header">
        <h1>JobTube</h1>
      </header>

      <div className="search-section">
        <input
          type="text"
          placeholder="키워드 입력"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="search-input"
        />
        <button onClick={searchVideos} className="search-button">검색</button>
      </div>

      <div className="video-list">
        {videos.length > 0 ? (
          videos.map((video) => (
            <div key={video.video_id} className="video-card">
              <div className="video-info">
                <img
                  src={video.thumbnails.default.url}
                  alt="thumbnail"
                  className="thumbnail"
                />
                <div className="video-details">
                  <h3>{video.title}</h3>
                  <p>{video.channel}</p>
                </div>
              </div>
              <button
                className="summary-button"
                onClick={() => fetchSummary(video.video_id)}
              >
                요약 보기
              </button>
              <div className="video-summary">
                {summaries[video.video_id] || '요약 정보가 없습니다.'}
              </div>
            </div>
          ))
        ) : (
          <p>검색 결과가 없습니다.</p>
        )}
      </div>
    </div>
  );
}

export default App;
