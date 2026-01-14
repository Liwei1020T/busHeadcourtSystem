import os
import sys
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.api.report import derive_bus_plant, bus_capacity_for, parse_bus_id_filter, normalize_plant


class TestReportHelpers(unittest.TestCase):
    def test_derive_bus_plant(self):
        self.assertEqual(derive_bus_plant(["P1"]), "P1")
        self.assertEqual(derive_bus_plant(["P1", "P2"]), "Mixed")
        self.assertEqual(derive_bus_plant([]), "Unassigned")

    def test_bus_capacity_for(self):
        self.assertEqual(bus_capacity_for("OWN"), 0)
        self.assertEqual(bus_capacity_for("UNKN"), 0)
        self.assertEqual(bus_capacity_for("A01"), 42)

    def test_parse_bus_id_filter(self):
        self.assertEqual(parse_bus_id_filter(None), [])
        self.assertEqual(parse_bus_id_filter("A01"), ["A01"])
        self.assertEqual(parse_bus_id_filter("A01, A02"), ["A01", "A02"])

    def test_normalize_plant(self):
        self.assertEqual(normalize_plant("P1"), "P1")
        self.assertEqual(normalize_plant("p2"), "P2")
        self.assertEqual(normalize_plant("BK"), "BK")
        self.assertIsNone(normalize_plant("X1"))


if __name__ == "__main__":
    unittest.main()
