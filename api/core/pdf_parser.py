import re
from PyPDF2 import PdfReader
from io import BytesIO

class QuickMeasureParser:
    @staticmethod
    def parse_pdf(file_bytes: bytes) -> dict:
        reader = PdfReader(BytesIO(file_bytes))
        full_text = ""
        for page in reader.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"

        def extract_num(pattern, text, default=0.0):
            # re.search will find the first occurrence
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                val_str = match.group(1).replace(',', '')
                try:
                    return float(val_str)
                except:
                    return default
            return default

        # Extract values using regex matching
        roof_area_sf = extract_num(r"Roof Area\s+([\d,]+)", full_text)
        roof_area_sq = round(roof_area_sf / 100, 2) if roof_area_sf else 0.0
        
        pitch = extract_num(r"Predominant Pitch\s+(\d+)", full_text)
        
        # Lengths (Try to match Eave(s) \n 123 or Eaves 123 ft)
        eave_lf = extract_num(r"Eave[s]?[\s\n]+([\d,]+)", full_text)
        rake_lf = extract_num(r"Rake[s]?[\s\n]+([\d,]+)", full_text)
        
        # Try finding standalone Ridge/Hip first (from lengths page)
        ridge_lf = extract_num(r"Ridge[\s\n]+([\d,]+)", full_text)
        hip_lf = extract_num(r"Hip[\s\n]+([\d,]+)", full_text)
        
        # Fallback to combined Ridges/Hips if separate not found
        if ridge_lf == 0 and hip_lf == 0:
            combined = extract_num(r"Ridges/Hips\s+([\d,]+)", full_text)
            if combined > 0:
                ridge_lf = combined # Put all in ridge if we don't know the split

        valley_lf = extract_num(r"Valley[s]?[\s\n]+([\d,]+)", full_text)
        
        # Step and Flash (Headwall)
        step_flashing_lf = extract_num(r"Step[\s\n]+([\d,]+)", full_text)
        headwall_lf = extract_num(r"Flash[\s\n]+([\d,]+)", full_text)

        parsed_data = {
            "roof_area_sq": roof_area_sq,
            "pitch": pitch,
            "eave_lf": eave_lf,
            "rake_lf": rake_lf,
            "ridge_lf": ridge_lf,
            "hip_lf": hip_lf,
            "valley_lf": valley_lf,
            "step_flashing_lf": step_flashing_lf,
            "headwall_lf": headwall_lf
        }
        
        if all(val == 0.0 for val in parsed_data.values()):
            raise ValueError("NO_DATA_FOUND")
            
        return parsed_data
