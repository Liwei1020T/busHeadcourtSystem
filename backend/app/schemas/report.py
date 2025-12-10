"""
Pydantic schemas for report-related operations.
"""

from pydantic import BaseModel
from typing import List, Optional


class TripSummary(BaseModel):
    """Schema for a single trip summary."""
    trip_date: str
    trip_code: str
    bus_id: str
    route_name: Optional[str] = None
    direction: str
    passenger_count: Optional[int] = None
    capacity: Optional[int] = None
    load_factor: Optional[float] = None  # 0-1


class SummaryResponse(BaseModel):
    """Schema for the summary report response."""
    total_passengers: Optional[int] = None
    avg_load_factor: Optional[float] = None
    trip_count: Optional[int] = None
    saving_estimate: Optional[float] = None
    trips: List[TripSummary] = []


class ScanRecord(BaseModel):
    """Schema for a single scan record in report."""
    scan_time: str
    employee_id: str
    bus_id: str
    trip_code: str
    direction: str


class ScansResponse(BaseModel):
    """Schema for the scans report response."""
    scans: List[ScanRecord] = []
