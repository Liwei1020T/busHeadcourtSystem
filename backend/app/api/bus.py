"""
Bus API endpoints.
Handles scan uploads from Pi agents.
"""

import logging
from datetime import datetime, date
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.db import get_db
from app.core.security import validate_api_key
from app.models import Bus, Trip, TripScan
from app.schemas.bus import UploadScansRequest, UploadScansResponse, ScanInput

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/bus", tags=["bus"])


def get_or_create_bus(db: Session, bus_id: str) -> Bus:
    """Get existing bus or create a new one."""
    bus = db.query(Bus).filter(Bus.bus_id == bus_id).first()
    if not bus:
        # Auto-create bus with default values
        bus = Bus(
            bus_id=bus_id,
            plate_number=None,
            route_name=f"Route {bus_id}",
            capacity=40
        )
        db.add(bus)
        db.flush()
        logger.info(f"Auto-created bus: {bus_id}")
    return bus


def get_or_create_trip(
    db: Session,
    bus_id: str,
    trip_date: date,
    trip_code: str,
    direction: str
) -> Trip:
    """Get existing trip or create a new one."""
    trip = db.query(Trip).filter(
        Trip.bus_id == bus_id,
        Trip.trip_date == trip_date,
        Trip.trip_code == trip_code
    ).first()
    
    if not trip:
        trip = Trip(
            bus_id=bus_id,
            trip_date=trip_date,
            trip_code=trip_code,
            direction=direction
        )
        db.add(trip)
        db.flush()
        logger.info(f"Created trip: {bus_id} {trip_date} {trip_code}")
    
    return trip


@router.post("/upload-scans", response_model=UploadScansResponse)
def upload_scans(
    request: UploadScansRequest,
    authenticated_bus_id: str = Depends(validate_api_key),
    db: Session = Depends(get_db)
):
    """
    Upload scan records from a Pi agent.
    
    Each scan is processed individually:
    1. Find or create the bus
    2. Find or create the trip
    3. Insert scan if not duplicate
    
    Returns list of successfully processed scan IDs.
    """
    success_ids: List[int] = []
    
    for scan in request.scans:
        try:
            # Verify the scan is from the authenticated bus
            if scan.bus_id != authenticated_bus_id:
                logger.warning(
                    f"Bus {authenticated_bus_id} tried to upload scan for {scan.bus_id}"
                )
                continue
            
            # Ensure bus exists
            get_or_create_bus(db, scan.bus_id)
            
            # Parse trip date
            try:
                trip_date = datetime.strptime(scan.trip_date, "%Y-%m-%d").date()
            except ValueError:
                logger.warning(f"Invalid trip_date format: {scan.trip_date}")
                continue
            
            # Get or create trip
            trip = get_or_create_trip(
                db,
                scan.bus_id,
                trip_date,
                scan.trip_code,
                scan.direction
            )
            
            # Parse scan time
            try:
                scan_time = datetime.fromisoformat(scan.scan_time)
            except ValueError:
                logger.warning(f"Invalid scan_time format: {scan.scan_time}")
                continue
            
            # Check for duplicate
            existing = db.query(TripScan).filter(
                TripScan.trip_id == trip.trip_id,
                TripScan.employee_id == scan.employee_id
            ).first()
            
            if existing:
                # Already recorded - still count as success
                success_ids.append(scan.id)
                continue
            
            # Insert new scan
            trip_scan = TripScan(
                trip_id=trip.trip_id,
                employee_id=scan.employee_id,
                scan_time=scan_time
            )
            db.add(trip_scan)
            db.flush()
            
            success_ids.append(scan.id)
            logger.debug(f"Recorded scan: {scan.employee_id} on trip {trip.trip_id}")
            
        except IntegrityError:
            db.rollback()
            # Duplicate - still count as success
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
