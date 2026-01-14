"""
Employee master list record.
Stores the uploaded master list fields as-is for audit and downstream reporting.
"""

from sqlalchemy import Column, BigInteger, String, Date, Index

from app.core.db import Base


class EmployeeMaster(Base):
    __tablename__ = "employee_master"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)
    personid = Column(BigInteger, nullable=True, index=True)
    row_hash = Column(String, nullable=True)
    date_joined = Column(Date, nullable=True)
    name = Column(String(100), nullable=True)
    sap_id = Column(String(50), nullable=True)
    status = Column(String(30), nullable=True)
    wdid = Column(String(50), nullable=True)
    transport_contractor = Column(String(100), nullable=True)
    address1 = Column(String(255), nullable=True)
    postcode = Column(String(20), nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    contact_no = Column(String(50), nullable=True)
    pickup_point = Column(String(255), nullable=True)
    transport = Column(String(50), nullable=True)
    route = Column(String(100), nullable=True)
    building_id = Column(String(50), nullable=True)
    day_type = Column(String(20), nullable=True)
    nationality = Column(String(50), nullable=True)
    terminate = Column(Date, nullable=True)

    __table_args__ = (
        Index("uq_employee_master_personid", "personid", unique=True, postgresql_where=(personid.isnot(None))),
        Index("ix_employee_master_transport", "transport"),
        Index("ix_employee_master_route", "route"),
        Index("ix_employee_master_contractor", "transport_contractor"),
    )

    def __repr__(self):
        return f"<EmployeeMaster id={self.id} personid={self.personid}>"
