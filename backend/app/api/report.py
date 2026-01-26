"""
Report API endpoints.
Provides headcount and attendance detail for the dashboard.
"""

import csv
import io
import logging
from datetime import datetime, date as date_type
from typing import Optional, List

from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, case, or_

from app.core.db import get_db
from app.core.cache import ttl_cache
from app.models import Attendance, AttendanceShift, Bus, Employee, EmployeeMaster, Van
from app.schemas.report import (
    HeadcountRow,
    HeadcountResponse,
    AttendanceRecord,
    SummaryResponse,
    TripSummary,
    OccupancyBusRow,
    OccupancyResponse,
    BusDetailResponse,
    BusRosterEntry,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/report", tags=["report"])


def parse_bus_ids(bus_id: Optional[str]) -> list[str]:
    """Accept comma-separated bus ids, e.g. 'A01,A02'. Empty entries are ignored."""
    if not bus_id:
        return []
    parts = [p.strip() for p in bus_id.split(",")]
    return [p for p in parts if p]


def parse_comma_list(value: Optional[str]) -> list[str]:
    """Parse comma-separated values into a list. Empty entries are ignored."""
    if not value:
        return []
    parts = [p.strip() for p in value.split(",")]
    return [p for p in parts if p]


def parse_date(value: Optional[str]) -> Optional[date_type]:
    if value is None:
        return None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")


def validate_shift(value: Optional[str]) -> Optional[AttendanceShift]:
    if value is None or value == "":
        return None
    try:
        return AttendanceShift(value)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid shift. Use morning, night, or unknown.")


def validate_shifts(value: Optional[str]) -> List[AttendanceShift]:
    """Parse comma-separated shifts and validate each."""
    if value is None or value == "":
        return []
    parts = parse_comma_list(value)
    result = []
    for p in parts:
        try:
            result.append(AttendanceShift(p))
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid shift '{p}'. Use morning, night, or unknown.")
    return result


def _query_headcount_rows(
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    shift: Optional[str] = Query(None, description="Filter by shift (morning/night)"),
    bus_id: Optional[str] = Query(None, description="Filter by bus ID (comma-separated supported)"),
    route: Optional[str] = Query(None, description="Filter by route (substring match)"),
    db: Session = Depends(get_db),
) -> List[HeadcountRow]:
    """Shared query for headcount rows (JSON and CSV)."""
    target_date = parse_date(date)
    target_from = parse_date(date_from)
    target_to = parse_date(date_to)
    target_shift = validate_shift(shift)
    bus_ids = parse_bus_ids(bus_id)

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
    if bus_ids:
        query = query.filter(Attendance.bus_id.in_(bus_ids))
    if route:
        query = query.filter(or_(Bus.route.ilike(f"%{route}%"), Attendance.bus_id.ilike(f"%{route}%")))

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
    return rows


@router.get("/headcount", response_model=HeadcountResponse)
def headcount(
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    shift: Optional[str] = Query(None, description="Filter by shift (morning/night/unknown)"),
    bus_id: Optional[str] = Query(None, description="Filter by bus ID"),
    route: Optional[str] = Query(None, description="Filter by route (substring match)"),
    db: Session = Depends(get_db),
):
    """Get per-bus headcount aggregated by date and shift. Supports single date or date range."""
    rows = _query_headcount_rows(date=date, date_from=date_from, date_to=date_to, shift=shift, bus_id=bus_id, route=route, db=db)
    return HeadcountResponse(rows=rows)


@router.get("/headcount/export")
def headcount_export(
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    shift: Optional[str] = Query(None, description="Filter by shift (morning/night/unknown)"),
    bus_id: Optional[str] = Query(None, description="Filter by bus ID"),
    route: Optional[str] = Query(None, description="Filter by route (substring match)"),
    db: Session = Depends(get_db),
):
    """Export headcount aggregates as CSV using the same filters as the JSON endpoint."""
    rows = _query_headcount_rows(date=date, date_from=date_from, date_to=date_to, shift=shift, bus_id=bus_id, route=route, db=db)

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["date", "shift", "bus_id", "route", "present", "unknown_batch", "unknown_shift", "total"])
    for row in rows:
        writer.writerow([row.date, row.shift, row.bus_id, row.route or "", row.present, row.unknown_batch, row.unknown_shift, row.total])

    filename = _build_filename(prefix="headcount", date=date, date_from=date_from, date_to=date_to, shift=shift, bus_id=bus_id, route=route)
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _build_filename(
    prefix: str,
    date: Optional[str],
    date_from: Optional[str],
    date_to: Optional[str],
    shift: Optional[str],
    bus_id: Optional[str],
    route: Optional[str] = None,
) -> str:
    """Create a descriptive filename for exports."""
    parts = [prefix]
    if date:
        parts.append(date)
    else:
        if date_from:
            parts.append(f"from-{date_from}")
        if date_to:
            parts.append(f"to-{date_to}")
    if shift:
        parts.append(f"shift-{shift}")
    if bus_id:
        parts.append(f"bus-{bus_id}")
    if route:
        parts.append(f"route-{route}")
    return "_".join(parts) + ".csv"


def _query_attendance_records(
    date: str = Query(..., description="Date to filter (YYYY-MM-DD)"),
    shift: Optional[str] = Query(None, description="Shift filter (morning/night/unknown)"),
    bus_id: Optional[str] = Query(None, description="Bus filter"),
    db: Session = Depends(get_db),
) -> List[AttendanceRecord]:
    """Shared query for attendance records (JSON and CSV)."""
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


@router.get("/attendance", response_model=List[AttendanceRecord])
def attendance_detail(
    date: str = Query(..., description="Date to filter (YYYY-MM-DD)"),
    shift: Optional[str] = Query(None, description="Shift filter (morning/night/unknown)"),
    bus_id: Optional[str] = Query(None, description="Bus filter"),
    db: Session = Depends(get_db),
):
    """Get detailed attendance records for a date with optional filters."""
    return _query_attendance_records(date=date, shift=shift, bus_id=bus_id, db=db)


@router.get("/attendance/export")
def attendance_export(
    date: str = Query(..., description="Date to filter (YYYY-MM-DD)"),
    shift: Optional[str] = Query(None, description="Shift filter (morning/night/unknown)"),
    bus_id: Optional[str] = Query(None, description="Bus filter"),
    db: Session = Depends(get_db),
):
    """Export attendance detail as CSV using the same filters as the JSON endpoint."""
    records = _query_attendance_records(date=date, shift=shift, bus_id=bus_id, db=db)

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["scanned_at", "batch_id", "employee_name", "bus_id", "van_id", "shift", "status", "source"])
    for record in records:
        writer.writerow([
            record.scanned_at,
            record.batch_id,
            record.employee_name or "",
            record.bus_id or "",
            record.van_id if record.van_id is not None else "",
            record.shift,
            record.status,
            record.source or "",
        ])

    filename = _build_filename(prefix="attendance", date=date, date_from=None, date_to=None, shift=shift, bus_id=bus_id)
    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/occupancy", response_model=OccupancyResponse)
@ttl_cache(ttl_seconds=60)
def occupancy(
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    shift: Optional[str] = Query(None, description="Filter by shift (comma-separated: morning,night)"),
    bus_id: Optional[str] = Query(None, description="Filter by bus ID (comma-separated supported)"),
    route: Optional[str] = Query(None, description="Filter by route (comma-separated supported)"),
    plant: Optional[str] = Query(None, description="Filter by plant/building_id (comma-separated: P1,P2,BK)"),
    db: Session = Depends(get_db),
):
    """
    Return per-bus capacity vs actual occupancy, including a bus-vs-van breakdown.
    Supports multi-select filters for shift, bus_id, route, and plant.
    """
    target_date = parse_date(date)
    target_from = parse_date(date_from)
    target_to = parse_date(date_to)
    target_shifts = validate_shifts(shift)
    bus_ids = parse_bus_ids(bus_id)
    routes = parse_comma_list(route)
    plants = parse_comma_list(plant)

    # Query bus metadata
    bus_rows_query = db.query(Bus.bus_id, Bus.route, func.coalesce(Bus.capacity, 0))
    if bus_ids:
        bus_rows_query = bus_rows_query.filter(Bus.bus_id.in_(bus_ids))
    if routes:
        route_filters = [Bus.route.ilike(f"%{r}%") for r in routes]
        bus_rows_query = bus_rows_query.filter(or_(*route_filters))
    bus_rows = bus_rows_query.all()
    bus_meta = {r[0]: {"route": r[1], "bus_capacity": int(r[2] or 0)} for r in bus_rows}
    allowed_bus_ids = set(bus_meta.keys()) if (routes and not bus_ids) else None

    # Query building_id for each bus from employee_master (most common building_id)
    building_query = (
        db.query(
            Employee.bus_id,
            EmployeeMaster.building_id,
            func.count(Employee.id).label("cnt")
        )
        .join(EmployeeMaster, Employee.batch_id == EmployeeMaster.personid, isouter=True)
        .filter(Employee.active.is_(True))
        .group_by(Employee.bus_id, EmployeeMaster.building_id)
    )
    if bus_ids:
        building_query = building_query.filter(Employee.bus_id.in_(bus_ids))
    elif allowed_bus_ids is not None:
        building_query = building_query.filter(Employee.bus_id.in_(allowed_bus_ids))

    building_rows = building_query.all()
    # Get the most common building_id for each bus
    bus_building_counts: dict = {}
    for bid, bld_id, cnt in building_rows:
        if bid not in bus_building_counts:
            bus_building_counts[bid] = {}
        if bld_id:
            bus_building_counts[bid][bld_id] = bus_building_counts[bid].get(bld_id, 0) + cnt

    building_by_bus = {}
    for bid, counts in bus_building_counts.items():
        if counts:
            building_by_bus[bid] = max(counts.keys(), key=lambda k: counts[k])
        else:
            building_by_bus[bid] = None

    # Filter by plant if specified
    if plants:
        plants_upper = [p.upper() for p in plants]
        filtered_bus_ids = set()
        for bid, bld in building_by_bus.items():
            if bld and bld.upper() in plants_upper:
                filtered_bus_ids.add(bid)
            elif not bld and "UNKNOWN" in plants_upper:
                filtered_bus_ids.add(bid)
        if allowed_bus_ids is not None:
            allowed_bus_ids = allowed_bus_ids & filtered_bus_ids
        elif bus_ids:
            bus_ids = [b for b in bus_ids if b in filtered_bus_ids]
        else:
            allowed_bus_ids = filtered_bus_ids

    # Query van metadata
    van_meta_query = db.query(
        Van.bus_id,
        func.count(Van.id).label("van_count"),
        func.sum(func.coalesce(Van.capacity, 0)).label("van_capacity"),
    ).filter(Van.active.is_(True))
    if bus_ids:
        van_meta_query = van_meta_query.filter(Van.bus_id.in_(bus_ids))
    elif allowed_bus_ids is not None:
        van_meta_query = van_meta_query.filter(Van.bus_id.in_(allowed_bus_ids))
    van_meta_rows = van_meta_query.group_by(Van.bus_id).all()
    van_capacity = {r[0]: int(r[2] or 0) for r in van_meta_rows}
    van_count = {r[0]: int(r[1] or 0) for r in van_meta_rows}

    present_case = case((Attendance.status == "present", 1), else_=0)
    bus_present_case = case((Attendance.status == "present", case((Attendance.van_id.is_(None), 1), else_=0)), else_=0)
    van_present_case = case((Attendance.status == "present", case((Attendance.van_id.is_not(None), 1), else_=0)), else_=0)

    # Calculate number of days in range for averaging
    num_days = 1
    if target_date:
        num_days = 1
    elif target_from and target_to:
        num_days = max(1, (target_to - target_from).days + 1)

    attendance_query = db.query(
        Attendance.bus_id,
        func.sum(bus_present_case).label("bus_present"),
        func.sum(van_present_case).label("van_present"),
        func.sum(present_case).label("total_present"),
    ).filter(
        Attendance.bus_id.is_not(None),
        Attendance.bus_id != 'OWN'
    )

    if target_date:
        attendance_query = attendance_query.filter(Attendance.scanned_on == target_date)
    else:
        if target_from:
            attendance_query = attendance_query.filter(Attendance.scanned_on >= target_from)
        if target_to:
            attendance_query = attendance_query.filter(Attendance.scanned_on <= target_to)
    if target_shifts:
        attendance_query = attendance_query.filter(Attendance.shift.in_(target_shifts))
    if bus_ids:
        attendance_query = attendance_query.filter(Attendance.bus_id.in_(bus_ids))
    elif allowed_bus_ids is not None:
        attendance_query = attendance_query.filter(Attendance.bus_id.in_(allowed_bus_ids))

    attendance_query = attendance_query.group_by(Attendance.bus_id)
    attendance_rows = attendance_query.all()

    # Calculate daily averages when spanning multiple days
    attendance_by_bus = {
        r[0] or "": {
            "bus_present": round(int(r[1] or 0) / num_days),
            "van_present": round(int(r[2] or 0) / num_days),
            "total_present": round(int(r[3] or 0) / num_days),
            "bus_present_sum": int(r[1] or 0),
            "van_present_sum": int(r[2] or 0),
            "total_present_sum": int(r[3] or 0),
        }
        for r in attendance_rows
        if r[0]
    }

    roster_query = db.query(
        Employee.bus_id,
        func.sum(case((Employee.van_id.is_(None), 1), else_=0)).label("bus_roster"),
        func.sum(case((Employee.van_id.is_not(None), 1), else_=0)).label("van_roster"),
        func.count(Employee.id).label("total_roster"),
    ).filter(
        Employee.active.is_(True),
        Employee.bus_id.is_not(None),
        Employee.bus_id != 'OWN'
    )

    if bus_ids:
        roster_query = roster_query.filter(Employee.bus_id.in_(bus_ids))
    elif allowed_bus_ids is not None:
        roster_query = roster_query.filter(Employee.bus_id.in_(allowed_bus_ids))

    roster_query = roster_query.group_by(Employee.bus_id)
    roster_rows = roster_query.all()
    roster_by_bus = {
        r[0]: {
            "bus_roster": int(r[1] or 0),
            "van_roster": int(r[2] or 0),
            "total_roster": int(r[3] or 0),
        }
        for r in roster_rows
        if r[0]
    }

    all_bus_ids = set(bus_meta.keys()) | set(attendance_by_bus.keys()) | set(roster_by_bus.keys()) | set(van_capacity.keys())
    if bus_ids:
        all_bus_ids = all_bus_ids & set(bus_ids)
    elif allowed_bus_ids is not None:
        all_bus_ids = all_bus_ids & allowed_bus_ids

    rows: List[OccupancyBusRow] = []
    totals = {
        "bus_capacity": 0,
        "van_count": 0,
        "van_capacity": 0,
        "total_capacity": 0,
        "bus_present": 0,
        "van_present": 0,
        "total_present": 0,
        "bus_present_sum": 0,
        "van_present_sum": 0,
        "total_present_sum": 0,
        "bus_roster": 0,
        "van_roster": 0,
        "total_roster": 0,
    }

    for bid in sorted(all_bus_ids):
        meta = bus_meta.get(bid, {"route": None, "bus_capacity": 0})
        vcount = int(van_count.get(bid, 0))
        vc = int(van_capacity.get(bid, 0))
        cap = int(meta["bus_capacity"]) + vc
        attendance = attendance_by_bus.get(bid, {
            "bus_present": 0, "van_present": 0, "total_present": 0,
            "bus_present_sum": 0, "van_present_sum": 0, "total_present_sum": 0
        })
        roster = roster_by_bus.get(bid, {"bus_roster": 0, "van_roster": 0, "total_roster": 0})

        row_obj = OccupancyBusRow(
            bus_id=bid,
            route=meta["route"],
            building_id=building_by_bus.get(bid),
            bus_capacity=int(meta["bus_capacity"]),
            van_count=vcount,
            van_capacity=vc,
            total_capacity=cap,
            bus_present=int(attendance["bus_present"]),
            van_present=int(attendance["van_present"]),
            total_present=int(attendance["total_present"]),
            # New fields
            num_days=num_days,
            bus_present_sum=int(attendance["bus_present_sum"]),
            van_present_sum=int(attendance["van_present_sum"]),
            total_present_sum=int(attendance["total_present_sum"]),
            # Roster
            bus_roster=int(roster["bus_roster"]),
            van_roster=int(roster["van_roster"]),
            total_roster=int(roster["total_roster"]),
        )
        rows.append(row_obj)

        totals["bus_capacity"] += row_obj.bus_capacity
        totals["van_count"] += row_obj.van_count
        totals["van_capacity"] += row_obj.van_capacity
        totals["total_capacity"] += row_obj.total_capacity
        totals["bus_present"] += row_obj.bus_present
        totals["van_present"] += row_obj.van_present
        totals["total_present"] += row_obj.total_present
        totals["bus_present_sum"] += row_obj.bus_present_sum
        totals["van_present_sum"] += row_obj.van_present_sum
        totals["total_present_sum"] += row_obj.total_present_sum
        totals["bus_roster"] += row_obj.bus_roster
        totals["van_roster"] += row_obj.van_roster
        totals["total_roster"] += row_obj.total_roster

    return OccupancyResponse(
        rows=rows,
        num_days=num_days,
        total_van_count=totals["van_count"],
        total_bus_capacity=totals["bus_capacity"],
        total_van_capacity=totals["van_capacity"],
        total_capacity=totals["total_capacity"],
        total_bus_present=totals["bus_present"],
        total_van_present=totals["van_present"],
        total_present=totals["total_present"],
        total_bus_present_sum=totals["bus_present_sum"],
        total_van_present_sum=totals["van_present_sum"],
        total_present_sum=totals["total_present_sum"],
        total_bus_roster=totals["bus_roster"],
        total_van_roster=totals["van_roster"],
        total_roster=totals["total_roster"],
    )


@router.get("/bus-detail", response_model=BusDetailResponse)
def bus_detail(
    date: Optional[str] = Query(None, description="Filter by date (YYYY-MM-DD)"),
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    shift: Optional[str] = Query(None, description="Filter by shift (morning/night/unknown)"),
    bus_id: str = Query(..., description="Bus ID to inspect"),
    include_inactive: bool = Query(False, description="Include inactive employees in the roster"),
    db: Session = Depends(get_db),
):
    """
    Return per-bus roster detail with present vs absent employees.

    Presence is determined by any Attendance(status='present') record in the selected date range (and optional shift).
    """
    target_date = parse_date(date)
    target_from = parse_date(date_from)
    target_to = parse_date(date_to)
    target_shift = validate_shift(shift)

    if target_date:
        target_from = target_date
        target_to = target_date

    if target_from is None or target_to is None:
        raise HTTPException(status_code=400, detail="date or date_from+date_to is required")

    bus = db.query(Bus).filter(Bus.bus_id == bus_id).first()
    route = bus.route if bus else None

    roster_rows = (
        db.query(
            Employee.batch_id,
            Employee.name,
            Employee.van_id,
            Van.van_code,
            EmployeeMaster.pickup_point,
            EmployeeMaster.transport_contractor,
            EmployeeMaster.building_id,
        )
        .join(Van, Employee.van_id == Van.id, isouter=True)
        .join(EmployeeMaster, Employee.batch_id == EmployeeMaster.personid, isouter=True)
        .filter(Employee.bus_id == bus_id)
        .order_by(Employee.name)
    )
    if not include_inactive:
        roster_rows = roster_rows.filter(Employee.active.is_(True))
    roster_rows = roster_rows.all()

    present_rows = (
        db.query(Attendance.scanned_batch_id, func.max(Attendance.scanned_at))
        .filter(Attendance.status == "present")
        .filter(Attendance.bus_id == bus_id)
        .filter(Attendance.scanned_on >= target_from)
        .filter(Attendance.scanned_on <= target_to)
    )
    if target_shift:
        present_rows = present_rows.filter(Attendance.shift == target_shift)
    present_rows = present_rows.group_by(Attendance.scanned_batch_id).all()

    present_by_personid = {int(pid): (ts.isoformat() if ts else None) for pid, ts in present_rows if pid is not None}

    entries: list[BusRosterEntry] = []
    roster_bus = 0
    roster_van = 0
    present_bus = 0
    present_van = 0

    for batch_id, name, van_id, van_code, pickup_point, contractor, building_id in roster_rows:
        pid = int(batch_id)
        is_van = van_id is not None
        present = pid in present_by_personid
        category = "van" if is_van else "bus"

        if is_van:
            roster_van += 1
            if present:
                present_van += 1
        else:
            roster_bus += 1
            if present:
                present_bus += 1

        entries.append(
            BusRosterEntry(
                personid=pid,
                name=name,
                category=category,
                van_code=van_code,
                pickup_point=pickup_point,
                contractor=contractor,
                plant=building_id,
                present=present,
                scanned_at=present_by_personid.get(pid),
            )
        )

    roster_total = roster_bus + roster_van
    present_total = present_bus + present_van
    absent_total = max(roster_total - present_total, 0)
    absent_bus = max(roster_bus - present_bus, 0)
    absent_van = max(roster_van - present_van, 0)
    attendance_rate_pct = round((present_total / roster_total) * 100, 1) if roster_total > 0 else 0.0

    return BusDetailResponse(
        bus_id=bus_id,
        route=route,
        date_from=target_from.isoformat() if target_from else None,
        date_to=target_to.isoformat() if target_to else None,
        shift=target_shift.value if target_shift else None,
        roster_total=roster_total,
        roster_bus=roster_bus,
        roster_van=roster_van,
        present_total=present_total,
        present_bus=present_bus,
        present_van=present_van,
        absent_total=absent_total,
        absent_bus=absent_bus,
        absent_van=absent_van,
        attendance_rate_pct=attendance_rate_pct,
        employees=entries,
    )


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


@router.get("/occupancy/filters")
def get_filter_options(db: Session = Depends(get_db)):
    """
    Return available filter options for bus_ids, routes, plants, and shifts.
    Used to populate multi-select dropdowns in the dashboard.
    """
    # Get all bus_ids
    bus_ids = [r[0] for r in db.query(Bus.bus_id).order_by(Bus.bus_id).all() if r[0]]

    # Get all routes
    routes = [r[0] for r in db.query(Bus.route).distinct().order_by(Bus.route).all() if r[0]]

    # Get all plants (building_ids) from employee_master
    building_ids = [
        r[0] for r in db.query(EmployeeMaster.building_id)
        .distinct()
        .filter(EmployeeMaster.building_id.isnot(None))
        .order_by(EmployeeMaster.building_id)
        .all()
        if r[0]
    ]
    # Normalize to unique plants
    plants_set = set()
    for bid in building_ids:
        upper = bid.upper().strip()
        if upper in ("P1", "P2"):
            plants_set.add(upper)
        elif upper.startswith("BK"):
            plants_set.add("BK")
        else:
            plants_set.add(upper)
    plants = sorted(list(plants_set))

    # Shifts are fixed
    shifts = ["morning", "night"]

    return {
        "buses": bus_ids,
        "routes": routes,
        "plants": plants,
        "shifts": shifts,
    }

