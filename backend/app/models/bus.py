"""
Bus model.
"""

from sqlalchemy import Column, String, Integer, CheckConstraint
from sqlalchemy.orm import relationship

from app.core.db import Base


class Bus(Base):
    """Bus entity representing a physical bus in the fleet."""

    __tablename__ = "buses"

    bus_id = Column(String(10), primary_key=True, index=True)
    route = Column(String, nullable=False)
    plate_number = Column(String(50), nullable=True)
    capacity = Column(Integer, default=40)

    __table_args__ = (
        CheckConstraint("length(bus_id) <= 4", name="ck_bus_id_length"),
    )

    # Relationships
    vans = relationship("Van", back_populates="bus", cascade="all, delete-orphan")
    employees = relationship("Employee", back_populates="bus")
    attendances = relationship("Attendance", back_populates="bus")

    def __repr__(self):
        return f"<Bus {self.bus_id}>"
