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
    bus_id: Optional[str] = None
    plate_number: Optional[str] = None
    driver_name: Optional[str] = None
    capacity: Optional[int] = None
    active: bool = True

    class Config:
        from_attributes = True


class VanCreate(BaseModel):
    """Create/update payload for vans."""
    van_code: str
    bus_id: Optional[str] = None
    plate_number: Optional[str] = None
    driver_name: Optional[str] = None
    capacity: Optional[int] = None
    active: bool = True


class EmployeeInfo(BaseModel):
    """Schema for employee information."""
    id: int
    batch_id: int
    name: str
    bus_id: Optional[str] = None
    van_id: Optional[int] = None
    active: bool = True

    # Enriched fields from employee master list (optional)
    date_joined: Optional[str] = None
    sap_id: Optional[str] = None
    wdid: Optional[str] = None
    transport_contractor: Optional[str] = None
    address1: Optional[str] = None
    postcode: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    contact_no: Optional[str] = None
    pickup_point: Optional[str] = None
    transport: Optional[str] = None
    route: Optional[str] = None
    building_id: Optional[str] = None
    nationality: Optional[str] = None
    status: Optional[str] = None
    terminate: Optional[str] = None

    class Config:
        from_attributes = True


class EmployeeCreate(BaseModel):
    """Create/update payload for employees."""
    batch_id: int
    name: str
    bus_id: Optional[str] = None
    van_id: Optional[int] = None
    active: bool = True


class UploadRowError(BaseModel):
    row_number: int
    personid: Optional[int] = None
    message: str


class MasterListUploadResponse(BaseModel):
    processed_rows: int
    selected_sheet: Optional[str] = None
    header_row_number: Optional[int] = None
    buses_upserted: int
    vans_upserted: int
    employees_upserted: int
    unassigned_rows: int = 0
    skipped_missing_personid: int = 0
    skipped_missing_name: int = 0
    row_errors: List[UploadRowError] = []


class AttendanceUploadResponse(BaseModel):
    processed_rows: int
    selected_sheet: Optional[str] = None
    header_row_number: Optional[int] = None
    attendance_inserted: int
    duplicates_ignored: int
    unknown_personids: int
    unknown_attendance_inserted: int = 0  # New: unknown PersonIds saved to unknown_attendances table
    offday_count: int = 0
    skipped_no_timein: int = 0
    skipped_missing_date: int = 0
    row_errors: List[UploadRowError] = []
