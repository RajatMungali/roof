import React, { useState, useRef } from 'react';

export default function LandingPage({ onExtractSuccess, onManual, onOpenJob, jobs }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileProcess(file);
  };

  const handleFileProcess = async (file) => {
    setErrorMsg('');
    if (file.type !== 'application/pdf') {
      setErrorMsg('Please drop a valid PDF file.');
      return;
    }

    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const rawBase = import.meta.env.VITE_API_BASE_URL || '';
      const apiBase = rawBase.replace(/\/+$/, '');
      const response = await fetch(`${apiBase}/api/parse-pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to parse: ${response.status} - ${text}`);
      }

      const result = await response.json();
      if (result.status === 'success') {
        onExtractSuccess(result.data);
      } else if (result.status === 'no_data') {
        alert("Please use a valid document. No measurements found!");
        onManual();
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while parsing the PDF.');
    } finally {
      setIsExtracting(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'Needs follow-up' && job.status !== 'Preliminary sent') return false;
    if (activeTab === 'Ready for contract' && job.status !== 'Ready for contract') return false;
    
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      if (!job.name.toLowerCase().includes(q) && !job.address.toLowerCase().includes(q)) {
        return false;
      }
    }
    
    return true;
  });

  return (
    <div className="landing-container" style={{ padding: '60px', fontFamily: 'sans-serif', color: '#111', height: 'calc(100vh - 60px)', overflowY: 'auto', backgroundColor: '#f4f5f7', boxSizing: 'border-box' }}>

      {errorMsg && (
        <div style={{ padding: '10px', backgroundColor: '#ffe6e6', color: '#cc0000', borderRadius: '4px', marginBottom: '20px', maxWidth: '1400px', margin: '0 auto 20px auto' }}>
          {errorMsg}
        </div>
      )}

      {/* LAYOUT CONTAINER */}
      <div className="landing-layout" style={{ display: 'flex', gap: '40px', maxWidth: '1400px', margin: '0 auto', alignItems: 'flex-start' }}>
        
        {/* LEFT COLUMN: Your Jobs */}
        <div style={{ flex: 1, backgroundColor: '#fff', borderRadius: '12px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #eaeaea', minHeight: '50vh' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '20px', margin: 0 }}>Your jobs</h2>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                placeholder="search name or address" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '8px 30px 8px 15px', borderRadius: '20px', border: '1px solid #ccc', outline: 'none', width: '220px', backgroundColor: '#f5f5f5' }}
              />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </div>
          </div>

          {/* TABS */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
            {['All', 'Needs follow-up', 'Ready for contract'].map(tab => (
              <span 
                key={tab} 
                onClick={() => setActiveTab(tab)}
                style={{ 
                  cursor: 'pointer', 
                  padding: '4px 12px', 
                  backgroundColor: activeTab === tab ? '#333' : 'transparent', 
                  color: activeTab === tab ? '#fff' : '#666', 
                  borderRadius: '16px', 
                  fontSize: '14px',
                  fontWeight: activeTab === tab ? '600' : '400',
                  transition: 'all 0.2s'
                }}
              >
                {tab}
              </span>
            ))}
          </div>

          {/* JOBS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', marginBottom: '40px' }}>
            {filteredJobs.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '14px' }}>
                No jobs found.
              </div>
            ) : (
              filteredJobs.map((job, index) => (
              <div 
                key={job.id}
                onClick={() => onOpenJob(job.formData)}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  padding: '16px 20px', 
                  borderBottom: index < jobs.length - 1 ? '1px solid #eee' : 'none',
                  cursor: 'pointer',
                  backgroundColor: '#fff',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{job.name}</div>
                  <div style={{ fontSize: '14px', color: '#666' }}>{job.address} {job.price > 0 && `· $${job.price.toLocaleString()}`}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ 
                    padding: '4px 10px', 
                    backgroundColor: job.status === 'Ready for contract' ? '#e8f5e9' : job.status === 'Preliminary sent' ? '#fff4e5' : '#f5f5f5', 
                    color: job.status === 'Ready for contract' ? '#2e7d32' : job.status === 'Preliminary sent' ? '#d97706' : '#666', 
                    borderRadius: '12px', 
                    fontSize: '12px', 
                    fontWeight: '500' 
                  }}>
                    {job.status}
                  </span>
                  <input type="checkbox" style={{ width: '18px', height: '18px', cursor: 'pointer' }} onClick={(e) => e.stopPropagation()} />
                </div>
              </div>
            )))}
          </div>
        </div>

        {/* RIGHT COLUMN: Start a new proposal */}
        <div style={{ flex: 1.2, backgroundColor: '#fff', borderRadius: '12px', padding: '40px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', border: '1px solid #eaeaea', minHeight: '50vh' }}>
          <h2 style={{ fontSize: '28px', margin: '0 0 8px 0' }}>Start a new proposal</h2>
          <p style={{ color: '#555', fontSize: '16px', margin: '0 0 30px 0' }}>
            Drop a QuickMeasure report to auto-fill measurements, or enter them yourself.
          </p>

          {/* CARDS CONTAINER */}
          <div className="landing-cards" style={{ display: 'flex', gap: '20px' }}>
            
            {/* DROPZONE CARD */}
        <div 
            onClick={() => fileInputRef.current.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          style={{ 
            flex: 1.6, 
            backgroundColor: isDragging ? '#e0efff' : '#f0f7ff', 
            border: `2px dashed ${isDragging ? '#0044aa' : '#0066cc'}`, 
            borderRadius: '12px',
            padding: '60px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s',
            position: 'relative'
          }}
        >
          {isExtracting ? (
            <div style={{ color: '#0066cc' }}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '18px' }}>Extracting data...</h3>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>Please wait while we read the PDF</p>
            </div>
          ) : (
            <div style={{ color: '#0066cc' }}>
              <div style={{ fontSize: '36px', marginBottom: '15px' }}>📄</div>
              <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: '600' }}>Drop or Click QuickMeasure PDF</h3>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>measurements fill in automatically</p>
            </div>
          )}
          {/* Hidden File Input for Clicking */}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={(e) => {
              if (e.target.files[0]) handleFileProcess(e.target.files[0]);
              e.target.value = null; // reset
            }} 
            style={{ display: 'none' }} 
            accept="application/pdf"
          />
        </div>

        {/* MANUAL ENTRY CARD */}
        <div 
          onClick={onManual}
          style={{ 
            flex: 1, 
            backgroundColor: '#f9f9f9', 
            border: '1px solid #ddd', 
            borderRadius: '12px',
            padding: '60px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f1f1f1'}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#f9f9f9'}
        >
          <div style={{ color: '#333' }}>
            <div style={{ fontSize: '36px', marginBottom: '15px' }}>✍️</div>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '18px', fontWeight: '600' }}>Enter manually</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>type measurements in</p>
          </div>
        </div>
      </div>

        </div>
      </div>
    </div>
  );
}
