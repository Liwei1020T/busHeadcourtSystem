"""
Trip model.
"""

from sqlalchemy import Column, String, Integer, Date, Time, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.db import Base


class Trip(Base):
    """Trip entity representing a single bus trip on a specific date."""
    
    __tablename__ = "trips"
    
    trip_id = Column(Integer, primary_key=True, autoincrement=True)
    bus_id = Column(String(50), ForeignKey("buses.bus_id"), nullable=False, index=True)
    trip_date = Column(Date, nullable=False, index=True)
    trip_code = Column(String(50), nullable=False)
    direction = Column(String(20), nullable=False)  # to_factory / from_factory
    planned_time = Column(Time, nullable=True)
    actual_time = Column(DateTime, nullable=True)
    
    # Unique constraint
    __table_args__ = (
        UniqueConstraint("bus_id", "trip_date", "trip_code", name="uq_bus_date_trip"),
    )
    
    # Relationships
    bus = relationship("Bus", back_populates="trips")
    scans = relationship("TripScan", back_populates="trip")
    
    def __repr__(self):
        return f"<Trip {self.trip_id}: {self.bus_id} {self.trip_date} {self.trip_code}>"
