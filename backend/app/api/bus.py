"""
Bus API endpoints.
Handles scan uploads from Pi agents.
"""

import logging
import re
import hashlib
from datetime import datetime, time
from typing import List, Optional, Sequence, TypeVar
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import and_

from app.core.db import get_db
from app.core.excel import build_scanned_at, coerce_date, coerce_int, coerce_str, coerce_time, read_table_from_best_sheet
from app.core.security import validate_api_key
from app.models import Bus, Employee, EmployeeMaster, Attendance, AttendanceShift, Van
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
    MasterListUploadResponse,
    AttendanceUploadResponse,
    UploadRowError,
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


def _canonical_bus_id(value: str) -> Optional[str]:
    text = value.strip()
    if not text:
        return None
    if "own" in text.lower():
        return "OWN"

    # Pattern 1: "Route C1_P1_AB" or "Route E12_BK_PPB" -> extract first part before underscore
    match = re.search(r"route\s+([A-Za-z0-9]+)(?:_|\s|$)", text, flags=re.IGNORECASE)
    if match:
        bus_code = match.group(1).upper()
        if 1 <= len(bus_code) <= 6:  # Allow up to 6 characters for codes like BKA04, BKD5
            return bus_code

    # Pattern 2: "Route-A07" or "Route: A07" -> extract after dash/colon
    match = re.search(r"route\s*[-:]\s*([A-Za-z0-9]{1,6})", text, flags=re.IGNORECASE)
    if match:
        return match.group(1).upper()

    # Pattern 3: Try to extract any 1-6 alphanumeric code
    cleaned = re.sub(r"[^A-Za-z0-9]", "", text).upper()
    if 1 <= len(cleaned) <= 6:
        return cleaned

    return None


def _canonical_van_code(value: str) -> Optional[str]:
    text = value.strip()
    if not text:
        return None
    if "own" in text.lower():
        return None
    cleaned = re.sub(r"[^A-Za-z0-9]", "", text).upper()
    return cleaned if cleaned else None


def _row_value(values: dict, *keys: str) -> Optional[object]:
    for key in keys:
        if key in values and values[key] is not None and str(values[key]).strip() != "":
            return values[key]
    return None


T = TypeVar("T")


def _chunked(values: Sequence[T], size: int = 1000):
    for i in range(0, len(values), size):
        yield values[i : i + size]


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
    bus = None
    if payload.bus_id is not None:
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
    employees = db.query(Employee).order_by(Employee.name).all()
    if not employees:
        return []

    personids = [int(e.batch_id) for e in employees]
    masters_by_personid: dict[int, EmployeeMaster] = {}
    for chunk in _chunked(personids):
        for master in db.query(EmployeeMaster).filter(EmployeeMaster.personid.in_(chunk)).all():
            masters_by_personid[int(master.personid)] = master

    results: list[dict] = []
    for emp in employees:
        payload = EmployeeInfo.model_validate(emp).model_dump()
        master = masters_by_personid.get(int(emp.batch_id))
        if master:
            payload.update(
                {
                    "date_joined": master.date_joined.isoformat() if master.date_joined else None,
                    "sap_id": master.sap_id,
                    "wdid": master.wdid,
                    "transport_contractor": master.transport_contractor,
                    "address1": master.address1,
                    "postcode": master.postcode,
                    "city": master.city,
                    "state": master.state,
                    "contact_no": master.contact_no,
                    "pickup_point": master.pickup_point,
                    "transport": master.transport,
                    "route": master.route,
                    "building_id": master.building_id,
                    "nationality": master.nationality,
                    "status": master.status,
                    "terminate": master.terminate.isoformat() if master.terminate else None,
                }
            )
        results.append(payload)

    return results


@router.post("/employees", response_model=EmployeeInfo, status_code=status.HTTP_201_CREATED)
def create_or_update_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    """
    Create or update an employee record (batch_id based).
    """
    # Validate bus if provided
    bus = None
    if payload.bus_id is not None:
        bus = db.query(Bus).filter(Bus.bus_id == payload.bus_id).first()
        if not bus:
            raise HTTPException(status_code=400, detail=f"Bus {payload.bus_id} not found")

    van_obj: Optional[Van] = None
    if payload.van_id is not None:
        van_obj = db.query(Van).filter(Van.id == payload.van_id).first()
        if not van_obj:
            raise HTTPException(status_code=400, detail=f"Van {payload.van_id} not found")
        if payload.bus_id is not None and van_obj.bus_id != payload.bus_id:
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


@router.post("/master-list/upload", response_model=MasterListUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_master_list(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Upload an employee master list Excel and upsert buses, vans, and employees.

    Expected headers (case-insensitive):
    - PersonId, Name, Status, Terminate, Transport, Route, ...

    Proposed mapping:
    - Route -> bus_id (must be <= 4 alphanumeric chars after normalization)
    - Transport -> van_code (optional)
    """
    if not file.filename or not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported")

    xlsx_bytes = file.file.read()
    try:
        table = read_table_from_best_sheet(
            xlsx_bytes,
            must_include={"name", "route", "transport"},
            prefer_include={"personid", "sapid", "route", "transport", "datejoined", "status", "wdid"},
            sheet_name_exclude_prefixes=("note", "read", "instruction", "template"),
            min_prefer_matches=2,
            required_non_empty_in_sample={"name"},
            min_valid_sample_rows=1,
            sample_size=20,
        )
    except Exception:
        logger.exception("Failed to parse master list workbook")
        raise HTTPException(status_code=400, detail="Invalid .xlsx file (unable to read workbook)")

    if not table or not table.rows:
        raise HTTPException(
            status_code=400,
            detail="Could not find a worksheet with required columns (PersonId, Name, Route, Transport) and at least 1 valid data row",
        )

    rows = table.rows

    row_errors: List[UploadRowError] = []
    buses_upserted = 0
    vans_upserted = 0
    employees_upserted = 0
    unassigned_rows = 0
    skipped_missing_personid = 0
    skipped_missing_name = 0

    parsed_rows: list[dict] = []
    master_rows_with_personid: list[dict] = []
    master_rows_without_personid: list[dict] = []
    bus_ids: set[str] = set()
    van_codes: set[str] = set()
    personids: set[int] = set()
    bus_routes: dict[str, str] = {}
    van_assignments: dict[str, str] = {}

    for row in rows:
        personid = coerce_int(_row_value(row.values, "personid", "person_id", "batchid", "batch_id", "employeeid", "employee_id"))
        name = coerce_str(_row_value(row.values, "name"))
        date_joined = coerce_date(_row_value(row.values, "datejoined"))
        sap_id = coerce_str(_row_value(row.values, "sapid"))

        # Fallback: if no personid, try to use sap_id (for passport holders)
        if not personid:
            personid = coerce_int(sap_id)
        status_text = coerce_str(_row_value(row.values, "status"))
        wdid = coerce_str(_row_value(row.values, "wdid"))
        transport_contractor = coerce_str(_row_value(row.values, "transportcontractor"))
        address1 = coerce_str(_row_value(row.values, "address1"))
        postcode = coerce_str(_row_value(row.values, "postcode"))
        city = coerce_str(_row_value(row.values, "city"))
        state = coerce_str(_row_value(row.values, "state"))
        contact_no = coerce_str(_row_value(row.values, "contactno"))
        pickup_point = coerce_str(_row_value(row.values, "pickuppoint"))
        terminate_raw = _row_value(row.values, "terminate")
        terminate_date = coerce_date(terminate_raw) or coerce_date(coerce_str(terminate_raw))
        transport = coerce_str(_row_value(row.values, "transport"))
        route_value = coerce_str(_row_value(row.values, "route"))
        building_id = coerce_str(_row_value(row.values, "buildingid"))
        nationality = coerce_str(_row_value(row.values, "nationality"))
        day_type = coerce_str(_row_value(row.values, "daytype", "day_type"))

        bus_id = _canonical_bus_id(route_value or "") if route_value else None
        if not bus_id and transport and "own" in transport.lower():
            bus_id = "OWN"
        if not bus_id:
            # Keep bus_id as None instead of assigning to UNKN
            unassigned_rows += 1

        van_code = _canonical_van_code(transport) if transport else None
        if bus_id is None:
            van_code = None
        if van_code and van_code == bus_id:
            van_code = None

        active = True
        if terminate_date or (terminate_raw is not None and str(terminate_raw).strip() != ""):
            active = False
        if status_text:
            status_norm = status_text.strip().lower()
            if "inactive" in status_norm or "terminate" in status_norm or "terminated" in status_norm:
                active = False
            elif status_norm in {"active", "current"}:
                active = True

        if personid:
            personids.add(int(personid))

        if bus_id:
            bus_ids.add(bus_id)
            if bus_id not in bus_routes and route_value:
                bus_routes[bus_id] = route_value.strip()
        if van_code:
            van_codes.add(van_code)
            existing_bus = van_assignments.get(van_code)
            if existing_bus is None:
                van_assignments[van_code] = bus_id
            elif bus_id and existing_bus != bus_id:
                van_assignments[van_code] = bus_id

        master_base = {
            "row_number": row.row_number,
            "personid": int(personid) if personid else None,
            "name": name,
            "date_joined": date_joined,
            "sap_id": sap_id,
            "status_text": status_text,
            "wdid": wdid,
            "transport_contractor": transport_contractor,
            "address1": address1,
            "postcode": postcode,
            "city": city,
            "state": state,
            "contact_no": contact_no,
            "pickup_point": pickup_point,
            "transport": transport,
            "route_value": route_value,
            "building_id": building_id,
            "nationality": nationality,
            "terminate_date": terminate_date,
        }

        if personid:
            master_rows_with_personid.append(master_base)
        else:
            skipped_missing_personid += 1
            stable = "|".join(
                [
                    str(row.row_number),
                    name or "",
                    sap_id or "",
                    wdid or "",
                    transport_contractor or "",
                    pickup_point or "",
                    transport or "",
                    route_value or "",
                    building_id or "",
                    address1 or "",
                    postcode or "",
                    city or "",
                    state or "",
                    nationality or "",
                ]
            )
            row_hash = hashlib.sha256(stable.encode("utf-8")).hexdigest()
            master_rows_without_personid.append({**master_base, "row_hash": row_hash})

        if not personid:
            continue
        if not name:
            skipped_missing_name += 1
            continue

        parsed_rows.append(
            {
                "row_number": row.row_number,
                "personid": int(personid),
                "name": name,
                "date_joined": date_joined,
                "sap_id": sap_id,
                "status_text": status_text,
                "wdid": wdid,
                "transport_contractor": transport_contractor,
                "address1": address1,
                "postcode": postcode,
                "city": city,
                "state": state,
                "contact_no": contact_no,
                "pickup_point": pickup_point,
                "transport": transport,
                "route_value": route_value,
                "building_id": building_id,
                "nationality": nationality,
                "terminate_date": terminate_date,
                "bus_id": bus_id,
                "van_code": van_code,
                "active": active,
            }
        )

    buses_by_id: dict[str, Bus] = {}
    vans_by_code: dict[str, Van] = {}
    employees_by_personid: dict[int, Employee] = {}
    masters_by_personid: dict[int, EmployeeMaster] = {}

    bus_id_list = sorted(bus_ids)
    van_code_list = sorted(van_codes)
    personid_list = sorted(personids)

    if bus_id_list:
        for chunk in _chunked(bus_id_list):
            for bus in db.query(Bus).filter(Bus.bus_id.in_(chunk)).all():
                buses_by_id[bus.bus_id] = bus

    if van_code_list:
        for chunk in _chunked(van_code_list):
            for van in db.query(Van).filter(Van.van_code.in_(chunk)).all():
                vans_by_code[van.van_code] = van

    if personid_list:
        for chunk in _chunked(personid_list):
            for emp in db.query(Employee).filter(Employee.batch_id.in_(chunk)).all():
                employees_by_personid[int(emp.batch_id)] = emp
            for master in db.query(EmployeeMaster).filter(EmployeeMaster.personid.in_(chunk)).all():
                masters_by_personid[int(master.personid)] = master

    touched_buses: set[str] = set()
    touched_vans: set[str] = set()
    touched_employees: set[int] = set()

    for bid in bus_id_list:
        if bid in buses_by_id:
            continue
        buses_by_id[bid] = Bus(
            bus_id=bid,
            route=("Unassigned" if bid == "UNKN" else bus_routes.get(bid) or f"Route-{bid}"),
            plate_number=None,
            capacity=None if bid in {"OWN", "UNKN"} else 40,
        )
        db.add(buses_by_id[bid])
        buses_upserted += 1
        touched_buses.add(bid)

    for vcode in van_code_list:
        if vcode in vans_by_code:
            continue
        assigned_bus_id = van_assignments.get(vcode)
        bus = buses_by_id.get(assigned_bus_id)
        van_obj = Van(van_code=vcode, bus_id=assigned_bus_id, plate_number=None, driver_name=None, capacity=12, active=True)
        if bus:
            van_obj.bus = bus
        db.add(van_obj)
        vans_by_code[vcode] = van_obj
        vans_upserted += 1
        touched_vans.add(vcode)

    # Upsert master rows with PersonId (unique index). Keep existing values when new values are missing.
    for item in master_rows_with_personid:
        if item["personid"] is None:
            continue
        personid = int(item["personid"])

        master = masters_by_personid.get(personid)
        if not master:
            master = EmployeeMaster(personid=personid)
            db.add(master)
            masters_by_personid[personid] = master

        if item["date_joined"] is not None:
            master.date_joined = item["date_joined"]
        if item["name"] is not None:
            master.name = item["name"]
        if item["sap_id"] is not None:
            master.sap_id = item["sap_id"]
        if item["status_text"] is not None:
            master.status = item["status_text"]
        if item["wdid"] is not None:
            master.wdid = item["wdid"]
        if item["transport_contractor"] is not None:
            master.transport_contractor = item["transport_contractor"]
        if item["address1"] is not None:
            master.address1 = item["address1"]
        if item["postcode"] is not None:
            master.postcode = item["postcode"]
        if item["city"] is not None:
            master.city = item["city"]
        if item["state"] is not None:
            master.state = item["state"]
        if item["contact_no"] is not None:
            master.contact_no = item["contact_no"]
        if item["pickup_point"] is not None:
            master.pickup_point = item["pickup_point"]
        if item["transport"] is not None:
            master.transport = item["transport"]
        if item["route_value"] is not None:
            master.route = item["route_value"]
        if item["building_id"] is not None:
            master.building_id = item["building_id"]
        if item["nationality"] is not None:
            master.nationality = item["nationality"]
        if item["terminate_date"] is not None:
            master.terminate = item["terminate_date"]

    # Insert master rows without PersonId for audit (not linked to employees).
    for item in master_rows_without_personid:
        master = EmployeeMaster(personid=None)
        master.row_hash = item.get("row_hash")
        master.date_joined = item.get("date_joined")
        master.name = item.get("name")
        master.sap_id = item.get("sap_id")
        master.status = item.get("status_text")
        master.wdid = item.get("wdid")
        master.transport_contractor = item.get("transport_contractor")
        master.address1 = item.get("address1")
        master.postcode = item.get("postcode")
        master.city = item.get("city")
        master.state = item.get("state")
        master.contact_no = item.get("contact_no")
        master.pickup_point = item.get("pickup_point")
        master.transport = item.get("transport")
        master.route = item.get("route_value")
        master.building_id = item.get("building_id")
        master.nationality = item.get("nationality")
        master.terminate = item.get("terminate_date")
        db.add(master)

    for item in parsed_rows:
        personid = int(item["personid"])

        bus_id = item["bus_id"]
        bus = None
        if bus_id:
            bus = buses_by_id.get(bus_id)
            if not bus:
                bus = Bus(
                    bus_id=bus_id,
                    route=("Unassigned" if bus_id == "UNKN" else (item["route_value"] or f"Route-{bus_id}").strip()),
                    plate_number=None,
                    capacity=None if bus_id in {"OWN", "UNKN"} else 40,
                )
                db.add(bus)
                buses_by_id[bus_id] = bus
                buses_upserted += 1
                touched_buses.add(bus_id)
            else:
                route_value = item["route_value"]
                if bus_id not in touched_buses and route_value and bus.route != route_value.strip():
                    bus.route = route_value.strip()
                    buses_upserted += 1
                    touched_buses.add(bus_id)

        van_obj: Optional[Van] = None
        van_code = item["van_code"]
        if van_code and bus_id:
            van_obj = vans_by_code.get(van_code)
            if not van_obj:
                van_obj = Van(van_code=van_code, bus_id=bus_id, plate_number=None, driver_name=None, capacity=12, active=True)
                van_obj.bus = bus
                db.add(van_obj)
                vans_by_code[van_code] = van_obj
                vans_upserted += 1
                touched_vans.add(van_code)
            else:
                if van_code not in touched_vans and van_obj.bus_id != bus_id:
                    van_obj.bus_id = bus_id
                    van_obj.bus = bus
                    vans_upserted += 1
                    touched_vans.add(van_code)

        employee = employees_by_personid.get(personid)
        if not employee:
            employee = Employee(batch_id=personid, name=item["name"], bus_id=bus_id, van_id=None, active=bool(item["active"]))
            db.add(employee)
            employees_by_personid[personid] = employee
        else:
            if item["name"] is not None:
                employee.name = item["name"]
            employee.bus_id = bus_id
            employee.active = bool(item["active"])

        employee.bus = bus
        employee.van = van_obj if van_obj else None

        if personid not in touched_employees:
            employees_upserted += 1
            touched_employees.add(personid)

    db.commit()

    return MasterListUploadResponse(
        processed_rows=len(rows),
        selected_sheet=table.sheet_name,
        header_row_number=table.header_row_number,
        buses_upserted=buses_upserted,
        vans_upserted=vans_upserted,
        employees_upserted=employees_upserted,
        unassigned_rows=unassigned_rows,
        skipped_missing_personid=skipped_missing_personid,
        skipped_missing_name=skipped_missing_name,
        row_errors=row_errors,
    )


@router.post("/attendance/upload", response_model=AttendanceUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_attendance(file: UploadFile = File(...), shift: Optional[str] = None, db: Session = Depends(get_db)):
    """
    Upload an attendance Excel and create Attendance rows by matching PersonId against the master list.

    - If PersonId matches an employee: status is recorded as "present"
    - If no match: status is recorded as "unknown_batch"
    - Date is taken from the Excel per row
    """
    if not file.filename or not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported")

    shift_override: Optional[AttendanceShift] = None
    if shift is not None and shift != "":
        try:
            shift_override = AttendanceShift(shift)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid shift. Use morning, night, or unknown.")

    xlsx_bytes = file.file.read()
    try:
        table = read_table_from_best_sheet(
            xlsx_bytes,
            must_include={"personid"},
            prefer_include={
                "date",
                "infodate",
                "attendancedate",
                "attendanceon",
                "scannedon",
                "scandate",
                "scan_date",
                "timein",
                "timeout",
                "shift",
                "daytype",
                "day_type",
            },
            sheet_name_exclude_prefixes=("note", "read", "instruction", "template"),
            min_prefer_matches=1,
            required_non_empty_in_sample={"personid"},
            min_valid_sample_rows=1,
            sample_size=20,
        )
    except Exception:
        logger.exception("Failed to parse attendance workbook")
        raise HTTPException(status_code=400, detail="Invalid .xlsx file (unable to read workbook)")

    if not table or not table.rows:
        raise HTTPException(status_code=400, detail="Could not find a worksheet containing PersonId rows")

    rows = table.rows

    row_errors: List[UploadRowError] = []
    attendance_inserted = 0
    duplicates_ignored = 0
    unknown_personids = 0
    offday_count = 0
    skipped_no_timein = 0
    skipped_missing_date = 0

    parsed_rows: list[dict] = []
    personids: set[int] = set()
    scanned_dates: set = set()
    shifts: set[AttendanceShift] = set()

    for row in rows:
        personid = coerce_int(_row_value(row.values, "personid", "batchid", "batch_id"))
        if not personid:
            row_errors.append(UploadRowError(row_number=row.row_number, message="Missing PersonId"))
            continue

        raw_date = _row_value(
            row.values,
            "date",
            "infodate",
            "attendancedate",
            "attendanceon",
            "scannedon",
            "scandate",
            "scan_date",
        )

        scanned_on = coerce_date(raw_date)
        if not scanned_on:
            skipped_missing_date += 1
            continue

        # Read DayType to determine if employee should be working
        day_type = coerce_str(_row_value(row.values, "daytype", "day_type"))

        # Skip if DayType is "Offday" - employee is not expected to work
        if day_type and day_type.lower() == "offday":
            continue

        # For workforce exports, treat rows with TimeIn as present; Offday/absence rows typically have no TimeIn.
        time_in = coerce_time(_row_value(row.values, "timein"))

        shift_value: AttendanceShift = shift_override or AttendanceShift.unknown
        scanned_at: datetime
        is_offday = time_in is None

        if time_in is not None:
            # Has TimeIn - determine shift from time
            if shift_override is None:
                local_dt = datetime.combine(scanned_on, time_in).replace(tzinfo=LOCAL_TZ)
                shift_value = derive_shift(local_dt)
                scanned_at = local_dt
            else:
                scanned_at = datetime.combine(scanned_on, time_in).replace(tzinfo=LOCAL_TZ)
        else:
            # No TimeIn - offday/absent, use default time
            if shift_override is not None:
                shift_value = shift_override
            # Use a default time for offday records
            scanned_at = datetime.combine(scanned_on, time(0, 0)).replace(tzinfo=LOCAL_TZ)

        parsed_rows.append(
            {
                "row_number": row.row_number,
                "personid": int(personid),
                "raw_date": raw_date,
                "scanned_on": scanned_on,
                "shift": shift_value,
                "scanned_at": scanned_at,
                "is_offday": is_offday,
            }
        )
        personids.add(int(personid))
        scanned_dates.add(scanned_on)
        shifts.add(shift_value)

    employees_by_personid: dict[int, Employee] = {}
    personid_list = sorted(personids)
    if personid_list:
        for chunk in _chunked(personid_list):
            for emp in db.query(Employee).filter(Employee.batch_id.in_(chunk)).all():
                employees_by_personid[int(emp.batch_id)] = emp

    # Track existing records in database and within this upload file
    existing_keys: set[tuple[int, object, AttendanceShift]] = set()
    if personid_list and scanned_dates and shifts:
        for chunk in _chunked(personid_list):
            for scanned_batch_id, scanned_on, shift_val in (
                db.query(Attendance.scanned_batch_id, Attendance.scanned_on, Attendance.shift)
                .filter(Attendance.scanned_batch_id.in_(chunk))
                .filter(Attendance.scanned_on.in_(list(scanned_dates)))
                .filter(Attendance.shift.in_(list(shifts)))
                .all()
            ):
                existing_keys.add((int(scanned_batch_id), scanned_on, shift_val))

    for item in parsed_rows:
        personid = item["personid"]
        scanned_on = item["scanned_on"]
        shift_value = item["shift"]

        key = (personid, scanned_on, shift_value)
        if key in existing_keys:
            duplicates_ignored += 1
            continue

        employee = employees_by_personid.get(personid)

        # Skip if employee not found - no unknown_batch records
        if not employee:
            unknown_personids += 1
            continue

        status_value: str
        employee_id: Optional[int] = None
        bus_id: Optional[str] = None
        van_id: Optional[int] = None
        is_offday = item.get("is_offday", False)

        employee_id = employee.id
        bus_id = employee.bus_id
        van_id = employee.van_id
        # Set status based on whether it's offday
        status_value = "offday" if is_offday else "present"

        raw_date = item["raw_date"]
        scanned_at = item.get("scanned_at")
        if scanned_at is None:
            if isinstance(raw_date, datetime):
                scanned_at = raw_date.replace(tzinfo=LOCAL_TZ) if raw_date.tzinfo is None else raw_date.astimezone(LOCAL_TZ)
            else:
                scanned_at = build_scanned_at(scanned_on, shift_value.value).replace(tzinfo=LOCAL_TZ)

        attendance = Attendance(
            scanned_batch_id=personid,
            employee_id=employee_id,
            bus_id=bus_id,
            van_id=van_id,
            shift=shift_value,
            status=status_value,
            scanned_at=scanned_at,
            scanned_on=scanned_on,
            source="manual_upload",
        )
        db.add(attendance)
        attendance_inserted += 1
        if is_offday:
            offday_count += 1
        existing_keys.add(key)

    db.commit()

    return AttendanceUploadResponse(
        processed_rows=len(rows),
        selected_sheet=table.sheet_name,
        header_row_number=table.header_row_number,
        attendance_inserted=attendance_inserted,
        duplicates_ignored=duplicates_ignored,
        unknown_personids=unknown_personids,
        offday_count=offday_count,
        skipped_no_timein=skipped_no_timein,
        skipped_missing_date=skipped_missing_date,
        row_errors=row_errors,
    )


@router.delete("/attendance/delete-by-date")
def delete_attendance_by_date(
    date_from: str,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Delete attendance records for a specific date range.

    - date_from: Start date (inclusive) in YYYY-MM-DD format
    - date_to: End date (inclusive) in YYYY-MM-DD format. If not provided, only date_from is deleted.
    """
    from datetime import date as date_type

    try:
        start_date = date_type.fromisoformat(date_from)
        end_date = date_type.fromisoformat(date_to) if date_to else start_date
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    if end_date < start_date:
        raise HTTPException(status_code=400, detail="End date must be after or equal to start date")

    # Count records to be deleted
    count = db.query(Attendance).filter(
        Attendance.scanned_on >= start_date,
        Attendance.scanned_on <= end_date
    ).count()

    # Delete records
    db.query(Attendance).filter(
        Attendance.scanned_on >= start_date,
        Attendance.scanned_on <= end_date
    ).delete(synchronize_session=False)

    db.commit()

    return {
        "deleted_count": count,
        "date_from": date_from,
        "date_to": date_to or date_from
    }


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
    batch_ids = list({scan.batch_id for scan in request.scans})
    employees_by_personid: dict[int, Employee] = {}

    if batch_ids:
        for chunk in _chunked(batch_ids):
            for emp in db.query(Employee).filter(Employee.batch_id.in_(chunk)).all():
                employees_by_personid[int(emp.batch_id)] = emp

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

            employee = employees_by_personid.get(int(scan.batch_id))

            # Skip if employee not found - no unknown_batch records
            if not employee:
                logger.warning(f"Skipping scan for unknown batch_id: {scan.batch_id}")
                success_ids.append(scan.id)
                continue

            status: str
            bus_id: Optional[str] = None
            van_id: Optional[int] = None
            employee_id: Optional[int] = None

            employee_id = employee.id
            bus_id = employee.bus_id
            van_id = employee.van_id
            status = "present" if shift != AttendanceShift.unknown else "unknown_shift"

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
