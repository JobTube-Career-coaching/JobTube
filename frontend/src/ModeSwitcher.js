import React from 'react';
import { useNavigate } from 'react-router-dom';

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

export default ModeSwitcher;
