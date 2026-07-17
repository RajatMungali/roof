import xml.etree.ElementTree as ET
import logging
from typing import Dict, Any

# Configure basic logging for webhook debugging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

class GAFXMLParser:
    """
    Parses structural XML payloads from the GAF Digital Design API.
    Extracts spatial dimensions and predominant pitch, formatting them
    to match the RoofMeasurements Pydantic schema.
    """

    @staticmethod
    def parse_payload(xml_string: str) -> Dict[str, Any]:
        """
        Takes the raw XML string from the webhook, traverses the nodes, 
        and returns a standardized dictionary.
        """
        try:
            # Parse the raw XML string into an ElementTree object
            root = ET.fromstring(xml_string)
            
            # Helper function to safely extract and convert text to float
            def get_float(tag_path: str, default: float = 0.0) -> float:
                element = root.find(tag_path)
                if element is not None and element.text:
                    try:
                        return float(element.text.strip())
                    except ValueError:
                        return default
                return default

            # Helper function to safely extract and convert text to int
            def get_int(tag_path: str, default: int = 0) -> int:
                element = root.find(tag_path)
                if element is not None and element.text:
                    try:
                        # Sometimes pitch comes in as "5:12" or "5/12", we only want the '5'
                        pitch_text = element.text.strip().split(':')[0].split('/')[0]
                        return int(pitch_text)
                    except ValueError:
                        return default
                return default

            # ---------------------------------------------------------
            # Node Extraction Mapping
            # ---------------------------------------------------------
            # Note: The specific tag paths (e.g., './/Area') depend on GAF's exact XML structure.
            # We use XPath './/' to find the tags anywhere in the tree.
            
            # 1. Total Area & Pitch
            # GAF typically provides Total Area in Square Feet. 
            # We divide by 100 to convert to Roofing Squares (SQ) if it's in SF.
            raw_area = get_float('.//Area', 0.0)
            roof_area_sq = raw_area / 100.0 if raw_area > 1000 else raw_area 
            
            predominant_pitch = get_int('.//Pitch', default=0)

            # 2. Linear Measurements (Edges, Ridges, Valleys)
            eave_lf = get_float('.//Eaves', 0.0)
            rake_lf = get_float('.//Rakes', 0.0)
            ridge_lf = get_float('.//Ridges', 0.0)
            valley_lf = get_float('.//Valleys', 0.0)
            
            # 3. Flashing & Wall Intersections
            sidewall_lf = get_float('.//StepFlashing', 0.0) # Often mapped as StepFlashing in roof reports
            headwall_lf = get_float('.//Headwall', 0.0)
            hip_lf = get_float('.//Hips', 0.0)

            # ---------------------------------------------------------
            # Dictionary Compilation
            # ---------------------------------------------------------
            # This dictionary perfectly matches the RoofMeasurements schema in calculator.py
            parsed_data = {
                "roof_area_sq": round(roof_area_sq, 2),
                "pitch": predominant_pitch,
                "eave_lf": round(eave_lf, 2),
                "rake_lf": round(rake_lf, 2),
                "ridge_lf": round(ridge_lf, 2),
                "valley_lf": round(valley_lf, 2),
                "sidewall_lf": round(sidewall_lf, 2),
                "headwall_lf": round(headwall_lf, 2),
                "hip_lf": round(hip_lf, 2)
            }

            logging.info(f"Successfully parsed GAF XML: {parsed_data['roof_area_sq']} SQ, Pitch: {parsed_data['pitch']}")
            return parsed_data

        except ET.ParseError as e:
            logging.error(f"Failed to parse XML payload. Invalid format: {e}")
            raise ValueError(f"Malformed XML payload received: {e}")
        except Exception as e:
            logging.error(f"Unexpected error during XML extraction: {e}")
            raise RuntimeError(f"Error processing roof dimensions: {e}")

# ==========================================
# Example Usage / Local Testing
# ==========================================
if __name__ == "__main__":
    # Mock XML payload representing what GAF sends to your webhook
    sample_gaf_xml = """<?xml version="1.0" encoding="UTF-8"?>
    <Report>
        <Measurements>
            <Area>2300.0</Area> <Pitch>5:12</Pitch>
            <Eaves>120.5</Eaves>
            <Rakes>80.0</Rakes>
            <Ridges>40.0</Ridges>
            <Valleys>20.0</Valleys>
            <StepFlashing>15.0</StepFlashing>
            <Headwall>10.0</Headwall>
            <Hips>0.0</Hips>
        </Measurements>
    </Report>
    """

    try:
        # 1. Parse the XML
        extracted_measurements = GAFXMLParser.parse_payload(sample_gaf_xml)
        print("Parsed Output:", extracted_measurements)
        
        # 2. To integrate with your calculator.py, you would simply do:
        # from calculator import RoofMeasurements, JobOptions, ProposalRequest, PricingEngine
        #
        # roof_measurements = RoofMeasurements(**extracted_measurements)
        # job_options = JobOptions(tear_off_layers=2, shingle_brand="CertainTeed")
        # request_payload = ProposalRequest(measurements=roof_measurements, options=job_options)
        # 
        # final_pricing = PricingEngine.run_estimate(request_payload)
        
    except Exception as error:
        print(error)
