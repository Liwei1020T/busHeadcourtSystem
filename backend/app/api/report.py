"""
Report API endpoints.
Provides summary and detail reports for the dashboard.
"""

import logging
from datetime import datetime, date
from typing import Optional, List

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.db import get_db
from app.models import Bus, Trip, TripScan
from app.schemas.report import TripSummary, SummaryResponse, ScanRecord

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/report", tags=["report"])


@router.get("/summary", response_model=SummaryResponse)
def get_summary(
    date_from: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    route: Optional[str] = Query(None, description="Filter by route name"),
    direction: Optional[str] = Query(None, description="Filter by direction (to_factory/from_factory)"),
    db: Session = Depends(get_db)
):
    """
    Get summary report with KPIs and trip details.
    
    Query params:
    - date_from: Start date (YYYY-MM-DD)
    - date_to: End date (YYYY-MM-DD)
    - route: Filter by route name
    - direction: Filter by direction (to_factory/from_factory)
    """
    # Parse dates
    try:
        from_date = datetime.strptime(date_from, "%Y-%m-%d").date() if date_from else None
        to_date = datetime.strptime(date_to, "%Y-%m-%d").date() if date_to else None
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    
    # Build query for trips with passenger counts
    query = db.query(
        Trip.trip_date,
        Trip.trip_code,
        Trip.bus_id,
        Trip.direction,
        Bus.route_name,
        Bus.capacity,
        func.count(TripScan.id).label("passenger_count")
    ).outerjoin(
        Bus, Trip.bus_id == Bus.bus_id
    ).outerjoin(
        TripScan, Trip.trip_id == TripScan.trip_id
    ).group_by(
        Trip.trip_id,
        Trip.trip_date,
        Trip.trip_code,
        Trip.bus_id,
        Trip.direction,
        Bus.route_name,
        Bus.capacity
    )
    
    # Apply filters
    if from_date:
        query = query.filter(Trip.trip_date >= from_date)
    if to_date:
        query = query.filter(Trip.trip_date <= to_date)
    if route:
        query = query.filter(Bus.route_name.ilike(f"%{route}%"))
    if direction:
        query = query.filter(Trip.direction == direction)
    
    # Order by date descending
    query = query.order_by(Trip.trip_date.desc(), Trip.trip_code)
    
    # Execute query
    results = query.all()
    
    # Build trip summaries
    trips: List[TripSummary] = []
    total_passengers = 0
    total_load_factor = 0.0
    valid_load_factors = 0
    
    for row in results:
        passenger_count = row.passenger_count or 0
        capacity = row.capacity or 40
        load_factor = passenger_count / capacity if capacity > 0 else 0
        
        trips.append(TripSummary(
            trip_date=row.trip_date.isoformat(),
            trip_code=row.trip_code,
            bus_id=row.bus_id,
            route_name=row.route_name or f"Route {row.bus_id}",
            direction=row.direction,
            passenger_count=passenger_count,
            capacity=capacity,
            load_factor=round(load_factor, 3)
        ))
        
        total_passengers += passenger_count
        if capacity > 0:
            total_load_factor += load_factor
            valid_load_factors += 1
    
    # Calculate KPIs
    trip_count = len(trips)
    avg_load_factor = total_load_factor / valid_load_factors if valid_load_factors > 0 else 0
    
    # Calculate saving estimate (simplified formula)
    # Assume each underutilized trip could save RM 500 if combined
    # Underutilized = load factor < 50%
    underutilized_trips = sum(1 for t in trips if (t.load_factor or 0) < 0.5)
    saving_estimate = underutilized_trips * 500.0
    
    return SummaryResponse(
        total_passengers=total_passengers,
        avg_load_factor=round(avg_load_factor, 3),
        trip_count=trip_count,
        saving_estimate=saving_estimate,
        trips=trips
    )


@router.get("/scans", response_model=List[ScanRecord])
def get_scans(
    date: str = Query(..., description="Date to get scans for (YYYY-MM-DD)"),
    db: Session = Depends(get_db)
):
    """
    Get individual scan records for a specific date.
    
    Query params:
    - date: Date to get scans for (YYYY-MM-DD) - required
    """
    # Parse date
    try:
        target_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD.")
    
    # Query scans for the date
    query = db.query(
        TripScan.scan_time,
        TripScan.employee_id,
        Trip.bus_id,
        Trip.trip_code,
        Trip.direction
    ).join(
        Trip, TripScan.trip_id == Trip.trip_id
    ).filter(
        Trip.trip_date == target_date
    ).order_by(
        TripScan.scan_time.desc()
    )
    
    results = query.all()
    
    scans = []
    for row in results:
        scans.append(ScanRecord(
            scan_time=row.scan_time.isoformat() if row.scan_time else "",
            employee_id=row.employee_id,
            bus_id=row.bus_id,
            trip_code=row.trip_code,
            direction=row.direction
        ))
    
    return scans
