from core.calculator import ProposalRequest, PricingEngine
import json

data = {
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
    "tear_off_layers": 2,
    "shingle_brand": "CertainTeed",
    "shingle_tier": "Landmark Pro",
    "relead_chimney": True,
    "new_gutters": True,
    "number_of_chimneys": 1,
    "number_of_pipe_boots": 2,
    "apply_financing": True
  }
}

req = ProposalRequest(**data)
res = PricingEngine.run_estimate(req)
print(json.dumps(res, indent=2))
