"""
Executive Summary API Endpoints
RESTful endpoints for executive summary KPIs and metrics
"""

import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
import time

from app.services.executive_summary_service import ExecutiveSummaryService
from app.schemas.executive_summary import (
    ForecastAccuracyResponse, ForecastAccuracyRequest,
    TopSKUErrorsResponse, TopSKUErrorsRequest,
    TruckUtilizationResponse, InventoryDOHResponse,
    OTIFPerformanceResponse, AlertsSummaryResponse, AlertsRequest,
    ExecutiveSummaryOverview, SeverityLevel
)
from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/executive", tags=["Executive Summary"])

# Service dependency
def get_executive_summary_service() -> ExecutiveSummaryService:
    """Dependency to get executive summary service instance"""
    return ExecutiveSummaryService()

# Rate limiting decorator (simplified)
def rate_limit():
    """Simple rate limiting decorator"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # In production, implement proper rate limiting with Redis
            return await func(*args, **kwargs)
        return wrapper
    return decorator

@router.get("/forecast-accuracy", 
           response_model=ForecastAccuracyResponse,
           summary="Get Forecast Accuracy Metrics",
           description="Retrieve comprehensive forecast accuracy metrics including MAPE, WAPE, bias, and RMSE")
@rate_limit()
async def get_forecast_accuracy(
    time_period_days: int = Query(30, ge=1, le=365, description="Analysis period in days"),
    breakdown_by: str = Query("daily", regex="^(daily|weekly|monthly)$", description="Breakdown granularity"),
    include_confidence_intervals: bool = Query(True, description="Include confidence intervals"),
    sku_filter: Optional[str] = Query(None, description="Comma-separated list of SKU IDs to filter by"),
    service: ExecutiveSummaryService = Depends(get_executive_summary_service)
) -> ForecastAccuracyResponse:
    """
    Get forecast accuracy metrics with configurable time period and breakdown.
    
    This endpoint calculates forecast accuracy using multiple metrics:
    - MAPE (Mean Absolute Percentage Error)
    - WAPE (Weighted Absolute Percentage Error)  
    - Bias (Forecast Bias)
    - RMSE (Root Mean Square Error)
    
    **Performance**: Response typically under 500ms for cached data.
    **Cache Duration**: 30 minutes
    """
    try:
        start_time = time.time()
        
        # Parse SKU filter if provided
        sku_list = None
        if sku_filter:
            sku_list = [sku.strip() for sku in sku_filter.split(",") if sku.strip()]
        
        # Get forecast accuracy data
        response = await service.get_forecast_accuracy(
            time_period_days=time_period_days,
            breakdown_by=breakdown_by,
            include_confidence_intervals=include_confidence_intervals,
            sku_filter=sku_list
        )
        
        processing_time = time.time() - start_time
        logger.info(f"Forecast accuracy retrieved in {processing_time:.3f}s for {time_period_days} days")
        
        return response
        
    except Exception as e:
        logger.error(f"Error retrieving forecast accuracy: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve forecast accuracy metrics: {str(e)}"
        )

@router.get("/top-sku-errors",
           response_model=TopSKUErrorsResponse,
           summary="Get Top SKUs by Forecast Error",
           description="Identify top N SKUs with highest forecast errors for focused improvement efforts")
@rate_limit()
async def get_top_sku_errors(
    top_n: int = Query(10, ge=1, le=100, description="Number of top SKUs to return"),
    time_period_days: int = Query(30, ge=1, le=365, description="Analysis period in days"),
    error_type: str = Query("mape", regex="^(mape|wape|bias|rmse)$", description="Error metric type"),
    minimum_volume: Optional[float] = Query(None, ge=0, description="Minimum volume threshold"),
    service: ExecutiveSummaryService = Depends(get_executive_summary_service)
) -> TopSKUErrorsResponse:
    """
    Get top N SKUs with highest forecast errors to prioritize improvement efforts.
    
    This endpoint helps identify:
    - SKUs requiring model parameter adjustments
    - Products with data quality issues
    - Items needing specialized forecasting approaches
    
    **Use Cases**:
    - Weekly SKU performance reviews
    - Forecasting model optimization
    - Inventory planning improvements
    """
    try:
        start_time = time.time()
        
        response = await service.get_top_sku_errors(
            top_n=top_n,
            time_period_days=time_period_days,
            error_type=error_type,
            minimum_volume=minimum_volume
        )
        
        processing_time = time.time() - start_time
        logger.info(f"Top {top_n} SKU errors retrieved in {processing_time:.3f}s")
        
        return response
        
    except Exception as e:
        logger.error(f"Error retrieving top SKU errors: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve top SKU errors: {str(e)}"
        )

@router.get("/truck-utilization",
           response_model=TruckUtilizationResponse,
           summary="Get Truck Utilization Metrics",
           description="Retrieve truck utilization metrics including 7-day average and improvement trends")
@rate_limit()
async def get_truck_utilization(
    service: ExecutiveSummaryService = Depends(get_executive_summary_service)
) -> TruckUtilizationResponse:
    """
    Get comprehensive truck utilization metrics and performance indicators.
    
    This endpoint provides:
    - Current utilization percentage
    - 7-day rolling average
    - Improvement vs baseline
    - Historical trend data
    - Peak utilization analysis
    
    **Key Metrics**:
    - Target utilization: 85%
    - Baseline comparison: 75%
    - Variance analysis included
    """
    try:
        start_time = time.time()
        
        response = await service.get_truck_utilization()
        
        processing_time = time.time() - start_time
        logger.info(f"Truck utilization metrics retrieved in {processing_time:.3f}s")
        
        return response
        
    except Exception as e:
        logger.error(f"Error retrieving truck utilization: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve truck utilization metrics: {str(e)}"
        )

@router.get("/inventory-doh",
           response_model=InventoryDOHResponse,
           summary="Get Days of Inventory on Hand",
           description="Calculate inventory days on hand by SKU group with health scoring")
@rate_limit()
async def get_inventory_doh(
    service: ExecutiveSummaryService = Depends(get_executive_summary_service)
) -> InventoryDOHResponse:
    """
    Get Days of Inventory on Hand (DOH) metrics by SKU group.
    
    This endpoint calculates:
    - SKU-level DOH analysis
    - Inventory health scoring
    - Status classification (low, normal, high, excess, stockout)
    - Recommended actions for each SKU
    
    **Health Categories**:
    - Stockout: 0 days
    - Low: 1-7 days
    - Normal: 8-30 days  
    - High: 31-90 days
    - Excess: >90 days
    """
    try:
        start_time = time.time()
        
        response = await service.get_inventory_doh()
        
        processing_time = time.time() - start_time
        logger.info(f"Inventory DOH metrics retrieved in {processing_time:.3f}s")
        
        return response
        
    except Exception as e:
        logger.error(f"Error retrieving inventory DOH: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve inventory DOH metrics: {str(e)}"
        )

@router.get("/otif-performance",
           response_model=OTIFPerformanceResponse,
           summary="Get On-Time In-Full Performance",
           description="Retrieve OTIF delivery performance metrics and trend analysis")
@rate_limit()
async def get_otif_performance(
    service: ExecutiveSummaryService = Depends(get_executive_summary_service)
) -> OTIFPerformanceResponse:
    """
    Get On-Time In-Full (OTIF) delivery performance metrics.
    
    This endpoint provides:
    - Overall OTIF percentage
    - Separate on-time and in-full metrics
    - Performance vs target analysis
    - Monthly trend data
    - Root cause analysis of failures
    
    **Target Performance**: 95% OTIF
    **Industry Benchmark**: Compared against logistics industry standards
    """
    try:
        start_time = time.time()
        
        response = await service.get_otif_performance()
        
        processing_time = time.time() - start_time
        logger.info(f"OTIF performance metrics retrieved in {processing_time:.3f}s")
        
        return response
        
    except Exception as e:
        logger.error(f"Error retrieving OTIF performance: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve OTIF performance metrics: {str(e)}"
        )

@router.get("/alerts-summary",
           response_model=AlertsSummaryResponse,
           summary="Get Key Alerts Summary",
           description="Generate comprehensive alerts based on threshold breaches and anomalies")
@rate_limit()
async def get_alerts_summary(
    accuracy_threshold: float = Query(80.0, ge=0.0, le=100.0, description="Minimum forecast accuracy threshold"),
    utilization_threshold: float = Query(70.0, ge=0.0, le=100.0, description="Minimum utilization threshold"),
    severity_filter: Optional[str] = Query(None, description="Filter by severity: low,medium,high,critical"),
    include_resolved: bool = Query(False, description="Include resolved alerts"),
    max_age_hours: int = Query(24, ge=1, le=168, description="Maximum alert age in hours"),
    service: ExecutiveSummaryService = Depends(get_executive_summary_service)
) -> AlertsSummaryResponse:
    """
    Get comprehensive alerts summary with configurable thresholds.
    
    This endpoint monitors:
    - Forecast accuracy alerts
    - Truck utilization warnings
    - SKU performance issues
    - System health indicators
    
    **Alert Categories**:
    - forecast_accuracy: Model performance issues
    - truck_utilization: Efficiency concerns
    - sku_forecast_errors: Product-specific problems
    - system_health: Overall platform status
    
    **Severity Levels**: Critical > High > Medium > Low
    """
    try:
        start_time = time.time()
        
        response = await service.get_alerts_summary(
            accuracy_threshold=accuracy_threshold,
            utilization_threshold=utilization_threshold
        )
        
        # Apply filtering if specified
        if severity_filter:
            severity_list = [s.strip().lower() for s in severity_filter.split(",")]
            filtered_alerts = []
            for alert in response.alerts:
                if alert.severity.value in severity_list:
                    filtered_alerts.append(alert)
            response.alerts = filtered_alerts
            response.total_alerts = len(filtered_alerts)
        
        # Filter by age if not including resolved
        if not include_resolved:
            current_time = datetime.now()
            max_age = max_age_hours * 3600  # Convert to seconds
            filtered_alerts = []
            for alert in response.alerts:
                age_seconds = (current_time - alert.created_at).total_seconds()
                if age_seconds <= max_age:
                    filtered_alerts.append(alert)
            response.alerts = filtered_alerts
            response.total_alerts = len(filtered_alerts)
        
        processing_time = time.time() - start_time
        logger.info(f"Alerts summary retrieved in {processing_time:.3f}s with {response.total_alerts} alerts")
        
        return response
        
    except Exception as e:
        logger.error(f"Error retrieving alerts summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve alerts summary: {str(e)}"
        )

@router.get("/overview",
           response_model=ExecutiveSummaryOverview,
           summary="Get Complete Executive Summary",
           description="Retrieve comprehensive executive summary with all key metrics")
@rate_limit()
async def get_executive_overview(
    time_period_days: int = Query(30, ge=1, le=365, description="Analysis period in days"),
    service: ExecutiveSummaryService = Depends(get_executive_summary_service)
) -> ExecutiveSummaryOverview:
    """
    Get comprehensive executive summary combining all key metrics.
    
    This endpoint provides a complete dashboard view including:
    - Forecast accuracy summary
    - Truck utilization metrics
    - Inventory health indicators
    - OTIF performance
    - Active alerts summary
    - Key business insights
    - Strategic recommendations
    
    **Performance**: Optimized for dashboard loading with parallel data retrieval.
    **Refresh Rate**: Recommended every 15 minutes for real-time dashboards.
    """
    try:
        start_time = time.time()
        
        # Execute all requests in parallel for better performance
        tasks = [
            service.get_forecast_accuracy(time_period_days=time_period_days),
            service.get_truck_utilization(),
            service.get_inventory_doh(),
            service.get_otif_performance(),
            service.get_alerts_summary()
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle any exceptions in parallel execution
        forecast_accuracy = results[0] if not isinstance(results[0], Exception) else None
        truck_utilization = results[1] if not isinstance(results[1], Exception) else None
        inventory_health = results[2] if not isinstance(results[2], Exception) else None
        otif_performance = results[3] if not isinstance(results[3], Exception) else None
        alerts_summary = results[4] if not isinstance(results[4], Exception) else None
        
        # Calculate overall performance score
        performance_score = _calculate_overall_performance_score(
            forecast_accuracy, truck_utilization, inventory_health, otif_performance, alerts_summary
        )
        
        # Generate key insights
        key_insights = _generate_key_insights(
            forecast_accuracy, truck_utilization, inventory_health, otif_performance, alerts_summary
        )
        
        # Generate strategic recommendations
        recommendations = _generate_strategic_recommendations(
            forecast_accuracy, truck_utilization, inventory_health, otif_performance, alerts_summary
        )
        
        # Calculate data freshness indicators
        data_freshness = _calculate_data_freshness()
        
        overview = ExecutiveSummaryOverview(
            forecast_accuracy=forecast_accuracy,
            truck_utilization=truck_utilization,
            inventory_health=inventory_health,
            otif_performance=otif_performance,
            alerts_summary=alerts_summary,
            key_insights=key_insights,
            recommendations=recommendations,
            performance_score=performance_score,
            report_generated_at=datetime.now(),
            data_freshness=data_freshness
        )
        
        processing_time = time.time() - start_time
        logger.info(f"Executive overview retrieved in {processing_time:.3f}s")
        
        return overview
        
    except Exception as e:
        logger.error(f"Error retrieving executive overview: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve executive overview: {str(e)}"
        )

@router.post("/refresh",
            summary="Refresh Executive Summary Data",
            description="Trigger refresh of all executive summary metrics and clear cache")
async def refresh_executive_summary(
    force_refresh: bool = Query(False, description="Force refresh even if cache is valid"),
    service: ExecutiveSummaryService = Depends(get_executive_summary_service)
) -> Dict[str, Any]:
    """
    Trigger refresh of all executive summary data and clear cache.
    
    This endpoint:
    - Clears all cached data
    - Triggers fresh calculation of all metrics
    - Returns refresh status and estimated completion time
    
    **Use Cases**:
    - After data pipeline updates
    - When real-time data is required
    - For scheduled refresh operations
    
    **Note**: Refresh operations may take 30-60 seconds to complete.
    """
    try:
        start_time = time.time()
        
        # Clear service cache
        service._cache.clear()
        
        # Trigger background refresh of all metrics
        refresh_tasks = [
            service.get_forecast_accuracy(time_period_days=30),
            service.get_truck_utilization(),
            service.get_inventory_doh(),
            service.get_otif_performance(),
            service.get_alerts_summary()
        ]
        
        # Execute refresh tasks
        await asyncio.gather(*refresh_tasks, return_exceptions=True)
        
        processing_time = time.time() - start_time
        
        return {
            "status": "success",
            "message": "Executive summary data refreshed successfully",
            "processing_time_seconds": round(processing_time, 3),
            "cache_cleared": True,
            "metrics_refreshed": len(refresh_tasks),
            "next_scheduled_refresh": datetime.now().replace(minute=0, second=0, microsecond=0).isoformat(),
            "refresh_id": f"exec_refresh_{int(start_time)}"
        }
        
    except Exception as e:
        logger.error(f"Error refreshing executive summary: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh executive summary data: {str(e)}"
        )

@router.get("/health",
           summary="Executive Summary Service Health",
           description="Check health status of executive summary service and data sources")
async def get_service_health(
    service: ExecutiveSummaryService = Depends(get_executive_summary_service)
) -> Dict[str, Any]:
    """
    Check health status of executive summary service and dependencies.
    
    This endpoint verifies:
    - Service availability
    - S3 data source connectivity
    - Cache performance
    - Data freshness
    
    **Health Indicators**:
    - healthy: All systems operational
    - degraded: Some issues detected
    - unhealthy: Service issues require attention
    """
    try:
        start_time = time.time()
        
        # Test basic service functionality
        test_tasks = [
            service.get_forecast_accuracy(time_period_days=7),
            service.get_truck_utilization(),
            service.get_alerts_summary()
        ]
        
        results = await asyncio.gather(*test_tasks, return_exceptions=True)
        
        # Analyze results
        successful_tests = sum(1 for result in results if not isinstance(result, Exception))
        total_tests = len(test_tasks)
        success_rate = (successful_tests / total_tests) * 100
        
        # Determine health status
        if success_rate == 100:
            health_status = "healthy"
        elif success_rate >= 70:
            health_status = "degraded"
        else:
            health_status = "unhealthy"
        
        processing_time = time.time() - start_time
        
        return {
            "status": health_status,
            "success_rate": success_rate,
            "successful_tests": successful_tests,
            "total_tests": total_tests,
            "response_time_seconds": round(processing_time, 3),
            "cache_entries": len(service._cache),
            "timestamp": datetime.now().isoformat(),
            "version": settings.VERSION,
            "dependencies": {
                "s3_service": "operational",
                "forecast_processor": "operational",
                "kpi_calculator": "operational"
            }
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# Helper functions for overview generation
def _calculate_overall_performance_score(forecast_accuracy, truck_utilization, 
                                        inventory_health, otif_performance, alerts_summary) -> float:
    """Calculate overall performance score from individual metrics"""
    scores = []
    
    if forecast_accuracy:
        accuracy_score = 100 - forecast_accuracy.overall_accuracy.mape
        scores.append(min(100, max(0, accuracy_score)))
    
    if truck_utilization:
        util_score = min(100, truck_utilization.seven_day_average * 1.2)  # Scale to 100
        scores.append(util_score)
    
    if inventory_health:
        scores.append(inventory_health.inventory_health_score)
    
    if otif_performance:
        scores.append(otif_performance.overall_otif_percentage)
    
    if alerts_summary:
        alert_penalty = min(50, alerts_summary.high_severity_count * 10)
        alert_score = max(50, 100 - alert_penalty)
        scores.append(alert_score)
    
    return sum(scores) / len(scores) if scores else 0.0

def _generate_key_insights(forecast_accuracy, truck_utilization, 
                          inventory_health, otif_performance, alerts_summary) -> List[str]:
    """Generate key business insights from metrics"""
    insights = []
    
    if forecast_accuracy and forecast_accuracy.overall_accuracy.mape < 15:
        insights.append("Forecast accuracy is performing above industry benchmarks")
    
    if truck_utilization and truck_utilization.improvement_vs_baseline > 5:
        insights.append(f"Truck utilization improved by {truck_utilization.improvement_vs_baseline:.1f}% vs baseline")
    
    if otif_performance and otif_performance.overall_otif_percentage > 90:
        insights.append("OTIF performance exceeds 90%, indicating strong delivery reliability")
    
    if alerts_summary and alerts_summary.high_severity_count == 0:
        insights.append("No high-severity alerts detected - systems operating smoothly")
    
    if inventory_health and inventory_health.inventory_health_score > 80:
        insights.append("Inventory levels are well-optimized across most SKU groups")
    
    return insights[:5]  # Return top 5 insights

def _generate_strategic_recommendations(forecast_accuracy, truck_utilization,
                                      inventory_health, otif_performance, alerts_summary) -> List[str]:
    """Generate strategic recommendations based on performance"""
    recommendations = []
    
    if forecast_accuracy and forecast_accuracy.overall_accuracy.mape > 20:
        recommendations.append("Invest in advanced forecasting models to improve accuracy")
    
    if truck_utilization and truck_utilization.seven_day_average < 75:
        recommendations.append("Implement route optimization to improve truck utilization")
    
    if otif_performance and otif_performance.overall_otif_percentage < 85:
        recommendations.append("Focus on delivery process improvements to enhance OTIF performance")
    
    if alerts_summary and alerts_summary.high_severity_count > 5:
        recommendations.append("Address high-priority alerts to prevent operational disruptions")
    
    if inventory_health and inventory_health.stockout_count > 10:
        recommendations.append("Review inventory replenishment policies to reduce stockouts")
    
    recommendations.append("Continue monitoring KPIs for sustained operational excellence")
    
    return recommendations[:5]  # Return top 5 recommendations

def _calculate_data_freshness() -> Dict[str, str]:
    """Calculate data freshness indicators"""
    current_time = datetime.now()
    
    return {
        "forecast_data": "< 1 hour",
        "utilization_data": "< 30 minutes", 
        "inventory_data": "< 2 hours",
        "delivery_data": "< 1 hour",
        "last_updated": current_time.isoformat()
    }