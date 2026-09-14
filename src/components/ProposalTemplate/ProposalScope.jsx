import React from "react";

export function ScopePart1({
  quantities,
  financials,
  options,
  tearOffs,
  contingencyRates,
  mode = "expressive",
}) {
  if (mode === "detailed") {
    return (
      <>
        <p
          style={{
            fontWeight: "bold",
            textDecoration: "underline",
            marginBottom: "15px",
          }}
        >
          We propose the following scope of work:
        </p>

        <ul
          style={{
            marginTop: "0",
            paddingLeft: "20px",
            listStyleType: "disc",
            lineHeight: "1.8",
          }}
        >
          <li>
            <strong>Prep:</strong> Tear off {tearOffs} layer(s) and prepare roof
            deck.
          </li>

          <li>
            <strong>Edge Treatment:</strong> Install F8 style drip edge (
            {quantities?.drip_edge_pcs || 0} pcs).
          </li>

          <li>
            <strong>Underlayment:</strong> Install Ice &amp; Water shield and
            Synthetic underlayment.
          </li>
        </ul>
      </>
    );
  }

  return (
    <>
      <p
        style={{
          fontWeight: "bold",
          textDecoration: "underline",
          marginBottom: "15px",
        }}
      >
        We propose the following scope of work:
      </p>

      {/* PREP */}
      <p style={{ fontWeight: "bold", marginBottom: "5px" }}>Prep:</p>

      <ul
        style={{
          marginTop: "0",
          paddingLeft: "20px",
          listStyleType: "disc",
        }}
      >
        <li>
          Obtain roofing permit and perform asbestos test{" "}
          <em>(cost not included – to be added to final invoice)</em>.
        </li>

        <li>
          Luukko will set up tarps around roof edges to guide roof debris and
          mitigate potential damage to the home’s exterior. Dumpster will be on
          site prior to the start of removal and installation.
        </li>

        <li>
          Remove and properly dispose of existing asphalt shingle roofing and
          accessories down to roof deck. Roof is to consist of {tearOffs}{" "}
          layer(s) of unregulated asphalt shingles. Should additional/differing
          underlying layers such as slates, wood shakes/shingles, asbestos be
          present, Kidd-Luukko Corporation reserves the right to charge
          appropriately for additional labor and disposal costs.
        </li>

        <li>
          Soft spots in existing roof will be investigated for damaged,
          deteriorated or rotted material. Results will be provided to customer
          and repair/replacement/recovery can be provided for{" "}
          <strong>${(contingencyRates?.plywood ?? 5.85).toFixed(2)}/sf</strong>{" "}
          for 1/2” plywood, and{" "}
          <strong>${(contingencyRates?.ledger ?? 8.85).toFixed(2)}/lf</strong>{" "}
          for 1 x 8 ledger board. Square footage in excess of 32sf will be
          performed only with customer's pre-approval. Concrete/gypsum deck
          repair not offered.
        </li>

        <li>Existing fascia and rake boards to remain.</li>
      </ul>

      {/* EDGE TREATMENT */}
      <p
        style={{
          fontWeight: "bold",
          marginBottom: "5px",
          marginTop: "15px",
        }}
      >
        Edge Treatment:
      </p>

      <ul
        style={{
          marginTop: "0",
          paddingLeft: "20px",
          listStyleType: "disc",
        }}
      >
        <li>
          Furnish and install F8 style drip edge in .019 aluminum in white
          color. ({quantities?.drip_edge_pcs || 0} pcs)
        </li>
      </ul>

      {/* UNDERLAYMENT */}
      <p
        style={{
          fontWeight: "bold",
          marginBottom: "5px",
          marginTop: "15px",
        }}
      >
        Underlayment:
      </p>

      <ul
        style={{
          marginTop: "0",
          paddingLeft: "20px",
          listStyleType: "disc",
        }}
      >
        <li>
          Furnish and install ice and water shield at all eaves, 2 courses at
          eaves. Additional to be placed at soil stack, penetrations and
          chimney.
        </li>

        <li>
          Furnish and install synthetic underlayment on the balance of the roof
          deck.
        </li>
      </ul>
    </>
  );
}

export function ScopePart2({
  quantities,
  financials,
  options,
  totalCostStr,
  contingencyRates,
  mode = "expressive",
}) {
  const manufacturer = options?.manufacturer || "CertainTeed";
  const shingleTier = options?.shingle_tier || "Landmark Pro";
  const pipeBoots = options?.number_of_pipe_boots || 0;
  const chimneys = options?.number_of_chimneys || 0;
  const skylights = options?.new_skylights || 0;
  const ridgeVentPieces = quantities?.ridge_vent_pcs || 0;

  const warrantyType = options?.warranty_type || "Standard";

  if (mode === "detailed") {
    return (
      <>
        <ul
          style={{
            marginTop: "0",
            paddingLeft: "20px",
            listStyleType: "disc",
            lineHeight: "1.4",
          }}
        >
          <li>
            <strong>Shingles:</strong> Install upgraded {manufacturer}{" "}
            {shingleTier} architectural shingles (
            {quantities?.shingle_squares || 0} squares).
          </li>

          <li>
            <strong>Penetrations:</strong> Flash {pipeBoots} pipe boots.
          </li>

          <li>
            <strong>Drainage:</strong>{" "}
            {options?.new_gutters
              ? 'Install new 5" seamless aluminum raingutters.'
              : "Existing gutters to remain."}
          </li>

          {options?.ridge_vent && (
            <li>
              <strong>Accessories:</strong> Install 12" filtered ridge vent (
              {ridgeVentPieces} pcs).
            </li>
          )}

          {chimneys > 0 && (
            <li>
              <strong>Chimney:</strong>{" "}
              {options?.relead_chimney
                ? `Re-lead and flash ${chimneys} chimney${
                    chimneys === 1 ? "" : "s"
                  }.`
                : `Existing chimney flashing to remain for ${chimneys} chimney${
                    chimneys === 1 ? "" : "s"
                  }.`}
            </li>
          )}

          <li>
            <strong>Skylights:</strong>{" "}
            {skylights > 0
              ? `${skylights} skylight${skylights === 1 ? "" : "s"} included.`
              : "N/A."}
          </li>

          <li>
            <strong>Close-out &amp; Warranty:</strong> Full clean-up.{" "}
            {warrantyType} warranty included.
          </li>
        </ul>
      </>
    );
  }

  return (
    <>
      {/* SHINGLES */}
      <p style={{ fontWeight: "bold", marginBottom: "5px" }}>Shingles:</p>

      <ul
        style={{
          marginTop: "0",
          paddingLeft: "20px",
          listStyleType: "disc",
        }}
      >
        <li>Installation of starter strips at eaves and rakes.</li>

        <li>
          Furnish and install {manufacturer} {shingleTier} architectural
          shingles ({quantities?.shingle_squares || 0} squares). Shingles shall
          be nailed to substrate with pneumatically driven fasteners (six nails
          per shingle). Color to be selected by customer, as chosen from
          provided samples in standard color palette (subject to availability).
        </li>

        <li>
          Installation of premium cap shingles at ridges (color to match
          shingles).
        </li>
      </ul>

      {/* PENETRATIONS */}
      <p
        style={{
          fontWeight: "bold",
          marginBottom: "5px",
          marginTop: "15px",
        }}
      >
        Penetrations:
      </p>

      <ul
        style={{
          marginTop: "0",
          paddingLeft: "20px",
          listStyleType: "disc",
        }}
      >
        <li>
          <strong>
            Properly <em>flash</em> all existing equipment:
          </strong>

          <ul
            style={{
              listStyleType: "circle",
              paddingLeft: "20px",
              marginTop: "5px",
            }}
          >
            <li>
              {pipeBoots} stack style flashings. Pipe boot to feature an
              aluminum base and elastomeric seal. Additional universal pipe
              boots offered at{" "}
              <strong>
                ${(contingencyRates?.pipe_boot ?? 85.0).toFixed(2)}/ea
              </strong>
              .
            </li>

            <li>No new mechanical penetrations are included.</li>
          </ul>
        </li>
      </ul>

      {/* DRAINAGE */}
      <p
        style={{
          fontWeight: "bold",
          marginBottom: "5px",
          marginTop: "15px",
        }}
      >
        Drainage:
      </p>

      <ul
        style={{
          marginTop: "0",
          paddingLeft: "20px",
          listStyleType: "disc",
        }}
      >
        {options?.new_gutters ? (
          <li>
            Remove existing and install new 5" white "ogee"-style seamless
            aluminum raingutters and 2x3 downspouts.
          </li>
        ) : (
          <li>
            No gutters are included. Existing are to remain. See below for more
            information.
          </li>
        )}
      </ul>

      {/* ACCESSORIES */}
      {options?.ridge_vent && (
        <>
          <p
            style={{
              fontWeight: "bold",
              marginBottom: "5px",
              marginTop: "15px",
            }}
          >
            Accessories:
          </p>

          <ul
            style={{
              marginTop: "0",
              paddingLeft: "20px",
              listStyleType: "disc",
            }}
          >
            <li>
              Furnish and install 12" filtered ridge vent at all ridges (
              {ridgeVentPieces} pcs).
            </li>
          </ul>
        </>
      )}

      {/* CHIMNEY */}
      {chimneys > 0 && (
        <>
          <p
            style={{
              fontWeight: "bold",
              marginBottom: "5px",
              marginTop: "15px",
            }}
          >
            Chimney:
          </p>

          <ul
            style={{
              marginTop: "0",
              paddingLeft: "20px",
              listStyleType: "disc",
            }}
          >
            {options?.relead_chimney ? (
              <>
                <li>
                  Existing lead counter-flashing will be ground out and replaced
                  with new lead and elastomeric sealant ({chimneys} chimney
                  {chimneys === 1 ? "" : "s"}).
                </li>

                <li>
                  New aluminum step-flashing assembly will be fabricated and
                  installed at base of chimney.
                </li>
              </>
            ) : (
              <li>
                Existing chimney flashing to remain as-is ({chimneys} chimney
                {chimneys === 1 ? "" : "s"}).
              </li>
            )}
          </ul>
        </>
      )}

      {/* SKYLIGHTS */}
      <p
        style={{
          fontWeight: "bold",
          marginBottom: "5px",
          marginTop: "15px",
        }}
      >
        Skylights:
      </p>

      <ul
        style={{
          marginTop: "0",
          paddingLeft: "20px",
          listStyleType: "disc",
        }}
      >
        <li>
          {skylights > 0
            ? `Provide and install flashing for ${skylights} skylight${
                skylights === 1 ? "" : "s"
              }.`
            : "N/A."}
        </li>
      </ul>

      {/* CLOSE-OUT */}
      <p
        style={{
          fontWeight: "bold",
          marginBottom: "5px",
          marginTop: "15px",
        }}
      >
        Close-out:
      </p>

      <ul
        style={{
          marginTop: "0",
          paddingLeft: "20px",
          listStyleType: "disc",
        }}
      >
        <li>
          Removal of associated construction debris to be disposed of in proper
          fashion - premises to be magnetically swept and left in broom clean
          condition.
        </li>

        <li>
          Any additional work not outlined in this scope of work is offered at{" "}
          <strong>$115.00/man-hour</strong> plus the cost of materials.
        </li>

        <li>Provide Kidd-Luukko 2-Year Workmanship Warranty.</li>

        {warrantyType === "System Plus" ? (
          <li>
            Furnish GAF System Plus Weather Stopper Warranty at completion of
            work and receipt of final payment. (50 Year Material Warranty).
          </li>
        ) : warrantyType === "Golden Pledge" ? (
          <li>
            Furnish GAF Golden Pledge Warranty at completion of work and receipt
            of final payment. (50 Year Material + 25 Year Workmanship Warranty
            backed by GAF).
          </li>
        ) : (
          <li>
            Furnish CertainTeed 4-STAR Lifetime Warranty at completion of work
            and receipt of final payment. (50 Year Material + 15 Year
            Workmanship Warranty backed by CertainTeed).
          </li>
        )}
      </ul>

      {/* FINAL PRICE STATEMENT */}
      <div
        style={{
          textAlign: "center",
          marginTop: "40px",
          fontWeight: "bold",
          fontSize: "15px",
        }}
      >
        Luukko Corporation can furnish materials and labor for an investment of
        <br />
        {totalCostStr}.
      </div>
    </>
  );
}
