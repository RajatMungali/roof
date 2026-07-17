import React, { useState, useEffect } from 'react';

const DEFAULT_FORM_DATA = {
  customer_name: '',
  customer_address: '',
  roof_area_sq: 0,
  pitch: 0,
  eave_lf: 0,
  rake_lf: 0,
  ridge_lf: 0,
  valley_lf: 0,
  sidewall_lf: 0,
  headwall_lf: 0,
  hip_lf: 0,
  waste_factor: 10,
  manufacturer: 'CertainTeed',
  shingle_tier: 'Landmark',
  tear_off_layers: 1,
  pipe_boots: 1,
  chimney_relead: false,
  num_chimneys: 0,
  step_flashing_override: 0,
  special_note_gutter_enabled: false,
  special_note_gutter_amount: 0,
  ridge_vent: true,
  skylights: 0,
  satellite: false,
  roof_deck_type: 'plywood',
  apply_financing: false,
  markup_percentage: 35.0,
  warranty_type: 'Standard',
  warranty_cost: 0,
  deck_replacement_sf: 0,
  custom_labor_override: 0,
  contingency_plywood_rate: 5.85,
  contingency_ledger_rate: 8.85,
  contingency_pipe_boot_rate: 85.00
};

export default function ControlPanel({ onCalculationComplete, pdfExtractedData, loadedJobData }) {
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const [expandedSection, setExpandedSection] = useState('ADMINISTRATIVE');
  const [isCalculating, setIsCalculating] = useState(false);
  const [liveTotal, setLiveTotal] = useState(0);

  useEffect(() => {
    if (loadedJobData) {
      setFormData(loadedJobData);
    } else if (pdfExtractedData) {
      setFormData(prev => ({
        ...DEFAULT_FORM_DATA, // Start fresh for new PDF
        roof_area_sq: pdfExtractedData.roof_area_sq || 0,
        pitch: pdfExtractedData.pitch || 0,
        eave_lf: pdfExtractedData.eave_lf || 0,
        rake_lf: pdfExtractedData.rake_lf || 0,
        ridge_lf: pdfExtractedData.ridge_lf || 0,
        hip_lf: pdfExtractedData.hip_lf || 0,
        valley_lf: pdfExtractedData.valley_lf || 0,
        sidewall_lf: pdfExtractedData.step_flashing_lf || 0,
        headwall_lf: pdfExtractedData.headwall_lf || 0,
      }));
    } else {
      setFormData(DEFAULT_FORM_DATA);
    }
  }, [pdfExtractedData, loadedJobData]);

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCalculate = async () => {
    setIsCalculating(true);
    try {
      const payload = {
        measurements: {
          roof_area_sq: Number(formData.roof_area_sq),
          pitch: Number(formData.pitch),
          eave_lf: Number(formData.eave_lf),
          rake_lf: Number(formData.rake_lf),
          ridge_lf: Number(formData.ridge_lf),
          valley_lf: Number(formData.valley_lf),
          sidewall_lf: Number(formData.sidewall_lf),
          headwall_lf: Number(formData.headwall_lf),
          hip_lf: Number(formData.hip_lf)
        },
        options: {
          manufacturer: formData.manufacturer,
          shingle_tier: formData.shingle_tier,
          tear_off_layers: Number(formData.tear_off_layers),
          number_of_pipe_boots: Number(formData.pipe_boots),
          relead_chimney: formData.chimney_relead,
          number_of_chimneys: Number(formData.num_chimneys),
          new_skylights: Number(formData.skylights),
          remove_satellite: formData.satellite,
          roof_deck_type: formData.roof_deck_type,
          apply_financing: formData.apply_financing,
          markup_percentage: Number(formData.markup_percentage),
          warranty_type: formData.warranty_type,
          warranty_cost: Number(formData.warranty_cost) || 0,
          deck_replacement_sf: Number(formData.deck_replacement_sf) || 0,
          custom_labor_override: Number(formData.custom_labor_override) || 0,
          waste_factor: Number(formData.waste_factor) / 100.0
        },
        customer_metadata: {
          name: formData.customer_name,
          address: formData.customer_address
        }
      };

      if (Number(formData.step_flashing_override) > 0) {
        payload.options.step_flashing_override = Number(formData.step_flashing_override);
      }

      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${apiBase}/api/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Calculation failed: ${response.status} - ${errorText}`);
      }
      const result = await response.json();

      if (result.status === "success") {
        setLiveTotal(result.data.financials.final_contract_price);
        onCalculationComplete({
          quantities: result.data.quantities,
          financials: result.data.financials,
          options: payload.options,
          customer_metadata: payload.customer_metadata,
          contingency_rates: {
            plywood: Number(formData.contingency_plywood_rate),
            ledger: Number(formData.contingency_ledger_rate),
            pipe_boot: Number(formData.contingency_pipe_boot_rate)
          },
          special_notes: {
            gutter_enabled: formData.special_note_gutter_enabled,
            gutter_amount: Number(formData.special_note_gutter_amount)
          }
        });
      }
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="sidebar-header">
        <h2 style={{ fontSize: '18px', margin: '0 0 5px 0' }}>Configure the estimate</h2>
        <p style={{ fontSize: '12px', color: 'var(--text-light)', margin: '0' }}>
          Everything updates the proposal live. Toggle sections to reveal controls.
        </p>
      </div>

      <div className="sidebar-content">

        {/* ADMINISTRATIVE 1/4 */}
        <div className="form-section">
          <div className="form-section-header" onClick={() => toggleSection('ADMINISTRATIVE')}>
            <span>🏛 ADMINISTRATIVE 1/4</span>
            <span>{expandedSection === 'ADMINISTRATIVE' ? '▲' : '▼'}</span>
          </div>
          {expandedSection === 'ADMINISTRATIVE' && (
            <div className="form-section-body">
              <div className="form-group">
                <label>Customer Name</label>
                <input type="text" className="form-control" name="customer_name" value={formData.customer_name} onChange={handleInputChange} style={{ backgroundColor: '#ffe6e6' }} />
              </div>
              <div className="form-group">
                <label>Property Address</label>
                <input type="text" className="form-control" name="customer_address" value={formData.customer_address} onChange={handleInputChange} style={{ backgroundColor: '#ffe6e6' }} />
              </div>
            </div>
          )}
        </div>

        {/* ROOF GEOMETRY 2/4 */}
        <div className="form-section">
          <div className="form-section-header" onClick={() => toggleSection('GEOMETRY')}>
            <span>📐 ROOF GEOMETRY 2/4</span>
            <span>{expandedSection === 'GEOMETRY' ? '▲' : '▼'}</span>
          </div>
          {expandedSection === 'GEOMETRY' && (
            <div className="form-section-body">
              <div className="row">
                <div className="col form-group">
                  <label>Squares (SQ)</label>
                  <input type="number" step="0.1" className="form-control" name="roof_area_sq" value={formData.roof_area_sq} onChange={handleInputChange} />
                </div>
                <div className="col form-group">
                  <label>Pitch</label>
                  <input type="number" className="form-control" name="pitch" value={formData.pitch} onChange={handleInputChange} />
                </div>
                <div className="col form-group">
                  <label>Waste Factor (%)</label>
                  <input type="number" className="form-control" name="waste_factor" value={formData.waste_factor} onChange={handleInputChange} />
                </div>
              </div>

              <div className="row">
                <div className="col form-group">
                  <label>Eaves (LF)</label>
                  <input type="number" className="form-control" name="eave_lf" value={formData.eave_lf} onChange={handleInputChange} />
                </div>
                <div className="col form-group">
                  <label>Rakes (LF)</label>
                  <input type="number" className="form-control" name="rake_lf" value={formData.rake_lf} onChange={handleInputChange} />
                </div>
              </div>

              <div className="row">
                <div className="col form-group">
                  <label>Ridges (LF)</label>
                  <input type="number" className="form-control" name="ridge_lf" value={formData.ridge_lf} onChange={handleInputChange} />
                </div>
                <div className="col form-group">
                  <label>Valleys (LF)</label>
                  <input type="number" className="form-control" name="valley_lf" value={formData.valley_lf} onChange={handleInputChange} />
                </div>
              </div>

              <div className="row">
                <div className="col form-group">
                  <label>Sidewalls (Step) (LF)</label>
                  <input type="number" className="form-control" name="sidewall_lf" value={formData.sidewall_lf} onChange={handleInputChange} />
                </div>
                <div className="col form-group">
                  <label>Headwalls (Flash) (LF)</label>
                  <input type="number" className="form-control" name="headwall_lf" value={formData.headwall_lf} onChange={handleInputChange} />
                </div>
              </div>

              <div className="form-group">
                <label>Hips (LF)</label>
                <input type="number" className="form-control" name="hip_lf" value={formData.hip_lf} onChange={handleInputChange} />
              </div>
            </div>
          )}
        </div>

        {/* MATERIALS & LABOR 3/4 */}
        <div className="form-section">
          <div className="form-section-header" onClick={() => toggleSection('MATERIALS')}>
            <span>🔨 MATERIALS & LABOR 3/4</span>
            <span>{expandedSection === 'MATERIALS' ? '▲' : '▼'}</span>
          </div>
          {expandedSection === 'MATERIALS' && (
            <div className="form-section-body">
              <div className="form-group">
                <label>Manufacturer</label>
                <select className="form-control" name="manufacturer" value={formData.manufacturer} onChange={handleInputChange} style={{ backgroundColor: '#ffe6e6' }}>
                  <option value="CertainTeed">CertainTeed</option>
                  <option value="GAF">GAF</option>
                  <option value="Owens Corning">Owens Corning</option>
                </select>
              </div>
              <div className="form-group">
                <label>Shingle Tier</label>
                <select className="form-control" name="shingle_tier" value={formData.shingle_tier} onChange={handleInputChange} style={{ backgroundColor: '#ffe6e6' }}>
                  <option value="Landmark">Landmark (Architectural)</option>
                  <option value="Landmark Pro">Landmark Pro (Premium)</option>
                  <option value="Belmont">Belmont (Luxury)</option>
                </select>
              </div>

              <div className="row">
                <div className="col form-group">
                  <label>Tear-off Layers</label>
                  <input type="number" className="form-control" name="tear_off_layers" value={formData.tear_off_layers} onChange={handleInputChange} style={{ backgroundColor: '#ffe6e6' }} />
                </div>
                <div className="col form-group">
                  <label>Markup (%)</label>
                  <input type="number" className="form-control" name="markup_percentage" value={formData.markup_percentage} onChange={handleInputChange} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* OPTIONAL ADD-ONS 4/4 */}
        <div className="form-section">
          <div className="form-section-header" onClick={() => toggleSection('ADDONS')}>
            <span>🔧 OPTIONAL ADD-ONS 4/5</span>
            <span>{expandedSection === 'ADDONS' ? '▲' : '▼'}</span>
          </div>
          {expandedSection === 'ADDONS' && (
            <div className="form-section-body">

              {/* Gutters Moved to Special Notes */}

              {/* Chimney Toggle */}
              <div className={`toggle-switch-container ${formData.chimney_relead ? 'active' : ''}`}>
                <div className="toggle-info">
                  <strong>Chimney Re-lead & Flash</strong>
                  <span>Grind out existing and replace lead.</span>
                </div>
                <label className="switch">
                  <input type="checkbox" name="chimney_relead" checked={formData.chimney_relead} onChange={handleInputChange} />
                  <span className="slider"></span>
                </label>
              </div>
              {formData.chimney_relead && (
                <div className="form-group" style={{ paddingLeft: '12px' }}>
                  <label>Number of Chimneys</label>
                  <input type="number" className="form-control" name="num_chimneys" value={formData.num_chimneys} onChange={handleInputChange} />
                </div>
              )}

              {/* Ridge Vent Toggle */}
              <div className={`toggle-switch-container ${formData.ridge_vent ? 'active' : ''}`}>
                <div className="toggle-info">
                  <strong>Ridge Vent Upgrade</strong>
                  <span>Filtered continuous ridge vent.</span>
                </div>
                <label className="switch">
                  <input type="checkbox" name="ridge_vent" checked={formData.ridge_vent} onChange={handleInputChange} />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="row" style={{ marginTop: '15px' }}>
                <div className="col form-group">
                  <label>Pipe Boots</label>
                  <input type="number" className="form-control" name="pipe_boots" value={formData.pipe_boots} onChange={handleInputChange} />
                </div>
                <div className="col form-group">
                  <label>Skylights</label>
                  <input type="number" className="form-control" name="skylights" value={formData.skylights} onChange={handleInputChange} />
                </div>
              </div>

            </div>
          )}
        </div>

        {/* FINANCIALS & OVERRIDES 5/5 */}
        <div className="form-section">
          <div className="form-section-header" onClick={() => toggleSection('FINANCIALS')}>
            <span>💰 FINANCIALS & OVERRIDES 5/5</span>
            <span>{expandedSection === 'FINANCIALS' ? '▲' : '▼'}</span>
          </div>
          {expandedSection === 'FINANCIALS' && (
            <div className="form-section-body">

              <div className="form-group">
                <label>Warranty Selection</label>
                <select className="form-control" name="warranty_type" value={formData.warranty_type} onChange={handleInputChange}>
                  <option value="Standard">Standard (CertainTeed 4-STAR)</option>
                  <option value="System Plus">GAF System Plus</option>
                  <option value="Golden Pledge">GAF Golden Pledge</option>
                </select>
              </div>

              {(formData.warranty_type === 'System Plus' || formData.warranty_type === 'Golden Pledge') && (
                <div className="form-group" style={{ paddingLeft: '12px', borderLeft: '2px solid #ccc' }}>
                  <label>Warranty Cost ($)</label>
                  <input type="number" className="form-control" name="warranty_cost" value={formData.warranty_cost} onChange={handleInputChange} />
                </div>
              )}

              <div className={`toggle-switch-container ${formData.apply_financing ? 'active' : ''}`} style={{ marginTop: '15px' }}>
                <div className="toggle-info">
                  <strong>Apply Financing (3.25%)</strong>
                  <span>Calculated automatically if toggled.</span>
                </div>
                <label className="switch">
                  <input type="checkbox" name="apply_financing" checked={formData.apply_financing} onChange={handleInputChange} />
                  <span className="slider"></span>
                </label>
              </div>

              <div className="row" style={{ marginTop: '15px' }}>
                <div className="col form-group">
                  <label>Custom Labor Adjust ($/sq)</label>
                  <input type="number" className="form-control" name="custom_labor_override" value={formData.custom_labor_override} onChange={handleInputChange} />
                </div>
                <div className="col form-group">
                  <label>Deck Replacement (sf)</label>
                  <input type="number" className="form-control" name="deck_replacement_sf" value={formData.deck_replacement_sf} onChange={handleInputChange} />
                </div>
              </div>

              <hr style={{ margin: '15px 0', borderColor: '#eee' }} />
              <p style={{ fontSize: '11px', color: '#666', marginBottom: '10px' }}>
                <strong>Contingency Rates (Print Only):</strong> These rates do not affect the live total.
              </p>

              <div className="row">
                <div className="col form-group">
                  <label>Plywood ($/sf)</label>
                  <input type="number" step="0.01" className="form-control" name="contingency_plywood_rate" value={formData.contingency_plywood_rate} onChange={handleInputChange} />
                </div>
                <div className="col form-group">
                  <label>Ledger ($/lf)</label>
                  <input type="number" step="0.01" className="form-control" name="contingency_ledger_rate" value={formData.contingency_ledger_rate} onChange={handleInputChange} />
                </div>
              </div>
              <div className="form-group" style={{ marginTop: '10px' }}>
                <label>Extra Pipe Boots ($/ea)</label>
                <input type="number" step="0.01" className="form-control" name="contingency_pipe_boot_rate" value={formData.contingency_pipe_boot_rate} onChange={handleInputChange} />
              </div>

            </div>
          )}
        </div>

        {/* SPECIAL NOTES */}
        <div className="form-section">
          <div className="form-section-header" onClick={() => toggleSection('SPECIAL_NOTES')}>
            <span>📝 SPECIAL NOTES</span>
            <span>{expandedSection === 'SPECIAL_NOTES' ? '▲' : '▼'}</span>
          </div>
          {expandedSection === 'SPECIAL_NOTES' && (
            <div className="form-section-body">
              <div className={`toggle-switch-container ${formData.special_note_gutter_enabled ? 'active' : ''}`}>
                <div className="toggle-info">
                  <strong>Show Gutters Note</strong>
                  <span>Adds optional gutter pricing to the PDF.</span>
                </div>
                <label className="switch">
                  <input type="checkbox" name="special_note_gutter_enabled" checked={formData.special_note_gutter_enabled} onChange={handleInputChange} />
                  <span className="slider"></span>
                </label>
              </div>
              {formData.special_note_gutter_enabled && (
                <div className="form-group" style={{ paddingLeft: '12px' }}>
                  <label>Gutter Amount ($)</label>
                  <input type="number" step="0.01" className="form-control" name="special_note_gutter_amount" value={formData.special_note_gutter_amount} onChange={handleInputChange} />
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', marginTop: '10px', padding: '12px' }}
          onClick={handleCalculate}
          disabled={isCalculating}
        >
          {isCalculating ? 'Calculating...' : 'Recalculate Proposal'}
        </button>

      </div>

      {/* LIVE TOTAL FOOTER */}
      <div className="sidebar-footer">
        <span className="live-total-label">Live Grand Total</span>
        <span className="live-total-value">
          ${liveTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
}