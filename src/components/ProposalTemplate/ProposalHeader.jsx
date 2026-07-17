import React from 'react';

export default function ProposalHeader({ customerName, date, customerAddress }) {
  // Try to parse the first name from customerName for the "Dear {firstName}" greeting
  const firstName = customerName ? customerName.split(' ')[0] : 'Customer';
  const cAddress = customerAddress || 'Project Address';

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Header Container */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '30px' }}>
        {/* Left Column: Certifications */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <img 
            src="/MasterElite-Logo.png" 
            alt="Certifications" 
            style={{ width: '220px', height: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Center Column: Main Logo */}
        <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: '-40px', marginTop: '-35px' }}>
          <img 
            src="/Kidd-Luukko.png" 
            alt="Kidd-Luukko Roofing" 
            style={{ width: '350px', height: 'auto', objectFit: 'contain' }}
          />
        </div>

        {/* Right Column: Contact Info */}
        <div style={{ flex: 1, textAlign: 'right', fontSize: '11px', color: '#1a4387', fontWeight: 'bold' }}>
          <p style={{ margin: '0 0 20px 0', fontStyle: 'italic' }}>Proposal #SK1324265RS</p>
          <p style={{ margin: '0' }}>Tel 508.799.9500</p>
          <p style={{ margin: '0' }}>Fax 508.792.3745</p>
          <p style={{ margin: '0' }}>23 North Street</p>
          <p style={{ margin: '0' }}>Worcester, MA 01605</p>
          <p style={{ margin: '15px 0 0 0', fontSize: '13px', color: '#333', fontWeight: 'normal' }}>
            {date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Customer Info */}
      <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
        <p style={{ margin: '0' }}>{customerName || 'Client Name'} Residence</p>
        <p style={{ margin: '0' }}>Attn: {customerName || 'Client Name'}</p>
        <p style={{ margin: '0', whiteSpace: 'pre-line' }}>{cAddress}</p>
        <p style={{ margin: '0' }}>RE: Roof Replacement</p>
      </div>

      {/* Opening Letter */}
      <div style={{ marginTop: '30px', fontSize: '14px', lineHeight: '1.5' }}>
        <p>Dear {firstName},</p>
        <p>
          Thank you for considering Luukko Roofing to replace your home’s roof. Upon review of the existing building at {cAddress}, we have prepared the following proposal for your review utilizing materials from CertainTeed. Please be sure the scope aligns with your expectations.
        </p>
      </div>
    </div>
  );
}