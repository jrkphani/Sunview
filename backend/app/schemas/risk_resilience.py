"""
Risk & Resilience Response Models
Comprehensive schemas for risk management and resilience analysis
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Optional, Any
from datetime import datetime
from enum import Enum


class RiskLevel(str, Enum):
    """Risk level classifications"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    MINIMAL = "minimal"


class AnomalyType(str, Enum):
    """Types of anomalies detected"""
    DEMAND_SPIKE = "demand_spike"
    SUPPLY_SHORTAGE = "supply_shortage"
    FORECAST_DEVIATION = "forecast_deviation"
    INVENTORY_ANOMALY = "inventory_anomaly"
    COST_ANOMALY = "cost_anomaly"
    QUALITY_ISSUE = "quality_issue"


class ScenarioParameter(str, Enum):
    """Adjustable scenario parameters"""
    DEMAND_CHANGE = "demand_change"
    SUPPLY_DISRUPTION = "supply_disruption"
    COST_INCREASE = "cost_increase"
    QUALITY_DEGRADATION = "quality_degradation"
    LEAD_TIME_CHANGE = "lead_time_change"
    CAPACITY_CONSTRAINT = "capacity_constraint"


class AnomalyDetail(BaseModel):
    """Detailed anomaly information"""
    model_config = ConfigDict(use_enum_values=True)
    
    anomaly_id: str = Field(..., description="Unique anomaly identifier")
    sku_id: str = Field(..., description="SKU identifier")
    anomaly_type: AnomalyType = Field(..., description="Type of anomaly detected")
    severity: float = Field(..., ge=0, le=1, description="Anomaly severity score (0-1)")
    confidence: float = Field(..., ge=0, le=1, description="Detection confidence (0-1)")
    detected_at: datetime = Field(..., description="Timestamp of detection")
    metric_value: float = Field(..., description="Actual metric value")
    expected_value: float = Field(..., description="Expected metric value")
    deviation_percentage: float = Field(..., description="Percentage deviation from expected")
    detection_method: str = Field(..., description="Method used for detection")
    context: Dict[str, Any] = Field(default_factory=dict, description="Additional context")


class AnomalyDetectionResponse(BaseModel):
    """Response for anomaly detection endpoint"""
    model_config = ConfigDict(use_enum_values=True)
    
    anomalies: List[AnomalyDetail] = Field(..., description="List of detected anomalies")
    total_anomalies: int = Field(..., description="Total number of anomalies")
    critical_count: int = Field(..., description="Number of critical anomalies")
    detection_timestamp: datetime = Field(..., description="Timestamp of detection run")
    detection_methods: List[str] = Field(..., description="Methods used for detection")
    processing_time_ms: float = Field(..., description="Processing time in milliseconds")


class BufferCoverageItem(BaseModel):
    """Buffer coverage analysis for a single SKU"""
    model_config = ConfigDict(use_enum_values=True)
    
    sku_id: str = Field(..., description="SKU identifier")
    current_inventory: float = Field(..., description="Current inventory level")
    safety_stock: float = Field(..., description="Calculated safety stock level")
    reorder_point: float = Field(..., description="Reorder point threshold")
    buffer_coverage_days: float = Field(..., description="Days of demand covered by buffer")
    coverage_percentage: float = Field(..., ge=0, description="Buffer coverage percentage")
    risk_level: RiskLevel = Field(..., description="Risk level based on coverage")
    recommended_action: str = Field(..., description="Recommended action")
    forecast_demand: float = Field(..., description="Forecasted demand")
    lead_time_days: int = Field(..., description="Lead time in days")


class BufferCoverageResponse(BaseModel):
    """Response for buffer coverage analysis"""
    model_config = ConfigDict(use_enum_values=True)
    
    buffer_coverage: List[BufferCoverageItem] = Field(..., description="Buffer coverage by SKU")
    at_risk_skus: int = Field(..., description="Number of SKUs at risk")
    critical_skus: List[str] = Field(..., description="SKUs with critical coverage")
    average_coverage_days: float = Field(..., description="Average coverage across all SKUs")
    total_buffer_value: float = Field(..., description="Total value of buffer inventory")
    recommendations: List[Dict[str, Any]] = Field(..., description="Strategic recommendations")


class SupplierRiskItem(BaseModel):
    """Risk assessment for a single supplier"""
    model_config = ConfigDict(use_enum_values=True)
    
    supplier_id: str = Field(..., description="Supplier identifier")
    supplier_name: str = Field(..., description="Supplier name")
    risk_score: float = Field(..., ge=0, le=100, description="Overall risk score (0-100)")
    risk_level: RiskLevel = Field(..., description="Risk level classification")
    single_source_skus: int = Field(..., description="Number of single-sourced SKUs")
    total_skus: int = Field(..., description="Total SKUs from supplier")
    dependency_percentage: float = Field(..., description="Supply chain dependency %")
    performance_metrics: Dict[str, float] = Field(..., description="Supplier performance metrics")
    risk_factors: List[str] = Field(..., description="Identified risk factors")
    mitigation_strategies: List[str] = Field(..., description="Recommended mitigation strategies")


class SupplierAnalysisResponse(BaseModel):
    """Response for supplier risk analysis"""
    model_config = ConfigDict(use_enum_values=True)
    
    supplier_risks: List[SupplierRiskItem] = Field(..., description="Risk assessment by supplier")
    high_risk_suppliers: int = Field(..., description="Number of high-risk suppliers")
    single_source_exposure: float = Field(..., description="Total single-source exposure %")
    concentration_risk: Dict[str, float] = Field(..., description="Supply concentration metrics")
    geographic_risk: Dict[str, Any] = Field(..., description="Geographic risk distribution")
    recommendations: List[Dict[str, Any]] = Field(..., description="Risk mitigation recommendations")


class ScenarioImpact(BaseModel):
    """Impact analysis for a scenario"""
    kpi_name: str = Field(..., description="KPI name")
    baseline_value: float = Field(..., description="Baseline KPI value")
    scenario_value: float = Field(..., description="KPI value under scenario")
    impact_percentage: float = Field(..., description="Percentage impact")
    impact_direction: str = Field(..., description="Direction of impact (positive/negative)")


class ScenarioResult(BaseModel):
    """Results from scenario planning simulation"""
    model_config = ConfigDict(use_enum_values=True)
    
    scenario_id: str = Field(..., description="Unique scenario identifier")
    scenario_name: str = Field(..., description="Scenario name")
    parameters: Dict[ScenarioParameter, float] = Field(..., description="Scenario parameters")
    kpi_impacts: List[ScenarioImpact] = Field(..., description="Impact on KPIs")
    overall_risk_score: float = Field(..., description="Overall risk score under scenario")
    probability_of_occurrence: float = Field(..., description="Probability of scenario occurring")
    confidence_interval: Dict[str, float] = Field(..., description="Confidence intervals")
    recommendations: List[str] = Field(..., description="Recommendations for scenario")
    simulation_runs: int = Field(..., description="Number of Monte Carlo runs")


class ScenarioPlanningRequest(BaseModel):
    """Request for scenario planning simulation"""
    model_config = ConfigDict(use_enum_values=True)
    
    scenario_name: str = Field(..., description="Name for the scenario")
    parameters: Dict[ScenarioParameter, float] = Field(..., description="Scenario parameters to adjust")
    simulation_runs: int = Field(default=1000, ge=100, le=10000, description="Monte Carlo simulation runs")
    confidence_level: float = Field(default=0.95, ge=0.8, le=0.99, description="Confidence level for intervals")
    time_horizon_days: int = Field(default=30, ge=1, le=365, description="Time horizon for simulation")
    affected_skus: Optional[List[str]] = Field(None, description="Specific SKUs to analyze")


class ScenarioPlanningResponse(BaseModel):
    """Response for scenario planning simulation"""
    model_config = ConfigDict(use_enum_values=True)
    
    scenario_results: ScenarioResult = Field(..., description="Detailed scenario results")
    sensitivity_analysis: Dict[str, float] = Field(..., description="Parameter sensitivity analysis")
    optimization_suggestions: List[Dict[str, Any]] = Field(..., description="Optimization suggestions")
    risk_mitigation_plan: List[Dict[str, Any]] = Field(..., description="Risk mitigation strategies")
    execution_time_ms: float = Field(..., description="Simulation execution time")


class RiskDashboardSummary(BaseModel):
    """Executive summary for risk dashboard"""
    model_config = ConfigDict(use_enum_values=True)
    
    overall_risk_score: float = Field(..., ge=0, le=100, description="Overall supply chain risk score")
    risk_level: RiskLevel = Field(..., description="Overall risk level")
    critical_risks: int = Field(..., description="Number of critical risks")
    high_risks: int = Field(..., description="Number of high risks")
    risk_trend: str = Field(..., description="Risk trend (increasing/decreasing/stable)")
    top_risk_factors: List[Dict[str, Any]] = Field(..., description="Top risk factors")
    risk_distribution: Dict[RiskLevel, int] = Field(..., description="Risk distribution by level")
    last_updated: datetime = Field(..., description="Last update timestamp")