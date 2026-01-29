import os
from datetime import datetime

import requests

API_URL = os.getenv("BUS_OPTIMIZER_API_URL", "http://localhost:8003/api/bus/upload-scans")
API_KEY = os.getenv("BUS_OPTIMIZER_API_KEY", "ENTRY_SECRET")

scan_data = {
    "scans": [
        {
            "id": 9999,
            "batch_id": 153280044064,
            "scan_time": datetime.now().isoformat(),
            "card_uid": "153280044064"
        }
    ]
}

headers = {
    "Content-Type": "application/json",
    "X-API-KEY": API_KEY
}

try:
    response = requests.post(API_URL, json=scan_data, headers=headers)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Error: {e}")
