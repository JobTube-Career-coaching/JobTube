import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import SummaryComponent from './components/SummaryComponent';

function App() {
    const [keyword, setKeyword] = useState('');
    const [videos, setVideos] = useState([]);
    const [summaries, setSummaries] = useState({});
    const [pdfSummary, setPdfSummary] = useState('');
    const [activeMenu, setActiveMenu] = useState('search');
    const [favorites, setFavorites] = useState([]); // 전체 데이터를 저장
    const [filteredFavorites, setFilteredFavorites] = useState([]); // 필터링된 데이터 저장
    const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
    const [loading, setLoading] = useState(false); // 전체 로딩 상태
    const [loadingSummary, setLoadingSummary] = useState(null); // 각 비디오에 대한 요약 로딩 상태

    let allData = []; // 모든 데이터를 저장할 배열
    const itemsPerPage = 10; // 페이지당 표시할 항목 수
  
    
    // 검색된 비디오
    const searchVideos = async () => {
      // 검색 시작 시 로딩 상태 true로 설정
      setLoading(true);
      // 이전 검색 결과 초기화
      setVideos([]);
      setSummaries({});
  
      try {
        const response = await axios.get(`http://localhost:8000/search?keyword=${keyword}`);
        setVideos(response.data); // 새로운 비디오 리스트 설정
      } catch (error) {
        console.error('Error searching videos:', error);
        setVideos([]); // 에러 시 빈 비디오 리스트 설정
      } finally {
        setLoading(false); // 데이터 로드 후 로딩 상태 false로 설정
      }
    };
  
    // 비디오 요약 가져오기
    const fetchSummary = async (videoId) => {
      setLoadingSummary(videoId); // 특정 비디오 요약 로딩 상태 true로 설정
      try {
        const response = await axios.get(`http://localhost:8000/transcript/${videoId}`);
        setSummaries((prevSummaries) => ({
          ...prevSummaries,
          [videoId]: response.data.transcript,
        }));
      } catch (error) {
        console.error('Error fetching summary:', error);
        if (error.response && error.response.status === 404) {
          setSummaries((prevSummaries) => ({
            ...prevSummaries,
            [videoId]: '요약 정보를 찾을 수 없습니다.',
          }));
        } else {
          setSummaries((prevSummaries) => ({
            ...prevSummaries,
            [videoId]: '알 수 없는 오류가 발생했습니다.',
          }));
        }
      } finally {
        setLoadingSummary(null); // 요약 로딩 완료 후 로딩 상태 false로 설정
      }
    };
  
    
  

    const uploadPdf = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await axios.post('http://localhost:8000/process-pdf', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            if (response.data.summary) {
                setPdfSummary(response.data.summary);
            } else {
                setPdfSummary('PDF 처리에 실패했습니다.');
            }
        } catch (error) {
            console.error('Error processing PDF:', error);
            setPdfSummary('PDF 처리 중 오류가 발생했습니다.');
        }
    };

    const [filters, setFilters] = useState({
        recrutPbancTtl: '',
        recrutSe: '전체보기',               // 공고(채용)구분
        workRgnLst: '전체보기',             // 근무지역목록
        acbgCondLst: '전체보기',            // 학력조건목록
        hireTypeLst: '전체보기',            // 고용유형목록
        ncsCdLst: '전체보기',               // NCS코드목록
    });


    const fetchFavorites = async () => {
        try {
            console.log('Fetching favorites...');
            const pageSize = 50; // 한 번에 가져올 데이터 수 (API 문서에 따라 변경)

            let currentDate = new Date(); // 현재 날짜
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1); // 1달 후 날짜 계산


            while (currentDate <= endDate) {
                const formattedDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                console.log(`Fetching data for date: ${formattedDate}`);

                try {
                    const response = await axios.get('http://apis.data.go.kr/1051000/recruitment/list', {
                        params: {
                            serviceKey: "secret",
                            pbancBgngYmd: formattedDate,
                            numOfRows: pageSize, // 페이지당 결과 수
                        },
                    });

                    const data = response.data.result || [];

                    // 중복 제거 후 누적
                    allData = [...allData, ...data]; // 데이터를 누적
                    allData = Array.from(new Set([...allData, ...data].map(JSON.stringify))).map(JSON.parse);
                    console.log('All favorites fetched successfully:', allData.length);
                    console.log('API Response:', response.data);
                } catch (error) {
                    console.error(`Error fetching data for ${formattedDate}:`, error);
                }

                // 현재 날짜를 하루 추가
                currentDate.setDate(currentDate.getDate() + 1);
            }

            setFavorites(allData);
            setFilteredFavorites(allData);


            console.log('All favorites fetched successfully:', allData.length);
        } catch (error) {
            console.error('Error in fetchFavorites:', error);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters({ ...filters, [key]: value });
    };

    const applyFilters = () => {
        let filtered = favorites;

        // 공고 제목 필터링
        if (filters.recrutPbancTtl) {
            filtered = filtered.filter(item =>
                item.recrutPbancTtl?.toLowerCase().includes(filters.recrutPbancTtl.toLowerCase())
            );
        }

        // 채용 구분 필터링
        if (filters.recrutSe !== '전체보기') {
            filtered = filtered.filter(item => item.recrutSe === filters.recrutSe);
        }

        // 근무 지역 필터링
        if (filters.workRgnLst !== '전체보기') {
            filtered = filtered.filter(item => item.workRgnLst === filters.workRgnLst);
        }

        // 학력 조건 필터링
        if (filters.acbgCondLst !== '전체보기') {
            filtered = filtered.filter(item => item.acbgCondLst === filters.acbgCondLst);
        }

        // 고용 유형 필터링
        if (filters.hireTypeLst !== '전체보기') {
            filtered = filtered.filter(item => item.hireTypeLst === filters.hireTypeLst);
        }

        // NCS 코드 필터링 (쉼표로 구분된 값 중 선택한 값이 포함되어 있는지 확인)
        if (filters.ncsCdLst !== '전체보기') {
            filtered = filtered.filter(item =>
                item.ncsCdLst?.split(',').includes(filters.ncsCdLst)
            );
        }

        setFilteredFavorites(filtered);
        setCurrentPage(1); // 필터 적용 시 첫 페이지로 초기화
    };



    const resetFilters = () => {
        setFilters({
            recrutPbancTtl: '',
            recrutSe: '전체보기',
            workRgnLst: '전체보기',
            acbgCondLst: '전체보기',
            hireTypeLst: '전체보기',
            ncsCdLst: '전체보기',
        });
        setFilteredFavorites(favorites); // 초기 데이터로 복원
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(filteredFavorites.length / itemsPerPage);

    const currentItems = filteredFavorites.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const clearSummary = (videoId) => {
        setSummaries((prevSummaries) => {
          const updatedSummaries = { ...prevSummaries };
          delete updatedSummaries[videoId];
          return updatedSummaries;
        });
      };

    return (
        <div className="App">
            <div className="sidebar">
                <h2>MENU</h2>
                <ul>
                    <li onClick={() => setActiveMenu('search')} className={activeMenu === 'search' ? 'active' : ''}>
                        YOUTUBE 요약
                    </li>
                    <li onClick={() => setActiveMenu('pdf')} className={activeMenu === 'pdf' ? 'active' : ''}>
                        문서 요약
                    </li>
                    <li onClick={() => setActiveMenu('favorites')} className={activeMenu === 'favorites' ? 'active' : ''}>
                        취업 공고
                    </li>
                </ul>
            </div>

            <div className="content">
                <header className="header">
                    <h1>JobTube</h1>
                </header>

                {activeMenu === 'search' && (
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
                )}

                    {activeMenu === 'search'&& loading ? (
                        <div className="loading-indicator">
                        <p>로딩 중...</p>
                        {/* 스피너 CSS로 추가 가능 */}
                        <div className="spinner"></div>
                        </div>
                    ) : activeMenu === 'search' && (
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
                                    <p>조회수: {video.view_count}</p>
                                    <p>좋아요 수: {video.like_count}</p>
                                    <p>태그: {video.tags.join(', ')}</p> {/* 태그 배열 출력 */}
                                    <a
                                    href={video.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="video-url"
                                    >
                                    YouTube에서 보기
                                    </a>
                                </div>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    className="summary-button"
                                    onClick={() => fetchSummary(video.video_id)}
                                    style={{ fontSize: '12px', padding: '5px 8px' }}
                                >
                                    요약 보기
                                </button>
                                <button
                                    className="close-summary-button"
                                    onClick={() => clearSummary(video.video_id)}
                                    style={{ fontSize: '12px', padding: '5px 8px' }}
                                >
                                    닫기
                                </button>
                                </div>
                                <div className="video-summary">
                                {loadingSummary === video.video_id ? (
                                    <div className="loading-indicator">
                                    <p>로딩 중...</p>
                                    <div className="spinner"></div>
                                    </div>
                                ) : (
                                    <SummaryComponent 
                                    summary={summaries[video.video_id] || ''} 
                            
                                    />
                
                                )}
                                </div>
                            </div>
                            ))
                        ) : (
                            <p>검색 결과가 없습니다.</p>
                        )}

                    </div>
                    )}
                {activeMenu === 'pdf' && (
                    <div className="pdf-section">
                        <h2>PDF 문서 요약</h2>
                        <label htmlFor="pdf-upload" className="pdf-upload-label">
                            PDF 업로드
                        </label>
                        <input
                            id="pdf-upload"
                            type="file"
                            accept="application/pdf"
                            style={{ display: 'none' }}
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    uploadPdf(file);
                                }
                            }}
                        />
                        {pdfSummary && (
                            <div className="pdf-summary">
                                <h3>요약 결과:</h3>
                                <p>{pdfSummary}</p>
                            </div>
                        )}
                    </div>
                )}


                {activeMenu === 'favorites' && (
                    <div>
                        <div className="filter-section">
                            <h2>[ 검색 및 필터링 ]</h2>
                            <div className="filter-controls">
                                <div>
                                    <label>공고 제목</label>
                                    <input
                                        type="text"
                                        placeholder="공고 제목을 입력해주세요."
                                        value={filters.recrutPbancTtl}
                                        onChange={(e) => handleFilterChange('recrutPbancTtl', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label>채용 구분</label>
                                    <select
                                        value={filters.recrutSe}
                                        onChange={(e) => handleFilterChange('recrutSe', e.target.value)}
                                    >
                                        <option value="전체보기">전체보기</option>
                                        <option value="R2010">신입</option>
                                        <option value="R2020">경력</option>
                                        <option value="R2030">신입+경력</option>
                                        <option value="R2040">외국인 전형</option>
                                    </select>
                                </div>
                                <div>
                                    <label>근무지</label>
                                    <select
                                        value={filters.workRgnLst}
                                        onChange={(e) => handleFilterChange('workRgnLst', e.target.value)}
                                    >
                                        <option value="전체보기">전체보기</option>
                                        <option value="R3010">서울</option>
                                        <option value="R3011">인천</option>
                                        <option value="R3012">대전</option>
                                        <option value="R3013">대구</option>
                                        <option value="R3014">부산</option>
                                        <option value="R3015">광주</option>
                                        <option value="R3016">울산</option>
                                        <option value="R3017">경기</option>
                                        <option value="R3018">강원</option>
                                        <option value="R3019">충남</option>
                                        <option value="R3020">충북</option>
                                        <option value="R3021">경북</option>
                                        <option value="R3022">경남</option>
                                        <option value="R3023">전남</option>
                                        <option value="R3024">전북</option>
                                        <option value="R3025">제주</option>
                                        <option value="R3026">세종</option>
                                        <option value="R3030">해외</option>
                                    </select>
                                </div>
                                <div>
                                    <label>학력</label>
                                    <select
                                        value={filters.acbgCondLst}
                                        onChange={(e) => handleFilterChange('acbgCondLst', e.target.value)}
                                    >
                                        <option value="전체보기">전체보기</option>
                                        <option value="R7010">학력무관</option>
                                        <option value="R7020">중졸이하</option>
                                        <option value="R7030">고졸</option>
                                        <option value="R7040">대졸(2~3년)</option>
                                        <option value="R7050">대졸(4년)</option>
                                        <option value="R7060">석사</option>
                                        <option value="R7070">박사</option>
                                    </select>
                                </div>
                                <div>
                                    <label>고용형태</label>
                                    <select
                                        value={filters.hireTypeLst}
                                        onChange={(e) => handleFilterChange('hireTypeLst', e.target.value)}
                                    >
                                        <option value="전체보기">전체보기</option>
                                        <option value="R1010">정규직</option>
                                        <option value="R1020">계약직</option>
                                        <option value="R1030">무기계약직</option>
                                        <option value="R1040">비정규직</option>
                                        <option value="R1050">청년인턴</option>
                                        <option value="R1060">청년인턴(체험형)</option>
                                        <option value="R1070">청년인턴(채용형)</option>
                                    </select>
                                </div>
                                <div>
                                    <label>NCS 코드</label>
                                    <select
                                        value={filters.ncsCdLst}
                                        onChange={(e) => handleFilterChange('ncsCdLst', e.target.value)}
                                    >
                                        <option value="전체보기">전체보기</option>
                                        <option value="R600001">사업관리</option>
                                        <option value="R600002">경영.회계.사무</option>
                                        <option value="R600003">금융.보험</option>
                                        <option value="R600004">교육.자연.사회과학</option>
                                        <option value="R600005">법률.경찰.소방.교도.국방</option>
                                        <option value="R600006">보건.의료</option>
                                        <option value="R600007">사회복지.종교</option>
                                        <option value="R600008">문화.예술.디자인.방송</option>
                                        <option value="R600009">운전.운송</option>
                                        <option value="R600010">영업판매</option>
                                        <option value="R600011">경비.청소</option>
                                        <option value="R600012">이용.숙박.여행.오락.스포츠</option>
                                        <option value="R600013">음식서비스</option>
                                        <option value="R600014">건설</option>
                                        <option value="R600015">기계</option>
                                        <option value="R600016">재료</option>
                                        <option value="R600017">화학</option>
                                        <option value="R600018">섬유.의복</option>
                                        <option value="R600019">전기.전자</option>
                                        <option value="R600020">정보통신</option>
                                        <option value="R600021">식품가공</option>
                                        <option value="R600022">인쇄.목재.가구.공예</option>
                                        <option value="R600023">환경.에너지.안전</option>
                                        <option value="R600024">농림어업</option>
                                        <option value="R600025">연구</option>
                                    </select>
                                </div>
                            </div>
                            <div className="filter-buttons">
                                <button onClick={applyFilters}>필터 적용</button>
                                <button onClick={resetFilters}>필터 초기화</button>
                            </div>
                        </div>

                        <div className="favorites-section">
                            <h2>( 현재 모집 중인 ) 취업 공고</h2>
                            {filteredFavorites.length > 0 ? (
                                <div>
                                    <table className="favorites-table">
                                        <thead>
                                            <tr>
                                                <th>공시기관</th>
                                                <th>공고</th>
                                                <th>채용구분</th>
                                                <th>고용형태</th>
                                                <th>근무지</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {currentItems.map((item, index) => (
                                                <tr key={index}>
                                                    <td>{item.instNm || '정보 없음'}</td>
                                                    <td>
                                                        {item.srcUrl ? (
                                                            <a
                                                                href={item.srcUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                style={{ textDecoration: 'none', color: '#007bff' }}
                                                            >
                                                                {item.recrutPbancTtl || '정보 없음'}
                                                            </a>
                                                        ) : (
                                                            item.recrutPbancTtl || '정보 없음'
                                                        )}
                                                    </td>
                                                    <td>{item.recrutSeNm || '정보 없음'}</td>
                                                    <td>{item.hireTypeNmLst || '정보 없음'}</td>
                                                    <td>{item.workRgnNmLst || '정보 없음'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="pagination">
                                        <button onClick={handlePrevPage} disabled={currentPage === 1}>
                                            이전
                                        </button>
                                        <span>
                                            {currentPage} / {totalPages}
                                        </span>
                                        <button onClick={handleNextPage} disabled={currentPage === totalPages}>
                                            다음
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p>데이터를 불러오는 중이거나 공고가 없습니다.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
