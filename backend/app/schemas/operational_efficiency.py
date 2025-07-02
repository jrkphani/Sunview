"""
Operational Efficiency API Response Models
Pydantic models for operational efficiency KPI endpoints
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
from datetime import datetime, date
from enum import Enum

class TrendDirection(str, Enum):
    """Trend direction indicators"""
    INCREASING = "increasing"
    DECREASING = "decreasing"
    STABLE = "stable"
    VOLATILE = "volatile"
    INSUFFICIENT_DATA = "insufficient_data"

class PerformanceStatus(str, Enum):
    """Performance status levels"""
    EXCELLENT = "excellent"
    GOOD = "good"
    AVERAGE = "average"
    BELOW_AVERAGE = "below_average"
    POOR = "poor"

class ShiftType(str, Enum):
    """Shift types"""
    DAY = "day"
    EVENING = "evening"
    NIGHT = "night"
    WEEKEND = "weekend"

class ThroughputComparison(BaseModel):
    """Throughput comparison data point"""
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    site_id: str = Field(..., description="Site identifier")
    sku_group: Optional[str] = Field(None, description="SKU group identifier")
    forecasted_throughput: float = Field(..., description="Forecasted throughput")
    actual_throughput: float = Field(..., description="Actual throughput")
    variance_percentage: float = Field(..., description="Variance percentage")
    accuracy_percentage: float = Field(..., description="Accuracy percentage")

class ThroughputComparisonResponse(BaseModel):
    """Response model for forecasted vs actual throughput endpoint"""
    site_comparisons: List[ThroughputComparison] = Field(..., description="Site-level throughput comparisons")
    overall_accuracy: float = Field(..., description="Overall throughput forecast accuracy")
    total_variance: float = Field(..., description="Total variance across all sites")
    best_performing_site: str = Field(..., description="Site with best forecast accuracy")
    worst_performing_site: str = Field(..., description="Site with worst forecast accuracy")
    trend_direction: TrendDirection = Field(..., description="Overall trend direction")
    analysis_period_days: int = Field(..., description="Analysis period in days")
    sites_analyzed: int = Field(..., description="Number of sites analyzed")
    calculation_date: datetime = Field(..., description="When the calculation was performed")
    recommendations: List[str] = Field(default_factory=list, description="Improvement recommendations")

class ConsumptionRateMetrics(BaseModel):
    """Forecast consumption rate metrics"""
    sku_id: str = Field(..., description="SKU identifier")
    forecast_generated: float = Field(..., description="Forecast quantity generated")
    forecast_consumed: float = Field(..., description="Forecast quantity consumed")
    consumption_rate: float = Field(..., description="Consumption rate percentage")
    remaining_forecast: float = Field(..., description="Remaining forecast quantity")
    consumption_velocity: float = Field(..., description="Daily consumption velocity")
    expected_depletion_date: Optional[date] = Field(None, description="Expected forecast depletion date")
    consumption_trend: TrendDirection = Field(..., description="Consumption trend")

class ForecastConsumptionResponse(BaseModel):
    """Response model for forecast consumption rate endpoint"""
    sku_consumption_rates: List[ConsumptionRateMetrics] = Field(..., description="SKU-level consumption rates")
    overall_consumption_rate: float = Field(..., description="Overall consumption rate percentage")
    fast_consuming_skus: List[str] = Field(..., description="SKUs with high consumption rates")
    slow_consuming_skus: List[str] = Field(..., description="SKUs with low consumption rates")
    average_consumption_velocity: float = Field(..., description="Average daily consumption velocity")
    forecast_utilization_efficiency: float = Field(..., description="Forecast utilization efficiency score")
    waste_reduction_opportunities: List[Dict[str, Any]] = Field(default_factory=list, description="Waste reduction opportunities")
    calculation_date: datetime = Field(..., description="When the calculation was performed")

class LaborMetrics(BaseModel):
    """Labor forecast vs actual metrics"""
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    site_id: str = Field(..., description="Site identifier")
    department: str = Field(..., description="Department or work area")
    forecasted_hours: float = Field(..., description="Forecasted labor hours")
    actual_hours: float = Field(..., description="Actual labor hours worked")
    forecasted_headcount: int = Field(..., description="Forecasted headcount")
    actual_headcount: int = Field(..., description="Actual headcount")
    productivity_rate: float = Field(..., description="Productivity rate (units per hour)")
    efficiency_percentage: float = Field(..., description="Labor efficiency percentage")
    overtime_hours: float = Field(0.0, description="Overtime hours worked")
    variance_hours: float = Field(..., description="Variance in hours")
    cost_variance: float = Field(..., description="Cost variance")

class LaborForecastResponse(BaseModel):
    """Response model for labor forecast vs actual endpoint"""
    labor_metrics: List[LaborMetrics] = Field(..., description="Labor metrics by site and department")
    overall_labor_accuracy: float = Field(..., description="Overall labor forecast accuracy")
    total_hour_variance: float = Field(..., description="Total hour variance")
    cost_impact: float = Field(..., description="Financial impact of labor variance")
    overstaff_situations: int = Field(..., description="Number of overstaffing situations")
    understaff_situations: int = Field(..., description="Number of understaffing situations")
    optimal_staffing_rate: float = Field(..., description="Optimal staffing achievement rate")
    productivity_trend: TrendDirection = Field(..., description="Productivity trend direction")
    recommendations: List[str] = Field(default_factory=list, description="Labor optimization recommendations")
    calculation_date: datetime = Field(..., description="When the calculation was performed")

class DockToStockMetrics(BaseModel):
    """Dock-to-stock time metrics"""
    site_id: str = Field(..., description="Site identifier")
    sku_group: str = Field(..., description="SKU group identifier")
    average_dock_to_stock_hours: float = Field(..., description="Average dock-to-stock time in hours")
    median_dock_to_stock_hours: float = Field(..., description="Median dock-to-stock time in hours")
    target_dock_to_stock_hours: float = Field(..., description="Target dock-to-stock time in hours")
    performance_vs_target: float = Field(..., description="Performance vs target percentage")
    on_time_percentage: float = Field(..., description="On-time processing percentage")
    volume_processed: int = Field(..., description="Total volume processed")
    bottleneck_stages: List[str] = Field(default_factory=list, description="Identified bottleneck stages")
    improvement_opportunity: float = Field(..., description="Improvement opportunity in hours")

class DockToStockResponse(BaseModel):
    """Response model for dock-to-stock time endpoint"""
    site_metrics: List[DockToStockMetrics] = Field(..., description="Site-level dock-to-stock metrics")
    overall_average_hours: float = Field(..., description="Overall average dock-to-stock time")
    best_performing_site: str = Field(..., description="Best performing site")
    worst_performing_site: str = Field(..., description="Worst performing site")
    trend_direction: TrendDirection = Field(..., description="Overall trend direction")
    total_improvement_opportunity: float = Field(..., description="Total improvement opportunity in hours")
    cost_of_delays: float = Field(..., description="Estimated cost of processing delays")
    process_optimization_score: float = Field(..., description="Process optimization score (0-100)")
    recommendations: List[str] = Field(default_factory=list, description="Process improvement recommendations")
    calculation_date: datetime = Field(..., description="When the calculation was performed")

class PickRateMetrics(BaseModel):
    """Pick rate metrics by shift"""
    site_id: str = Field(..., description="Site identifier")
    shift_type: ShiftType = Field(..., description="Shift type")
    shift_date: str = Field(..., description="Shift date")
    total_picks: int = Field(..., description="Total picks completed")
    total_hours: float = Field(..., description="Total working hours")
    picks_per_hour: float = Field(..., description="Picks per hour rate")
    target_pick_rate: float = Field(..., description="Target pick rate")
    performance_vs_target: float = Field(..., description="Performance vs target percentage")
    accuracy_percentage: float = Field(..., description="Pick accuracy percentage")
    error_count: int = Field(..., description="Number of picking errors")
    team_size: int = Field(..., description="Team size for the shift")
    productivity_score: float = Field(..., description="Productivity score (0-100)")

class PickRatesResponse(BaseModel):
    """Response model for pick rates by shift endpoint"""
    shift_metrics: List[PickRateMetrics] = Field(..., description="Pick rate metrics by shift")
    overall_pick_rate: float = Field(..., description="Overall pick rate across all shifts")
    best_performing_shift: Dict[str, Any] = Field(..., description="Best performing shift details")
    worst_performing_shift: Dict[str, Any] = Field(..., description="Worst performing shift details")
    shift_performance_ranking: List[Dict[str, Any]] = Field(..., description="Shift performance ranking")
    accuracy_trend: TrendDirection = Field(..., description="Pick accuracy trend")
    productivity_improvement: float = Field(..., description="Productivity improvement vs baseline")
    optimization_opportunities: List[str] = Field(default_factory=list, description="Pick rate optimization opportunities")
    calculation_date: datetime = Field(..., description="When the calculation was performed")

class ConsolidationOpportunity(BaseModel):
    """Truck consolidation opportunity"""
    route_id: str = Field(..., description="Route identifier")
    origin_site: str = Field(..., description="Origin site")
    destination_site: str = Field(..., description="Destination site")
    current_trucks: int = Field(..., description="Current number of trucks")
    recommended_trucks: int = Field(..., description="Recommended number of trucks")
    consolidation_potential: int = Field(..., description="Number of trucks that can be consolidated")
    volume_utilization: float = Field(..., description="Current volume utilization percentage")
    weight_utilization: float = Field(..., description="Current weight utilization percentage")
    cost_savings_potential: float = Field(..., description="Potential cost savings")
    environmental_impact: Dict[str, float] = Field(..., description="Environmental impact metrics")
    implementation_difficulty: str = Field(..., description="Implementation difficulty level")
    priority_score: float = Field(..., description="Priority score for implementation")

class ConsolidationOpportunitiesResponse(BaseModel):
    """Response model for truck consolidation opportunities endpoint"""
    consolidation_opportunities: List[ConsolidationOpportunity] = Field(..., description="Consolidation opportunities")
    total_cost_savings_potential: float = Field(..., description="Total potential cost savings")
    total_trucks_reducible: int = Field(..., description="Total number of trucks that can be reduced")
    environmental_benefits: Dict[str, float] = Field(..., description="Total environmental benefits")
    quick_wins: List[ConsolidationOpportunity] = Field(..., description="Quick win opportunities")
    long_term_opportunities: List[ConsolidationOpportunity] = Field(..., description="Long-term opportunities")
    implementation_roadmap: List[Dict[str, Any]] = Field(default_factory=list, description="Implementation roadmap")
    roi_analysis: Dict[str, float] = Field(..., description="Return on investment analysis")
    calculation_date: datetime = Field(..., description="When the calculation was performed")

class OperationalEfficiencyOverview(BaseModel):
    """Comprehensive operational efficiency overview"""
    throughput_comparison: ThroughputComparisonResponse
    forecast_consumption: ForecastConsumptionResponse
    labor_forecast: LaborForecastResponse
    dock_to_stock: DockToStockResponse
    pick_rates: PickRatesResponse
    consolidation_opportunities: ConsolidationOpportunitiesResponse
    overall_efficiency_score: float = Field(..., description="Overall operational efficiency score (0-100)")
    key_performance_indicators: Dict[str, float] = Field(..., description="Key performance indicators")
    improvement_priorities: List[str] = Field(default_factory=list, description="Top improvement priorities")
    benchmark_comparisons: Dict[str, float] = Field(default_factory=dict, description="Industry benchmark comparisons")
    report_generated_at: datetime = Field(..., description="When the report was generated")

# Request models for filtering and parameters
class ThroughputComparisonRequest(BaseModel):
    """Request parameters for throughput comparison endpoint"""
    time_period_days: int = Field(30, ge=1, le=365, description="Analysis period in days")
    site_filter: Optional[List[str]] = Field(None, description="Filter by specific sites")
    sku_group_filter: Optional[List[str]] = Field(None, description="Filter by SKU groups")
    include_forecasts: bool = Field(True, description="Include forecast data")
    breakdown_by: str = Field("site", regex="^(site|sku_group|date)$", description="Breakdown granularity")

class ConsumptionRateRequest(BaseModel):
    """Request parameters for consumption rate endpoint"""
    time_period_days: int = Field(30, ge=1, le=365, description="Analysis period in days")
    sku_filter: Optional[List[str]] = Field(None, description="Filter by specific SKUs")
    minimum_forecast_quantity: Optional[float] = Field(None, description="Minimum forecast quantity threshold")
    consumption_threshold: float = Field(0.8, ge=0.0, le=1.0, description="Consumption rate threshold")

class LaborForecastRequest(BaseModel):
    """Request parameters for labor forecast endpoint"""
    time_period_days: int = Field(30, ge=1, le=365, description="Analysis period in days")
    site_filter: Optional[List[str]] = Field(None, description="Filter by specific sites")
    department_filter: Optional[List[str]] = Field(None, description="Filter by departments")
    include_overtime: bool = Field(True, description="Include overtime data")
    variance_threshold: float = Field(0.1, ge=0.0, le=1.0, description="Variance threshold for reporting")

class DockToStockRequest(BaseModel):
    """Request parameters for dock-to-stock endpoint"""
    time_period_days: int = Field(30, ge=1, le=365, description="Analysis period in days")
    site_filter: Optional[List[str]] = Field(None, description="Filter by specific sites")
    sku_group_filter: Optional[List[str]] = Field(None, description="Filter by SKU groups")
    target_hours: Optional[float] = Field(None, description="Target processing time in hours")

class PickRatesRequest(BaseModel):
    """Request parameters for pick rates endpoint"""
    time_period_days: int = Field(30, ge=1, le=365, description="Analysis period in days")
    site_filter: Optional[List[str]] = Field(None, description="Filter by specific sites")
    shift_type_filter: Optional[List[ShiftType]] = Field(None, description="Filter by shift types")
    include_accuracy: bool = Field(True, description="Include accuracy metrics")

class ConsolidationRequest(BaseModel):
    """Request parameters for consolidation opportunities endpoint"""
    time_period_days: int = Field(30, ge=1, le=365, description="Analysis period in days")
    route_filter: Optional[List[str]] = Field(None, description="Filter by specific routes")
    minimum_savings: Optional[float] = Field(None, description="Minimum cost savings threshold")
    utilization_threshold: float = Field(0.8, ge=0.0, le=1.0, description="Utilization threshold for consolidation")
    priority_filter: Optional[str] = Field(None, regex="^(high|medium|low)$", description="Priority level filter")