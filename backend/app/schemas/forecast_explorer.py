"""
Forecast Explorer Response Models
Comprehensive schemas for advanced forecast analytics
"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Dict, Optional, Any
from datetime import datetime, date
from enum import Enum


class ForecastHorizon(str, Enum):
    """Forecast horizon periods"""
    DAY_1 = "1_day"
    DAY_7 = "7_day"
    DAY_14 = "14_day"
    DAY_28 = "28_day"
    DAY_90 = "90_day"


class AccuracyMetric(str, Enum):
    """Types of forecast accuracy metrics"""
    MAPE = "mape"  # Mean Absolute Percentage Error
    WAPE = "wape"  # Weighted Absolute Percentage Error
    MAE = "mae"    # Mean Absolute Error
    RMSE = "rmse"  # Root Mean Square Error
    BIAS = "bias"  # Forecast Bias
    MSE = "mse"    # Mean Square Error
    SMAPE = "smape" # Symmetric MAPE


class ForecastModel(str, Enum):
    """Available forecast models"""
    ARIMA = "arima"
    PROPHET = "prophet"
    LSTM = "lstm"
    XGB = "xgboost"
    ENSEMBLE = "ensemble"
    BASELINE = "baseline"


class ConfidenceMethod(str, Enum):
    """Confidence interval calculation methods"""
    BAYESIAN = "bayesian"
    FREQUENTIST = "frequentist"
    BOOTSTRAP = "bootstrap"
    QUANTILE = "quantile"


class ForecastTrendPoint(BaseModel):
    """Single point in forecast trend"""
    date: date = Field(..., description="Forecast date")
    forecast_value: float = Field(..., description="Forecasted value")
    actual_value: Optional[float] = Field(None, description="Actual value if available")
    lower_bound: float = Field(..., description="Lower confidence bound")
    upper_bound: float = Field(..., description="Upper confidence bound")
    confidence_level: float = Field(..., description="Confidence level used")


class MultiHorizonTrend(BaseModel):
    """Forecast trend for a specific horizon"""
    model_config = ConfigDict(use_enum_values=True)
    
    sku_id: str = Field(..., description="SKU identifier")
    horizon: ForecastHorizon = Field(..., description="Forecast horizon")
    trend_points: List[ForecastTrendPoint] = Field(..., description="Trend data points")
    trend_direction: str = Field(..., description="Overall trend direction")
    growth_rate: float = Field(..., description="Average growth rate")
    volatility: float = Field(..., description="Forecast volatility measure")
    seasonality_strength: float = Field(..., description="Seasonality strength (0-1)")


class ForecastTrendsResponse(BaseModel):
    """Response for multi-horizon forecast trends"""
    model_config = ConfigDict(use_enum_values=True)
    
    trends: List[MultiHorizonTrend] = Field(..., description="Forecast trends by horizon")
    comparison_metrics: Dict[ForecastHorizon, Dict[str, float]] = Field(..., description="Comparison across horizons")
    best_horizon: ForecastHorizon = Field(..., description="Recommended forecast horizon")
    trend_summary: Dict[str, Any] = Field(..., description="Executive trend summary")
    generated_at: datetime = Field(..., description="Analysis timestamp")


class AccuracyMetricDetail(BaseModel):
    """Detailed accuracy metric information"""
    model_config = ConfigDict(use_enum_values=True)
    
    metric: AccuracyMetric = Field(..., description="Metric type")
    value: float = Field(..., description="Metric value")
    benchmark: float = Field(..., description="Industry benchmark value")
    percentile: float = Field(..., description="Percentile ranking (0-100)")
    trend: str = Field(..., description="Trend (improving/declining/stable)")
    historical_values: List[float] = Field(..., description="Historical metric values")


class ModelAccuracy(BaseModel):
    """Accuracy metrics for a specific model"""
    model_config = ConfigDict(use_enum_values=True)
    
    model: ForecastModel = Field(..., description="Forecast model type")
    metrics: List[AccuracyMetricDetail] = Field(..., description="Accuracy metrics")
    overall_score: float = Field(..., description="Overall accuracy score (0-100)")
    ranking: int = Field(..., description="Model ranking")
    strengths: List[str] = Field(..., description="Model strengths")
    weaknesses: List[str] = Field(..., description="Model weaknesses")


class AccuracyMetricsResponse(BaseModel):
    """Response for forecast accuracy metrics"""
    model_config = ConfigDict(use_enum_values=True)
    
    sku_id: str = Field(..., description="SKU identifier")
    model_accuracy: List[ModelAccuracy] = Field(..., description="Accuracy by model")
    best_model: ForecastModel = Field(..., description="Best performing model")
    ensemble_accuracy: Dict[AccuracyMetric, float] = Field(..., description="Ensemble model accuracy")
    time_period: Dict[str, date] = Field(..., description="Evaluation time period")
    sample_size: int = Field(..., description="Number of data points evaluated")


class VarianceComponent(BaseModel):
    """Component of forecast variance"""
    component: str = Field(..., description="Variance component name")
    value: float = Field(..., description="Variance value")
    percentage: float = Field(..., description="Percentage of total variance")
    description: str = Field(..., description="Component description")


class VarianceAnalysisDetail(BaseModel):
    """Detailed variance analysis for a period"""
    date: date = Field(..., description="Analysis date")
    forecast: float = Field(..., description="Forecasted value")
    actual: float = Field(..., description="Actual value")
    variance: float = Field(..., description="Absolute variance")
    variance_percentage: float = Field(..., description="Variance percentage")
    variance_components: List[VarianceComponent] = Field(..., description="Variance breakdown")
    root_causes: List[str] = Field(..., description="Identified root causes")
    statistical_significance: float = Field(..., description="Statistical significance (p-value)")


class VarianceAnalysisResponse(BaseModel):
    """Response for forecast vs actual variance analysis"""
    sku_id: str = Field(..., description="SKU identifier")
    variance_details: List[VarianceAnalysisDetail] = Field(..., description="Detailed variance analysis")
    summary_statistics: Dict[str, float] = Field(..., description="Summary statistics")
    variance_decomposition: Dict[str, float] = Field(..., description="Variance decomposition")
    improvement_recommendations: List[str] = Field(..., description="Improvement recommendations")
    outliers_detected: int = Field(..., description="Number of outliers detected")
    trend_analysis: Dict[str, Any] = Field(..., description="Variance trend analysis")


class ConfidenceIntervalDetail(BaseModel):
    """Detailed confidence interval information"""
    model_config = ConfigDict(use_enum_values=True)
    
    date: date = Field(..., description="Forecast date")
    point_forecast: float = Field(..., description="Point forecast value")
    lower_bound_50: float = Field(..., description="50% confidence lower bound")
    upper_bound_50: float = Field(..., description="50% confidence upper bound")
    lower_bound_80: float = Field(..., description="80% confidence lower bound")
    upper_bound_80: float = Field(..., description="80% confidence upper bound")
    lower_bound_95: float = Field(..., description="95% confidence lower bound")
    upper_bound_95: float = Field(..., description="95% confidence upper bound")
    prediction_interval_width: float = Field(..., description="Width of prediction interval")
    uncertainty_score: float = Field(..., description="Uncertainty score (0-1)")


class ConfidenceIntervalsResponse(BaseModel):
    """Response for confidence interval calculations"""
    model_config = ConfigDict(use_enum_values=True)
    
    sku_id: str = Field(..., description="SKU identifier")
    method: ConfidenceMethod = Field(..., description="Calculation method used")
    intervals: List[ConfidenceIntervalDetail] = Field(..., description="Confidence intervals")
    average_uncertainty: float = Field(..., description="Average uncertainty score")
    reliability_score: float = Field(..., description="Interval reliability score (0-100)")
    coverage_probability: Dict[str, float] = Field(..., description="Actual coverage probabilities")
    calibration_metrics: Dict[str, float] = Field(..., description="Calibration metrics")


class ModelComparisonDetail(BaseModel):
    """Detailed model comparison information"""
    model_config = ConfigDict(use_enum_values=True)
    
    model: ForecastModel = Field(..., description="Forecast model")
    accuracy_metrics: Dict[AccuracyMetric, float] = Field(..., description="Accuracy metrics")
    computational_time_ms: float = Field(..., description="Computation time in milliseconds")
    complexity_score: float = Field(..., description="Model complexity score (0-1)")
    interpretability_score: float = Field(..., description="Interpretability score (0-1)")
    robustness_score: float = Field(..., description="Robustness score (0-1)")
    best_use_cases: List[str] = Field(..., description="Best use cases for this model")


class ModelComparisonResponse(BaseModel):
    """Response for forecast model comparison"""
    model_config = ConfigDict(use_enum_values=True)
    
    sku_id: str = Field(..., description="SKU identifier")
    models_compared: List[ModelComparisonDetail] = Field(..., description="Model comparison details")
    recommendation: ForecastModel = Field(..., description="Recommended model")
    recommendation_rationale: str = Field(..., description="Rationale for recommendation")
    ensemble_weights: Dict[ForecastModel, float] = Field(..., description="Optimal ensemble weights")
    performance_matrix: Dict[str, Dict[str, float]] = Field(..., description="Performance comparison matrix")
    scenario_performance: Dict[str, Dict[ForecastModel, float]] = Field(..., description="Performance by scenario")


class ForecastDecomposition(BaseModel):
    """Time series decomposition components"""
    date: date = Field(..., description="Date")
    observed: float = Field(..., description="Observed value")
    trend: float = Field(..., description="Trend component")
    seasonal: float = Field(..., description="Seasonal component")
    residual: float = Field(..., description="Residual component")


class DecompositionAnalysisResponse(BaseModel):
    """Response for forecast decomposition analysis"""
    sku_id: str = Field(..., description="SKU identifier")
    decomposition: List[ForecastDecomposition] = Field(..., description="Decomposition components")
    trend_strength: float = Field(..., description="Trend strength (0-1)")
    seasonal_strength: float = Field(..., description="Seasonal strength (0-1)")
    noise_ratio: float = Field(..., description="Noise ratio")
    seasonal_periods: List[int] = Field(..., description="Detected seasonal periods")
    changepoints: List[date] = Field(..., description="Detected changepoints")


class ForecastExplorerSummary(BaseModel):
    """Executive summary for forecast explorer"""
    total_skus_analyzed: int = Field(..., description="Total SKUs analyzed")
    average_forecast_accuracy: float = Field(..., description="Average forecast accuracy")
    best_performing_model: ForecastModel = Field(..., description="Best overall model")
    accuracy_trend: str = Field(..., description="Accuracy trend")
    top_insights: List[str] = Field(..., description="Top forecast insights")
    improvement_opportunities: List[Dict[str, Any]] = Field(..., description="Improvement opportunities")
    last_updated: datetime = Field(..., description="Last update timestamp")