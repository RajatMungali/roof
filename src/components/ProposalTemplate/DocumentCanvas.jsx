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
  const [layoutOption, setLayoutOption] = useState('Best');
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

      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/commit`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setAlertConfig({ type: 'success', message: 'Success! Proposal generated and pushed to JobNimbus.' });
      } else {
        const errorText = await response.text();
        setAlertConfig({ type: 'error', message: `Error saving proposal to CRM: ${response.status} - ${errorText}` });
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
            <option value="Good">Good</option>
            <option value="Better">Better</option>
            <option value="Best">Best</option>
          </select>
        </div>
        <div className="toolbar-actions">
        </div>
      </div>

      <div className="print-page-wrapper">
        {/* THE PROPOSAL DOCUMENT */}
        <div ref={componentRef}>
          
          {layoutOption === 'Best' && (
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

          {layoutOption === 'Better' && (
            <>
              {/* PAGE 1 */}
              <PageWrapper hideFooter={true}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <ProposalHeader customerName={data.customer_metadata?.name} date={new Date().toLocaleDateString()} customerAddress={data.customer_metadata?.address} mode="summarised" />
                  
                  {/* NEW: Tier Strip (Better Tier) */}
                  <div style={{ marginTop: '10px', marginBottom: '10px', backgroundColor: '#f9f9f9', padding: '10px 15px', borderRadius: '8px', border: '1px solid #eee' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '33%', paddingBottom: '10px' }}>GOOD</th>
                          <th style={{ width: '33%', paddingBottom: '10px', color: '#b30000' }}>BETTER</th>
                          <th style={{ width: '34%', paddingBottom: '10px' }}>BEST</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ padding: '5px' }}>Architectural shingles</td>
                          <td style={{ padding: '5px' }}>Upgraded shingle line</td>
                          <td style={{ padding: '5px' }}>Premium designer shingle</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '5px', color: '#666' }}>Standard warranty</td>
                          <td style={{ padding: '5px', fontWeight: 'bold' }}>Extended warranty</td>
                          <td style={{ padding: '5px', color: '#666' }}>Lifetime warranty</td>
                        </tr>
                      </tbody>
                    </table>
                    <div style={{ textAlign: 'right', fontSize: '11px', fontStyle: 'italic', color: '#888', marginTop: '10px' }}>[this document = BETTER tier]</div>
                  </div>

                  <ScopePart1 quantities={data.quantities} financials={data.financials} options={data.options} tearOffs={data.options?.tear_off_layers || 1} contingencyRates={data.contingency_rates} mode="detailed" />
                  
                  {/* Moved Bill of Materials to Page 2 to prevent cutoff on Page 1 */}

                  {/* Footer Placeholder for Page 1 */}
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <span>www.kiddluukko.com</span>
                    <span>Estimate valid 30 days &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Initial Here _______</span>
                  </div>
                </div>
              </PageWrapper>

              {/* PAGE 2 */}
              <PageWrapper hideFooter={true}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  
                  <div style={{ marginTop: '0px' }}>
                    <h3 style={{ borderBottom: '2px solid #333', paddingBottom: '5px', margin: '0 0 10px 0' }}>Bill of Materials Details</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                          <th style={{ padding: '6px', border: '1px solid #ddd' }}>Item Description</th>
                          <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>Upgraded Shingles: {data.options?.shingle_tier || 'Landmark Pro'} (Squares)</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.shingle_squares || 0}</td></tr>
                        <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>Drip Edge (Pieces)</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.drip_edge_pcs || 0}</td></tr>
                        <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>Ice & Water Shield (Rolls)</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.ice_and_water_rolls || 0}</td></tr>
                        <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>Synthetic Underlayment (Rolls)</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.underlayment_rolls || 0}</td></tr>
                        <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>Starter Strips (Bundles)</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.starter_bundles || 0}</td></tr>
                        <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>Ridge Cap (Bundles)</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.ridge_cap_bundles || 0}</td></tr>
                        <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>Ridge Vent (Pieces)</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.ridge_vent_pcs || 0}</td></tr>
                      </tbody>
                    </table>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <ScopePart2 quantities={data.quantities} financials={data.financials} options={data.options} contingencyRates={data.contingency_rates} totalCostStr={(data.financials?.final_contract_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} mode="detailed" />
                  </div>
                  
                  <div style={{ marginTop: '15px' }}>
                    <h3 style={{ borderBottom: '2px solid #333', paddingBottom: '5px', margin: '0 0 10px 0' }}>Included Services Breakdown</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', fontSize: '13px' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                          <th style={{ padding: '6px', border: '1px solid #ddd' }}>Service Description</th>
                          <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>Professional Labor & Installation</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>Included</td></tr>
                        {data.options?.tear_off_layers > 0 && (
                          <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>Tear-off & Debris Disposal ({data.options.tear_off_layers} layer{data.options.tear_off_layers > 1 ? 's' : ''})</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>Included</td></tr>
                        )}
                        <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>Site Clean-up & Magnetic Sweep</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>Included</td></tr>
                        <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>{data.options?.warranty_type || 'Standard'} Warranty</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>Included</td></tr>
                      </tbody>
                    </table>
                    {/* Terms and Payment Box moved to Page 3 */}
                  </div>

                  {/* Footer Placeholder for Page 2 */}
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <span>www.kiddluukko.com</span>
                    <span>Estimate valid 30 days &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Initial Here _______</span>
                  </div>
                </div>
              </PageWrapper>

              {/* PAGE 3 */}
              <PageWrapper hideFooter={true}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  
                  {/* NEW: Qualifications and Exclusions brought to Page 3 */}
                  <div style={{ marginTop: '0px' }}>
                    <TermsPart1 financials={data.financials} mode="detailed" hidePaymentTerms={true} hideVisaText={false} />
                  </div>

                  {/* Payment Terms Box (Detailed Tier) */}
                  <div style={{ marginTop: '15px', padding: '15px', backgroundColor: '#fdfdfd', border: '2px solid #333', borderRadius: '8px', maxWidth: '400px', marginLeft: 'auto' }}>
                    <div style={{ fontSize: '15px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
                      Payment Terms:
                    </div>
                    <table style={{ width: '100%', fontSize: '14px', color: '#444' }}>
                      <tbody>
                        <tr>
                          <td style={{ paddingBottom: '10px' }}>Deposit Due Upon Signing:</td>
                          <td style={{ paddingBottom: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                            ${((data.financials?.final_contract_price || 0) * 0.3).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**
                          </td>
                        </tr>
                        <tr>
                          <td style={{ paddingBottom: '10px' }}>Remainder Due Upon Completion of Job:</td>
                          <td style={{ paddingBottom: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                            ${((data.financials?.final_contract_price || 0) * 0.7).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**
                          </td>
                        </tr>
                        <tr style={{ borderTop: '1px solid #ccc' }}>
                          <td style={{ paddingTop: '10px', fontWeight: 'bold', color: '#333' }}>Total Payments Due:</td>
                          <td style={{ paddingTop: '10px', textAlign: 'right', fontWeight: '900', color: '#b30000', fontSize: '16px' }}>
                            ${(data.financials?.final_contract_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Footer Placeholder for Page 3 */}
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <span>www.kiddluukko.com</span>
                    <span>Estimate valid 30 days &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Initial Here _______</span>
                  </div>
                </div>
              </PageWrapper>

              {/* PAGE 4 */}
              <PageWrapper hideFooter={true}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  
                  {/* Special Notes and Signatures (TermsPart2) */}
                  <div style={{ marginTop: '0px' }}>
                    <TermsPart2 specialNotes={data.special_notes} />
                  </div>

                  {/* Footer Placeholder for Page 4 */}
                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                    <span>www.kiddluukko.com</span>
                    <span>Estimate valid 30 days &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Initial Here _______</span>
                  </div>
                </div>
              </PageWrapper>
            </>
          )}
          {layoutOption === 'Good' && (
            <>
              {/* PAGE 1 */}
              <PageWrapper hideFooter={true}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <ProposalHeader customerName={data.customer_metadata?.name} date={new Date().toLocaleDateString()} customerAddress={data.customer_metadata?.address} mode="summarised" />
                
                {/* NEW: Tier Strip */}
                <div style={{ marginTop: '10px', marginBottom: '10px', backgroundColor: '#f9f9f9', padding: '10px 15px', borderRadius: '8px', border: '1px solid #eee' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'center' }}>
                    <thead>
                      <tr>
                        <th style={{ width: '33%', paddingBottom: '10px', color: '#b30000' }}>GOOD</th>
                        <th style={{ width: '33%', paddingBottom: '10px' }}>BETTER</th>
                        <th style={{ width: '34%', paddingBottom: '10px' }}>BEST</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '5px' }}>Architectural shingles</td>
                        <td style={{ padding: '5px' }}>Upgraded shingle line</td>
                        <td style={{ padding: '5px' }}>Premium designer shingle</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px', fontWeight: 'bold' }}>Standard warranty</td>
                        <td style={{ padding: '5px', color: '#666' }}>Extended warranty</td>
                        <td style={{ padding: '5px', color: '#666' }}>Lifetime warranty</td>
                      </tr>
                    </tbody>
                  </table>
                  <div style={{ textAlign: 'right', fontSize: '11px', fontStyle: 'italic', color: '#888', marginTop: '10px' }}>[this document = GOOD tier]</div>
                </div>

                <div style={{ marginTop: '15px' }}>
                  <h3 style={{ borderBottom: '2px solid #333', paddingBottom: '5px', margin: '0 0 10px 0' }}>Bill of Materials</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5', textAlign: 'left' }}>
                        <th style={{ padding: '6px', border: '1px solid #ddd' }}>Item Description</th>
                        <th style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>Quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>Architectural Shingles (Squares)</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.shingle_squares || 0}</td></tr>
                      <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>Drip Edge (Pieces)</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.drip_edge_pcs || 0}</td></tr>
                      <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>Ice & Water Shield (Rolls)</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.ice_and_water_rolls || 0}</td></tr>
                      <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>Synthetic Underlayment (Rolls)</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.underlayment_rolls || 0}</td></tr>
                      <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>Starter Strips (Bundles)</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.starter_bundles || 0}</td></tr>
                      <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>Ridge Cap (Bundles)</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.ridge_cap_bundles || 0}</td></tr>
                      <tr><td style={{ padding: '6px', border: '1px solid #ddd' }}>Ridge Vent (Pieces)</td><td style={{ padding: '6px', border: '1px solid #ddd', textAlign: 'right' }}>{data.quantities?.ridge_vent_pcs || 0}</td></tr>
                    </tbody>
                  </table>
                </div>
                
                {/* Footer Placeholder for Page 1 */}
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                  <span>www.kiddluukko.com</span>
                  <span>Estimate valid 30 days &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Initial Here _______</span>
                </div>
                </div>
              </PageWrapper>

              {/* PAGE 2 */}
              <PageWrapper hideFooter={true}>
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* NEW: Scope Summary */}
                <div style={{ marginTop: '20px', marginBottom: '30px', fontSize: '14px', lineHeight: '1.6' }}>
                  <p>
                    This estimate covers a full roof replacement: removal and disposal of the existing roof, installation of new underlayment and shingles per manufacturer specifications, and site cleanup. Exact scope, materials, and any additional findings (such as deck repair) will be confirmed during a walkthrough before contract signing.
                  </p>
                </div>

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
                  
                  {/* RELABELED: Estimated Investment Box */}
                  <div style={{ marginTop: '40px', padding: '25px', backgroundColor: '#fdfdfd', border: '2px solid #333', borderRadius: '8px', maxWidth: '400px', marginLeft: 'auto' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', color: '#666', marginBottom: '10px' }}>
                      Estimated Investment (Good Tier)
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: '900', color: '#b30000', marginBottom: '15px' }}>
                      ${(data.financials?.final_contract_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ fontSize: '13px', color: '#444', lineHeight: '1.4' }}>
                      Includes materials, labor, disposal, and applicable taxes.<br/><br/>
                      This is a preliminary estimate based on aerial measurements. Final pricing will be confirmed upon acceptance and a site walkthrough.
                    </div>
                  </div>
                </div>

                {/* NEW: Next step */}
                <div style={{ marginTop: '50px', fontSize: '15px', lineHeight: '1.6', backgroundColor: '#f0f5fa', padding: '20px', borderRadius: '8px' }}>
                  <p style={{ fontWeight: 'bold', marginTop: 0 }}>Interested in moving forward?</p>
                  <p style={{ marginBottom: 0 }}>
                    Reply to this email or call <strong>508.799.9500</strong> and we'll schedule a walkthrough to finalize scope and pricing, then prepare your formal contract.
                  </p>
                </div>

                {/* Footer Placeholder for Page 2 */}
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666', borderTop: '1px solid #eee', paddingTop: '10px' }}>
                  <span>www.kiddluukko.com</span>
                  <span>Estimate valid 30 days &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Initial Here _______</span>
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