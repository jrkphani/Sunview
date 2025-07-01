"""
Configuration management for GXO Signify API
Environment-based settings with validation
"""

from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import List, Optional
import os

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Environment
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "GXO Signify Forecasting API"
    VERSION: str = "1.0.0"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:5173",
            "https://main.d1abc2def3ghij.amplifyapp.com"
        ],
        env="ALLOWED_ORIGINS"
    )
    
    # AWS Configuration
    AWS_REGION: str = Field(default="us-east-1", env="AWS_REGION")
    S3_BUCKET_NAME: str = Field(
        default="gxo-signify-pilot-272858488437", 
        env="S3_BUCKET_NAME"
    )
    
    # Amazon Forecast
    FORECAST_DATASET_GROUP_ARN: str = Field(
        default="arn:aws:forecast:us-east-1:272858488437:dataset-group/signify_logistics_pilot",
        env="FORECAST_DATASET_GROUP_ARN"
    )
    
    # Database Configuration
    DATABASE_URL: Optional[str] = Field(default=None, env="DATABASE_URL")
    DB_POOL_SIZE: int = Field(default=10, env="DB_POOL_SIZE")
    DB_MAX_OVERFLOW: int = Field(default=20, env="DB_MAX_OVERFLOW")
    
    # Redis Configuration (for caching)
    REDIS_URL: Optional[str] = Field(default=None, env="REDIS_URL")
    CACHE_TTL_SECONDS: int = Field(default=3600, env="CACHE_TTL_SECONDS")  # 1 hour
    
    # Security
    SECRET_KEY: str = Field(
        default="gxo-signify-secret-key-change-in-production",
        env="SECRET_KEY"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = Field(default=100, env="RATE_LIMIT_PER_MINUTE")
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(default="json", env="LOG_FORMAT")
    
    # ML Service Configuration
    FORECAST_HORIZON_DAYS: int = Field(default=28, env="FORECAST_HORIZON_DAYS")
    CONFIDENCE_INTERVALS: List[str] = Field(
        default=["0.1", "0.5", "0.9"],
        env="CONFIDENCE_INTERVALS"
    )
    
    # Business Logic Settings
    MINIMUM_FORECAST_ACCURACY: float = Field(default=0.75, env="MINIMUM_FORECAST_ACCURACY")
    ANOMALY_SENSITIVITY_THRESHOLD: int = Field(default=50, env="ANOMALY_SENSITIVITY_THRESHOLD")
    
    # Data Processing
    MAX_FORECAST_ITEMS_PER_REQUEST: int = Field(default=100, env="MAX_FORECAST_ITEMS_PER_REQUEST")
    DATA_REFRESH_INTERVAL_HOURS: int = Field(default=24, env="DATA_REFRESH_INTERVAL_HOURS")
    
    @validator("ENVIRONMENT")
    def validate_environment(cls, v):
        if v not in ["development", "staging", "production"]:
            raise ValueError("Environment must be development, staging, or production")
        return v
    
    @validator("ALLOWED_ORIGINS", pre=True)
    def parse_allowed_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("CONFIDENCE_INTERVALS", pre=True)
    def parse_confidence_intervals(cls, v):
        if isinstance(v, str):
            return [interval.strip() for interval in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Global settings instance
settings = Settings()

# Environment-specific configurations
def get_database_url():
    """Get database URL based on environment"""
    if settings.DATABASE_URL:
        return settings.DATABASE_URL
    
    if settings.ENVIRONMENT == "production":
        # Aurora PostgreSQL in production
        return "postgresql+asyncpg://user:password@aurora-cluster.amazonaws.com:5432/gxo_forecasting"
    elif settings.ENVIRONMENT == "staging":
        return "postgresql+asyncpg://user:password@staging-db.amazonaws.com:5432/gxo_forecasting"
    else:
        # Local development
        return "sqlite+aiosqlite:///./gxo_forecasting.db"

def get_redis_url():
    """Get Redis URL based on environment"""
    if settings.REDIS_URL:
        return settings.REDIS_URL
    
    if settings.ENVIRONMENT == "production":
        return "redis://elasticache-cluster.amazonaws.com:6379"
    elif settings.ENVIRONMENT == "staging":
        return "redis://staging-redis.amazonaws.com:6379"
    else:
        return None  # No Redis in development

# AWS Service Configuration
AWS_CONFIG = {
    "region_name": settings.AWS_REGION,
    # AWS credentials will be picked up from environment/IAM role
}

# Logging configuration
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "json": {
            "format": "%(asctime)s %(name)s %(levelname)s %(message)s",
            "class": "pythonjsonlogger.jsonlogger.JsonFormatter"
        },
        "standard": {
            "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
        }
    },
    "handlers": {
        "default": {
            "level": settings.LOG_LEVEL,
            "formatter": settings.LOG_FORMAT,
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout"
        }
    },
    "loggers": {
        "": {
            "handlers": ["default"],
            "level": settings.LOG_LEVEL,
            "propagate": False
        },
        "uvicorn": {
            "handlers": ["default"],
            "level": "INFO",
            "propagate": False
        }
    }
}