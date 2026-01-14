import os
import sys
import unittest
from datetime import datetime, date

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.api.report import occupancy
from app.core.db import Base
from app.models import Bus, Employee, EmployeeMaster, Attendance, AttendanceShift


class TestOccupancyDayType(unittest.TestCase):
    def setUp(self):
        engine = create_engine("sqlite://")
        Attendance.__table__.c.scanned_on.server_default = None
        Base.metadata.create_all(bind=engine)
        self.SessionLocal = sessionmaker(bind=engine)

    def test_occupancy_excludes_offday(self):
        db = self.SessionLocal()
        try:
            bus = Bus(bus_id="A01", route="Route-A01", capacity=40)
            db.add(bus)

            master_regular = EmployeeMaster(id=1, personid=1001, name="Regular", building_id="P1", day_type="regular")
            master_offday = EmployeeMaster(id=2, personid=1002, name="Offday", building_id="P2", day_type="offday")
            db.add_all([master_regular, master_offday])

            emp_regular = Employee(batch_id=1001, name="Regular", bus_id="A01", active=True)
            emp_offday = Employee(batch_id=1002, name="Offday", bus_id="A01", active=True)
            db.add_all([emp_regular, emp_offday])
            db.flush()

            scanned_at = datetime(2026, 1, 12, 7, 0)
            scanned_on = date(2026, 1, 12)
            att_regular = Attendance(
                id=1,
                scanned_batch_id=1001,
                employee_id=emp_regular.id,
                bus_id="A01",
                shift=AttendanceShift.morning,
                status="present",
                scanned_at=scanned_at,
                scanned_on=scanned_on,
            )
            att_offday = Attendance(
                id=2,
                scanned_batch_id=1002,
                employee_id=emp_offday.id,
                bus_id="A01",
                shift=AttendanceShift.morning,
                status="present",
                scanned_at=scanned_at,
                scanned_on=scanned_on,
            )
            db.add_all([att_regular, att_offday])
            db.commit()

            response = occupancy(
                date="2026-01-12",
                date_from=None,
                date_to=None,
                shift="morning",
                bus_id=None,
                route=None,
                plant=None,
                db=db,
            )
            row = next((r for r in response.rows if r.bus_id == "A01"), None)

            self.assertIsNotNone(row)
            self.assertEqual(row.bus_capacity, 42)
            self.assertEqual(row.total_capacity, 42)
            self.assertEqual(row.total_present, 1)
            self.assertEqual(row.bus_present, 1)
            self.assertEqual(row.total_roster, 1)
            self.assertEqual(row.bus_roster, 1)
            self.assertEqual(row.plant, "P1")
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
