"""
Application configuration module.
Loads settings from environment variables.
"""

import os
from typing import Dict, Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database configuration
    # Default to SQLite for easy local development
    database_url: str = "sqlite:///./bus_optimizer.db"
    
    # API Keys configuration (format: "LABEL1:KEY1,LABEL2:KEY2")
    api_keys: str = "ENTRY_GATE:ENTRY_SECRET"
    
    # Application settings
    app_name: str = "Bus Optimizer API"
    debug: bool = False
    
    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


def get_api_keys_map() -> Dict[str, str]:
    """
    Parse API keys from environment variable into a dictionary.
    Format: "BUS_ID1:KEY1,BUS_ID2:KEY2"
    Returns: {"BUS_ID1": "KEY1", "BUS_ID2": "KEY2"}
    """
    settings = get_settings()
    api_keys_str = settings.api_keys
    
    if not api_keys_str:
        return {}
    
    result = {}
    pairs = api_keys_str.split(",")
    
    for pair in pairs:
        pair = pair.strip()
        if ":" in pair:
            bus_id, key = pair.split(":", 1)
            result[bus_id.strip()] = key.strip()
    
    return result
