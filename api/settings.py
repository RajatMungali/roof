import os
import json
from sqlalchemy import create_engine, text

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

def load_pricing_settings():
    with engine.connect() as conn:
        result = conn.execute(
            text("SELECT settings FROM pricing_settings WHERE id = 1")
        ).fetchone()

        if result:
            return json.loads(result[0])

        return {
            "material_prices": {},
            "labor_rates": {},
            "defaults": {}
        }


def save_pricing_settings(settings):
    settings_json = json.dumps(settings)

    with engine.begin() as conn:
        conn.execute(
            text("""
                INSERT INTO pricing_settings (id, settings)
                VALUES (1, :settings)
                ON CONFLICT (id)
                DO UPDATE SET settings = :settings
            """),
            {"settings": settings_json}
        )


def get_material_prices():
    return load_pricing_settings()["material_prices"]


def get_labor_rates():
    return load_pricing_settings()["labor_rates"]


def get_pricing_defaults():
    return load_pricing_settings()["defaults"]