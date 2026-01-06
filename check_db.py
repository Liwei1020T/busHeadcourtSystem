import os
import sqlite3

db_path = os.getenv("BUS_SCANS_DB_PATH", "./pi-agent/data/bus_scans.db")
output_path = os.getenv("BUS_SCANS_OUTPUT", "db_output.txt")

conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
cursor = conn.cursor()
cursor.execute("SELECT id, batch_id, scan_time, uploaded FROM scans WHERE uploaded = 0 LIMIT 5")
rows = cursor.fetchall()

with open(output_path, "w") as f:
    for row in rows:
        f.write(f"ID: {row['id']} | Batch: {row['batch_id']} | Time: '{row['scan_time']}' | Uploaded: {row['uploaded']}\n")
conn.close()
print(f"Output written to {output_path}")
