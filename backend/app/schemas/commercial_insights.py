"""
Pydantic schemas for Commercial Insights API
Business intelligence response models and validation
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from datetime import datetime, date
from enum import Enum
from decimal import Decimal

# Enums for Commercial Insights
class ServiceTier(str, Enum):
    """Service tier classifications"""
    PREMIUM = "premium"
    STANDARD = "standard"
    BASIC = "basic"
    EXPRESS = "express"
    ECONOMY = "economy"

class ProfitabilityLevel(str, Enum):
    """Profitability assessment levels"""
    HIGHLY_PROFITABLE = "highly_profitable"
    PROFITABLE = "profitable"
    BREAK_EVEN = "break_even"
    UNPROFITABLE = "unprofitable"
    LOSS_MAKING = "loss_making"

class VolatilityRisk(str, Enum):
    """Client/SKU volatility risk levels"""
    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    VERY_HIGH = "very_high"
    EXTREME = "extreme"

class PricingStrategy(str, Enum):
    """Pricing optimization strategies"""
    INCREASE = "increase"
    DECREASE = "decrease"
    MAINTAIN = "maintain"
    DYNAMIC = "dynamic"
    PREMIUM = "premium"

class ServiceType(str, Enum):
    """Types of services offered"""
    WAREHOUSING = "warehousing"
    TRANSPORTATION = "transportation"
    VALUE_ADDED = "value_added"
    CONSULTING = "consulting"
    TECHNOLOGY = "technology"

class OpportunityType(str, Enum):
    """Types of commercial opportunities"""
    PRICING_OPTIMIZATION = "pricing_optimization"
    SERVICE_UPGRADE = "service_upgrade"
    COST_REDUCTION = "cost_reduction"
    VOLUME_EXPANSION = "volume_expansion"
    NEW_SERVICE = "new_service"

# Base Models
class FinancialMetrics(BaseModel):
    """Financial performance metrics"""
    revenue: Decimal = Field(..., description="Revenue amount")
    cost: Decimal = Field(..., description="Total cost")
    margin: Decimal = Field(..., description="Profit margin")
    margin_percentage: float = Field(..., ge=-100.0, le=100.0, description="Margin as percentage")
    roi: Optional[float] = Field(None, description="Return on investment")

class PerformanceMetrics(BaseModel):
    """Service performance metrics"""
    volume_handled: float = Field(..., ge=0.0, description="Volume handled")
    service_level: float = Field(..., ge=0.0, le=100.0, description="Service level percentage")
    efficiency_score: float = Field(..., ge=0.0, le=1.0, description="Efficiency score")
    quality_score: float = Field(..., ge=0.0, le=1.0, description="Quality score")

# Service Tier Analysis Models
class ServiceTierPerformance(BaseModel):
    """Performance analysis for service tier"""
    tier: ServiceTier
    financial_metrics: FinancialMetrics
    performance_metrics: PerformanceMetrics
    client_count: int = Field(..., ge=0, description="Number of clients in tier")
    volume_share: float = Field(..., ge=0.0, le=100.0, description="Volume share percentage")
    profitability_level: ProfitabilityLevel
    improvement_potential: float = Field(..., ge=0.0, le=1.0, description="Improvement potential score")

class ServiceTierComparison(BaseModel):
    """Comparison between service tiers"""
    tier_a: ServiceTier
    tier_b: ServiceTier
    revenue_difference: Decimal = Field(..., description="Revenue difference")
    margin_difference: float = Field(..., description="Margin difference in percentage points")
    volume_difference: float = Field(..., description="Volume difference")
    recommendation: str = Field(..., description="Optimization recommendation")

class ServiceTierAnalysisResponse(BaseModel):
    """Response model for service tier profitability analysis"""
    analysis_date: date
    total_revenue: Decimal
    overall_margin: float
    tier_performances: List[ServiceTierPerformance]
    tier_comparisons: List[ServiceTierComparison]
    unprofitable_tiers: List[ServiceTier] = Field(default_factory=list)
    optimization_opportunities: List[Dict[str, Any]] = Field(default_factory=list)
    recommendations: List[str] = Field(default_factory=list)

# Premium Service Suggestions Models
class ServiceOpportunity(BaseModel):
    """Individual service opportunity"""
    service_name: str
    service_type: ServiceType
    target_clients: List[str] = Field(default_factory=list)
    estimated_revenue: Decimal = Field(..., ge=0, description="Estimated annual revenue")
    implementation_cost: Decimal = Field(..., ge=0, description="Implementation cost")
    payback_period_months: int = Field(..., gt=0, description="Payback period in months")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Confidence in opportunity")
    risk_factors: List[str] = Field(default_factory=list)

class ClientServiceProfile(BaseModel):
    """Service profile for specific client"""
    client_id: str
    client_name: Optional[str] = None
    current_services: List[ServiceType] = Field(default_factory=list)
    service_spend: Decimal = Field(..., ge=0, description="Current service spend")
    service_utilization: float = Field(..., ge=0.0, le=1.0, description="Service utilization rate")
    upgrade_opportunities: List[ServiceOpportunity] = Field(default_factory=list)
    cross_sell_potential: float = Field(..., ge=0.0, le=1.0, description="Cross-sell potential score")

class PremiumServiceSuggestionsResponse(BaseModel):
    """Response model for premium service suggestions"""
    analysis_date: date
    total_opportunities: int
    total_estimated_revenue: Decimal
    client_profiles: List[ClientServiceProfile]
    top_opportunities: List[ServiceOpportunity]
    market_trends: List[str] = Field(default_factory=list)
    implementation_roadmap: List[Dict[str, Any]] = Field(default_factory=list)
    success_metrics: Dict[str, float] = Field(default_factory=dict)

# Client Volatility Analysis Models
class VolatilityMetrics(BaseModel):
    """Volatility calculation metrics"""
    coefficient_of_variation: float = Field(..., description="CV of demand/volume")
    standard_deviation: float = Field(..., description="Standard deviation")
    volatility_score: float = Field(..., ge=0.0, le=1.0, description="Normalized volatility score")
    trend_stability: float = Field(..., ge=0.0, le=1.0, description="Trend stability measure")
    seasonal_impact: float = Field(..., ge=0.0, le=1.0, description="Seasonal volatility impact")

class ClientVolatilityProfile(BaseModel):
    """Volatility profile for client"""
    client_id: str
    client_name: Optional[str] = None
    volatility_risk: VolatilityRisk
    volatility_metrics: VolatilityMetrics
    sku_volatility_breakdown: Dict[str, VolatilityMetrics] = Field(default_factory=dict)
    historical_volatility_trend: List[Dict[str, Any]] = Field(default_factory=list)
    risk_mitigation_strategies: List[str] = Field(default_factory=list)
    contract_recommendations: List[str] = Field(default_factory=list)

class VolatilityBenchmark(BaseModel):
    """Volatility benchmarking data"""
    industry_average: float = Field(..., description="Industry average volatility")
    peer_group_average: float = Field(..., description="Peer group average")
    top_quartile_threshold: float = Field(..., description="Top quartile threshold")
    bottom_quartile_threshold: float = Field(..., description="Bottom quartile threshold")

class ClientVolatilityAnalysisResponse(BaseModel):
    """Response model for client volatility analysis"""
    analysis_period: Dict[str, date]
    total_clients_analyzed: int
    volatility_distribution: Dict[VolatilityRisk, int] = Field(default_factory=dict)
    client_profiles: List[ClientVolatilityProfile]
    volatility_benchmarks: VolatilityBenchmark
    high_risk_alerts: List[Dict[str, Any]] = Field(default_factory=list)
    portfolio_recommendations: List[str] = Field(default_factory=list)

# Pricing Optimization Models
class DemandElasticity(BaseModel):
    """Demand elasticity metrics"""
    price_elasticity: float = Field(..., description="Price elasticity coefficient")
    elasticity_confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence in elasticity estimate")
    demand_sensitivity: str = Field(..., description="Demand sensitivity classification")
    optimal_price_range: Dict[str, Decimal] = Field(default_factory=dict)

class PricingScenario(BaseModel):
    """Pricing scenario analysis"""
    scenario_name: str
    price_change_percentage: float = Field(..., description="Price change percentage")
    expected_volume_change: float = Field(..., description="Expected volume change")
    revenue_impact: Decimal = Field(..., description="Revenue impact")
    margin_impact: float = Field(..., description="Margin impact")
    risk_assessment: str = Field(..., description="Risk level assessment")

class ServicePricingOptimization(BaseModel):
    """Pricing optimization for service"""
    service_type: ServiceType
    current_pricing: Decimal = Field(..., ge=0, description="Current pricing")
    demand_elasticity: DemandElasticity
    pricing_scenarios: List[PricingScenario]
    recommended_strategy: PricingStrategy
    optimal_price: Decimal = Field(..., ge=0, description="Optimal price recommendation")
    expected_revenue_lift: float = Field(..., description="Expected revenue lift percentage")

class PricingOptimizationResponse(BaseModel):
    """Response model for pricing optimization"""
    analysis_date: date
    services_analyzed: int
    total_revenue_opportunity: Decimal
    service_optimizations: List[ServicePricingOptimization]
    market_positioning: Dict[str, Any] = Field(default_factory=dict)
    competitive_analysis: List[Dict[str, Any]] = Field(default_factory=list)
    implementation_timeline: List[Dict[str, Any]] = Field(default_factory=list)
    success_kpis: List[str] = Field(default_factory=list)

# Revenue Opportunities Models
class RevenueOpportunity(BaseModel):
    """Individual revenue opportunity"""
    opportunity_id: str
    opportunity_type: OpportunityType
    description: str
    target_clients: List[str] = Field(default_factory=list)
    estimated_revenue: Decimal = Field(..., ge=0, description="Estimated revenue impact")
    implementation_effort: str = Field(..., description="Implementation effort level")
    time_to_realize: int = Field(..., gt=0, description="Time to realize in months")
    confidence_level: float = Field(..., ge=0.0, le=1.0, description="Confidence level")
    dependencies: List[str] = Field(default_factory=list)

class RevenueImpactAnalysis(BaseModel):
    """Revenue impact analysis"""
    short_term_impact: Decimal = Field(..., description="0-12 months impact")
    medium_term_impact: Decimal = Field(..., description="12-24 months impact")
    long_term_impact: Decimal = Field(..., description="24+ months impact")
    cumulative_impact: Decimal = Field(..., description="Total cumulative impact")
    roi_percentage: float = Field(..., description="Return on investment percentage")

class RevenueOpportunitiesResponse(BaseModel):
    """Response model for revenue opportunities"""
    analysis_date: date
    total_opportunities: int
    total_revenue_potential: Decimal
    opportunities: List[RevenueOpportunity]
    impact_analysis: RevenueImpactAnalysis
    prioritization_matrix: List[Dict[str, Any]] = Field(default_factory=list)
    quick_wins: List[RevenueOpportunity] = Field(default_factory=list)
    strategic_initiatives: List[RevenueOpportunity] = Field(default_factory=list)
    execution_roadmap: List[Dict[str, Any]] = Field(default_factory=list)

# Request Models
class CommercialAnalysisRequest(BaseModel):
    """Base request model for commercial analysis"""
    analysis_date: Optional[date] = Field(None, description="Analysis date")
    client_filter: Optional[List[str]] = Field(None, description="Filter by client IDs")
    service_filter: Optional[List[ServiceType]] = Field(None, description="Filter by service types")
    region_filter: Optional[List[str]] = Field(None, description="Filter by regions")
    min_revenue_threshold: Optional[Decimal] = Field(None, ge=0, description="Minimum revenue threshold")
    include_forecasts: bool = Field(True, description="Include forecast data")

class ServiceTierAnalysisRequest(CommercialAnalysisRequest):
    """Request model for service tier analysis"""
    include_benchmarking: bool = Field(True, description="Include industry benchmarking")
    profitability_threshold: float = Field(0.15, ge=0.0, le=1.0, description="Minimum profitability threshold")

class PremiumServiceRequest(CommercialAnalysisRequest):
    """Request model for premium service suggestions"""
    opportunity_threshold: Decimal = Field(Decimal('10000'), ge=0, description="Minimum opportunity size")
    payback_period_limit: int = Field(24, gt=0, description="Maximum payback period in months")

class VolatilityAnalysisRequest(CommercialAnalysisRequest):
    """Request model for volatility analysis"""
    volatility_window_days: int = Field(90, ge=30, le=365, description="Volatility calculation window")
    risk_threshold: float = Field(0.3, ge=0.0, le=1.0, description="Risk threshold for alerts")

class PricingOptimizationRequest(CommercialAnalysisRequest):
    """Request model for pricing optimization"""
    elasticity_confidence_threshold: float = Field(0.7, ge=0.5, le=1.0, description="Minimum elasticity confidence")
    max_price_change: float = Field(0.2, ge=0.0, le=1.0, description="Maximum price change percentage")

class RevenueOpportunityRequest(CommercialAnalysisRequest):
    """Request model for revenue opportunities"""
    opportunity_types: List[OpportunityType] = Field(
        default_factory=lambda: list(OpportunityType),
        description="Types of opportunities to analyze"
    )
    min_opportunity_size: Decimal = Field(Decimal('5000'), ge=0, description="Minimum opportunity size")
    max_implementation_months: int = Field(18, gt=0, description="Maximum implementation time")