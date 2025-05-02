import React, { useState } from 'react';
import axios from 'axios';
import "../styles/mypage.css"



const MyPage = () => {
    // 즐겨찾기 예시 데이터
    const [bookmarks] = useState([
        { id: 1, title: "취업 성공 전략 가이드", category: "취업guides" },
        { id: 2, title: "직무별 자기소개서 작성법", category: "이력서" },
        { id: 3, title: "산업별 평균 연봉 정보", category: "정보" }
    ]);
    
    // 최근 본 콘텐츠 예시 데이터
    const [recentViews] = useState([
        { id: 1, title: "IT 업계 취업 트렌드", date: "2025-01-30" },
        { id: 2, title: "경력 개발 로드맵", date: "2025-01-29" }
    ]);
    
    return (
        <div className="mypage-container">
        {/* 환영 메시지 및 플랫폼 설명 */}
        <div className="welcome-section">
            <div className="welcome-content">
            <div className="welcome-header">
                <div className="user-icon">👤</div>
                <div>
                <h2>마이페이지</h2>
                <p>미래 설계 플랫폼에 오신 것을 환영합니다</p>
                </div>
            </div>
            <p className="welcome-description">
                맞춤형 경력 개발과 미래 설계를 위한 통합 플랫폼입니다. 
                개인화된 추천 서비스와 다양한 리소스를 활용하여 성공적인 커리어를 준비하세요.
            </p>
            </div>
        </div>
    
        <div className="grid-container">
            {/* 즐겨찾기 섹션 */}
            <div className="card">
            <div className="card-header">
                <h3>⭐ 즐겨찾기</h3>
            </div>
            <div className="card-content">
                <ul className="list">
                {bookmarks.map(bookmark => (
                    <li key={bookmark.id} className="list-item">
                    <span>{bookmark.title}</span>
                    <span className="category-tag">{bookmark.category}</span>
                    </li>
                ))}
                </ul>
            </div>
            </div>
    
            {/* 최근 본 콘텐츠 */}
            <div className="card">
            <div className="card-header">
                <h3>📅 최근 본 콘텐츠</h3>
            </div>
            <div className="card-content">
                <ul className="list">
                {recentViews.map(item => (
                    <li key={item.id} className="list-item">
                    <span>{item.title}</span>
                    <span className="date-tag">{item.date}</span>
                    </li>
                ))}
                </ul>
            </div>
            </div>
    
            {/* 목표 설정 */}
            <div className="card">
            <div className="card-header">
                <h3>🎯 나의 목표</h3>
            </div>
            <div className="card-content">
                <div className="goals-container">
                <h4>2025년 상반기 목표</h4>
                <ul className="goals-list">
                    <li>자격증 2개 취득하기</li>
                    <li>포트폴리오 완성하기</li>
                    <li>희망 기업 3곳 지원하기</li>
                </ul>
                </div>
            </div>
            </div>
    
            {/* 알림 센터 */}
            <div className="card">
            <div className="card-header">
                <h3>🔔 알림 센터</h3>
            </div>
            <div className="card-content">
                <div className="notifications">
                <div className="notification new">
                    <p>새로운 추천 컨텐츠가 등록되었습니다</p>
                    <p className="notification-time">1시간 전</p>
                </div>
                <div className="notification">
                    <p>관심 분야의 채용 정보가 업데이트되었습니다</p>
                    <p className="notification-time">어제</p>
                </div>
                </div>
            </div>
            </div>
        </div>
    
        {/* 설정 바로가기 */}
        <div className="settings-container">
            <button className="settings-button">⚙️ 설정</button>
        </div>
        </div>
    );
    };

    export default MyPage;
