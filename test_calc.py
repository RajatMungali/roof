import requests
import json
tim_data = { "customer_name": "Tim Lamoureux", "customer_address": "39 Town Farm Road, Brookfield MA", "roof_area_sq": 23.0, "pitch": 5, "eave_lf": 120.5, "rake_lf": 80.0, "ridge_lf": 40.0, "valley_lf": 20.0, "sidewall_lf": 15.0, "headwall_lf": 10.0, "hip_lf": 0, "waste_factor": 5, "manufacturer": "CertainTeed", "shingle_tier": "Landmark Pro", "tear_off_layers": 2, "pipe_boots": 1, "chimney_relead": True, "num_chimneys": 1, "step_flashing_override": 0, "special_note_gutter_enabled": True, "special_note_gutter_amount": 3612.00, "ridge_vent": True, "skylights": 0, "satellite": False, "roof_deck_type": "plywood", "apply_financing": False, "markup_percentage": 40.0, "warranty_type": "Standard", "warranty_cost": 0, "deck_replacement_sf": 0, "custom_labor_override": 0, "contingency_plywood_rate": 5.85, "contingency_ledger_rate": 8.85, "contingency_pipe_boot_rate": 85.00 }
john_data = { "customer_name": "John Smith", "customer_address": "130 Cross Rd", "roof_area_sq": 20.0, "pitch": 6, "eave_lf": 100, "rake_lf": 70, "ridge_lf": 30, "valley_lf": 10, "sidewall_lf": 10, "headwall_lf": 5, "hip_lf": 10, "waste_factor": 10, "manufacturer": "GAF", "shingle_tier": "Landmark", "tear_off_layers": 1, "pipe_boots": 2, "chimney_relead": False, "num_chimneys": 0, "step_flashing_override": 0, "special_note_gutter_enabled": False, "special_note_gutter_amount": 0, "ridge_vent": True, "skylights": 1, "satellite": False, "roof_deck_type": "plywood", "apply_financing": True, "markup_percentage": 35.0, "warranty_type": "Standard", "warranty_cost": 0, "deck_replacement_sf": 0, "custom_labor_override": 0, "contingency_plywood_rate": 5.85, "contingency_ledger_rate": 8.85, "contingency_pipe_boot_rate": 85.00 }
try:
    res_tim = requests.post("http://127.0.0.1:8000/api/calculate", json={"options": tim_data, "customer_metadata": {}})
    print("Tim:", res_tim.json()["data"]["financials"]["final_contract_price"])
    res_john = requests.post("http://127.0.0.1:8000/api/calculate", json={"options": john_data, "customer_metadata": {}})
    print("John:", res_john.json()["data"]["financials"]["final_contract_price"])
except Exception as e:
    print(e)
