import os
import sys
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.schemas.report import OccupancyBusRow


class TestReportSchema(unittest.TestCase):
    def test_occupancy_bus_row_has_plant(self):
        fields = getattr(OccupancyBusRow, "model_fields", None)
        if fields is None:
            fields = OccupancyBusRow.__fields__
        self.assertIn("plant", fields)


if __name__ == "__main__":
    unittest.main()
