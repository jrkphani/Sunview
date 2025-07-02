"""
Forecast Explorer API Endpoints
Advanced forecast analytics and exploration tools for analysts
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from typing import List, Dict, Any, Optional
from datetime import date, datetime, timedelta
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field

from app.schemas.forecast_explorer import (
    ForecastTrendsResponse,
    ForecastTrendData,
    ForecastDeltaResponse,
    ForecastDeltaItem,
    AccuracyTrendResponse,
    AccuracyMetric,
    ConfidenceIntervalResponse,
    ConfidenceInterval,
    ModelComparisonResponse,
    ModelPerformance,
    ForecastExplorerOverview
)
from app.services.forecast_analytics_service import ForecastAnalyticsService
from app.services.confidence_interval_service import ConfidenceIntervalService

router = APIRouter(prefix="/forecast-explorer", tags=["forecast-analytics"])

# Initialize services
analytics_service = ForecastAnalyticsService()
confidence_service = ConfidenceIntervalService()


@router.get("/trends", response_model=ForecastTrendsResponse)
async def get_forecast_trends(
    horizons: List[int] = Query([1, 7, 14, 28], description="Forecast horizons in days"),
    sku_filter: Optional[List[str]] = Query(None, description="Filter by SKU IDs"),
    date_range_start: Optional[date] = Query(None, description="Start date for analysis"),
    date_range_end: Optional[date] = Query(None, description="End date for analysis"),
    model_filter: Optional[List[str]] = Query(None, description="Filter by model types"),
    aggregation_level: str = Query("daily", description="Aggregation level: daily, weekly, monthly")
) -> ForecastTrendsResponse:
    """
    Get multi-horizon forecast trends with model comparison capabilities
    """
    try:
        # Set default date range if not provided
        if not date_range_start:
            date_range_start = date.today() - timedelta(days=90)
        if not date_range_end:
            date_range_end = date.today()
        
        # Get forecast trend data
        trend_data = await analytics_service.get_forecast_trends(
            horizons=horizons,
            sku_filter=sku_filter,
            date_range_start=date_range_start,
            date_range_end=date_range_end,
            model_filter=model_filter,
            aggregation_level=aggregation_level
        )
        
        # Calculate summary statistics
        total_forecasts = sum([len(trend.forecast_values) for trend in trend_data])
        
        # Get model performance summary
        model_performance = await analytics_service.get_model_performance_summary(
            horizons=horizons,
            date_range_start=date_range_start,
            date_range_end=date_range_end
        )
        
        return ForecastTrendsResponse(
            trend_data=trend_data,
            horizons_analyzed=horizons,
            total_forecasts=total_forecasts,
            date_range_start=date_range_start,
            date_range_end=date_range_end,
            model_performance=model_performance,
            aggregation_level=aggregation_level,
            last_updated=datetime.now()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving forecast trends: {str(e)}"
        )


@router.get("/variance-analysis", response_model=ForecastDeltaResponse)
async def get_forecast_variance_analysis(
    horizon_days: int = Query(7, ge=1, le=90, description="Forecast horizon in days"),
    sku_filter: Optional[List[str]] = Query(None, description="Filter by SKU IDs"),
    variance_threshold: float = Query(0.15, ge=0.0, le=1.0, description="Minimum variance threshold (15% default)"),
    include_outliers: bool = Query(True, description="Include outlier analysis"),
    sort_by: str = Query("absolute_error", description="Sort by: absolute_error, percentage_error, or impact")
) -> ForecastDeltaResponse:
    """
    Get forecast vs actual variance analysis with detailed delta calculations
    """
    try:
        # Get variance analysis data
        delta_items = await analytics_service.calculate_forecast_deltas(
            horizon_days=horizon_days,
            sku_filter=sku_filter,
            variance_threshold=variance_threshold,
            include_outliers=include_outliers,
            sort_by=sort_by
        )
        
        # Calculate summary statistics
        total_items = len(delta_items)
        over_predictions = len([item for item in delta_items if item.delta_percentage > 0])
        under_predictions = len([item for item in delta_items if item.delta_percentage < 0])
        high_variance_items = len([item for item in delta_items if abs(item.delta_percentage) > variance_threshold])
        
        # Calculate aggregate metrics
        total_forecast = sum([item.forecast_value for item in delta_items])
        total_actual = sum([item.actual_value for item in delta_items])
        overall_bias = ((total_forecast - total_actual) / total_actual * 100) if total_actual > 0 else 0
        
        return ForecastDeltaResponse(
            delta_items=delta_items,
            total_items=total_items,
            over_predictions=over_predictions,
            under_predictions=under_predictions,
            high_variance_items=high_variance_items,
            overall_bias_percentage=overall_bias,
            variance_threshold=variance_threshold,
            horizon_days=horizon_days,
            analysis_date=date.today()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating forecast variance: {str(e)}"
        )


@router.get("/accuracy-trends", response_model=AccuracyTrendResponse)
async def get_accuracy_trends(
    time_window: str = Query("weekly", description="Time window: daily, weekly, monthly"),
    metrics: List[str] = Query(["mape", "wape", "mae", "bias"], description="Accuracy metrics to calculate"),
    sku_group_filter: Optional[str] = Query(None, description="Filter by SKU group or category"),
    rolling_average_periods: int = Query(4, ge=1, le=12, description="Number of periods for rolling average"),
    include_confidence_bands: bool = Query(True, description="Include confidence bands for trends")
) -> AccuracyTrendResponse:
    """
    Get historical accuracy trends with multiple metrics and time windows
    """
    try:
        # Get accuracy trend data
        accuracy_metrics = await analytics_service.calculate_accuracy_trends(
            time_window=time_window,
            metrics=metrics,
            sku_group_filter=sku_group_filter,
            rolling_average_periods=rolling_average_periods,
            include_confidence_bands=include_confidence_bands
        )
        
        # Calculate trend directions and improvements
        trend_analysis = await analytics_service.analyze_accuracy_trends(
            accuracy_metrics,
            time_window=time_window
        )
        
        return AccuracyTrendResponse(
            accuracy_metrics=accuracy_metrics,
            time_window=time_window,
            metrics_calculated=metrics,
            trend_analysis=trend_analysis,
            rolling_periods=rolling_average_periods,
            confidence_bands_included=include_confidence_bands,
            analysis_period_start=date.today() - timedelta(days=90),
            analysis_period_end=date.today(),
            last_updated=datetime.now()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating accuracy trends: {str(e)}"
        )


@router.get("/confidence-intervals", response_model=ConfidenceIntervalResponse)
async def get_confidence_intervals(
    confidence_levels: List[float] = Query([0.5, 0.8, 0.95], description="Confidence levels (0.5 = 50%, etc.)"),
    horizon_days: int = Query(7, ge=1, le=90, description="Forecast horizon in days"),
    sku_filter: Optional[List[str]] = Query(None, description="Filter by SKU IDs"),
    method: str = Query("bootstrap", description="CI method: bootstrap, bayesian, or parametric"),
    include_calibration_analysis: bool = Query(True, description="Include confidence interval calibration analysis")
) -> ConfidenceIntervalResponse:
    """
    Calculate and analyze forecast confidence intervals with calibration metrics
    """
    try:
        # Validate confidence levels
        for level in confidence_levels:
            if not 0.0 < level < 1.0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid confidence level: {level}. Must be between 0.0 and 1.0"
                )
        
        # Calculate confidence intervals
        confidence_intervals = await confidence_service.calculate_confidence_intervals(
            confidence_levels=confidence_levels,
            horizon_days=horizon_days,
            sku_filter=sku_filter,
            method=method
        )
        
        # Perform calibration analysis if requested
        calibration_results = None
        if include_calibration_analysis:
            calibration_results = await confidence_service.analyze_calibration(
                confidence_intervals,
                confidence_levels
            )
        
        # Calculate coverage statistics
        coverage_stats = await confidence_service.calculate_coverage_statistics(
            confidence_intervals,
            confidence_levels
        )
        
        return ConfidenceIntervalResponse(
            confidence_intervals=confidence_intervals,
            confidence_levels=confidence_levels,
            horizon_days=horizon_days,
            method=method,
            coverage_statistics=coverage_stats,
            calibration_results=calibration_results,
            total_forecasts=len(confidence_intervals),
            calculation_date=date.today()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating confidence intervals: {str(e)}"
        )


@router.get("/model-comparison", response_model=ModelComparisonResponse)
async def get_model_comparison(
    models: Optional[List[str]] = Query(None, description="Models to compare (default: all available)"),
    evaluation_metrics: List[str] = Query(["mape", "wape", "mae", "rmse"], description="Evaluation metrics"),
    horizon_days: int = Query(7, ge=1, le=90, description="Forecast horizon for comparison"),
    test_period_days: int = Query(30, ge=7, le=180, description="Test period length in days"),
    include_statistical_tests: bool = Query(True, description="Include statistical significance tests")
) -> ModelComparisonResponse:
    """
    Compare performance of different forecast models with statistical significance testing
    """
    try:
        # Get available models if not specified
        if not models:
            models = await analytics_service.get_available_models()
        
        # Perform model comparison
        model_performance = await analytics_service.compare_models(
            models=models,
            evaluation_metrics=evaluation_metrics,
            horizon_days=horizon_days,
            test_period_days=test_period_days
        )
        
        # Perform statistical significance tests if requested
        statistical_tests = None
        if include_statistical_tests:
            statistical_tests = await analytics_service.perform_statistical_tests(
                model_performance,
                metrics=evaluation_metrics
            )
        
        # Determine best performing model
        best_model = await analytics_service.determine_best_model(
            model_performance,
            primary_metric="mape"
        )
        
        return ModelComparisonResponse(
            model_performance=model_performance,
            best_model=best_model,
            evaluation_metrics=evaluation_metrics,
            horizon_days=horizon_days,
            test_period_days=test_period_days,
            statistical_tests=statistical_tests,
            comparison_date=date.today(),
            models_compared=len(models)
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing model comparison: {str(e)}"
        )


@router.get("/overview", response_model=ForecastExplorerOverview)
async def get_forecast_explorer_overview() -> ForecastExplorerOverview:
    """
    Get comprehensive overview of forecast analytics and explorer capabilities
    """
    try:
        # Get summary statistics
        total_forecasts = await analytics_service.get_total_forecast_count()
        unique_skus = await analytics_service.get_unique_sku_count()
        available_models = await analytics_service.get_available_models()
        date_range = await analytics_service.get_data_date_range()
        
        # Get recent accuracy metrics
        recent_accuracy = await analytics_service.get_recent_accuracy_summary()
        
        # Get model performance summary
        model_summary = await analytics_service.get_model_performance_summary()
        
        return ForecastExplorerOverview(
            total_forecasts=total_forecasts,
            unique_skus=unique_skus,
            available_models=available_models,
            data_date_range=date_range,
            recent_accuracy=recent_accuracy,
            model_performance_summary=model_summary,
            last_updated=datetime.now(),
            system_status="healthy"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving forecast explorer overview: {str(e)}"
        )


@router.get("/export/{analysis_type}")
async def export_forecast_analysis(
    analysis_type: str = Query(..., description="Type of analysis to export"),
    format: str = Query("csv", description="Export format: csv, json, or excel"),
    **kwargs
) -> Dict[str, Any]:
    """
    Export forecast analysis results in various formats
    """
    try:
        # Validate analysis type
        valid_types = ["trends", "variance", "accuracy", "confidence", "model-comparison"]
        if analysis_type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid analysis type. Must be one of: {valid_types}"
            )
        
        # Generate export data
        export_data = await analytics_service.generate_export_data(
            analysis_type=analysis_type,
            format=format,
            **kwargs
        )
        
        return {
            "export_id": export_data["export_id"],
            "download_url": export_data["download_url"],
            "format": format,
            "analysis_type": analysis_type,
            "generated_at": datetime.now().isoformat(),
            "expires_at": (datetime.now() + timedelta(hours=24)).isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error exporting forecast analysis: {str(e)}"
        )


@router.get("/health")
async def get_forecast_explorer_health() -> Dict[str, Any]:
    """
    Health check endpoint for forecast explorer services
    """
    try:
        # Check service components
        analytics_health = await analytics_service.health_check()
        confidence_health = await confidence_service.health_check()
        
        overall_status = "healthy"
        if not all([analytics_health["status"] == "healthy", 
                   confidence_health["status"] == "healthy"]):
            overall_status = "degraded"
        
        return {
            "status": overall_status,
            "timestamp": datetime.now().isoformat(),
            "services": {
                "forecast_analytics": analytics_health,
                "confidence_intervals": confidence_health
            },
            "data_availability": await analytics_service.check_data_availability(),
            "version": "1.0.0"
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "version": "1.0.0"
        }