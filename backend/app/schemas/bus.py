"""
Pydantic schemas for bus-related operations.
"""

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ScanInput(BaseModel):
    """Schema for a single scan record from Pi agent."""
    id: int
    bus_id: str
    trip_date: str  # YYYY-MM-DD
    trip_code: str
    direction: str  # to_factory / from_factory
    employee_id: str
    card_uid: str
    scan_time: str  # ISO datetime string


class UploadScansRequest(BaseModel):
    """Schema for the upload-scans request body."""
    scans: List[ScanInput]


class UploadScansResponse(BaseModel):
    """Schema for the upload-scans response."""
    success_ids: List[int]


class BusInfo(BaseModel):
    """Schema for bus information."""
    bus_id: str
    plate_number: Optional[str] = None
    route_name: Optional[str] = None
    capacity: Optional[int] = 40
    
    class Config:
        from_attributes = True
