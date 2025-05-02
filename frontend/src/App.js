import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import YouTubeSearch from './components/YouTubeSearch'; import './App.css'; // 스타일링 파일 추가
import MyPage from './components/mypage';
import Bookmark from './components/bookmark';
import DisabledPage from './components/DisabledPage';
import SeniorPage from './components/SeniorPage';
import Career from './components/Career';
import DataSummary from './components/DataSummary';

import { HiOutlineLightBulb } from "react-icons/hi";
import { IoRocketSharp } from "react-icons/io5";
import { MdOutlineScience } from "react-icons/md";
import { VscGraph } from "react-icons/vsc";
import SeniorResultsPage from './components/SeniorResultsPage';
import DisabledResultsPage from './components/DisabledResultsPage';
import SeniorSearch from './components/SeniorSearch';





// ProtectedMode 컴포넌트 업데이트
function ProtectedMode() {
  return (
    <div className="protected-mode">
      <h2 className="protected-title">🌟 사회적 약자를 위한 미래 설계 플랫폼</h2>
      <p className="protected-description">
        보호 모드는 고령자, 장애인 등 사회적 약자를 대상으로 한 
        맞춤형 정보와 지원 서비스를 제공합니다. 여러분의 더 나은 미래 설계를 돕기 위해 준비된 
        공간입니다.
      </p>
      <p className="protected-guidance">
        왼쪽 사이드 메뉴에서 <strong>카테고리를 선택</strong>하여 해당 대상자에게 적합한 정보를 확인하세요. 
        다양한 주제별로 유용한 자료를 탐색할 수 있습니다.
      </p>
    </div>
  );
}








// 상단 옵션 바 컴포넌트
function ModeSwitcher({ mode, setMode }) {
  const navigate = useNavigate();

  return (
    <div className="mode-switcher">
      <button
        onClick={() => {
          setMode('normal');
          navigate('/');
        }}
        className={`mode-button ${mode === 'normal' ? 'active' : ''}`}
      >
        노멀 모드
      </button>
      <button
        onClick={() => {
          setMode('protection');
          navigate('/protected');
        }}
        className={`mode-button ${mode === 'protection' ? 'active' : ''}`}
      >
        보호 모드
      </button>
    </div>
  );
}

// 메인 App 컴포넌트
function App() {
  const [mode, setMode] = useState('normal');

  useEffect(() => {
    if (mode === 'protection') {
      document.body.classList.add('accessible-mode');
    } else {
      document.body.classList.remove('accessible-mode');
    }
  }, [mode]);

  const normalMenu = [
    {path:'/mypage',label:"마이 페이지"},
    { path: '/YouTubeSearch', label: '직업 탐색' },
    { path: '/career', label: '취업 공고' },
    { path: '/datasummary', label: '데이터 분석' },
  ];

  const protectionMenu = [
    { path: '/senior', label: '고령자(시니어)' },
    { path: '/disabled', label: '장애인' },

  ];

  const menu = mode === 'normal' ? normalMenu : protectionMenu;

  return (
    <Router>

      <div className="App">
        <header className="header">
          <div className="title-container">
            {/* 왼쪽 아이콘 그룹 */}
            <div className="icon-group-left">
              <HiOutlineLightBulb className="header-icon icon-left" />
              <IoRocketSharp className="header-icon icon-left-2" />
            </div>

            <h1>JOBTUBE</h1>

            {/* 오른쪽 아이콘 그룹 */}
            <div className="icon-group-right">
              <MdOutlineScience className="header-icon icon-right" />
              <VscGraph className="header-icon icon-right-2" />
            </div>
          </div>
          <ModeSwitcher mode={mode} setMode={setMode} />

        </header>
          

     <div className="main-container">
          <nav className="sidebar">
            <ul>
              {menu.map((item, index) => (
                <li key={index}>
                  <Link to={item.path}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="content">
            <Routes>
              <Route path="/" element={<YouTubeSearch />} />
              <Route path="/YouTubeSearch" element={<YouTubeSearch />} />
              <Route path="/mypage" element={<MyPage />} />
              <Route path="/career" element={<Career />} />
              <Route path="/datasummary" element={<DataSummary />} />
              <Route path="/bookmark" element={<Bookmark />} />
              <Route path="/protected" element={<ProtectedMode />} />
              <Route path="/senior" element={<SeniorPage />} />
              <Route path="/disabled" element={<DisabledPage />} />
              <Route path="/senior-results/:categoryId" element={<SeniorResultsPage />} />
              <Route path="/disabled-results/:categoryId" element={<DisabledResultsPage />} />
              <Route path="/disabled/disabled_search" element={<YouTubeSearch />} />
              <Route path="/search-frontend" element={<SeniorSearch />} />


            </Routes>
          </div>
        </div>
      </div>
    </Router>
    
  );
}

export default App;
