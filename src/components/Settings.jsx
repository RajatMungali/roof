import React, { useEffect, useState } from "react";

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const loadSettings = async () => {
    try {
      const rawBase = import.meta.env.VITE_API_BASE_URL || "";
      const apiBase = rawBase.replace(/\/+$/, "");

      const response = await fetch(`${apiBase}/api/settings`);

      if (!response.ok) {
        throw new Error("Failed to load pricing settings");
      }

      const result = await response.json();

      if (result.status === "success") {
        setSettings(result.data);
      }
    } catch (error) {
      console.error(error);
      setMessage("Failed to load settings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateMaterialPrice = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      material_prices: {
        ...prev.material_prices,
        [key]: Number(value),
      },
    }));
  };

  const updateLaborRate = (roofType, pitchType, value) => {
    setSettings((prev) => ({
      ...prev,
      labor_rates: {
        ...prev.labor_rates,
        [roofType]: {
          ...prev.labor_rates[roofType],
          [pitchType]: Number(value),
        },
      },
    }));
  };

  const updateDefault = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      defaults: {
        ...prev.defaults,
        [key]: Number(value),
      },
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const rawBase = import.meta.env.VITE_API_BASE_URL || "";
      const apiBase = rawBase.replace(/\/+$/, "");

      const response = await fetch(`${apiBase}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error("Failed to save settings");
      }

      const result = await response.json();

      if (result.status === "success") {
        setSettings(result.data);
        setMessage("Settings saved successfully.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div style={{ padding: "30px" }}>Loading settings...</div>;
  }

  if (!settings) {
    return <div style={{ padding: "30px" }}>Unable to load settings.</div>;
  }

  return (
    <div
      style={{
        flexGrow: 1,
        overflow: "auto",
        padding: "30px",
        backgroundColor: "var(--bg-canvas)",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1>Pricing Settings</h1>

        <p style={{ color: "#666" }}>
          These values are used as defaults for new estimates. Individual jobs
          can still use their own overrides.
        </p>

        {/* DEFAULTS */}
        <section className="form-section">
          <div className="form-section-header">
            <span>DEFAULT PRICING</span>
          </div>

          <div className="form-section-body">
            <div className="row">
              <div className="col form-group">
                <label>Waste Percentage (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.defaults.waste_percentage}
                  onChange={(e) =>
                    updateDefault("waste_percentage", e.target.value)
                  }
                />
              </div>

              <div className="col form-group">
                <label>Misc Percentage (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.defaults.misc_percentage * 100}
                  onChange={(e) =>
                    updateDefault(
                      "misc_percentage",
                      Number(e.target.value) / 100,
                    )
                  }
                />
              </div>

              <div className="col form-group">
                <label>Markup Percentage (%)</label>
                <input
                  type="number"
                  className="form-control"
                  value={settings.defaults.markup_percentage}
                  onChange={(e) =>
                    updateDefault("markup_percentage", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        </section>

        {/* LABOR */}
        <section className="form-section" style={{ marginTop: "20px" }}>
          <div className="form-section-header">
            <span>LABOR RATES ($ / SQ)</span>
          </div>

          <div className="form-section-body">
            {Object.entries(settings.labor_rates).map(([roofType, rates]) => (
              <div key={roofType} className="row">
                <div className="col form-group">
                  <label>
                    {roofType
                      .replace("_", " ")
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </label>
                </div>

                <div className="col form-group">
                  <label>Normal Pitch</label>
                  <input
                    type="number"
                    className="form-control"
                    value={rates.normal}
                    onChange={(e) =>
                      updateLaborRate(roofType, "normal", e.target.value)
                    }
                  />
                </div>

                <div className="col form-group">
                  <label>Steep Pitch</label>
                  <input
                    type="number"
                    className="form-control"
                    value={rates.steep}
                    onChange={(e) =>
                      updateLaborRate(roofType, "steep", e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* MATERIALS */}
        <section className="form-section" style={{ marginTop: "20px" }}>
          <div className="form-section-header">
            <span>MATERIAL PRICES</span>
          </div>

          <div className="form-section-body">
            {Object.entries(settings.material_prices).map(([key, value]) => (
              <div
                key={key}
                className="form-group"
                style={{ marginBottom: "12px" }}
              >
                <label>
                  {key
                    .replaceAll("_", " ")
                    .replace(/\b\w/g, (c) => c.toUpperCase())}
                </label>

                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={value}
                  onChange={(e) => updateMaterialPrice(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        </section>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            marginTop: "25px",
          }}
        >
          <button
            className="btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </button>

          {message && <span style={{ color: "#555" }}>{message}</span>}
        </div>
      </div>
    </div>
  );
}
