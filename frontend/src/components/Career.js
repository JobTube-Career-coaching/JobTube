import React, { useState, useEffect } from 'react';
import axios from 'axios';
import "../styles/Career.css"

function Career() {
    const [summaries, setSummaries] = useState({});
    const [activeMenu, setActiveMenu] = useState('search');
    const [favorites, setFavorites] = useState([]); // 전체 데이터를 저장
    const [filteredFavorites, setFilteredFavorites] = useState([]); // 필터링된 데이터 저장
    const [currentPage, setCurrentPage] = useState(1); // 현재 페이지
    const [loading, setLoading] = useState(false); // 전체 로딩 상태

    let allData = []; // 모든 데이터를 저장할 배열
    const itemsPerPage = 10; // 페이지당 표시할 항목 수


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
            const pageSize = 100;
            const maxPages = 1;

            let allData = [];

            const today = new Date();
            const endDate = new Date();
            endDate.setMonth(endDate.getMonth() - 12);

            const formattedStartDate = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
            const formattedEndDate = `${today.getFullYear()}-${String(today.getMonth() + 4).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            console.log(`Fetching data for range: ${formattedStartDate} ~ ${formattedEndDate}`);

            for (let pageNo = 1; pageNo <= maxPages; pageNo++) {
                try {
                    const response = await axios.get('http://apis.data.go.kr/1051000/recruitment/list', {
                        params: {
                            serviceKey: 'OU7Aa5bKI3fElL2xe6eU+Z9WCdjEtS+8FU0jVhHlJmWNn7wg7lCcgLRkBY5IVqj4jm7tJN1EpaOyeGd+McrXog==',
                            pbancBgngYmd: formattedStartDate,
                            pbancEndYmd: formattedEndDate,
                            numOfRows: pageSize,
                            pageNo: pageNo,
                        },
                    });

                    const data = response.data.result || [];

                    if (data.length === 0) {
                        console.log(`[API LIMIT] No more data available at page ${pageNo}, stopping requests.`);
                        break;
                    }

                    allData = Array.from(new Set([...allData, ...data].map(JSON.stringify))).map(JSON.parse);
                    console.log(`Fetched ${data.length} records from page ${pageNo}, total: ${allData.length}`);
                    console.log('API Response:', response.data);
                } catch (error) {
                    console.error(`Error fetching data at page ${pageNo}:`, error);
                    break;
                }
            }

            setFavorites(allData);
            setFilteredFavorites(allData);

            // 00:00 또는 12:00에만 MongoDB 저장
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            if ((currentHour === 0 || currentHour === 12) && currentMinute === 0) {
                await axios.post('http://localhost:5000/api/local', allData);
                console.log('Data saved to MongoDB at', now.toISOString());
            } else {
                console.log(`Skipping MongoDB save (Current Time: ${currentHour}:${currentMinute})`);
            }

            console.log('All favorites fetched successfully:', allData.length);
        } catch (error) {
            console.error('Error in fetchFavorites:', error);
        }
    };

    // MongoDB에서 `fetchFavorites`의 pageSize * maxPages 만큼의 최신 데이터만 불러오기
    const fetchSavedData = async () => {
        try {
            console.log('Fetching saved data from MongoDB...');
            const pageSize = 100; // fetchFavorites에서 설정한 값과 동일하게 유지
            const maxPages = 1;
            const limit = pageSize * maxPages; // 가져올 데이터 개수 설정

            const response = await axios.get(`http://localhost:5000/api/local?limit=${limit}`);
            console.log(`Fetched latest ${limit} records:`, response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching saved data:', error);
            return [];
        }
    };

    useEffect(() => {
        fetchFavorites();
        fetchSavedData();
    }, []);


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

        <div className="favorites">
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
                                    <th>지역</th>
                                    <th>기한</th>
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
                                        <td>
                                            {item.pbancBgngYmd
                                                ? `${item.pbancBgngYmd.slice(0, 4)}.${item.pbancBgngYmd.slice(4, 6)}.${item.pbancBgngYmd.slice(6, 8)}`
                                                : '정보 없음'} ~
                                            {item.pbancEndYmd
                                                ? `${item.pbancEndYmd.slice(0, 4)}.${item.pbancEndYmd.slice(4, 6)}.${item.pbancEndYmd.slice(6, 8)}`
                                                : '정보 없음'}
                                        </td>
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


    );

}

export default Career;