"""
Van model.
"""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.core.db import Base


class Van(Base):
    """Van entity representing vans assigned to buses."""

    __tablename__ = "vans"

    id = Column(Integer, primary_key=True, autoincrement=True)
    van_code = Column(String(20), unique=True, nullable=False, index=True)
    bus_id = Column(String(10), ForeignKey("buses.bus_id"), nullable=False, index=True)
    plate_number = Column(String(50), nullable=True)
    driver_name = Column(String(100), nullable=True)
    capacity = Column(Integer, nullable=True)
    active = Column(Boolean, default=True)

    bus = relationship("Bus", back_populates="vans")
    employees = relationship("Employee", back_populates="van")
    attendances = relationship("Attendance", back_populates="van")

    def __repr__(self):
        return f"<Van {self.van_code} bus={self.bus_id}>"
