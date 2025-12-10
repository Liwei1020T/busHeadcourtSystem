"""
Pydantic schemas for report-related operations.
"""

from pydantic import BaseModel
from typing import List, Optional


class HeadcountRow(BaseModel):
    """Aggregated headcount per bus/date/shift."""
    date: str
    shift: str
    bus_id: str
    route: Optional[str] = None
    present: int
    unknown_batch: int
    unknown_shift: int
    total: int


class HeadcountResponse(BaseModel):
    """Response for headcount aggregation."""
    rows: List[HeadcountRow] = []


class AttendanceRecord(BaseModel):
    """Detailed attendance record."""
    scanned_at: str
    batch_id: int
    employee_name: Optional[str] = None
    bus_id: Optional[str] = None
    van_id: Optional[int] = None
    shift: str
    status: str
    source: Optional[str] = None


# Compatibility schemas for legacy summary endpoint (dashboard fallback)
class TripSummary(BaseModel):
    """Synthetic trip summary (uses attendance aggregates)."""
    trip_date: str
    trip_code: str
    bus_id: str
    route_name: Optional[str] = None
    direction: str
    passenger_count: Optional[int] = None
    capacity: Optional[int] = None
    load_factor: Optional[float] = None  # 0-1


class SummaryResponse(BaseModel):
    """Summary response for legacy dashboard."""
    total_passengers: Optional[int] = None
    avg_load_factor: Optional[float] = None
    trip_count: Optional[int] = None
    saving_estimate: Optional[float] = None
    trips: List[TripSummary] = []
