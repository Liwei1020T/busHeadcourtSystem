
import sys
import os

# Add the current directory to python path to make imports work
sys.path.append(os.getcwd())

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.core.config import get_settings
from app.models import Employee, EmployeeMaster

# Setup DB connection
settings = get_settings()
engine = create_engine(str(settings.database_url))
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
db = SessionLocal()

try:
    print("--- Debugging Plant/Building ID Data ---")

    # 1. Check distinct building_ids
    result = db.execute(text("SELECT DISTINCT building_id FROM employee_master")).fetchall()
    print(f"\nDistinct building_ids in employee_master: {[r[0] for r in result]}")

    # 2. Check counts
    total = db.query(EmployeeMaster).count()
    with_building = db.query(EmployeeMaster).filter(EmployeeMaster.building_id.isnot(None)).count()
    print(f"\nTotal rows in employee_master: {total}")
    print(f"Rows with building_id: {with_building}")

    # 3. Check ORM query exactly as in report.py
    print("\nChecking ORM query:")
    from sqlalchemy import func

    building_query = (
        db.query(
            Employee.bus_id,
            EmployeeMaster.building_id,
            func.count(Employee.id).label("cnt")
        )
        .join(EmployeeMaster, Employee.batch_id == EmployeeMaster.personid, isouter=True)
        .filter(Employee.active.is_(True))
        .group_by(Employee.bus_id, EmployeeMaster.building_id)
    )

    print(f"SQL: {building_query}")

    results = building_query.all()
    print(f"Results count: {len(results)}")
    for i, row in enumerate(results[:10]):
        print(f"Row {i}: {row}")

    # Check if 'A01' is in there
    a01_data = [r for r in results if r[0] == 'A01']
    print(f"A01 data: {a01_data}")

finally:
    db.close()
