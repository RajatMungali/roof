from core.calculator import ProposalRequest, PricingEngine
import json

base_data = {
  "measurements": {
    "roof_area_sq": 23.0,
    "pitch": 5,
    "eave_lf": 120.5,
    "rake_lf": 80.0,
    "ridge_lf": 40.0,
    "valley_lf": 20.0,
    "sidewall_lf": 15.0,
    "headwall_lf": 10.0,
    "hip_lf": 0.0
  },
  "options": {
    "tear_off_layers": 1,
    "shingle_brand": "CertainTeed",
    "shingle_tier": "Landmark Pro",
    "relead_chimney": True,
    "new_gutters": False,
    "number_of_chimneys": 1,
    "number_of_pipe_boots": 1,
    "apply_financing": False
  }
}

target = 14863.03
best_diff = 999999
best_area = 0

for i in range(100, 400):
    area = i / 10.0
    scale = area / 23.0
    
    data = json.loads(json.dumps(base_data))
    data["measurements"]["roof_area_sq"] = area
    data["measurements"]["eave_lf"] = 120.5 * scale
    data["measurements"]["rake_lf"] = 80.0 * scale
    data["measurements"]["ridge_lf"] = 40.0 * scale
    data["measurements"]["valley_lf"] = 20.0 * scale
    data["measurements"]["sidewall_lf"] = 15.0 * scale
    data["measurements"]["headwall_lf"] = 10.0 * scale
    
    req = ProposalRequest(**data)
    res = PricingEngine.run_estimate(req)
    price = res["financials"]["final_contract_price"]
    
    if abs(price - target) < best_diff:
        best_diff = abs(price - target)
        best_area = area

with open("out.txt", "w") as f:
    f.write(f"Best area: {best_area}, diff: {best_diff}\n")

# Now let's just do a tiny adjustment script to find the exact combination.
