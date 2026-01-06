"""
Bus API endpoints.
Handles scan uploads from Pi agents.
"""

import logging
from datetime import datetime, time
from typing import List, Optional
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_

from app.core.db import get_db
from app.core.security import validate_api_key
from app.models import Bus, Employee, Attendance, AttendanceShift, Van
from app.schemas.bus import (
    UploadScansRequest,
    UploadScansResponse,
    ScanInput,
    BusInfo,
    BusCreate,
    VanInfo,
    VanCreate,
    EmployeeInfo,
    EmployeeCreate,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/bus", tags=["bus"])

try:
    LOCAL_TZ = ZoneInfo("Asia/Kuala_Lumpur")
except ZoneInfoNotFoundError:
    # Fallback for environments without tzdata installed
    logger.warning("ZoneInfo Asia/Kuala_Lumpur not found; falling back to UTC")
    LOCAL_TZ = ZoneInfo("UTC")
MORNING_START = time(4, 0)
MORNING_END = time(10, 0)
NIGHT_START = time(16, 0)
NIGHT_END = time(21, 0)


def get_or_create_bus(db: Session, bus_id: str) -> Bus:
    """Get existing bus or create a new one."""
    bus = db.query(Bus).filter(Bus.bus_id == bus_id).first()
    if not bus:
        bus = Bus(
            bus_id=bus_id,
            plate_number=None,
            route=f"Route {bus_id}",
            capacity=40,
        )
        db.add(bus)
        db.flush()
        logger.info(f"Auto-created bus: {bus_id}")
    return bus


def derive_shift(local_dt: datetime) -> AttendanceShift:
    """Derive morning/night/unknown based on KL local time."""
    t = local_dt.time()
    if MORNING_START <= t <= MORNING_END:
        return AttendanceShift.morning
    if NIGHT_START <= t <= NIGHT_END:
        return AttendanceShift.night
    return AttendanceShift.unknown


@router.get("/buses", response_model=List[BusInfo])
def list_buses(db: Session = Depends(get_db)):
    """List all buses for admin/dashboard use."""
    return db.query(Bus).order_by(Bus.bus_id).all()


@router.post("/buses", response_model=BusInfo, status_code=status.HTTP_201_CREATED)
def create_or_update_bus(payload: BusCreate, db: Session = Depends(get_db)):
    """
    Create or update a bus for admin management.
    Updates plate/route/capacity if the bus already exists.
    """
    bus = db.query(Bus).filter(Bus.bus_id == payload.bus_id).first()
    if bus:
        bus.route = payload.route
        bus.plate_number = payload.plate_number
        bus.capacity = payload.capacity
    else:
        bus = Bus(
            bus_id=payload.bus_id,
            route=payload.route,
            plate_number=payload.plate_number,
            capacity=payload.capacity,
        )
        db.add(bus)
    db.commit()
    db.refresh(bus)
    return bus


@router.get("/vans", response_model=List[VanInfo])
def list_vans(db: Session = Depends(get_db)):
    """List all vans with their bus assignments."""
    return db.query(Van).order_by(Van.bus_id, Van.van_code).all()


@router.post("/vans", response_model=VanInfo, status_code=status.HTTP_201_CREATED)
def create_or_update_van(payload: VanCreate, db: Session = Depends(get_db)):
    """
    Create or update a van for admin management.
    Uses van_code as the unique key.
    """
    bus = db.query(Bus).filter(Bus.bus_id == payload.bus_id).first()
    if not bus:
        raise HTTPException(status_code=400, detail=f"Bus {payload.bus_id} not found")

    van = db.query(Van).filter(Van.van_code == payload.van_code).first()
    if van:
        van.bus_id = payload.bus_id
        van.plate_number = payload.plate_number
        van.driver_name = payload.driver_name
        van.capacity = payload.capacity
        van.active = payload.active
    else:
        van = Van(
            van_code=payload.van_code,
            bus_id=payload.bus_id,
            plate_number=payload.plate_number,
            driver_name=payload.driver_name,
            capacity=payload.capacity,
            active=payload.active,
        )
        db.add(van)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Van code must be unique")

    db.refresh(van)
    return van


@router.get("/employees", response_model=List[EmployeeInfo])
def list_employees(db: Session = Depends(get_db)):
    """List all employees for admin/dashboard use."""
    return db.query(Employee).order_by(Employee.name).all()


@router.post("/employees", response_model=EmployeeInfo, status_code=status.HTTP_201_CREATED)
def create_or_update_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    """
    Create or update an employee record (batch_id based).
    """
    # Validate bus
    bus = db.query(Bus).filter(Bus.bus_id == payload.bus_id).first()
    if not bus:
        raise HTTPException(status_code=400, detail=f"Bus {payload.bus_id} not found")

    van_obj: Optional[Van] = None
    if payload.van_id is not None:
        van_obj = db.query(Van).filter(Van.id == payload.van_id).first()
        if not van_obj:
            raise HTTPException(status_code=400, detail=f"Van {payload.van_id} not found")
        if van_obj.bus_id != payload.bus_id:
            raise HTTPException(status_code=400, detail="Van bus does not match employee bus")

    employee = db.query(Employee).filter(Employee.batch_id == payload.batch_id).first()
    if employee:
        employee.name = payload.name
        employee.bus_id = payload.bus_id
        employee.van_id = payload.van_id
        employee.active = payload.active
    else:
        employee = Employee(
            batch_id=payload.batch_id,
            name=payload.name,
            bus_id=payload.bus_id,
            van_id=payload.van_id,
            active=payload.active,
        )
        db.add(employee)

    db.commit()
    db.refresh(employee)
    return employee


@router.post("/upload-scans", response_model=UploadScansResponse)
def upload_scans(
    request: UploadScansRequest,
    _api_label: str = Depends(validate_api_key),
    db: Session = Depends(get_db),
):
    """
    Upload scan records from an entry scanner (factory gate).

    Flow per scan:
    - Authenticate via API key (label is informational)
    - Parse scan time, derive shift from Kuala Lumpur local time
    - Find employee by batch_id, attach bus/van from assignment, set status
    - Insert attendance (dedupe per batch_id + date + shift)
    """
    success_ids: List[int] = []

    for scan in request.scans:
        try:
            # Parse scan time
            try:
                parsed = datetime.fromisoformat(scan.scan_time)
            except ValueError:
                logger.warning(f"Invalid scan_time format: {scan.scan_time}")
                continue

            # Normalize to KL timezone
            if parsed.tzinfo is None:
                local_dt = parsed.replace(tzinfo=LOCAL_TZ)
            else:
                local_dt = parsed.astimezone(LOCAL_TZ)

            shift = derive_shift(local_dt)
            scanned_on = local_dt.date()

            employee = db.query(Employee).filter(Employee.batch_id == scan.batch_id).first()

            status: str
            bus_id: Optional[str] = None
            van_id: Optional[int] = None
            employee_id: Optional[int] = None

            if employee:
                employee_id = employee.id
                bus_id = employee.bus_id
                van_id = employee.van_id
                status = "present" if shift != AttendanceShift.unknown else "unknown_shift"
            else:
                status = "unknown_shift" if shift == AttendanceShift.unknown else "unknown_batch"

            # Prevent duplicate per batch/date/shift
            exists = db.query(Attendance.id).filter(
                and_(
                    Attendance.scanned_batch_id == scan.batch_id,
                    Attendance.scanned_on == scanned_on,
                    Attendance.shift == shift,
                )
            ).first()
            if exists:
                success_ids.append(scan.id)
                continue

            attendance = Attendance(
                scanned_batch_id=scan.batch_id,
                employee_id=employee_id,
                bus_id=bus_id,
                van_id=van_id,
                shift=shift,
                status=status,
                scanned_at=local_dt,
                scanned_on=scanned_on,
                source="pi_agent",
            )
            db.add(attendance)
            db.flush()

            success_ids.append(scan.id)
            logger.debug(f"Recorded attendance for {scan.batch_id} on {scanned_on} shift={shift}")

        except IntegrityError:
            db.rollback()
            success_ids.append(scan.id)
        except Exception as e:
            logger.error(f"Error processing scan {scan.id}: {e}")
            db.rollback()

    # Commit all changes
    try:
        db.commit()
    except Exception as e:
        logger.error(f"Error committing scans: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Database error")

    logger.info(f"Processed {len(success_ids)} of {len(request.scans)} scans")

    return UploadScansResponse(success_ids=success_ids)
