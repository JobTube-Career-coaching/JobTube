import React, { useState } from "react";
import "../styles/JobSlider.css";

const ITEMS_PER_PAGE = 30;

const JobSliderSenior = ({ Name, jobListings }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(jobListings.length / ITEMS_PER_PAGE);

  const paginatedJobs = jobListings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePrev = () => {
    if (currentPage > 1) setCurrentPage((prev) => prev - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage((prev) => prev + 1);
  };

  const calculateDDay = (deadline) => {
    if (!deadline) return null;
    const today = new Date();
    const endDate = new Date(deadline);
    const diff = Math.floor((endDate - today) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff : null;
  };

  return (
    <div className="jobs-section">
      <h2 className="jobs-source-title">{Name} 채용 공고 목록</h2>

      <div className="jobs-grid">
        {paginatedJobs.map((job, idx) => {
          const jobItem = Array.isArray(job.data) ? job.data[0] : job.data;
          if (!jobItem) return null;

          const dDay = calculateDDay(jobItem.deadline);

          return (
            <div className="job-card" key={idx}>
              <div className="job-header">
                <p className="job-company">{jobItem.company || jobItem.institution || "회사 미상"}</p>
                <h3 className="job-title">{jobItem.title || job.title || "제목 없음"}</h3>
                <p className="job-detail-item">📍 {job.location || "지역 정보 없음"}</p>
                <p className="job-detail-item">{jobItem.salary ? `${jobItem.salary}만원` : "급여 미상"}</p>
                <p className="job-detail-item">{jobItem.deadline || "마감일 미정"}</p>
                <p className="job-detail-item">
                  주 {jobItem.work_conditions || "-"}일 | {jobItem.work_hours || "-"}시간
                </p>
              </div>

              {dDay !== null && (
                <div className={`d-day-badge ${dDay <= 3 ? "urgent" : ""}`}>
                  D-{dDay}
                </div>
              )}

              <a
                href={job.second_link || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="job-link"
              >
                상세 보기
              </a>
            </div>
          );
        })}
      </div>

      <div className="pagination">
        <button
          className="page-button nav-button"
          onClick={handlePrev}
          disabled={currentPage === 1}
        >
          &lt; 이전
        </button>

        <span style={{ margin: "0 1rem", fontWeight: "600" }}>
          페이지 {currentPage} / {totalPages}
        </span>

        <button
          className="page-button nav-button"
          onClick={handleNext}
          disabled={currentPage === totalPages}
        >
          다음 &gt;
        </button>
      </div>
    </div>
  );
};

export default JobSliderSenior;