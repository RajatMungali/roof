import React, { useState, useRef, useEffect } from 'react';
import ControlPanel from './components/ControlPanel';
import DocumentCanvas from './components/ProposalTemplate/DocumentCanvas';
import LandingPage from './components/LandingPage';
import './assets/main.css';

const defaultJobs = [
  { id: 1, name: 'Tim Lamoureux', address: '39 Town Farm Rd', price: 15231, status: 'Preliminary sent', formData: { customer_name: 'Tim Lamoureux', customer_address: '39 Town Farm Road, Brookfield MA', roof_area_sq: 23.0, pitch: 5, eave_lf: 120.5, rake_lf: 80.0, ridge_lf: 40.0, valley_lf: 20.0, sidewall_lf: 15.0, headwall_lf: 10.0, hip_lf: 0, waste_factor: 5, manufacturer: 'CertainTeed', shingle_tier: 'Landmark Pro', tear_off_layers: 2, pipe_boots: 1, chimney_relead: true, num_chimneys: 1, step_flashing_override: 0, special_note_gutter_enabled: true, special_note_gutter_amount: 3612.00, ridge_vent: true, skylights: 0, satellite: false, roof_deck_type: 'plywood', apply_financing: false, markup_percentage: 40.0, warranty_type: 'Standard', warranty_cost: 0, deck_replacement_sf: 0, custom_labor_override: 0, contingency_plywood_rate: 5.85, contingency_ledger_rate: 8.85, contingency_pipe_boot_rate: 85.00 } },
  { id: 2, name: 'John Smith', address: '130 Cross Rd', price: 12407, status: 'Ready for contract', formData: { customer_name: 'John Smith', customer_address: '130 Cross Rd', roof_area_sq: 20.0, pitch: 6, eave_lf: 100, rake_lf: 70, ridge_lf: 30, valley_lf: 10, sidewall_lf: 10, headwall_lf: 5, hip_lf: 10, waste_factor: 10, manufacturer: 'GAF', shingle_tier: 'Landmark', tear_off_layers: 1, pipe_boots: 2, chimney_relead: false, num_chimneys: 0, step_flashing_override: 0, special_note_gutter_enabled: false, special_note_gutter_amount: 0, ridge_vent: true, skylights: 1, satellite: false, roof_deck_type: 'plywood', apply_financing: true, markup_percentage: 35.0, warranty_type: 'Standard', warranty_cost: 0, deck_replacement_sf: 0, custom_labor_override: 0, contingency_plywood_rate: 5.85, contingency_ledger_rate: 8.85, contingency_pipe_boot_rate: 85.00 } },
  { id: 3, name: 'Maria Chen', address: 'the estimate', price: 0, status: 'Draft', formData: { customer_name: 'Maria Chen', customer_address: '', roof_area_sq: 0, pitch: 0, eave_lf: 0, rake_lf: 0, ridge_lf: 0, valley_lf: 0, sidewall_lf: 0, headwall_lf: 0, hip_lf: 0, waste_factor: 0, manufacturer: 'CertainTeed', shingle_tier: 'Landmark', tear_off_layers: 1, pipe_boots: 1, chimney_relead: false, num_chimneys: 0, step_flashing_override: 0, special_note_gutter_enabled: false, special_note_gutter_amount: 0, ridge_vent: true, skylights: 0, satellite: false, roof_deck_type: 'plywood', apply_financing: false, markup_percentage: 0, warranty_type: 'Standard', warranty_cost: 0, deck_replacement_sf: 0, custom_labor_override: 0, contingency_plywood_rate: 5.85, contingency_ledger_rate: 8.85, contingency_pipe_boot_rate: 85.00 } }
];

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [proposalData, setProposalData] = useState(null);
  const [pdfExtractedData, setPdfExtractedData] = useState(null);
  const [loadedJobData, setLoadedJobData] = useState(null);
  const [jobs, setJobs] = useState(defaultJobs);
  const documentRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simple client-side router hook
  useEffect(() => {
    const onPopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const handleCalculationComplete = (calculatedData) => {
    setProposalData(calculatedData);
  };

  const handleApproveClick = async () => {
    if (documentRef.current) {
      setIsSubmitting(true);
      
      // Store as a new job in the list
      if (proposalData && proposalData.rawFormData) {
         setJobs(prev => {
            const newJob = {
               id: Date.now(),
               name: proposalData.customer_metadata?.name || 'New Customer',
               address: proposalData.customer_metadata?.address || 'Unknown Address',
               price: proposalData.financials?.final_contract_price || 0,
               status: 'Preliminary sent',
               formData: proposalData.rawFormData
            };
            // Check if job exists
            const existing = prev.find(j => j.name === newJob.name);
            if (existing) {
               return prev.map(j => j.id === existing.id ? { ...newJob, id: existing.id } : j);
            }
            return [newJob, ...prev];
         });
      }

      await documentRef.current.handleApproveAndSend();
      setIsSubmitting(false);
    }
  };

  const handleDownloadClick = () => {
    if (documentRef.current) {
      documentRef.current.handleDownloadPDF();
    }
  };

  const handleExtractSuccess = (data) => {
    setPdfExtractedData(data);
    setLoadedJobData(null);
    navigate('/report');
  };

  const handleOpenJob = (jobFormData) => {
    setPdfExtractedData(null);
    setLoadedJobData(jobFormData);
    navigate('/report');
  };

  const handleManual = () => {
    setPdfExtractedData(null);
    setLoadedJobData(null);
    navigate('/report');
  };

  return (
    <div className="app-container">
      {/* TOP HEADER BAR */}
      <header className="top-nav">
        <div className="nav-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src="/Company logo.png" alt="Company Logo" style={{ height: '32px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
            <span style={{ fontSize: '18px', fontWeight: 'bold', marginLeft: '6px' }}>Roofing Proposal Automation</span>
          </div>
        </div>

        <div className="nav-right">
          <span className="status-badge">
            <span className="dot blinking-dot" style={{ backgroundColor: '#ffc107' }}></span>
            Not Synced to JobNimbus
          </span>
          {currentPath === '/report' && (
            <>
              <button className="btn-secondary" onClick={handleDownloadClick} disabled={!proposalData || isSubmitting}>
                💾 Download Final PDF
              </button>
              <button className="btn-primary" onClick={handleApproveClick} disabled={!proposalData || isSubmitting}>
                {isSubmitting ? '⏳ Waiting for response from JobNimbus...' : '🚀 Approve & Send'}
              </button>
            </>
          )}
        </div>

        {currentPath === '/report' && (
          <div 
            className="nav-center"
            style={{ 
              transform: isSubmitting ? 'translateX(calc(-50% - 150px))' : 'translateX(-50%)',
              transition: 'transform 0.3s ease'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="nav-label">Customer</span>
              <span className="nav-value">{proposalData?.customer_metadata?.name || '---'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span className="nav-label">Job Number</span>
              <span className="nav-value">JN-88210-A</span>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTENT */}
      {currentPath === '/' ? (
        <LandingPage 
          onExtractSuccess={handleExtractSuccess} 
          onManual={handleManual} 
          onOpenJob={handleOpenJob}
          jobs={jobs}
        />
      ) : (
        <div className="main-content">
          {/* LEFT COLUMN: Sidebar Form */}
          <div className="sidebar">
            <ControlPanel 
              onCalculationComplete={handleCalculationComplete} 
              pdfExtractedData={pdfExtractedData}
              loadedJobData={loadedJobData}
            />
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
      )}
    </div>
  );
}