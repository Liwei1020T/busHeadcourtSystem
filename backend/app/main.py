"""
Bus Optimizer Backend API
FastAPI application for the Bus Passenger Counting System.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import bus_router, report_router
from app.core.config import get_settings
from app.core.db import create_tables

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    logger.info("Starting Bus Optimizer API...")
    settings = get_settings()
    logger.info(f"Database URL: {settings.database_url[:30]}...")
    
    # Create tables if they don't exist
    try:
        create_tables()
        logger.info("Database tables ready")
    except Exception as e:
        logger.error(f"Failed to create tables: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Bus Optimizer API...")


# Create FastAPI app
settings = get_settings()
app = FastAPI(
    title=settings.app_name,
    description="API for Bus Passenger Counting & Optimization System",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(bus_router)
app.include_router(report_router)


@app.get("/")
def root():
    """Root endpoint."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


# For running with uvicorn directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
