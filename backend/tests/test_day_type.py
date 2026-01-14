import os
import sys
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.api.report import normalize_day_type
from app.models.employee_master import EmployeeMaster


class TestDayTypeNormalization(unittest.TestCase):
    def test_normalize_day_type(self):
        self.assertEqual(normalize_day_type("Offday"), "offday")
        self.assertEqual(normalize_day_type("Restday"), "restday")
        self.assertEqual(normalize_day_type("Regular"), "regular")
        self.assertEqual(normalize_day_type(None), "regular")

    def test_employee_master_has_day_type(self):
        self.assertTrue(hasattr(EmployeeMaster, "day_type"))


if __name__ == "__main__":
    unittest.main()
