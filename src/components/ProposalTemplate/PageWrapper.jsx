import React from 'react';

export default function PageWrapper({ children, customFooter, hideFooter = false }) {
  return (
    <div className="print-page" style={{
      width: '8.5in',
      height: '11in',
      padding: '0.5in',
      backgroundColor: 'white',
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.85), rgba(255,255,255,0.85)), url(/Background_Placeholder.png)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
      marginBottom: '40px',
      position: 'relative',
      boxSizing: 'border-box',
      color: '#333',
      fontFamily: '"Times New Roman", Times, serif',
      pageBreakAfter: 'always',
      overflow: 'hidden' // ensure content doesn't spill out visibly if it gets too close to bottom
    }}>
      {/* Content Container (leaves room for the absolute footer) */}
      <div style={{ height: 'calc(100% - 0.5in)' }}>
        {children}
      </div>
      
      {/* Absolute positioned footer at the bottom of the 11in page */}
      {!hideFooter && (
        <div style={{ position: 'absolute', bottom: '0.4in', left: '0.5in', right: '0.5in', display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#1a4387', fontStyle: 'italic', fontWeight: 'bold' }}>
          <span>www.FixTheRoof.com</span>
          <span>Initial Here______</span>
        </div>
      )}

      {customFooter && (
        <div style={{ position: 'absolute', bottom: '0.1in', left: '0.5in', right: '0.5in', textAlign: 'center', fontSize: '11px' }}>
          {customFooter}
        </div>
      )}
    </div>
  );
}
