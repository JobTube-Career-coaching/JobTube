import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import "../styles/results.css";

function ResultsPage() {
  const { category } = useParams();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`http://localhost:8000/jobs?category=${category}`) // FastAPI 엔드포인트 호출
      .then((response) => {
        setJobs(response.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("데이터 가져오기 실패:", error);
        setLoading(false);
      });
  }, [category]);

  return (
    <div className="results-container">
      <h1 className="results-title">"{category}" 관련 직무 추천</h1>
      {loading ? (
        <p>데이터를 불러오는 중...</p>
      ) : jobs.length > 0 ? (
        <ul className="results-list">
          {jobs.map((job, index) => (
            <li key={index} className="results-item">
              <strong>{job.title}</strong>
              <p>{job.description}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p>관련 직무 정보를 찾을 수 없습니다.</p>
      )}
    </div>
  );
}

export default ResultsPage;