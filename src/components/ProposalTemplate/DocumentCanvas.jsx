import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import html2pdf from 'html2pdf.js';

import PageWrapper from './PageWrapper';
import ProposalHeader from './ProposalHeader';
import { ScopePart1, ScopePart2 } from './ProposalScope';
import { TermsPart1, TermsPart2 } from './ProposalTerms';
import { LegalPart1, LegalPart2 } from './LegalTerms';

const DocumentCanvas = forwardRef(({ data }, ref) => {
  const componentRef = useRef(null);
  const [isCommitting, setIsCommitting] = useState(false);
  const [layoutOption, setLayoutOption] = useState('Expressive');
  const [alertConfig, setAlertConfig] = useState(null);

  const generatePDF = async (action) => {
    const element = componentRef.current;
    
    // Temporarily add class to strip browser margins and shadows
    element.classList.add('pdf-export-mode');
    
    // Force DOM update to apply the class before capturing
    await new Promise(resolve => setTimeout(resolve, 50));

    const opt = {
      margin: 0,
      filename: 'Proposal_Draft.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    try {
      if (action === 'download') {
        await html2pdf().set(opt).from(element).save();
      } else if (action === 'blob') {
        return await html2pdf().set(opt).from(element).output('blob');
      }
    } finally {
      // Remove class to restore browser UI
      element.classList.remove('pdf-export-mode');
    }
  };

  const handleApproveAndSend = async () => {
    setIsCommitting(true);
    try {
      const pdfBlob = await generatePDF('blob');

      const formData = new FormData();
      formData.append('file', pdfBlob, 'proposal_draft_final.pdf');
      formData.append('metadata', JSON.stringify(data));
      formData.append('contact_id', data.contact_id || 'UNKNOWN');

      const response = await fetch('/api/commit', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setAlertConfig({ type: 'success', message: 'Success! Proposal generated and pushed to JobNimbus.' });
      } else {
        setAlertConfig({ type: 'error', message: 'Error saving proposal to CRM. Please try again.' });
      }
    } catch (error) {
      console.error("Commit failed:", error);
      setAlertConfig({ type: 'error', message: 'An unexpected error occurred while communicating with JobNimbus.' });
    } finally {
      setIsCommitting(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await generatePDF('download');
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Error downloading PDF.");
    }
  };

  useImperativeHandle(ref, () => ({
    handleApproveAndSend,
    handleDownloadPDF,
    isCommitting
  }));


  return (
    <div className="canvas-container">
      {/* CUSTOM ALERT MODAL */}
      {alertConfig && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            background: 'white', padding: '30px', borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)', maxWidth: '400px', textAlign: 'center'
          }}>
            <h2 style={{ margin: '0 0 15px', color: alertConfig.type === 'success' ? '#28a745' : '#dc3545' }}>
              {alertConfig.type === 'success' ? 'Success!' : 'Error'}
            </h2>
            <p style={{ fontSize: '16px', color: '#555', marginBottom: '25px', lineHeight: '1.5' }}>{alertConfig.message}</p>
            <button 
              onClick={() => setAlertConfig(null)}
              style={{
                backgroundColor: 'var(--primary)', color: 'white', border: 'none',
                padding: '10px 30px', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold',
                cursor: 'pointer', transition: 'background-color 0.2s'
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* CANVAS SUB-TOOLBAR */}
      <div className="canvas-toolbar">
        <div>
          <span className="status-badge" style={{ backgroundColor: 'transparent', color: '#888', padding: 0 }}>
            <span className="dot" style={{ backgroundColor: '#28a745' }}></span>
            Last saved just now
          </span>
        </div>
        <div style={{ fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '10px' }}>
          ⓘ Preview reflects unsaved changes in real time
          <select 
            value={layoutOption} 
            onChange={(e) => setLayoutOption(e.target.value)}
            style={{ padding: '4px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="Summarised">Summarised</option>
            <option value="Detailed">Detailed</option>
            <option value="Expressive">Expressive</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button onClick={handleDownloadPDF} disabled={isCommitting}>
            📄 Export PDF
          </button>
        </div>
      </div>

      <div className="print-page-wrapper">
        {/* THE PROPOSAL DOCUMENT */}
        <div ref={componentRef}>
          
          {layoutOption === 'Expressive' && (
            <>
              {/* PAGE 1 */}
              <PageWrapper>
                <ProposalHeader customerName={data.customer_metadata?.name} date={new Date().toLocaleDateString()} customerAddress={data.customer_metadata?.address} />
                <ScopePart1 quantities={data.quantities} financials={data.financials} options={data.options} tearOffs={data.options?.tear_off_layers || 1} contingencyRates={data.contingency_rates} />
              </PageWrapper>

              {/* PAGE 2 */}
              <PageWrapper>
                <ScopePart2 quantities={data.quantities} financials={data.financials} options={data.options} contingencyRates={data.contingency_rates} totalCostStr={(data.financials?.final_contract_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} />
              </PageWrapper>

              {/* PAGE 3 */}
              <PageWrapper>
                <TermsPart1 financials={data.financials} />
              </PageWrapper>

              {/* PAGE 4 */}
              <PageWrapper>
                <TermsPart2 specialNotes={data.special_notes} />
              </PageWrapper>

              {/* PAGE 5 */}
              <PageWrapper>
                <LegalPart1 />
              </PageWrapper>

              {/* PAGE 6 */}
              <PageWrapper>
                <LegalPart2 />
              </PageWrapper>
            </>
          )}

          {layoutOption === 'Detailed' && (
            <>
              {/* PAGE 1 */}
              <PageWrapper>
                <ProposalHeader customerName={data.customer_metadata?.name} date={new Date().toLocaleDateString()} customerAddress={data.customer_metadata?.address} />
                <ScopePart1 quantities={data.quantities} financials={data.financials} options={data.options} tearOffs={data.options?.tear_off_layers || 1} contingencyRates={data.contingency_rates} mode="detailed" />
                
                {/* Valuable Addition: Bill of Materials */}
                <div style={{ marginTop: '30px' }}>
                  <h3 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>Bill of Materials Details</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>Item Description</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Architectural Shingles (Squares)</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.shingle_squares || 0}</td></tr>
                      <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Drip Edge (Pieces)</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.drip_edge_pcs || 0}</td></tr>
                      <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Ice & Water Shield (Rolls)</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.ice_and_water_rolls || 0}</td></tr>
                      <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Synthetic Underlayment (Rolls)</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.underlayment_rolls || 0}</td></tr>
                      <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Starter Strips (Bundles)</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.starter_bundles || 0}</td></tr>
                      <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Ridge Cap (Bundles)</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.ridge_cap_bundles || 0}</td></tr>
                      <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Ridge Vent (Pieces)</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.ridge_vent_pcs || 0}</td></tr>
                    </tbody>
                  </table>
                </div>
              </PageWrapper>

              {/* PAGE 2 */}
              <PageWrapper>
                <ScopePart2 quantities={data.quantities} financials={data.financials} options={data.options} contingencyRates={data.contingency_rates} totalCostStr={(data.financials?.final_contract_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mode="detailed" />
                
                {/* Valuable Addition: Included Services */}
                <div style={{ marginTop: '30px' }}>
                  <h3 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>Included Services Breakdown</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', fontSize: '13px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                        <th style={{ padding: '8px', border: '1px solid #ddd' }}>Service Description</th>
                        <th style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Professional Labor & Installation</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Included</td></tr>
                      {data.options?.tear_off_layers > 0 && (
                        <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Tear-off & Debris Disposal ({data.options.tear_off_layers} layer{data.options.tear_off_layers > 1 ? 's' : ''})</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Included</td></tr>
                      )}
                      <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>Site Clean-up & Magnetic Sweep</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Included</td></tr>
                      <tr><td style={{ padding: '8px', border: '1px solid #ddd' }}>{data.options?.warranty_type || 'Standard'} Warranty</td><td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'right' }}>Included</td></tr>
                    </tbody>
                  </table>
                </div>
              </PageWrapper>

              {/* PAGE 3 */}
              <PageWrapper>
                <TermsPart1 financials={data.financials} mode="detailed" />
              </PageWrapper>
            </>
          )}

          {layoutOption === 'Summarised' && (
            <>
              {/* PAGE 1 */}
              <PageWrapper>
                <ProposalHeader customerName={data.customer_metadata?.name} date={new Date().toLocaleDateString()} customerAddress={data.customer_metadata?.address} />
                <div style={{ marginTop: '30px' }}>
                  <h3 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>Bill of Materials</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Item Description</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ padding: '10px', border: '1px solid #ddd' }}>Architectural Shingles (Squares)</td><td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.shingle_squares || 0}</td></tr>
                      <tr><td style={{ padding: '10px', border: '1px solid #ddd' }}>Drip Edge (Pieces)</td><td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.drip_edge_pcs || 0}</td></tr>
                      <tr><td style={{ padding: '10px', border: '1px solid #ddd' }}>Ice & Water Shield (Rolls)</td><td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.ice_and_water_rolls || 0}</td></tr>
                      <tr><td style={{ padding: '10px', border: '1px solid #ddd' }}>Synthetic Underlayment (Rolls)</td><td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.underlayment_rolls || 0}</td></tr>
                      <tr><td style={{ padding: '10px', border: '1px solid #ddd' }}>Starter Strips (Bundles)</td><td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.starter_bundles || 0}</td></tr>
                      <tr><td style={{ padding: '10px', border: '1px solid #ddd' }}>Ridge Cap (Bundles)</td><td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.ridge_cap_bundles || 0}</td></tr>
                      <tr><td style={{ padding: '10px', border: '1px solid #ddd' }}>Ridge Vent (Pieces)</td><td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.ridge_vent_pcs || 0}</td></tr>
                    </tbody>
                  </table>
                </div>
              </PageWrapper>

              {/* PAGE 2 */}
              <PageWrapper>
                <div style={{ marginTop: '30px' }}>
                  <h3 style={{ borderBottom: '2px solid #333', paddingBottom: '10px' }}>Included Services & Summary</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>Service Description</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ padding: '10px', border: '1px solid #ddd' }}>Professional Labor & Installation</td><td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Included</td></tr>
                      {data.options?.tear_off_layers > 0 && (
                        <tr><td style={{ padding: '10px', border: '1px solid #ddd' }}>Tear-off & Debris Disposal ({data.options.tear_off_layers} layer{data.options.tear_off_layers > 1 ? 's' : ''})</td><td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Included</td></tr>
                      )}
                      <tr><td style={{ padding: '10px', border: '1px solid #ddd' }}>Site Clean-up & Magnetic Sweep</td><td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Included</td></tr>
                      <tr><td style={{ padding: '10px', border: '1px solid #ddd' }}>{data.options?.warranty_type || 'Standard'} Warranty</td><td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'right' }}>Included</td></tr>
                    </tbody>
                  </table>
                  
                  <div style={{ marginTop: '60px', padding: '20px', backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px', textAlign: 'right' }}>
                    <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#333' }}>
                      Total Contract Price: ${(data.financials?.final_contract_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '14px', color: '#666', fontStyle: 'italic' }}>
                      Includes all materials, labor, disposal, and applicable taxes.
                    </div>
                  </div>
                </div>
              </PageWrapper>
            </>
          )}

        </div>
      </div>
    </div>
  );
});

export default DocumentCanvas;