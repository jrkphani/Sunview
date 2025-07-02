"""
Executive Summary API Response Models
Pydantic models for executive summary KPI endpoints
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime
from enum import Enum

class SeverityLevel(str, Enum):
    """Alert severity levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class TrendDirection(str, Enum):
    """Trend direction indicators"""
    INCREASING = "increasing"
    DECREASING = "decreasing"
    STABLE = "stable"
    INSUFFICIENT_DATA = "insufficient_data"

class AccuracyMetrics(BaseModel):
    """Forecast accuracy metrics"""
    mape: float = Field(..., description="Mean Absolute Percentage Error")
    wape: float = Field(..., description="Weighted Absolute Percentage Error")
    bias: float = Field(..., description="Forecast bias")
    rmse: float = Field(..., description="Root Mean Square Error")
    sample_size: int = Field(..., description="Number of data points analyzed")
    confidence_interval_lower: Optional[float] = Field(None, description="Lower confidence interval")
    confidence_interval_upper: Optional[float] = Field(None, description="Upper confidence interval")

class ForecastAccuracyResponse(BaseModel):
    """Response model for forecast accuracy endpoint"""
    overall_accuracy: AccuracyMetrics
    time_period_days: int = Field(..., description="Analysis period in days")
    records_analyzed: int = Field(..., description="Total records analyzed")
    unique_skus: int = Field(..., description="Number of unique SKUs analyzed")
    calculation_date: datetime = Field(..., description="When the calculation was performed")
    accuracy_grade: str = Field(..., description="Overall accuracy grade (A-F)")
    improvement_vs_previous: Optional[float] = Field(None, description="Improvement percentage vs previous period")

class SKUError(BaseModel):
    """SKU-level forecast error details"""
    sku_id: str = Field(..., description="SKU identifier")
    forecast_error: float = Field(..., description="Forecast error percentage")
    forecast_accuracy: float = Field(..., description="Forecast accuracy percentage")
    volume_forecast: float = Field(..., description="Forecasted volume")
    actual_volume: float = Field(..., description="Actual volume")
    error_percentage: float = Field(..., description="Error as percentage of actual")
    bias: float = Field(..., description="Forecast bias")
    trend_direction: TrendDirection = Field(..., description="Trend direction")
    historical_performance: Optional[Dict[str, float]] = Field(None, description="Historical performance metrics")

class TopSKUErrorsResponse(BaseModel):
    """Response model for top SKU errors endpoint"""
    top_sku_errors: List[SKUError]
    analysis_period_days: int = Field(..., description="Analysis period in days")
    total_skus_analyzed: int = Field(..., description="Total number of SKUs analyzed")
    average_error_rate: float = Field(..., description="Average error rate across all SKUs")
    calculation_date: datetime = Field(..., description="When the calculation was performed")
    improvement_recommendations: List[str] = Field(default_factory=list, description="Recommended actions")

class UtilizationTrend(BaseModel):
    """Historical utilization trend data point"""
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    utilization: float = Field(..., description="Utilization percentage")

class TruckUtilizationResponse(BaseModel):
    """Response model for truck utilization endpoint"""
    current_utilization: float = Field(..., description="Current utilization percentage")
    seven_day_average: float = Field(..., description="7-day average utilization")
    improvement_vs_baseline: float = Field(..., description="Improvement vs baseline percentage")
    trend_direction: TrendDirection = Field(..., description="Utilization trend direction")
    peak_utilization: float = Field(..., description="Peak utilization in period")
    utilization_variance: float = Field(..., description="Utilization variance")
    historical_trend: List[UtilizationTrend] = Field(default_factory=list, description="Historical trend data")
    baseline_utilization: float = Field(75.0, description="Baseline utilization for comparison")
    target_utilization: float = Field(85.0, description="Target utilization percentage")
    calculation_date: datetime = Field(..., description="When the calculation was performed")

class SKUInventoryDOH(BaseModel):
    """SKU-level Days of Inventory on Hand"""
    sku_id: str = Field(..., description="SKU identifier")
    current_inventory: float = Field(..., description="Current inventory level")
    avg_daily_demand: float = Field(..., description="Average daily demand")
    days_of_inventory: float = Field(..., description="Days of inventory on hand")
    status: str = Field(..., description="Inventory status (low, normal, high, excess, stockout)")
    recommended_action: Optional[str] = Field(None, description="Recommended action")

class InventoryDOHResponse(BaseModel):
    """Response model for inventory Days of Inventory on Hand endpoint"""
    sku_level_doh: Dict[str, SKUInventoryDOH] = Field(..., description="SKU-level DOH metrics")
    average_doh: float = Field(..., description="Average DOH across all SKUs")
    median_doh: float = Field(..., description="Median DOH across all SKUs")
    skus_analyzed: int = Field(..., description="Number of SKUs analyzed")
    low_inventory_count: int = Field(0, description="Number of SKUs with low inventory")
    excess_inventory_count: int = Field(0, description="Number of SKUs with excess inventory")
    stockout_count: int = Field(0, description="Number of SKUs with stockouts")
    optimal_range_count: int = Field(0, description="Number of SKUs in optimal range")
    calculation_date: datetime = Field(..., description="When the calculation was performed")
    inventory_health_score: float = Field(..., description="Overall inventory health score (0-100)")

class OTIFPerformanceResponse(BaseModel):
    """Response model for On-Time In-Full performance endpoint"""
    overall_otif_percentage: float = Field(..., description="Overall OTIF percentage")
    on_time_percentage: float = Field(..., description="On-time delivery percentage")
    in_full_percentage: float = Field(..., description="In-full delivery percentage")
    total_deliveries: int = Field(..., description="Total number of deliveries analyzed")
    trend_direction: TrendDirection = Field(..., description="OTIF trend direction")
    target_otif: float = Field(95.0, description="Target OTIF percentage")
    performance_vs_target: float = Field(..., description="Performance vs target percentage")
    monthly_trend: List[Dict[str, Any]] = Field(default_factory=list, description="Monthly OTIF trend")
    root_cause_analysis: List[str] = Field(default_factory=list, description="Common causes of OTIF failures")
    calculation_date: datetime = Field(..., description="When the calculation was performed")

class Alert(BaseModel):
    """Individual alert details"""
    id: str = Field(..., description="Unique alert identifier")
    type: str = Field(..., description="Alert type")
    severity: SeverityLevel = Field(..., description="Alert severity level")
    title: str = Field(..., description="Alert title")
    description: str = Field(..., description="Alert description")
    current_value: Optional[float] = Field(None, description="Current metric value")
    threshold: Optional[float] = Field(None, description="Threshold value")
    recommendation: str = Field(..., description="Recommended action")
    created_at: datetime = Field(..., description="When the alert was created")
    affected_skus: Optional[List[str]] = Field(None, description="SKUs affected by this alert")
    estimated_impact: Optional[str] = Field(None, description="Estimated business impact")

class AlertsSummaryResponse(BaseModel):
    """Response model for alerts summary endpoint"""
    alerts: List[Alert] = Field(..., description="List of active alerts")
    total_alerts: int = Field(..., description="Total number of alerts")
    high_severity_count: int = Field(..., description="Number of high severity alerts")
    medium_severity_count: int = Field(..., description="Number of medium severity alerts")
    low_severity_count: int = Field(..., description="Number of low severity alerts")
    critical_severity_count: int = Field(0, description="Number of critical severity alerts")
    alert_categories: Dict[str, int] = Field(default_factory=dict, description="Alert counts by category")
    last_checked: datetime = Field(..., description="Last time alerts were checked")
    system_health_score: float = Field(..., description="Overall system health score (0-100)")
    thresholds: Dict[str, float] = Field(..., description="Current alert thresholds")
    trending_issues: List[str] = Field(default_factory=list, description="Issues that are trending")

class ExecutiveSummaryOverview(BaseModel):
    """Comprehensive executive summary overview"""
    forecast_accuracy: ForecastAccuracyResponse
    truck_utilization: TruckUtilizationResponse
    inventory_health: InventoryDOHResponse
    otif_performance: OTIFPerformanceResponse
    alerts_summary: AlertsSummaryResponse
    key_insights: List[str] = Field(default_factory=list, description="Key business insights")
    recommendations: List[str] = Field(default_factory=list, description="Strategic recommendations")
    performance_score: float = Field(..., description="Overall performance score (0-100)")
    report_generated_at: datetime = Field(..., description="When the report was generated")
    data_freshness: Dict[str, str] = Field(..., description="Data freshness indicators")

# Request models for filtering and parameters
class ForecastAccuracyRequest(BaseModel):
    """Request parameters for forecast accuracy endpoint"""
    time_period_days: int = Field(30, ge=1, le=365, description="Analysis period in days")
    breakdown_by: str = Field("daily", regex="^(daily|weekly|monthly)$", description="Breakdown granularity")
    include_confidence_intervals: bool = Field(True, description="Include confidence intervals")
    sku_filter: Optional[List[str]] = Field(None, description="Filter by specific SKUs")

class TopSKUErrorsRequest(BaseModel):
    """Request parameters for top SKU errors endpoint"""
    top_n: int = Field(10, ge=1, le=100, description="Number of top SKUs to return")
    time_period_days: int = Field(30, ge=1, le=365, description="Analysis period in days")
    error_type: str = Field("mape", regex="^(mape|wape|bias|rmse)$", description="Error metric type")
    minimum_volume: Optional[float] = Field(None, description="Minimum volume threshold")

class AlertsRequest(BaseModel):
    """Request parameters for alerts endpoint"""
    severity_filter: Optional[List[SeverityLevel]] = Field(None, description="Filter by severity levels")
    alert_types: Optional[List[str]] = Field(None, description="Filter by alert types")
    include_resolved: bool = Field(False, description="Include resolved alerts")
    max_age_hours: int = Field(24, ge=1, le=168, description="Maximum alert age in hours")