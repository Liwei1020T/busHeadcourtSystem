"""
Database connection and session management.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session, DeclarativeBase
from typing import Generator

from app.core.config import get_settings


# Get database URL from settings
settings = get_settings()

# Handle SQLite connection args
connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(settings.database_url, echo=settings.debug, connect_args=connect_args)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


def get_db() -> Generator[Session, None, None]:
    """
    Dependency that provides a database session.
    Use with FastAPI's Depends().
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    """Create all database tables."""
    # Import all models to ensure they are registered
    from app.models import bus, van, employee, employee_master, attendance, unknown_attendance  # noqa
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")


def drop_tables() -> None:
    """Drop all database tables (use with caution)."""
    from app.models import bus, van, employee, employee_master, attendance, unknown_attendance  # noqa
    Base.metadata.drop_all(bind=engine)
    print("Database tables dropped")
