"""
TripScan model.
"""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.core.db import Base


class TripScan(Base):
    """TripScan entity representing a single employee scan on a trip."""
    
    __tablename__ = "trip_scans"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    trip_id = Column(Integer, ForeignKey("trips.trip_id"), nullable=False, index=True)
    employee_id = Column(String(50), nullable=False, index=True)
    scan_time = Column(DateTime, nullable=False)
    
    # Unique constraint - each employee can only be scanned once per trip
    __table_args__ = (
        UniqueConstraint("trip_id", "employee_id", name="uq_trip_employee"),
    )
    
    # Relationships
    trip = relationship("Trip", back_populates="scans")
    
    def __repr__(self):
        return f"<TripScan {self.id}: trip={self.trip_id} employee={self.employee_id}>"
