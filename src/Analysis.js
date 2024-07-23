import React from 'react';

const Analysis = ({ analysis, loading }) => {
  return (
    <div className="analysis-section">
      {loading && <div id="loading" className="loading">Analyzing...</div>}
      <div id="analysis" className="analysis-result">
        {analysis.length > 0 ? (
          analysis.map((paragraph, index) => <p key={index}>{paragraph}</p>)
        ) : (
          'Your analysis will appear here'
        )}
      </div>
    </div>
  );
};

export default Analysis;
