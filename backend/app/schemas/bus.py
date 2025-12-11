"""
Pydantic schemas for bus-related operations.
"""

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ScanInput(BaseModel):
    """Schema for a single scan record from entry scanner."""
    id: int
    batch_id: int
    scan_time: str  # ISO datetime string
    card_uid: Optional[str] = None  # optional raw card id


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
    route: Optional[str] = None
    capacity: Optional[int] = 40
    
    class Config:
        from_attributes = True


class BusCreate(BaseModel):
    """Create/update payload for buses."""
    bus_id: str
    route: str
    plate_number: Optional[str] = None
    capacity: Optional[int] = 40


class VanInfo(BaseModel):
    """Schema for van information."""
    id: int
    van_code: str
    bus_id: str
    plate_number: Optional[str] = None
    driver_name: Optional[str] = None
    capacity: Optional[int] = None
    active: bool = True

    class Config:
        from_attributes = True


class VanCreate(BaseModel):
    """Create/update payload for vans."""
    van_code: str
    bus_id: str
    plate_number: Optional[str] = None
    driver_name: Optional[str] = None
    capacity: Optional[int] = None
    active: bool = True


class EmployeeInfo(BaseModel):
    """Schema for employee information."""
    id: int
    batch_id: int
    name: str
    bus_id: str
    van_id: Optional[int] = None
    active: bool = True

    class Config:
        from_attributes = True


class EmployeeCreate(BaseModel):
    """Create/update payload for employees."""
    batch_id: int
    name: str
    bus_id: str
    van_id: Optional[int] = None
    active: bool = True
