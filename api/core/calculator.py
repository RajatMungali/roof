import math
from pydantic import BaseModel, Field
from settings import load_pricing_settings

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

    # Material selections
    manufacturer: str = Field(default="CertainTeed")
    shingle_brand: str = Field(default="CertainTeed")
    shingle_tier: str = Field(default="Landmark Pro")

    # Optional add-ons
    relead_chimney: bool = Field(default=False)
    number_of_chimneys: int = Field(default=0)
    number_of_pipe_boots: int = Field(default=0)
    ridge_vent: bool = Field(default=True)
    new_skylights: int = Field(default=0)
    remove_satellite: bool = Field(default=False)

    # Financial options
    apply_financing: bool = Field(default=False)
    markup_percentage: float = Field(default=40.0)
    labor_rate_override: float = Field(
        default=None,
        description="Optional override for the per-square labor rate"
    )
    misc_percentage: float = Field(
        default=0.02,
        description="Percentage added for misc materials (default 2%)"
    )

    # Overrides
    step_flashing_override: int = Field(
        default=None,
        description="Optional override for step flashing packs"
    )
    warranty_type: str = Field(default="Standard")
    warranty_cost: float = Field(default=0.0)
    deck_replacement_sf: float = Field(default=0.0)
    custom_labor_override: float = Field(default=0.0)

    # Waste
    waste_factor: float = Field(
        default=0.05,
        description="Dynamic waste percentage (e.g. 0.20 for 20%)"
    )

class ProposalRequest(BaseModel):
    measurements: RoofMeasurements
    options: JobOptions

# ---------------------------------------------------------
# 2. The Core Pricing Calculator
# ---------------------------------------------------------
class PricingEngine:

    @staticmethod
    def get_settings():
        return load_pricing_settings()

    @classmethod
    def get_prices(cls):
        return cls.get_settings()["material_prices"]

    @classmethod
    def calculate_labor_rate(cls, layers: int, pitch: int) -> float:
        """Determines labor cost from saved pricing settings."""

        labor_rates = cls.get_settings()["labor_rates"]

        is_steep = pitch >= 8
        roof_type = "steep" if is_steep else "normal"

        if layers == 0:
            return labor_rates["new_construction"][roof_type]
        elif layers == 1:
            return labor_rates["one_layer"][roof_type]
        elif layers == 2:
            return labor_rates["two_layers"][roof_type]
        elif layers >= 3:
            return labor_rates["three_layers"][roof_type]

        return labor_rates["one_layer"][roof_type]
    

    @classmethod
    def run_estimate(cls, payload: ProposalRequest) -> dict:
        m = payload.measurements
        opt = payload.options
        prices = cls.get_prices()

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
        
        # 7. Ridge Vents: only calculate if the option is enabled
        ridge_vent_pcs = 0

        if opt.ridge_vent:
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
        # Skylights
        skylight_cost = opt.new_skylights * prices["skylight"]
        materials_cost = (
            (shingle_squares * prices["shingle_sq"]) +
            (drip_edge_pcs * prices["drip_edge_pc"]) +
            (iw_rolls * prices["ice_and_water_roll"]) +
            (underlayment_rolls * prices["underlayment_roll"]) +
            (starter_bundles * prices["starter_bundle"]) +
            (ridge_cap_bundles * prices["ridge_cap_bundle"]) +
            (ridge_vent_pcs * prices["ridge_vent_pc"]) +
            (step_flashing_packs * prices["step_flashing_pack"]) +
            (nail_boxes * prices["nails_box"]) +
            (opt.number_of_pipe_boots * prices["pipe_boot"]) +
            (opt.number_of_chimneys * prices["chimney_lead"]) +
            (6 * prices["sealant_tube"]) +
            skylight_cost
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
                dumpster_cost = prices["dumpster_15_yd"]
            elif equivalent_sq <= 30:
                dumpster_cost = prices["dumpster_20_yd"]
            elif equivalent_sq <= 50:
                dumpster_cost = prices["dumpster_30_yd"]
            else:
                dumpster_cost = math.ceil(equivalent_sq / 50) * prices["dumpster_30_yd"]

        # Flat Add-ons
        # Flat Add-ons
        # Flat Add-ons
        flat_add_ons_cost = 0

        markup_multiplier = 1.0 + (opt.markup_percentage / 100.0)

        if opt.relead_chimney:
            flat_add_ons_cost += prices["chimney_relead"]

        if opt.deck_replacement_sf > 0:
            flat_add_ons_cost += (
                opt.deck_replacement_sf * prices["deck_replacement_sf"]
            ) / markup_multiplier

        if opt.warranty_cost > 0:
            flat_add_ons_cost += (
                opt.warranty_cost
            ) / markup_multiplier

        total_subtotal_cost = total_material_w_tax + total_labor_cost + flat_add_ons_cost + dumpster_cost

        # ---------------------------------------------------------
        # D. Margins, Sell Point, and Payments
        # ---------------------------------------------------------
        markup_multiplier = 1.0 + (opt.markup_percentage / 100.0)
        ideal_sell_point = total_subtotal_cost * markup_multiplier
            
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
            "nail_boxes": nail_boxes,
            "pipe_boots": opt.number_of_pipe_boots,
            "chimneys": opt.number_of_chimneys,
            "skylights": opt.new_skylights,
        },

        "financials": {
            "total_cost": round(total_subtotal_cost, 2),
            "materials_tax": round(material_tax, 2),
            "margin_sell_point": round(ideal_sell_point, 2),
            "financing_fee": round(financing_fee, 2),
            "final_contract_price": round(final_contract_price, 2),
            "deposit_due": round(deposit_due, 2),
            "completion_due": round(completion_due, 2)
        },

        "options": {
            "manufacturer": opt.manufacturer,
            "shingle_tier": opt.shingle_tier,
            "tear_off_layers": opt.tear_off_layers,
            "number_of_pipe_boots": opt.number_of_pipe_boots,
            "relead_chimney": opt.relead_chimney,
            "number_of_chimneys": opt.number_of_chimneys,
            "ridge_vent": opt.ridge_vent,
            "new_skylights": opt.new_skylights,
            "markup_percentage": opt.markup_percentage,
            "apply_financing": opt.apply_financing,
            "warranty_type": opt.warranty_type,
        }
    }