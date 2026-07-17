import requests

url = "http://127.0.0.1:8000/api/parse-pdf"
file_path = "quick_measure_sample_roof_report.pdf"

try:
    with open(file_path, "rb") as f:
        files = {"file": f}
        response = requests.post(url, files=files)
    
    print("Status Code:", response.status_code)
    print("Response JSON:")
    print(response.json())
except Exception as e:
    print(f"Error: {e}")
