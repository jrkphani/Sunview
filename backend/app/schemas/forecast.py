"""
Pydantic schemas for forecast API
Request/response models and validation
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum

class TimeHorizon(str, Enum):
    """Forecast time horizon options"""
    DAY_1 = "1d"
    WEEK_1 = "7d"
    WEEK_2 = "14d"
    WEEK_4 = "28d"

class ForecastType(str, Enum):
    """Types of forecasts available"""
    DEMAND = "demand"
    VOLUME = "volume"
    UTILIZATION = "utilization"

class ConfidenceLevel(str, Enum):
    """Confidence interval levels"""
    LOW = "0.1"
    MEDIUM = "0.5"
    HIGH = "0.9"

# Request Models
class ForecastRequest(BaseModel):
    """Request model for forecast generation"""
    sku_ids: Optional[List[str]] = Field(None, description="SKU IDs to forecast")
    warehouse_codes: Optional[List[str]] = Field(None, description="Warehouse codes to include")
    horizon_days: int = Field(..., ge=1, le=28, description="Forecast horizon in days")
    forecast_type: ForecastType = Field(ForecastType.DEMAND, description="Type of forecast")
    confidence_intervals: List[ConfidenceLevel] = Field(
        default=[ConfidenceLevel.LOW, ConfidenceLevel.MEDIUM, ConfidenceLevel.HIGH],
        description="Confidence intervals to include"
    )
    include_explainability: bool = Field(False, description="Include explainability data")
    
    @validator('sku_ids')
    def validate_sku_ids(cls, v):
        if v and len(v) > 100:
            raise ValueError('Maximum 100 SKUs per request')
        return v

class DateRange(BaseModel):
    """Date range for filtering"""
    start_date: date
    end_date: date
    
    @validator('end_date')
    def validate_date_range(cls, v, values):
        if 'start_date' in values and v <= values['start_date']:
            raise ValueError('end_date must be after start_date')
        return v

# Response Models
class ForecastPoint(BaseModel):
    """Individual forecast data point"""
    timestamp: datetime
    predicted_value: float
    confidence_lower: Optional[float] = None
    confidence_upper: Optional[float] = None
    confidence_level: Optional[str] = None

class ForecastResponse(BaseModel):
    """Response model for forecast data"""
    sku_id: str
    warehouse_code: Optional[str] = None
    forecast_type: ForecastType
    horizon_days: int
    generated_at: datetime
    predictor_arn: Optional[str] = None
    accuracy_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    
    # Forecast data points
    forecast_points: List[ForecastPoint]
    
    # Metadata
    data_source: str
    model_version: Optional[str] = None
    feature_importance: Optional[Dict[str, float]] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class AccuracyMetrics(BaseModel):
    """Forecast accuracy calculation results"""
    mape: float = Field(..., description="Mean Absolute Percentage Error")
    wape: float = Field(..., description="Weighted Absolute Percentage Error") 
    bias: float = Field(..., description="Forecast bias")
    rmse: float = Field(..., description="Root Mean Square Error")
    ci_coverage: Optional[float] = Field(None, description="Confidence interval coverage")

class AccuracyMetricsResponse(BaseModel):
    """Response model for accuracy metrics"""
    period_start: date
    period_end: date
    total_forecasts: int
    sku_count: int
    
    # Overall accuracy metrics
    overall_metrics: AccuracyMetrics
    
    # SKU-level breakdown
    sku_level_metrics: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Per-SKU accuracy breakdown"
    )
    
    # Time-based trends
    daily_accuracy: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Daily accuracy trends"
    )
    
    # Model performance insights
    insights: List[str] = Field(
        default_factory=list,
        description="Key insights about forecast performance"
    )

class ForecastExplanation(BaseModel):
    """Explainability data for forecasts"""
    forecast_id: str
    primary_drivers: List[Dict[str, Any]]
    feature_contributions: Dict[str, float]
    seasonal_components: Optional[Dict[str, Any]] = None
    trend_analysis: Optional[Dict[str, Any]] = None
    external_factors: List[str] = Field(default_factory=list)
    confidence_factors: List[str] = Field(default_factory=list)

class ForecastJob(BaseModel):
    """Forecast generation job status"""
    job_id: str
    status: str = Field(..., pattern="^(pending|running|completed|failed)$")
    progress_percentage: float = Field(0.0, ge=0.0, le=100.0)
    started_at: datetime
    estimated_completion: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_message: Optional[str] = None
    
    # Job parameters
    parameters: ForecastRequest
    
    # Results (when completed)
    results_summary: Optional[Dict[str, Any]] = None

class VolumeforecastPoint(BaseModel):
    """Volume forecast data point"""
    date: date
    predicted_volume: float
    confidence_lower: Optional[float] = None
    confidence_upper: Optional[float] = None
    actual_volume: Optional[float] = None
    variance_percentage: Optional[float] = None

class VolumeForecastResponse(BaseModel):
    """Response model for volume forecasts"""
    aggregation_level: str  # daily, weekly, monthly
    time_horizon: TimeHorizon
    total_predicted_volume: float
    average_daily_volume: float
    peak_volume_day: Optional[date] = None
    peak_volume_value: Optional[float] = None
    
    # Time series data
    forecast_series: List[VolumeforecastPoint]
    
    # Insights
    volume_insights: List[str] = Field(default_factory=list)
    capacity_recommendations: List[str] = Field(default_factory=list)

class ForecastSummaryStats(BaseModel):
    """Summary statistics for forecasts"""
    total_active_forecasts: int
    accuracy_score: float
    last_update: datetime
    next_scheduled_update: datetime
    data_freshness_hours: int
    
    # Breakdown by type
    forecast_breakdown: Dict[str, int] = Field(
        default_factory=dict,
        description="Count by forecast type"
    )
    
    # Performance metrics
    average_processing_time_minutes: float
    success_rate_percentage: float