"""
Report API endpoints.
Provides headcount and attendance detail for the dashboard.
"""

import logging
from datetime import datetime, date as date_type
from typing import Optional, List

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case

from app.core.db import get_db
from app.models import Attendance, AttendanceShift, Bus, Employee
from app.schemas.report import (
    HeadcountRow,
    HeadcountResponse,
    AttendanceRecord,
    SummaryResponse,
    TripSummary,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/report", tags=["report"])


def parse_date(value: Optional[str]) -> Optional[date_type]:
    if value is None:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")


def validate_shift(value: Optional[str]) -> Optional[AttendanceShift]:
    if value is None:
        return None
    try:
        return AttendanceShift(value)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid shift. Use morning or night.")


@router.get("/headcount", response_model=HeadcountResponse)
def headcount(
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    shift: Optional[str] = Query(None, description="Filter by shift (morning/night)"),
    bus_id: Optional[str] = Query(None, description="Filter by bus ID"),
    db: Session = Depends(get_db),
):
    """Get per-bus headcount aggregated by date and shift. Supports single date or date range."""
    target_date = parse_date(date)
    target_from = parse_date(date_from)
    target_to = parse_date(date_to)
    target_shift = validate_shift(shift)

    present_case = case((Attendance.status == "present", 1), else_=0)
    unknown_batch_case = case((Attendance.status == "unknown_batch", 1), else_=0)
    unknown_shift_case = case((Attendance.status == "unknown_shift", 1), else_=0)

    query = db.query(
        Attendance.scanned_on.label("scanned_on"),
        Attendance.shift.label("shift"),
        Attendance.bus_id.label("bus_id"),
        Bus.route.label("route"),
        func.sum(present_case).label("present"),
        func.sum(unknown_batch_case).label("unknown_batch"),
        func.sum(unknown_shift_case).label("unknown_shift"),
        func.count(Attendance.id).label("total"),
    ).join(Bus, Attendance.bus_id == Bus.bus_id, isouter=True)

    if target_date:
        query = query.filter(Attendance.scanned_on == target_date)
    else:
        if target_from:
            query = query.filter(Attendance.scanned_on >= target_from)
        if target_to:
            query = query.filter(Attendance.scanned_on <= target_to)
    if target_shift:
        query = query.filter(Attendance.shift == target_shift)
    if bus_id:
        query = query.filter(Attendance.bus_id == bus_id)

    query = query.group_by(Attendance.scanned_on, Attendance.shift, Attendance.bus_id, Bus.route)
    query = query.order_by(Attendance.scanned_on.desc(), Attendance.shift, Attendance.bus_id)

    rows: List[HeadcountRow] = []
    for row in query.all():
        rows.append(
            HeadcountRow(
                date=row.scanned_on.isoformat(),
                shift=row.shift.value if isinstance(row.shift, AttendanceShift) else str(row.shift),
                bus_id=row.bus_id or "",
                route=row.route,
                present=int(row.present or 0),
                unknown_batch=int(row.unknown_batch or 0),
                unknown_shift=int(row.unknown_shift or 0),
                total=int(row.total or 0),
            )
        )

    return HeadcountResponse(rows=rows)


@router.get("/attendance", response_model=List[AttendanceRecord])
def attendance_detail(
    date: str = Query(..., description="Date to filter (YYYY-MM-DD)"),
    shift: Optional[str] = Query(None, description="Shift filter (morning/night)"),
    bus_id: Optional[str] = Query(None, description="Bus filter"),
    db: Session = Depends(get_db),
):
    """Get detailed attendance records for a date with optional filters."""
    target_date = parse_date(date)
    if not target_date:
        raise HTTPException(status_code=400, detail="Date is required")
    target_shift = validate_shift(shift)

    query = db.query(
        Attendance.scanned_at,
        Attendance.scanned_batch_id,
        Attendance.bus_id,
        Attendance.van_id,
        Attendance.shift,
        Attendance.status,
        Attendance.source,
        Employee.name.label("employee_name"),
    ).join(Employee, Attendance.employee_id == Employee.id, isouter=True)

    query = query.filter(Attendance.scanned_on == target_date)
    if target_shift:
        query = query.filter(Attendance.shift == target_shift)
    if bus_id:
        query = query.filter(Attendance.bus_id == bus_id)

    query = query.order_by(Attendance.scanned_at.desc())

    records: List[AttendanceRecord] = []
    for row in query.all():
        shift_value = row.shift.value if isinstance(row.shift, AttendanceShift) else str(row.shift)
        records.append(
            AttendanceRecord(
                scanned_at=row.scanned_at.isoformat() if row.scanned_at else "",
                batch_id=row.scanned_batch_id,
                employee_name=row.employee_name,
                bus_id=row.bus_id,
                van_id=row.van_id,
                shift=shift_value,
                status=row.status,
                source=row.source,
            )
        )

    return records


@router.get("/summary", response_model=SummaryResponse)
def get_summary(
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    route: Optional[str] = Query(None, description="Filter by route (substring match)"),
    direction: Optional[str] = Query(None, description="Unused; kept for compatibility"),
    db: Session = Depends(get_db),
):
    """
    Compatibility summary endpoint for legacy dashboard.
    Aggregates attendance as synthetic trips per bus/date/shift.
    """
    from_date = parse_date(date_from)
    to_date = parse_date(date_to)

    present_case = case((Attendance.status == "present", 1), else_=0)

    query = db.query(
        Attendance.scanned_on.label("scanned_on"),
        Attendance.shift.label("shift"),
        Attendance.bus_id.label("bus_id"),
        Bus.route.label("route"),
        Bus.capacity.label("capacity"),
        func.sum(present_case).label("present"),
    ).join(Bus, Attendance.bus_id == Bus.bus_id, isouter=True)

    if from_date:
        query = query.filter(Attendance.scanned_on >= from_date)
    if to_date:
        query = query.filter(Attendance.scanned_on <= to_date)
    if route:
        query = query.filter(Bus.route.ilike(f"%{route}%"))
    # direction is ignored (no trips concept)

    query = query.group_by(Attendance.scanned_on, Attendance.shift, Attendance.bus_id, Bus.route, Bus.capacity)
    query = query.order_by(Attendance.scanned_on.desc(), Attendance.bus_id)

    trips: List[TripSummary] = []
    total_passengers = 0
    total_load_factor = 0.0
    load_factor_count = 0

    for row in query.all():
        passenger_count = int(row.present or 0)
        capacity = row.capacity or 0
        load_factor = (passenger_count / capacity) if capacity > 0 else None

        trips.append(
            TripSummary(
                trip_date=row.scanned_on.isoformat(),
                trip_code=str(row.shift),
                bus_id=row.bus_id or "",
                route_name=row.route,
                direction="unknown",
                passenger_count=passenger_count,
                capacity=capacity or None,
                load_factor=round(load_factor, 3) if load_factor is not None else None,
            )
        )

        total_passengers += passenger_count
        if load_factor is not None:
            total_load_factor += load_factor
            load_factor_count += 1

    avg_load_factor = (total_load_factor / load_factor_count) if load_factor_count > 0 else None

    return SummaryResponse(
        total_passengers=total_passengers,
        avg_load_factor=round(avg_load_factor, 3) if avg_load_factor is not None else None,
        trip_count=len(trips),
        saving_estimate=0.0,
        trips=trips,
    )
