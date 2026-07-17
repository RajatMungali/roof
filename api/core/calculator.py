import math
from pydantic import BaseModel, Field

# ---------------------------------------------------------
# 1. Input Schemas 
# ---------------------------------------------------------
class RoofMeasurements(BaseModel):
    roof_area_sq: float = Field(..., description="Total roof area in Squares (100 sf = 1 SQ)")
    pitch: int = Field(..., description="Predominant pitch integer (e.g., 5 for 5:12)")
    eave_lf: float = Field(default=0.0, description="Total eave length in linear feet")
    rake_lf: float = Field(default=0.0, description="Total rake/gable length in linear feet")
    ridge_lf: float = Field(default=0.0, description="Total ridge length in linear feet")
    valley_lf: float = Field(default=0.0, description="Total valley length in linear feet")
    sidewall_lf: float = Field(default=0.0, description="Total sidewall length in linear feet")
    headwall_lf: float = Field(default=0.0, description="Total headwall length in linear feet")
    hip_lf: float = Field(default=0.0, description="Total hip length in linear feet")

class JobOptions(BaseModel):
    tear_off_layers: int = Field(default=1, description="0 for new construction, 1-3 for tear-offs")
    shingle_brand: str = Field(default="CertainTeed")
    shingle_tier: str = Field(default="Landmark Pro")
    relead_chimney: bool = Field(default=False)
    number_of_chimneys: int = Field(default=0)
    number_of_pipe_boots: int = Field(default=0)
    apply_financing: bool = Field(default=False)
    labor_rate_override: float = Field(default=None, description="Optional override for the per-square labor rate")
    misc_percentage: float = Field(default=0.02, description="Percentage added for misc materials (default 2%)")
    step_flashing_override: int = Field(default=None, description="Optional override for step flashing packs")
    warranty_type: str = Field(default="Standard")
    warranty_cost: float = Field(default=0.0)
    deck_replacement_sf: float = Field(default=0.0)
    custom_labor_override: float = Field(default=0.0)
    waste_factor: float = Field(default=0.05, description="Dynamic waste percentage (e.g. 0.20 for 20%)")

class ProposalRequest(BaseModel):
    measurements: RoofMeasurements
    options: JobOptions

# ---------------------------------------------------------
# 2. The Core Pricing Calculator
# ---------------------------------------------------------
class PricingEngine:
    PRICES = {
        "ice_and_water_roll": 82.50,     # CertainTeed WinterGuard
        "underlayment_roll": 112.65,     # CertainTeed RoofRunner
        "starter_bundle": 61.63,         # SwiftStart Starter Strip
        "shingle_sq": 147.00,            # Restored to 147.00
        "ridge_cap_bundle": 74.15,       # ShadowRidge
        "ridge_vent_pc": 14.57,          # 12" filtered Ridge Vent
        "drip_edge_pc": 12.71,           # 8" white drip edge
        "step_flashing_pack": 62.04,     # Alum Step Flashing
        "sealant_tube": 5.65,            # Geocel 3900
        "pipe_boot": 12.87,              # 3"-4" universal pipe boot
        "nails_box": 45.00,              # Restored to 45.00
        "chimney_lead": 147.46,          # Chimney lead
        "dumpster_30_yd": 950.00,
        "dumpster_20_yd": 850.00,
        "dumpster_15_yd": 625.00
    }

    @staticmethod
    def calculate_labor_rate(layers: int, pitch: int) -> float:
        """Determines the labor cost per square based on spreadsheet matrix."""
        is_steep = pitch >= 8
        
        if layers == 0:
            return 85.00 if is_steep else 75.00
        elif layers == 1:
            return 140.00 if is_steep else 130.00
        elif layers == 2:
            return 235.00 if is_steep else 150.00
        elif layers >= 3:
            return 255.00 if is_steep else 150.00
        return 130.00

    @classmethod
    def run_estimate(cls, payload: ProposalRequest) -> dict:
        m = payload.measurements
        opt = payload.options

        # ---------------------------------------------------------
        # A. Material Quantities & Formulas (Spreadsheet Match)
        # ---------------------------------------------------------
        # 1. Shingles: Roof Area + Dynamic Waste Factor
        shingle_squares = math.ceil(m.roof_area_sq * (1.0 + opt.waste_factor))
        
        # 2. Drip Edge: Eave + Rake + 20% waste -> 10' pieces
        drip_edge_pcs = math.ceil(((m.eave_lf + m.rake_lf) * 1.20) / 10)
        
        # 3. Ice & Water Shield: (Eave x2) + Valley + Headwall + Sidewall + (pipes+chimneys)*3 -> 67' rolls
        iw_lf_needed = (m.eave_lf * 2) + m.valley_lf + m.headwall_lf + m.sidewall_lf + ((opt.number_of_pipe_boots + opt.number_of_chimneys) * 3)
        iw_rolls = math.ceil(iw_lf_needed / 67) 
        iw_area_sf = iw_lf_needed * 3 # I&W roll is 3ft wide
        
        # 4. Underlayment: Total Area - I&W Area + 10% waste -> 1000sf rolls
        total_roof_sf = m.roof_area_sq * 100
        underlayment_sf_needed = max(0, total_roof_sf - iw_area_sf)
        underlayment_rolls = math.ceil((underlayment_sf_needed * 1.10) / 1000)
        
        # 5. Starter Strips: Eave + Rake + 10% waste -> 116 lf bundles
        starter_bundles = math.ceil(((m.eave_lf + m.rake_lf) * 1.10) / 116)
        
        # 6. Ridge Caps: Hip + Ridge + 10% waste -> 30 lf bundles
        ridge_cap_bundles = math.ceil(((m.hip_lf + m.ridge_lf) * 1.10) / 30)
        
        # 7. Ridge Vents: Ridge length + 10% waste -> 4' pieces
        ridge_vent_pcs = math.ceil((m.ridge_lf * 1.10) / 4)
        
        # 8. Step Flashing: Use override if present, else If 0 layers, (Sidewall x 3) + (Chimneys x 12) + 10% waste -> 100 pc packs
        if opt.step_flashing_override is not None:
            step_flashing_packs = opt.step_flashing_override
        else:
            step_flashing_packs = 0
            if opt.tear_off_layers == 0:
                step_flashing_packs = math.ceil((((m.sidewall_lf * 3) + (opt.number_of_chimneys * 12)) * 1.10) / 100)
        
        # 9. Nails: Raw roof squares + 10% waste / 15
        nail_boxes = math.ceil((m.roof_area_sq * 1.10) / 15)

        # ---------------------------------------------------------
        # B. Aggregate Material Costs & Tax
        # ---------------------------------------------------------
        materials_cost = (
            (shingle_squares * cls.PRICES["shingle_sq"]) +
            (drip_edge_pcs * cls.PRICES["drip_edge_pc"]) +
            (iw_rolls * cls.PRICES["ice_and_water_roll"]) +
            (underlayment_rolls * cls.PRICES["underlayment_roll"]) +
            (starter_bundles * cls.PRICES["starter_bundle"]) +
            (ridge_cap_bundles * cls.PRICES["ridge_cap_bundle"]) +
            (ridge_vent_pcs * cls.PRICES["ridge_vent_pc"]) +
            (step_flashing_packs * cls.PRICES["step_flashing_pack"]) +
            (nail_boxes * cls.PRICES["nails_box"]) +
            (opt.number_of_pipe_boots * cls.PRICES["pipe_boot"]) +
            (opt.number_of_chimneys * cls.PRICES["chimney_lead"]) +
            (6 * cls.PRICES["sealant_tube"]) # Hardcoded 6 tubes based on Image 3
        )

        misc_cost = materials_cost * opt.misc_percentage
        material_tax = (materials_cost + misc_cost) * 0.0625
        total_material_w_tax = materials_cost + misc_cost + material_tax

        # ---------------------------------------------------------
        # C. Labor, Dumpsters & Flat Add-ons
        # ---------------------------------------------------------
        base_labor_rate = opt.labor_rate_override if opt.labor_rate_override is not None else cls.calculate_labor_rate(opt.tear_off_layers, m.pitch)
        if opt.custom_labor_override > 0:
            base_labor_rate += opt.custom_labor_override
            
        labor_squares = shingle_squares + ((starter_bundles + ridge_cap_bundles) / 5)
        total_labor_cost = labor_squares * base_labor_rate

        # Dumpster Estimation (Equivalent squares logic)
        equivalent_sq = m.roof_area_sq * opt.tear_off_layers
        dumpster_cost = 0
        if opt.tear_off_layers > 0:
            if equivalent_sq <= 25:
                dumpster_cost = cls.PRICES["dumpster_15_yd"]
            elif equivalent_sq <= 30:
                dumpster_cost = cls.PRICES["dumpster_20_yd"]
            elif equivalent_sq <= 50:
                dumpster_cost = cls.PRICES["dumpster_30_yd"]
            else:
                dumpster_cost = math.ceil(equivalent_sq / 50) * cls.PRICES["dumpster_30_yd"]

        # Flat Add-ons
        flat_add_ons_cost = 0
        if opt.relead_chimney:
            flat_add_ons_cost += 265.00
        if opt.deck_replacement_sf > 0:
            flat_add_ons_cost += (opt.deck_replacement_sf * 5.85) / 1.40 # Divide by markup since it gets marked up later
        if opt.warranty_cost > 0:
            flat_add_ons_cost += opt.warranty_cost / 1.40 # Divide by markup since it gets marked up later

        total_subtotal_cost = total_material_w_tax + total_labor_cost + flat_add_ons_cost + dumpster_cost

        # ---------------------------------------------------------
        # D. Margins, Sell Point, and Payments
        # ---------------------------------------------------------
        ideal_sell_point = total_subtotal_cost * 1.40
            
        # Finance Fee if applicable
        financing_fee = ideal_sell_point * 0.0325 if opt.apply_financing else 0
        final_contract_price = ideal_sell_point + financing_fee
        
        # Payment splits
        deposit_due = final_contract_price * 0.30
        completion_due = final_contract_price * 0.70

        return {
            "quantities": {
                "shingle_squares": shingle_squares,
                "drip_edge_pcs": drip_edge_pcs,
                "ice_and_water_rolls": iw_rolls,
                "underlayment_rolls": underlayment_rolls,
                "starter_bundles": starter_bundles,
                "ridge_cap_bundles": ridge_cap_bundles,
                "ridge_vent_pcs": ridge_vent_pcs,
                "step_flashing_packs": step_flashing_packs,
                "nail_boxes": nail_boxes
            },
            "financials": {
                "total_cost": round(total_subtotal_cost, 2),
                "materials_tax": round(material_tax, 2),
                "margin_sell_point": round(ideal_sell_point, 2),
                "financing_fee": round(financing_fee, 2),
                "final_contract_price": round(final_contract_price, 2),
                "deposit_due": round(deposit_due, 2),
                "completion_due": round(completion_due, 2)
            }
        }