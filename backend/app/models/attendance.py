"""
Attendance model.
"""

from sqlalchemy import Column, Integer, BigInteger, String, Enum, Date, DateTime, ForeignKey, text, UniqueConstraint
from sqlalchemy.orm import relationship
from enum import Enum as PyEnum

from app.core.db import Base


class AttendanceShift(str, PyEnum):
    morning = "morning"
    night = "night"
    unknown = "unknown"


class Attendance(Base):
    """Attendance entry generated from a scan."""

    __tablename__ = "attendances"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    scanned_batch_id = Column(BigInteger, nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    bus_id = Column(String(10), ForeignKey("buses.bus_id"), nullable=True, index=True)
    van_id = Column(Integer, ForeignKey("vans.id"), nullable=True, index=True)
    shift = Column(
        Enum(AttendanceShift, name="attendance_shift", create_type=False),
        nullable=False,
        default=AttendanceShift.unknown,
        index=True,
    )
    status = Column(String(30), nullable=False, index=True)
    scanned_at = Column(DateTime(timezone=True), nullable=False)
    scanned_on = Column(
        Date,
        nullable=False,
        server_default=text("(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kuala_Lumpur')::date"),
    )
    source = Column(String(50), nullable=True)

    __table_args__ = (
        UniqueConstraint("scanned_batch_id", "scanned_on", "shift", name="uq_attendance_batch_date_shift"),
    )

    bus = relationship("Bus", back_populates="attendances")
    van = relationship("Van", back_populates="attendances")
    employee = relationship("Employee", back_populates="attendances")

    def __repr__(self):
        return f"<Attendance {self.id} batch={self.scanned_batch_id} shift={self.shift}>"
