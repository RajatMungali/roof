import os
import json
import httpx
from fastapi import FastAPI, Request, HTTPException, File, UploadFile, Form, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

# Import your local modules
from core.xml_parser import GAFXMLParser
from core.calculator import ProposalRequest, PricingEngine
from core.pdf_parser import QuickMeasureParser

# ---------------------------------------------------------
# 1. App Initialization & CORS Configuration
# ---------------------------------------------------------
app = FastAPI(
    title="JobNimbus Automation API",
    description="Backend math engine and CRM gateway for roofing proposals",
    version="1.0.0"
)

router = APIRouter()

# Configure CORS so your Vite frontend (both locally and on Vercel) can communicate with this backend safely
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Environment Variables (Stored securely in Vercel)
JOBNIMBUS_API_KEY = os.getenv("JOBNIMBUS_API_KEY")
JOBNIMBUS_BASE_URL = "https://app.jobnimbus.com/api1"


# ---------------------------------------------------------
# 2. Endpoints (Dual decorators so both / and /api work)
# ---------------------------------------------------------

# --- PDF Parsing Endpoint ---
@router.post("/parse-pdf")
@router.post("/api/parse-pdf")
async def parse_pdf(file: UploadFile = File(...)):
    try:
        content = await file.read()
        extracted_data = QuickMeasureParser.parse_pdf(content)
        return {"status": "success", "data": extracted_data}
    except ValueError as e:
        if str(e) == "NO_DATA_FOUND":
            return {"status": "no_data"}
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse PDF: {str(e)}")

@router.get("/health")
@router.get("/api/health")
async def health_check():
    """Simple ping endpoint to verify the Vercel function is awake."""
    return {"status": "active", "service": "JobNimbus Integration Engine"}

@router.get("/parse_sheet")
@router.get("/api/parse_sheet")
async def parse_sheet():
    import xml.etree.ElementTree as ET
    import os
    
    sheet_path = os.path.join(os.path.dirname(__file__), "tmp_excel", "xl", "worksheets", "sheet1.xml")
    strings_path = os.path.join(os.path.dirname(__file__), "tmp_excel", "xl", "sharedStrings.xml")
    
    # Parse shared strings
    strings = []
    if os.path.exists(strings_path):
        s_tree = ET.parse(strings_path)
        s_root = s_tree.getroot()
        ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        for si in s_root.findall('ns:si', ns):
            t = si.find('.//ns:t', ns)
            if t is not None:
                strings.append(t.text)
            else:
                strings.append("")
                
    # Parse sheet1
    cells = {}
    if os.path.exists(sheet_path):
        tree = ET.parse(sheet_path)
        root = tree.getroot()
        ns = {'ns': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        for row in root.findall('.//ns:row', ns):
            for c in row.findall('ns:c', ns):
                r = c.get('r')
                t = c.get('t')
                v = c.find('ns:v', ns)
                if v is not None:
                    val = v.text
                    if t == 's': # shared string
                        val = strings[int(val)] if int(val) < len(strings) else val
                    cells[r] = val
                    
    # Let's filter to just return everything to analyze
    return {"cells": cells}

@router.get("/brute_force")
@router.get("/api/brute_force")
async def brute_force():
    from core.calculator import ProposalRequest, PricingEngine
    
    data = {
      "measurements": {
        "roof_area_sq": 0, "pitch": 5, "eave_lf": 0, "rake_lf": 0, "ridge_lf": 0, "valley_lf": 0, "sidewall_lf": 0, "headwall_lf": 0, "hip_lf": 0
      },
      "options": {
        "tear_off_layers": 1, "shingle_brand": "CertainTeed", "shingle_tier": "Landmark Pro",
        "relead_chimney": True, "new_gutters": False, "number_of_chimneys": 1, "number_of_pipe_boots": 1,
        "apply_financing": False, "warranty_type": "Standard", "warranty_cost": 0.0, "deck_replacement_sf": 0.0, "custom_labor_override": 0.0
      }
    }
    
    target = 14863.03
    best_diff = 99999
    best_combo = None
    
    for i in range(2300, 2600):
        area = i / 100.0
        scale = area / 23.0
        
        data["measurements"]["roof_area_sq"] = area
        data["measurements"]["eave_lf"] = round(120.5 * scale, 1)
        data["measurements"]["rake_lf"] = round(80.0 * scale, 1)
        data["measurements"]["ridge_lf"] = round(40.0 * scale, 1)
        data["measurements"]["valley_lf"] = round(20.0 * scale, 1)
        data["measurements"]["sidewall_lf"] = round(15.0 * scale, 1)
        data["measurements"]["headwall_lf"] = round(10.0 * scale, 1)
        
        req = ProposalRequest(**data)
        res = PricingEngine.run_estimate(req)
        price = res["financials"]["final_contract_price"]
        
        diff = abs(price - target)
        if diff < best_diff:
            best_diff = diff
            best_combo = {
                "area": area, "eave": data["measurements"]["eave_lf"], "rake": data["measurements"]["rake_lf"],
                "price": price, "subtotal": res["financials"]["total_cost"]
            }
                
    return {"best": best_combo, "diff": best_diff}



@router.post("/webhook/gaf")
@router.post("/api/webhook/gaf")
async def handle_gaf_webhook(request: Request):
    """
    Catches the raw XML webhook from GAF[cite: 403, 715], parses it, 
    and syncs the spatial data to the JobNimbus contact record[cite: 425].
    """
    try:
        # 1. Read the raw XML body
        raw_xml = await request.body()
        xml_string = raw_xml.decode("utf-8")

        # 2. Parse the measurements using your xml_parser module
        parsed_measurements = GAFXMLParser.parse_payload(xml_string)

        contact_id = request.query_params.get("contact_id") 

        if not contact_id:
            raise HTTPException(status_code=400, detail="Missing contact_id to sync with JobNimbus")

        # 3. Sync to JobNimbus Custom Fields
        headers = {
            "Authorization": f"Bearer {JOBNIMBUS_API_KEY}",
            "Content-Type": "application/json"
        }
        
        jn_payload = {
            "cf_gaf_roof_area_sq": parsed_measurements["roof_area_sq"],
            "cf_gaf_predominant_pitch": parsed_measurements["pitch"],
            "cf_gaf_eave_lf": parsed_measurements["eave_lf"],
            "cf_gaf_ridge_lf": parsed_measurements["ridge_lf"]
        }

        async with httpx.AsyncClient() as client:
            response = await client.put(
                f"{JOBNIMBUS_BASE_URL}/contacts/{contact_id}",
                headers=headers,
                json=jn_payload
            )
            response.raise_for_status()

        return {"status": "success", "message": "GAF data synced to JobNimbus successfully."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/calculate")
@router.post("/api/calculate")
async def calculate_proposal(payload: ProposalRequest):
    """
    Receives JSON from the Vite frontend, runs the deterministic Excel math, 
    and returns exact pricing/quantities[cite: 620, 717].
    """
    try:
        # The payload is automatically validated by Pydantic against ProposalRequest
        results = PricingEngine.run_estimate(payload)
        return {"status": "success", "data": results}
        
    except ValidationError as ve:
        raise HTTPException(status_code=422, detail=ve.errors())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation Error: {str(e)}")


@router.post("/commit")
@router.post("/api/commit")
async def commit_proposal_to_crm(
    contact_id: str = Form(...),
    metadata: str = Form(...),
    file: UploadFile = File(...)
):
    """
    The final atomic step: 
    1. Uploads the Vite-generated PDF to JobNimbus[cite: 629].
    2. Updates final financial totals in the CRM[cite: 631].
    3. Shifts status to 'Proposal Sent' to trigger email/SMS drips[cite: 633].
    """
    try:
        # Parse the stringified JSON metadata sent from the frontend FormData
        job_data = json.loads(metadata)
        
        headers = {
            "Authorization": f"Bearer {JOBNIMBUS_API_KEY}"
        }

        async with httpx.AsyncClient() as client:
            # ---------------------------------------------------------
            # Step 1: Upload the Document Binary [cite: 629]
            # ---------------------------------------------------------
            file_content = await file.read()
            files_payload = {
                "file": (file.filename, file_content, file.content_type)
            }
            data_payload = {"related": contact_id} 
            
            upload_res = await client.post(
                f"{JOBNIMBUS_BASE_URL}/files",
                headers=headers,
                data=data_payload,
                files=files_payload
            )
            upload_res.raise_for_status()

            # ---------------------------------------------------------
            # Step 2 & 3: Update Financials & Transition Status [cite: 631, 633]
            # ---------------------------------------------------------
            update_payload = {
                "cf_final_contract_price": job_data["financials"]["final_contract_price"],
                "cf_deposit_due": job_data["financials"]["deposit_due"],
                "status_name": "Proposal Sent"
            }

            status_res = await client.put(
                f"{JOBNIMBUS_BASE_URL}/contacts/{contact_id}",
                headers={"Authorization": f"Bearer {JOBNIMBUS_API_KEY}", "Content-Type": "application/json"},
                json=update_payload
            )
            status_res.raise_for_status()

        return {"status": "success", "message": "Proposal committed and drips launched."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Commit Error: {str(e)}")

# Mount the router to the FastAPI app
app.include_router(router)
