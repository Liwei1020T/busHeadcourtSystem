#!/bin/bash
# Test unknown routes tracking functionality

set -e

echo "=================================================="
echo "Testing Unknown Routes Tracking"
echo "=================================================="

# Database connection
DB_USER="lwt"
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME="bus"

export PGPASSWORD="system"

echo ""
echo "1. Check unknown_attendances table exists..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "\d unknown_attendances" | head -5

echo ""
echo "2. Count unknown attendance records..."
TOTAL=$(psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -t -c "SELECT COUNT(*) FROM unknown_attendances;")
echo "Total unknown attendance records: $TOTAL"

echo ""
echo "3. Show unique unknown routes (bus_id)..."
psql -U $DB_USER -h $DB_HOST -p $DB_PORT -d $DB_NAME -c "
    SELECT
        bus_id,
        route_raw,
        COUNT(*) as count,
        MIN(scanned_on) as first_seen,
        MAX(scanned_on) as last_seen
    FROM unknown_attendances
    WHERE bus_id IS NOT NULL
    GROUP BY bus_id, route_raw
    ORDER BY count DESC
    LIMIT 10;
"

echo ""
echo "4. Test occupancy API includes unknown buses..."
curl -s "http://localhost:8003/api/report/occupancy?date_from=2026-01-13&date_to=2026-01-13" \
  | python3 -c "
import sys, json
data = json.load(sys.stdin)
unknown_buses = [b for b in data['rows'] if b['building_id'] is None]
print(f'Found {len(unknown_buses)} unknown buses in API response:')
for bus in unknown_buses[:5]:
    print(f\"  - {bus['bus_id']}: {bus['route']}, present={bus['total_present']}, roster={bus['total_roster']}\")
"

echo ""
echo "5. Test unknown-attendances API endpoint..."
curl -s "http://localhost:8003/api/report/unknown-attendances/summary?date_from=2026-01-10&date_to=2026-01-13" \
  | python3 -m json.tool

echo ""
echo "=================================================="
echo "✓ All tests completed"
echo "=================================================="
