import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Building2, Calendar, GraduationCap, MapPinned } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import '../styles/JobSlider.css';

const JobSlider = ({ jobListings }) => {
  const location = useLocation();
  const [currentPage, setCurrentPage] = useState({
    worknet: 1,
    saramin: 1
  });
  
  const [currentPageGroup, setCurrentPageGroup] = useState({
    worknet: 0,
    saramin: 0
  });
  
  const worknetJobs = jobListings.filter(job => job.source === 'worknet');
  const saraminJobs = jobListings.filter(job => job.source === 'saramin');
  
  const ITEMS_PER_PAGE = 6;
  const PAGES_PER_GROUP = 10;

  // Reset pagination when location changes
  useEffect(() => {
    setCurrentPage({
      worknet: 1,
      saramin: 1
    });
    setCurrentPageGroup({
      worknet: 0,
      saramin: 0
    });
  }, [location.pathname]);

  const JobCard = ({ job }) => {
    const getDataLines = (data, index) => {
      if (!data || !data[index]) return ["N/A"];
      return data[index].split('\n');
    };
  
    const companyLines = getDataLines(job.data, 0);
    const positionLines = getDataLines(job.data, 1);
    const workConditionLines = getDataLines(job.data, 2);   

    const getDdayBadgeStyle = (dday) => {
      if (!dday) return '';
      const days = parseInt(dday.replace('D-', ''));
      if (days < 0) return 'expired';
      if (days <= 3) return 'urgent';
      return '';
    };

    return (
      <div className="job-card">
        {job.image && (
          <img src={job.image} alt="Job" className="job-image" style={{ position: 'absolute', top: '10px', right: '10px', width: '50px', height: '50px' }} />
        )}
        <div className="job-header">
          <h3 className="job-company">{companyLines[0]}</h3>
          {companyLines[1] && (
            <span className="job-title">
              {companyLines[1]}
            </span>
          )}
        </div>
        
        <div className="job-title-section">
          <h2 className="job-department-badge">{positionLines[0]}</h2>
          <span className={`d-day-badge ${getDdayBadgeStyle(workConditionLines[0])}`}>
            {workConditionLines[0]}
          </span>
        </div>
  
        <div className="job-details">
          <div className="job-detail-item">
            <GraduationCap className="job-icon" size={16} />
            <span>{positionLines[1]} | {positionLines[2]} </span>
          </div>
          {job.location && (
            <div className="job-detail-item">
              <MapPinned className="job-icon" size={16} />
              <span>{job.location}</span>
            </div>
          )}
          <div className="job-detail-item">
            <Calendar className="job-icon" size={16} />
            <span>{workConditionLines[2]} ~ {workConditionLines[1]}</span>
          </div>
        </div>
              
        <a 
          href={job.second_link}
          target="_blank"
          rel="noopener noreferrer"
          className="job-link"
        >
          상세 보기
        </a>
      </div>
    );
  };

  const Pagination = ({ totalItems, currentPage, source, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const currentGroup = currentPageGroup[source];
    
    const startPage = currentGroup * PAGES_PER_GROUP + 1;
    const endPage = Math.min(startPage + PAGES_PER_GROUP - 1, totalPages);
    
    const handleNextGroup = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (startPage + PAGES_PER_GROUP <= totalPages) {
        setCurrentPageGroup(prev => ({
          ...prev,
          [source]: prev[source] + 1
        }));
        onPageChange(startPage + PAGES_PER_GROUP);
      }
    };

    const handlePrevGroup = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (currentGroup > 0) {
        setCurrentPageGroup(prev => ({
          ...prev,
          [source]: prev[source] - 1
        }));
        onPageChange(Math.max(startPage - PAGES_PER_GROUP, 1));
      }
    };

    const handlePageClick = (e, pageNumber) => {
      e.preventDefault();
      e.stopPropagation();
      onPageChange(pageNumber);
    };
    
    return (
      <div className="pagination">
        {currentGroup > 0 && (
          <button
            type="button"
            className="page-button nav-button"
            onClick={handlePrevGroup}
            aria-label="이전 페이지 그룹"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        
        {[...Array(endPage - startPage + 1)].map((_, index) => {
          const pageNumber = startPage + index;
          return (
            <button
              key={pageNumber}
              type="button"
              className={`page-button ${currentPage === pageNumber ? 'active' : ''}`}
              onClick={(e) => handlePageClick(e, pageNumber)}
            >
              {pageNumber}
            </button>
          );
        })}
        
        {endPage < totalPages && (
          <button
            type="button"
            className="page-button nav-button"
            onClick={handleNextGroup}
            aria-label="다음 페이지 그룹"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    );
  };

  const JobSection = ({ title, jobs, source }) => {
    const startIndex = (currentPage[source] - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const currentJobs = jobs.slice(startIndex, endIndex);

    const handlePageChange = (page) => {
      setCurrentPage(prev => ({
        ...prev,
        [source]: page
      }));
    };

    return (
      <div className="jobs-section">
        <div className="jobs-header">
          <h3 className="jobs-source-title">
            {title} ({jobs.length}개)
          </h3>
        </div>
        
        <div className="jobs-grid">
          {currentJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>

        <Pagination
          totalItems={jobs.length}
          currentPage={currentPage[source]}
          source={source}
          onPageChange={handlePageChange}
        />
      </div>
    );
  };

  return (
    <div className="results-section">
      <h2 className="section-title">취업 공고</h2>
      {worknetJobs.length > 0 && (
        <JobSection 
          title="워크넷 채용정보" 
          jobs={worknetJobs} 
          source="worknet" 
        />
      )}
      {saraminJobs.length > 0 && (
        <JobSection 
          title="사람인 채용정보" 
          jobs={saraminJobs} 
          source="saramin" 
        />
      )}
    </div>
  );
};

export default JobSlider;