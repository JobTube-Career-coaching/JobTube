// src/components/SummaryComponent.js
import React from 'react';
import './SummaryComponent.css';

const SummaryComponent = ({ summary = '' }) => {
  // Render HTML content safely
  const createMarkup = (htmlContent) => {
    return { __html: htmlContent };
  };

  // Handle empty or missing summary
  if (!summary) {
    return (
      <div className="summary-container no-summary">
        <div className="no-summary-header">
          <h4>No Summary</h4>
        </div>
      </div>
    );
  }

  // Split summary into sections
  const sections = summary.split('\n\n');
  const overallSummary = sections[0];
  const detailedSections = sections.slice(1);

  return (
    <div className="summary-container">
      <div className="summary-header">
        <h2>Content Summary</h2>
      </div>
      
      <div className="summary-body">
        {/* Overall Summary Section */}
        <section 
          className="overall-summary"
          dangerouslySetInnerHTML={createMarkup(overallSummary)}
          style={{ backgroundColor: 'white', marginBottom: '24px' }}
        />

        {/* Detailed Sections */}
        <div className="detailed-sections" style={{ marginTop: '16px' }}>
          {detailedSections.map((section, index) => (
            <div 
              key={index} 
              className="detailed-section"
              style={{ backgroundColor: '#e3f2fd', borderLeft: '4px solid #1565c0' }}
            >
              <div 
                dangerouslySetInnerHTML={createMarkup(section)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SummaryComponent;
