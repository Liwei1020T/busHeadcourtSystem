"""
Employee model.
"""

from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.core.db import Base


class Employee(Base):
    """Employee with assigned bus/van and scannable batch ID."""

    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, autoincrement=True)
    batch_id = Column(Integer, unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    bus_id = Column(String(10), ForeignKey("buses.bus_id"), nullable=False, index=True)
    van_id = Column(Integer, ForeignKey("vans.id"), nullable=True, index=True)
    active = Column(Boolean, default=True)

    bus = relationship("Bus", back_populates="employees")
    van = relationship("Van", back_populates="employees")
    attendances = relationship("Attendance", back_populates="employee")

    def __repr__(self):
        return f"<Employee {self.id} batch={self.batch_id}>"
