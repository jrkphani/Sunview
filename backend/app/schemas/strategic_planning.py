"""
Pydantic schemas for Strategic Planning API
Advanced analytics response models and validation
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, date
from enum import Enum

# Enums for Strategic Planning
class SeasonalityType(str, Enum):
    """Types of seasonality patterns"""
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"
    NONE = "none"

class LifecycleStage(str, Enum):
    """SKU lifecycle stages"""
    INTRODUCTION = "introduction"
    GROWTH = "growth" 
    MATURITY = "maturity"
    DECLINE = "decline"
    PHASE_OUT = "phase_out"

class StabilityLevel(str, Enum):
    """Forecast stability levels"""
    VERY_STABLE = "very_stable"
    STABLE = "stable"
    MODERATE = "moderate"
    VOLATILE = "volatile"
    VERY_VOLATILE = "very_volatile"

class TrendDirection(str, Enum):
    """Trend directions for analysis"""
    INCREASING = "increasing"
    DECREASING = "decreasing"
    STABLE = "stable"
    CYCLICAL = "cyclical"

# Base Models
class AnalysisPeriod(BaseModel):
    """Analysis period specification"""
    start_date: date
    end_date: date
    total_days: int
    data_points: int

class StatisticalSignificance(BaseModel):
    """Statistical significance metrics"""
    p_value: float = Field(..., ge=0.0, le=1.0, description="Statistical p-value")
    confidence_level: float = Field(..., ge=0.0, le=1.0, description="Confidence level")
    is_significant: bool = Field(..., description="Whether result is statistically significant")

# Seasonality Analysis Models
class SeasonalPattern(BaseModel):
    """Individual seasonal pattern detection"""
    pattern_type: SeasonalityType
    strength: float = Field(..., ge=0.0, le=1.0, description="Pattern strength (0-1)")
    amplitude: float = Field(..., description="Pattern amplitude")
    period_length: int = Field(..., gt=0, description="Period length in days/weeks")
    phase_shift: Optional[float] = Field(None, description="Phase shift in radians")
    frequency_components: List[float] = Field(default_factory=list)

class SKUSeasonalityAnalysis(BaseModel):
    """Seasonality analysis for individual SKU"""
    sku_id: str
    category: Optional[str] = None
    detected_patterns: List[SeasonalPattern]
    dominant_pattern: Optional[SeasonalityType] = None
    seasonality_score: float = Field(..., ge=0.0, le=1.0)
    statistical_significance: StatisticalSignificance
    peak_periods: List[str] = Field(default_factory=list)
    low_periods: List[str] = Field(default_factory=list)

class SeasonalityAnalysisResponse(BaseModel):
    """Response model for seasonality analysis"""
    analysis_period: AnalysisPeriod
    total_skus_analyzed: int
    sku_analyses: List[SKUSeasonalityAnalysis]
    category_summary: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    insights: List[str] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)

# Forecast Bias Analysis Models
class BiasMetrics(BaseModel):
    """Forecast bias calculation metrics"""
    mean_bias: float = Field(..., description="Mean forecast bias")
    median_bias: float = Field(..., description="Median forecast bias") 
    bias_percentage: float = Field(..., description="Bias as percentage of actual")
    systematic_bias: bool = Field(..., description="Whether bias is systematic")
    bias_direction: str = Field(..., description="Over/under forecasting tendency")

class LocationBiasAnalysis(BaseModel):
    """Bias analysis for specific location/warehouse"""
    location_code: str
    location_name: Optional[str] = None
    bias_metrics: BiasMetrics
    product_groups: Dict[str, BiasMetrics] = Field(default_factory=dict)
    trend_analysis: Dict[str, float] = Field(default_factory=dict)
    data_quality_score: float = Field(..., ge=0.0, le=1.0)

class ForecastBiasTrendsResponse(BaseModel):
    """Response model for forecast bias trends"""
    analysis_period: AnalysisPeriod
    overall_bias_metrics: BiasMetrics
    location_analyses: List[LocationBiasAnalysis]
    temporal_trends: List[Dict[str, Any]] = Field(default_factory=list)
    bias_patterns: List[str] = Field(default_factory=list)
    corrective_actions: List[str] = Field(default_factory=list)

# SKU Lifecycle Analysis Models
class LifecycleMetrics(BaseModel):
    """Metrics for lifecycle classification"""
    demand_trend_slope: float = Field(..., description="Demand trend slope")
    volume_growth_rate: float = Field(..., description="Volume growth rate")
    demand_variance: float = Field(..., description="Demand variance measure")
    time_since_introduction: Optional[int] = Field(None, description="Days since introduction")
    revenue_contribution: float = Field(..., ge=0.0, description="Revenue contribution")

class SKULifecycleClassification(BaseModel):
    """Lifecycle classification for individual SKU"""
    sku_id: str
    category: Optional[str] = None
    current_stage: LifecycleStage
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    lifecycle_metrics: LifecycleMetrics
    stage_transition_probability: Dict[LifecycleStage, float] = Field(default_factory=dict)
    recommended_actions: List[str] = Field(default_factory=list)
    risk_factors: List[str] = Field(default_factory=list)

class SKULifecycleResponse(BaseModel):
    """Response model for SKU lifecycle analysis"""
    analysis_period: AnalysisPeriod
    total_skus_classified: int
    lifecycle_distribution: Dict[LifecycleStage, int] = Field(default_factory=dict)
    sku_classifications: List[SKULifecycleClassification]
    category_insights: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    transition_predictions: List[Dict[str, Any]] = Field(default_factory=list)
    strategic_recommendations: List[str] = Field(default_factory=list)

# Product Mix Analysis Models
class ProductMixMetrics(BaseModel):
    """Product mix change metrics"""
    mix_shift_magnitude: float = Field(..., description="Magnitude of mix shift")
    mix_shift_direction: str = Field(..., description="Direction of mix change")
    statistical_significance: StatisticalSignificance
    contribution_change: float = Field(..., description="Change in contribution %")

class CategoryMixAnalysis(BaseModel):
    """Product mix analysis for category"""
    category_name: str
    current_mix_percentage: float = Field(..., ge=0.0, le=100.0)
    previous_mix_percentage: float = Field(..., ge=0.0, le=100.0)
    mix_change: float = Field(..., description="Percentage point change")
    mix_metrics: ProductMixMetrics
    key_drivers: List[str] = Field(default_factory=list)
    impact_assessment: str

class ProductMixShiftResponse(BaseModel):
    """Response model for product mix shift analysis"""
    analysis_period: AnalysisPeriod
    comparison_period: AnalysisPeriod
    overall_mix_stability: float = Field(..., ge=0.0, le=1.0)
    category_analyses: List[CategoryMixAnalysis]
    significant_shifts: List[Dict[str, Any]] = Field(default_factory=list)
    market_implications: List[str] = Field(default_factory=list)
    strategic_insights: List[str] = Field(default_factory=list)

# Forecast Stability Analysis Models
class StabilityMetrics(BaseModel):
    """Comprehensive stability metrics"""
    coefficient_of_variation: float = Field(..., description="CV of forecasts")
    mean_absolute_revision: float = Field(..., description="MAR metric")
    forecast_revision_frequency: float = Field(..., description="Revision frequency")
    stability_score: float = Field(..., ge=0.0, le=1.0, description="Overall stability score")
    volatility_index: float = Field(..., description="Volatility measure")

class LocationStabilityAnalysis(BaseModel):
    """Stability analysis for specific location"""
    location_code: str
    location_name: Optional[str] = None
    stability_level: StabilityLevel
    stability_metrics: StabilityMetrics
    product_stability_breakdown: Dict[str, StabilityMetrics] = Field(default_factory=dict)
    stability_trends: List[Dict[str, Any]] = Field(default_factory=list)
    improvement_opportunities: List[str] = Field(default_factory=list)

class ForecastStabilityIndexResponse(BaseModel):
    """Response model for forecast stability index"""
    analysis_period: AnalysisPeriod
    overall_stability_index: float = Field(..., ge=0.0, le=1.0)
    stability_distribution: Dict[StabilityLevel, int] = Field(default_factory=dict)
    location_analyses: List[LocationStabilityAnalysis]
    stability_benchmarks: Dict[str, float] = Field(default_factory=dict)
    improvement_recommendations: List[str] = Field(default_factory=list)
    risk_alerts: List[str] = Field(default_factory=list)

# Common Request Models
class AnalysisRequest(BaseModel):
    """Base request model for strategic analysis"""
    start_date: Optional[date] = Field(None, description="Analysis start date")
    end_date: Optional[date] = Field(None, description="Analysis end date")
    sku_filter: Optional[List[str]] = Field(None, description="Filter by SKU IDs")
    category_filter: Optional[List[str]] = Field(None, description="Filter by categories")
    location_filter: Optional[List[str]] = Field(None, description="Filter by locations")
    confidence_level: float = Field(0.95, ge=0.5, le=0.99, description="Statistical confidence level")
    include_predictions: bool = Field(True, description="Include predictive insights")
    
    @validator('end_date')
    def validate_date_range(cls, v, values):
        if 'start_date' in values and values['start_date'] and v:
            if v <= values['start_date']:
                raise ValueError('end_date must be after start_date')
        return v

class SeasonalityAnalysisRequest(AnalysisRequest):
    """Request model for seasonality analysis"""
    pattern_types: List[SeasonalityType] = Field(
        default=[SeasonalityType.WEEKLY, SeasonalityType.MONTHLY, SeasonalityType.QUARTERLY],
        description="Types of seasonality to detect"
    )
    min_pattern_strength: float = Field(0.3, ge=0.1, le=1.0, description="Minimum pattern strength")

class BiasAnalysisRequest(AnalysisRequest):
    """Request model for bias analysis"""
    aggregation_level: str = Field("weekly", pattern="^(daily|weekly|monthly)$")
    include_historical_trends: bool = Field(True, description="Include historical bias trends")

class LifecycleAnalysisRequest(AnalysisRequest):
    """Request model for lifecycle analysis"""
    include_transition_probabilities: bool = Field(True, description="Include transition probabilities")
    min_data_points: int = Field(30, ge=10, description="Minimum data points for classification")

class MixAnalysisRequest(AnalysisRequest):
    """Request model for product mix analysis"""
    comparison_period_days: int = Field(90, ge=30, le=365, description="Comparison period length")
    min_significance_level: float = Field(0.05, ge=0.01, le=0.1, description="Minimum significance for changes")

class StabilityAnalysisRequest(AnalysisRequest):
    """Request model for stability analysis"""
    stability_window_days: int = Field(28, ge=7, le=90, description="Window for stability calculation")
    include_volatility_breakdown: bool = Field(True, description="Include detailed volatility analysis")