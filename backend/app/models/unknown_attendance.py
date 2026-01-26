"""
Unknown attendance model for tracking attendance records that don't match master list.
"""

from sqlalchemy import Column, Integer, BigInteger, String, Enum, Date, DateTime, text, UniqueConstraint
from enum import Enum as PyEnum

from app.core.db import Base


class UnknownAttendanceShift(str, PyEnum):
    morning = "morning"
    night = "night"
    unknown = "unknown"


class UnknownAttendance(Base):
    """
    Attendance entry for PersonIds that exist in attendance files
    but are NOT in the master list.

    This allows tracking of:
    - Routes that appear in attendance but not in master list
    - PersonIds that have been removed from master list but still show up
    """

    __tablename__ = "unknown_attendances"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    scanned_batch_id = Column(BigInteger, nullable=False, index=True)  # PersonId from attendance
    route_raw = Column(String(200), nullable=True)  # Original route string from attendance
    bus_id = Column(String(10), nullable=True, index=True)  # Normalized bus_id (if parseable)
    shift = Column(
        Enum(UnknownAttendanceShift, name="unknown_attendance_shift", create_type=False),
        nullable=False,
        default=UnknownAttendanceShift.unknown,
        index=True,
    )
    scanned_at = Column(DateTime(timezone=True), nullable=False)
    scanned_on = Column(
        Date,
        nullable=False,
        server_default=text("(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kuala_Lumpur')::date"),
    )
    source = Column(String(50), nullable=True)  # Filename or upload source

    __table_args__ = (
        UniqueConstraint("scanned_batch_id", "scanned_on", "shift", name="uq_unknown_attendance_batch_date_shift"),
    )

    def __repr__(self):
        return f"<UnknownAttendance {self.id} batch={self.scanned_batch_id} route={self.route_raw}>"
