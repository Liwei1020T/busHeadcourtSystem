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


class OccupancyBusRow(BaseModel):
    bus_id: str
    route: Optional[str] = None
    building_id: Optional[str] = None  # Plant: P1, P2, BK
    bus_capacity: int
    van_count: int = 0
    van_capacity: int
    total_capacity: int

    # Averages (per day)
    bus_present: int
    van_present: int
    total_present: int

    # Raw Totals (sum over num_days)
    num_days: int = 1
    bus_present_sum: int = 0
    van_present_sum: int = 0
    total_present_sum: int = 0

    bus_roster: int
    van_roster: int
    total_roster: int


class OccupancyResponse(BaseModel):
    rows: List[OccupancyBusRow] = []
    num_days: int = 1  # Global num_days for the query context

    total_van_count: int = 0
    total_bus_capacity: int
    total_van_capacity: int
    total_capacity: int

    # Averages
    total_bus_present: int
    total_van_present: int
    total_present: int

    # Raw Totals
    total_bus_present_sum: int = 0
    total_van_present_sum: int = 0
    total_present_sum: int = 0

    total_bus_roster: int
    total_van_roster: int
    total_roster: int


class BusRosterEntry(BaseModel):
    personid: int
    name: Optional[str] = None
    category: str  # "bus" | "van"
    van_code: Optional[str] = None
    pickup_point: Optional[str] = None
    contractor: Optional[str] = None
    plant: Optional[str] = None
    present: bool
    scanned_at: Optional[str] = None


class BusDetailResponse(BaseModel):
    bus_id: str
    route: Optional[str] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    shift: Optional[str] = None

    roster_total: int
    roster_bus: int
    roster_van: int
    present_total: int
    present_bus: int
    present_van: int
    absent_total: int
    absent_bus: int
    absent_van: int
    attendance_rate_pct: float

    employees: List[BusRosterEntry] = []


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
