import React, { useState, useRef } from 'react';
import ControlPanel from './components/ControlPanel';
import DocumentCanvas from './components/ProposalTemplate/DocumentCanvas';
import './assets/main.css';

export default function App() {
  const [proposalData, setProposalData] = useState(null);
  const documentRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCalculationComplete = (calculatedData) => {
    setProposalData(calculatedData);
  };

  const handleApproveClick = async () => {
    if (documentRef.current) {
      setIsSubmitting(true);
      await documentRef.current.handleApproveAndSend();
      setIsSubmitting(false);
    }
  };

  const handleDownloadClick = () => {
    if (documentRef.current) {
      documentRef.current.handleDownloadPDF();
    }
  };

  return (
    <div className="app-container">
      {/* TOP HEADER BAR */}
      <header className="top-nav">
        <div className="nav-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/Company logo.png" alt="Company Logo" style={{ height: '32px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            <span style={{ fontSize: '18px', fontWeight: 'bold', marginLeft: '6px' }}>Roofing Proposal Automation</span>
          </div>
        </div>

        <div className="nav-center">
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="nav-label">Customer</span>
            <span className="nav-value">{proposalData?.customer_metadata?.name || '---'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="nav-label">Job Number</span>
            <span className="nav-value">JN-88210-A</span>
          </div>
        </div>

        <div className="nav-right">
          <span className="status-badge">
            <span className="dot blinking-dot" style={{ backgroundColor: '#ffc107' }}></span>
            Not Synced to JobNimbus
          </span>
          <button className="btn-secondary" onClick={handleDownloadClick} disabled={!proposalData || isSubmitting}>
            💾 Download Draft PDF
          </button>
          <button className="btn-primary" onClick={handleApproveClick} disabled={!proposalData || isSubmitting}>
            {isSubmitting ? '⏳ Waiting for response from JobNimbus...' : '🚀 Approve & Send'}
          </button>
        </div>
      </header>

      {/* MAIN CONTENT SPLIT */}
      <div className="main-content">
        {/* LEFT COLUMN: Sidebar Form */}
        <div className="sidebar">
          <ControlPanel onCalculationComplete={handleCalculationComplete} />
        </div>

        {/* RIGHT COLUMN: The Visual Proposal Canvas */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-canvas)' }}>
          {!proposalData ? (
            <div style={{ margin: 'auto', textAlign: 'center', color: '#888' }}>
              <h2>Ready to Estimate</h2>
              <p>Adjust variables in the control panel to generate a preview.</p>
            </div>
          ) : (
            <DocumentCanvas ref={documentRef} data={proposalData} />
          )}
        </div>
      </div>
    </div>
  );
}