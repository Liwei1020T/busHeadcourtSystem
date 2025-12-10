"""
Security module for API authentication.
"""

from fastapi import Header, HTTPException, status
from typing import Optional

from app.core.config import get_api_keys_map


def validate_api_key(x_api_key: Optional[str] = Header(None)) -> str:
    """
    Validate the API key from request header.
    Returns the bus_id associated with the API key.
    
    Raises:
        HTTPException: If API key is missing or invalid.
    """
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Please provide X-API-KEY header."
        )
    
    api_keys = get_api_keys_map()
    
    # Find the bus_id for this API key
    for bus_id, key in api_keys.items():
        if key == x_api_key:
            return bus_id
    
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid API key"
    )


def get_bus_id_from_api_key(x_api_key: str) -> Optional[str]:
    """
    Get the bus_id associated with an API key without raising exceptions.
    Returns None if the API key is invalid.
    """
    api_keys = get_api_keys_map()
    
    for bus_id, key in api_keys.items():
        if key == x_api_key:
            return bus_id
    
    return None
