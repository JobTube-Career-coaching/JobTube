import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import "../styles/SeniorResultsPage.css";

const calculateDday = (deadline) => {
  const today = new Date();
  const targetDate = new Date(deadline);
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // 날짜 차이 계산
  return diffDays;
};

function DisabledResultsPage() {
  const { categoryId } = useParams();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryName = queryParams.get('name'); // URL에 전달된 category.name

  const [crawlData, setCrawlData] = useState([]);
  const [jobData, setJobData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('최신 교육 정보를 불러오는 중...');
  const [currentPage, setCurrentPage] = useState(1); // 현재 페이지 상태
  const itemsPerPage = 30; // 페이지 당 항목 수

  // 데이터 가져오기 함수
  const fetchCrawlData = async () => {
    try {
      const response = await axios.get('http://localhost:8000/crawl-data-disabled');
      if (response.data && Array.isArray(response.data.data)) {
        setCrawlData(response.data.data);
      } else {
        setCrawlData([]);
        console.error('크롤링 데이터가 올바른 형식이 아닙니다:', response.data);
      }
    } catch (error) {
      console.error('크롤링 데이터 가져오기 실패:', error);
      setCrawlData([]);
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  // 페이지네이션을 위한 데이터 추출
  const getPaginatedData = (data) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex); // 데이터를 페이지 크기만큼 잘라서 반환
  };

  const fetchJobData = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/jobs_disabled?id=${categoryId}&keyword=${encodeURIComponent(categoryName)}`);
      if (response.data && response.data.jobs) {
        setJobData(response.data.jobs);
      } else {
        setJobData([]);
        console.error('직무 데이터 형식 오류:', response.data);
      }
    } catch (error) {
      console.error('직무 데이터 가져오기 실패:', error);
      setJobData([]);
    } finally {
      setIsLoading(false);
      setProgress(100);
    }
  };

  useEffect(() => {
    if (categoryName) {
      fetchJobData();
    } else {
      axios.post(`http://localhost:8000/start-crawling-disabled-dynamic?id=${categoryId}`)
        .then(() => {
          const interval = setInterval(() => {
            axios.get("http://localhost:8000/crawl-progress-disabled")
              .then(res => {
                if (res.data) {
                  setProgress(res.data.progress || 0);
                  setStatus(res.data.status || '');
                  if (res.data.completed) {
                    clearInterval(interval);
                    fetchCrawlData();
                  }
                }
              })
              .catch(err => {
                console.error("진행 상황 가져오기 실패:", err);
              });
          }, 2000);
        })
        .catch(err => {
          console.error("동적 크롤링 시작 실패:", err);
          setIsLoading(false);
        });
    }
  }, [categoryId, categoryName]);

  // 페이지 이동 함수
  const nextPage = () => {
    if ((currentPage * itemsPerPage) < jobData.length) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // JobListing 컴포넌트 (직무 공고 항목을 출력)
  const JobListing = ({ company, title, location, salary, deadline, link }) => {
    const dDay = calculateDday(deadline);
    const dDayText = dDay < 0 ? '마감' : `D-${dDay < 10 ? `0${dDay}` : dDay}`;

    return (
      <div className="job-listing">
        <div className="company-name">{company}</div>
        <div className="job-title">{title}</div>
        <div className="location">{location}</div>
        <div className="salary">{salary}만원</div>
        <div className="deadline">
          <div className="d-day">{dDayText}</div> {/* D-Day 박스 */}
          {deadline}
        </div>
        <a href={link} target="_blank" rel="noopener noreferrer">
          <button className="details-btn">상세 보기</button>
        </a>
      </div>
    );
  };

  return (
    <div className="senior-container">
      <h1 className="senior-title">
        {categoryName ? `${categoryName} 관련 직무 검색 결과` : '직무 검색 결과'}
      </h1>
      {isLoading ? (
  	  <div className="loading-container">
            <div className="loader"></div>
            <p className="loading-text">검색 중...</p>
          </div>

  
      ) : (
        <div className="senior-data-grid">
          {categoryName ? (
            jobData && jobData.length > 0 ? (
              getPaginatedData(jobData).map((job, idx) => (
                <div key={idx} className="job-listing-container">
                  {job.data.map((item, index) => (
                    <JobListing
                      key={index}
                      company={item.company}
                      title={item.title || '제목 없음'}
                      location={job.location}
                      salary={item.salary}
                      deadline={item.deadline}
                      link={job.second_link}
                    />
                  ))}
                </div>
              ))
            ) : (
              <p>데이터가 없습니다.</p>
            )
          ) : (
            crawlData && crawlData.length > 0 ? (
              getPaginatedData(crawlData).map((job, idx) => (
                <div key={idx} className="job-listing-container">
                  {job.data.map((item, index) => (
                    <JobListing
                      key={index}
                      company={item.company}
                      title={item.title || '제목 없음'}
                      location={job.location}
                      salary={item.salary}
                      deadline={item.deadline}
                      link={job.second_link}
                    />
                  ))}
                </div>
              ))
            ) : (
              <p>데이터가 없습니다.</p>
            )
          )}
        </div>
      )}

      {/* 페이지네이션 버튼 */}
      <div className="pagination">
        <button onClick={prevPage} disabled={currentPage === 1}>
          이전
        </button>
        <span>페이지 {currentPage}</span>
        <button onClick={nextPage} disabled={(currentPage * itemsPerPage) >= jobData.length}>
          다음
        </button>
      </div>
    </div>
  );
}

export default DisabledResultsPage;
