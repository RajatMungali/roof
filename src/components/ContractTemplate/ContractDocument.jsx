import React, { useRef } from "react";
import html2pdf from "html2pdf.js";
import PageWrapper from "../ProposalTemplate/PageWrapper";
import { ScopePart1, ScopePart2 } from "../ProposalTemplate/ProposalScope";
import { TermsPart1, TermsPart2 } from "../ProposalTemplate/ProposalTerms";
import { LegalPart1, LegalPart2 } from "../ProposalTemplate/LegalTerms";

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function ContractHeader({ formData, proposalNumber }) {
  const customerName = formData?.customer_name || "Customer";
  const customerAddress = formData?.customer_address || "Property Address";

  const manufacturer = formData?.manufacturer || "CertainTeed";

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
        }}
      >
        <div style={{ flex: 1 }}>
          <img
            src="/MasterElite-Logo.png"
            alt="Certification"
            style={{
              width: "180px",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </div>

        <div
          style={{
            flex: 1,
            textAlign: "center",
          }}
        >
          <img
            src="/Kidd-Luukko.png"
            alt="Company Logo"
            style={{
              width: "220px",
              height: "auto",
              objectFit: "contain",
            }}
          />
        </div>

        <div
          style={{
            flex: 1,
            textAlign: "right",
            fontSize: "10px",
            color: "#1a4387",
            fontWeight: "bold",
          }}
        >
          <p
            style={{
              margin: "0 0 10px",
              fontStyle: "italic",
            }}
          >
            Proposal #{proposalNumber}
          </p>

          <p style={{ margin: 0 }}>Tel 508.799.9500</p>
          <p style={{ margin: 0 }}>Fax 508.792.3745</p>
          <p style={{ margin: 0 }}>23 North Street</p>
          <p style={{ margin: 0 }}>Worcester, MA 01605</p>

          <p
            style={{
              marginTop: "10px",
              color: "#333",
              fontWeight: "normal",
            }}
          >
            Date: {today}
          </p>
        </div>
      </div>

      {/* CUSTOMER */}
      <div
        style={{
          fontSize: "13px",
          lineHeight: "1.4",
        }}
      >
        <p style={{ margin: 0 }}>{customerName} Residence</p>

        <p style={{ margin: 0 }}>Attn: {customerName}</p>

        <p style={{ margin: 0 }}>{customerAddress}</p>

        <p style={{ margin: 0 }}>RE: Roof Replacement</p>
      </div>

      {/* INTRO */}
      <p
        style={{
          marginTop: "18px",
          fontSize: "13px",
          lineHeight: "1.4",
        }}
      >
        Thank you for considering Kidd-Luukko to replace your home's roof. Upon
        review of the existing building at {customerAddress}, we have prepared
        the following proposal for your review utilizing materials from{" "}
        {manufacturer}. Please be sure the scope aligns with your expectations.
      </p>
    </div>
  );
}

export default function ContractDocument({
  proposalData,
  formData,
  proposalNumber = "AUTO",
}) {
  // The contract uses the finalized proposal data directly.
  // NO recalculation happens here.
  const calculatedData = proposalData;
  const componentRef = useRef(null);

  const handleDownloadPDF = async () => {
    const element = componentRef.current;

    if (!element) {
      alert("Contract document is not ready.");
      return;
    }

    element.classList.add("pdf-export-mode");

    await new Promise((resolve) => setTimeout(resolve, 50));

    const opt = {
      margin: 0,
      filename: `Contract_${proposalNumber}.pdf`,
      image: {
        type: "jpeg",
        quality: 0.98,
      },
      html2canvas: {
        scale: 2,
      },
      jsPDF: {
        unit: "in",
        format: "letter",
        orientation: "portrait",
      },
    };

    try {
      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Contract PDF generation failed:", error);
      alert("Error downloading contract PDF.");
    } finally {
      element.classList.remove("pdf-export-mode");
    }
  };

  // Prefer the original form data saved with the finalized proposal.
  const contractFormData = proposalData?.rawFormData || formData || {};

  if (!calculatedData) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
        }}
      >
        <h2>No finalized proposal data found</h2>
        <p>This contract can only be generated from a finalized proposal.</p>

        <button className="btn-primary" onClick={() => window.history.back()}>
          Back
        </button>
      </div>
    );
  }

  const { quantities, financials, options, contingency_rates, special_notes } =
    calculatedData;

  return (
    <div>
      {/* CONTRACT ACTIONS */}
      <div
        style={{
          width: "8.5in",
          margin: "0 auto 20px auto",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          className="btn-secondary"
          onClick={() => window.history.back()}
          style={{
            backgroundColor: "#000",
            color: "#fff",
          }}
        >
          ← Back to Jobs
        </button>

        <button className="btn-primary" onClick={handleDownloadPDF}>
          💾 Download Contract PDF
        </button>
      </div>

      {/* CONTRACT DOCUMENT */}
      <div
        ref={componentRef}
        style={{
          width: "8.5in",
          margin: "0 auto",
        }}
      >
        {/* PAGE 1 */}
        <PageWrapper>
          <ContractHeader
            formData={contractFormData}
            proposalNumber={proposalNumber}
          />

          <ScopePart1
            quantities={quantities}
            financials={financials}
            options={options}
            tearOffs={options?.tear_off_layers}
            contingencyRates={contingency_rates}
            mode="expressive"
          />
        </PageWrapper>

        {/* PAGE 2 */}
        <PageWrapper>
          <ScopePart2
            quantities={quantities}
            financials={financials}
            options={options}
            contingencyRates={contingency_rates}
            totalCostStr={formatMoney(financials?.final_contract_price)}
            mode="expressive"
          />
        </PageWrapper>

        {/* PAGE 3 */}
        <PageWrapper>
          <TermsPart1
            financials={financials}
            mode="expressive"
            hidePaymentTerms={true}
            hideVisaText={false}
          />

          <div
            style={{
              marginTop: "20px",
              borderTop: "1px solid #333",
              paddingTop: "12px",
            }}
          >
            <h3
              style={{
                fontSize: "14px",
                margin: "0 0 10px",
              }}
            >
              Payment Terms
            </h3>

            <div
              style={{
                fontSize: "12px",
                lineHeight: "1.7",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <strong>Deposit Due Upon Signing:</strong>
                <span>{formatMoney(financials?.deposit_due)}</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <strong>Remainder Due Upon Completion:</strong>
                <span>
                  {formatMoney(
                    (financials?.final_contract_price || 0) -
                      (financials?.deposit_due || 0),
                  )}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <strong>Total Payments Due:</strong>
                <span>{formatMoney(financials?.final_contract_price)}</span>
              </div>
            </div>
          </div>
        </PageWrapper>

        {/* PAGE 4 */}
        <PageWrapper>
          <TermsPart2 specialNotes={special_notes} />

          <div
            style={{
              marginTop: "20px",
              fontSize: "12px",
            }}
          >
            <strong>Work Dates:</strong>

            <p style={{ margin: "8px 0" }}>Work Start Date: TBD</p>

            <p style={{ margin: "8px 0" }}>Work Completion Date: TBD</p>
          </div>
        </PageWrapper>

        {/* PAGE 5 */}
        <PageWrapper>
          <LegalPart1 />
        </PageWrapper>

        {/* PAGE 6 */}
        <PageWrapper>
          <LegalPart2 />
        </PageWrapper>
      </div>
    </div>
  );
}
