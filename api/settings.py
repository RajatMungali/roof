import json
from pathlib import Path

SETTINGS_FILE = Path(__file__).parent / "data" / "pricing_settings.json"


def load_pricing_settings():
    """Load pricing defaults from the persistent JSON file."""
    if not SETTINGS_FILE.exists():
        raise FileNotFoundError(
            f"Pricing settings file not found: {SETTINGS_FILE}"
        )

    with open(SETTINGS_FILE, "r", encoding="utf-8") as file:
        return json.load(file)


def save_pricing_settings(settings):
    """Save updated pricing defaults."""
    SETTINGS_FILE.parent.mkdir(parents=True, exist_ok=True)

    with open(SETTINGS_FILE, "w", encoding="utf-8") as file:
        json.dump(settings, file, indent=2)


def get_material_prices():
    return load_pricing_settings()["material_prices"]


def get_labor_rates():
    return load_pricing_settings()["labor_rates"]


def get_pricing_defaults():
    return load_pricing_settings()["defaults"]