import React from 'react';

export function TermsPart1({ financials, mode = 'expressive', hidePaymentTerms = false, hideVisaText = false }) {
  const formatMoney = (val) => '$' + (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <>
      {/* QUALIFICATIONS */}
      <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>Qualifications:</p>
      {mode === 'detailed' ? (
        <ul style={{ marginTop: '0', paddingLeft: '20px', listStyleType: 'disc', lineHeight: '1.4' }}>
          <li>Landscaping protection provided, but minor damage is possible. Scaffolding is extra.</li>
          <li>Includes 1 mobilization. No project phasing.</li>
          <li>Scope covers roof edge to roof edge only.</li>
          <li>Not responsible for damage to building systems below the roof deck.</li>
        </ul>
      ) : (
        <ul style={{ marginTop: '0', paddingLeft: '20px', listStyleType: 'disc' }}>
          <li>The utmost care will be afforded for protection of landscaping; however, roofing materials will damage shrubbery and vegetation below. Our proposal is consistent with existing roof demolition utilizing tarps and direct drops to ground. Perimeter scaffolding is available upon request for an additional charge.</li>
          <li>This proposal is inclusive of 1 mobilization. Phasing of project is not included.</li>
          <li>Scope of work is from roof edge to roof edge. Soffit, fasciae, trim wrapping not included unless specifically noted above.</li>
          <li>Kidd-Luukko Corp is not responsible for any building systems below the roof deck that may be damaged by roofing fasteners during the roofing process.</li>
          <li>Should you have any questions or concerns regarding the scope of work, or the terminology used, please clarify prior to accepting these terms.</li>
        </ul>
      )}

      {/* EXCLUSIONS */}
      <p style={{ fontWeight: 'bold', marginBottom: '5px', marginTop: '15px' }}>Exclusions:</p>
      {mode === 'detailed' ? (
        <ul style={{ marginTop: '0', paddingLeft: '20px', listStyleType: 'disc', lineHeight: '1.4' }}>
          <li>Hand sealing of shingles and permanent fall protection anchors.</li>
          <li>Solar penetrations, awnings, and mechanical penetrations by others.</li>
          <li>Insulation and historical preservation requirements.</li>
          <li>Winter condition charges and interior protection.</li>
          <li>Non-roofing trades (painting, mechanical, masonry, siding, non-roofing carpentry).</li>
        </ul>
      ) : (
        <ul style={{ marginTop: '0', paddingLeft: '20px', listStyleType: 'disc' }}>
          <li>Hand Sealing of shingles unless specifically otherwise noted above.</li>
          <li>Furnish or installation of permanently installed fall protection anchor points unless specifically noted otherwise in scope of work above.</li>
          <li>Flashing of solar specific penetrations unless otherwise noted above.</li>
          <li>Fabric Awnings/Canopies.</li>
          <li>Supply, installation, and locating of penetrations by others. We will set and flash curbs. Curbs furnished, loaded and assembled by others.</li>
          <li>Temporary weather protection of mechanical penetrations.</li>
          <li>Insulation.</li>
          <li>Historical preservation specific requirements or reviews.</li>
          <li>Winter Conditions. Cold weather installation is available for additional charges and/or alternative methods.</li>
          <li>Work related to soffits, fasciae, or siding.</li>
          <li>Interior protection.</li>
          <li>Non-roofing trades required to perform roofing scope, unless noted otherwise above:
            <ul style={{ listStyleType: 'circle', paddingLeft: '20px', marginTop: '5px' }}>
              <li>Painting/staining.</li>
              <li>Mechanical tradesmen; mechanical, plumbing, electrical disconnect/reconnection.</li>
              <li>Masonry.</li>
              <li>Carpentry that is not specifically mentioned in the above scope of work.</li>
            </ul>
          </li>
        </ul>
      )}

      {!hideVisaText && (
        <p style={{ textAlign: 'center', fontWeight: 'bold', marginTop: '15px', marginBottom: '15px', fontSize: '13px' }}>
          Payments made by Visa, Master Card, Discover or American Express are subject to convenience fee of 4% of total amount charged.
        </p>
      )}

      {/* PAYMENT TERMS */}
      {!hidePaymentTerms && (
        <>
          <p style={{ fontWeight: 'bold', textDecoration: 'underline', marginBottom: '15px' }}>Payment Terms:</p>
          <table style={{ width: '70%', marginLeft: '30px', fontWeight: 'bold' }}>
            <tbody>
              <tr>
                <td style={{ paddingBottom: '10px' }}>Deposit Due Upon Signing:</td>
                <td style={{ paddingBottom: '10px' }}>{formatMoney(financials?.deposit_due)}**</td>
              </tr>
              <tr>
                <td style={{ paddingBottom: '10px' }}>Remainder Due Upon Completion of Job:</td>
                <td style={{ paddingBottom: '10px' }}>{formatMoney(financials?.completion_due)}**</td>
              </tr>
              <tr>
                <td style={{ paddingTop: '10px' }}>Total Payments Due:</td>
                <td style={{ paddingTop: '10px' }}>{formatMoney(financials?.final_contract_price)}**</td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </>
  );
}

export function TermsPart2({ specialNotes }) {
  return (
    <>
      {/* WORK DATES */}
      <table style={{ width: '70%', marginLeft: '30px', fontWeight: 'bold', marginBottom: '20px' }}>
        <tbody>
          <tr>
            <td style={{ paddingBottom: '10px' }}>Work Start Date:</td>
            <td style={{ paddingBottom: '10px' }}>TBD***</td>
          </tr>
          <tr>
            <td style={{ paddingBottom: '10px' }}>Work Completion Date:</td>
            <td style={{ paddingBottom: '10px' }}>TBD***</td>
          </tr>
        </tbody>
      </table>

      <div style={{ fontSize: '11px', lineHeight: '1.4', marginBottom: '30px' }}>
        <p style={{ margin: '0 0 5px 0' }}>** Totals listed do not include any optional items, extra work, and permitting fees, if applicable.</p>
        <p style={{ margin: '0' }}>***Availability is subject to suitable weather conditions, scheduling logistics, and material/labor availability. No work can begin prior to both parties receiving a signed copy of the contract</p>
      </div>

      {/* SPECIAL NOTES */}
      <p style={{ fontWeight: 'bold', marginBottom: '15px' }}>Special Notes:</p>
      
      {specialNotes?.gutter_enabled !== false && (
        <p style={{ marginBottom: '15px' }}>
          Existing gutters can be removed, disposed of and replaced with new 5” white “ogee”-style, seamless aluminum raingutters and 2x3 downspouts for an additional charge of <strong>${(specialNotes?.gutter_amount || 3612.00).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>.
        </p>
      )}
      <p style={{ marginBottom: '15px' }}>
        Any and all painting required is to be performed by others. (not included).
      </p>
      <p style={{ marginBottom: '15px' }}>
        If you have any questions, please call. Should you choose Kidd-Luukko to perform this work, please sign this proposal, notate the selections desired, and or mail to our office or call toll-free <strong>1-866-915-ROOF (7663)</strong>. We’ll order materials right away (to increase curb appeal and protect your property immediately).
      </p>
      <p style={{ marginBottom: '40px' }}>
        Thank you for the opportunity to quote your project. The above quote maintains the highest level of quality products and installation techniques available.
      </p>

      {/* RESPECTFULLY */}
      <p style={{ marginBottom: '10px' }}>Respectfully,</p>
      <p style={{ marginBottom: '0' }}>Sign</p>
      <p style={{ marginBottom: '0' }}>KLC</p>
      <p style={{ marginBottom: '0' }}>Luukko Roofing</p>
    </>
  );
}
