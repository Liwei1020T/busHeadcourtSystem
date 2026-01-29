"""
Uploader module for Pi Agent.
Handles uploading scan records to the central backend.
"""

import logging
from typing import List, Dict, Optional
import requests

logger = logging.getLogger(__name__)

# Timeout for HTTP requests (seconds)
REQUEST_TIMEOUT = 30


def upload_scans(
    api_base_url: str,
    api_key: str,
    scans: List[Dict]
) -> Optional[List[int]]:
    """
    Upload scan records to the backend API.
    
    Args:
        api_base_url: Base URL for the bus API (e.g., http://localhost:8000/api/bus)
        api_key: API key for authentication
        scans: List of scan dictionaries to upload
    
    Returns:
        List of successfully uploaded scan IDs, or None if upload failed.
    """
    if not scans:
        logger.debug("No scans to upload")
        return []
    
    url = f"{api_base_url}/upload-scans"
    headers = {
        "Content-Type": "application/json",
        "X-API-KEY": api_key
    }
    payload = {"scans": scans}
    
    try:
        logger.info(f"Uploading {len(scans)} scans to {url}")
        response = requests.post(
            url,
            json=payload,
            headers=headers,
            timeout=REQUEST_TIMEOUT
        )
        
        if response.status_code == 200:
            result = response.json()
            success_ids = result.get("success_ids", [])
            logger.info(f"Upload successful: {len(success_ids)} scans accepted")
            return success_ids
        elif response.status_code == 401:
            logger.error("Upload failed: Invalid API key")
            return None
        elif response.status_code == 422:
            logger.error(f"Upload failed: Validation error - {response.text}")
            return None
        else:
            logger.error(f"Upload failed: HTTP {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.Timeout:
        logger.error("Upload failed: Request timed out")
        return None
    except requests.exceptions.ConnectionError:
        logger.warning("Upload failed: Cannot connect to server (will retry later)")
        return None
    except requests.exceptions.RequestException as e:
        logger.error(f"Upload failed: {e}")
        return None


def check_connectivity(api_base_url: str) -> bool:
    """
    Check if the backend API is reachable.
    
    Args:
        api_base_url: Base URL for the bus API
    
    Returns:
        True if the API is reachable, False otherwise.
    """
    try:
        # Try to reach the health endpoint or base URL
        url = api_base_url.replace("/api/bus", "/health")
        response = requests.get(url, timeout=5)
        return response.status_code == 200
    except requests.exceptions.RequestException:
        return False
