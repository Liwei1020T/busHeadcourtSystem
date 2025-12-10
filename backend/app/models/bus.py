"""
Bus model.
"""

from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship

from app.core.db import Base


class Bus(Base):
    """Bus entity representing a physical bus in the fleet."""
    
    __tablename__ = "buses"
    
    bus_id = Column(String(50), primary_key=True, index=True)
    plate_number = Column(String(50), nullable=True)
    route_name = Column(String(100), nullable=True)
    capacity = Column(Integer, default=40)
    
    # Relationships
    trips = relationship("Trip", back_populates="bus")
    
    def __repr__(self):
        return f"<Bus {self.bus_id}>"
