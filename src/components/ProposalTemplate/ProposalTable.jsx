import React from 'react';

export default function ProposalTable({ quantities, financials }) {
  if (!quantities || !financials) return null;

  return (
    <div style={{ width: '100%', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}>

      {/* Scope of Work / Materials Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #333' }}>
            <th style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>Description</th>
            <th style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>Quantity</th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #eee', pageBreakInside: 'avoid' }}>
            <td style={{ padding: '10px' }}>Shingles (Squares)</td>
            <td style={{ padding: '10px', textAlign: 'right' }}>{quantities.shingle_squares || 0}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee', pageBreakInside: 'avoid' }}>
            <td style={{ padding: '10px' }}>Drip Edge (Pcs)</td>
            <td style={{ padding: '10px', textAlign: 'right' }}>{quantities.drip_edge_pcs || 0}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee', pageBreakInside: 'avoid' }}>
            <td style={{ padding: '10px' }}>Ice & Water Shield (Rolls)</td>
            <td style={{ padding: '10px', textAlign: 'right' }}>{quantities.ice_and_water_rolls || 0}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee', pageBreakInside: 'avoid' }}>
            <td style={{ padding: '10px' }}>Underlayment (Rolls)</td>
            <td style={{ padding: '10px', textAlign: 'right' }}>{quantities.underlayment_rolls || 0}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee', pageBreakInside: 'avoid' }}>
            <td style={{ padding: '10px' }}>Starter Bundles</td>
            <td style={{ padding: '10px', textAlign: 'right' }}>{quantities.starter_bundles || 0}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee', pageBreakInside: 'avoid' }}>
            <td style={{ padding: '10px' }}>Ridge Cap Bundles</td>
            <td style={{ padding: '10px', textAlign: 'right' }}>{quantities.ridge_cap_bundles || 0}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee', pageBreakInside: 'avoid' }}>
            <td style={{ padding: '10px' }}>Ridge Vent (Pcs)</td>
            <td style={{ padding: '10px', textAlign: 'right' }}>{quantities.ridge_vent_pcs || 0}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee', pageBreakInside: 'avoid' }}>
            <td style={{ padding: '10px' }}>Step Flashing (Packs)</td>
            <td style={{ padding: '10px', textAlign: 'right' }}>{quantities.step_flashing_packs || 0}</td>
          </tr>
          <tr style={{ borderBottom: '1px solid #eee', pageBreakInside: 'avoid' }}>
            <td style={{ padding: '10px' }}>Nail Boxes</td>
            <td style={{ padding: '10px', textAlign: 'right' }}>{quantities.nail_boxes || 0}</td>
          </tr>
        </tbody>
      </table>

      {/* Financial Breakdown Table */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', pageBreakInside: 'avoid' }}>
        <table style={{ width: '50%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>Base Cost:</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>
                ${(financials.total_cost || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>Materials Tax:</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>
                ${(financials.materials_tax || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
            <tr style={{ borderBottom: '2px solid #333' }}>
              <td style={{ padding: '10px', fontWeight: 'bold', fontSize: '1.1rem' }}>Final Contract Price:</td>
              <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', fontSize: '1.1rem' }}>
                ${(financials.final_contract_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '10px', fontWeight: 'bold', color: '#007bff' }}>Deposit Due (30%):</td>
              <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#007bff' }}>
                ${(financials.deposit_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
            <tr>
              <td style={{ padding: '10px', fontWeight: 'bold' }}>Balance Due Upon Completion:</td>
              <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>
                ${(financials.completion_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
}