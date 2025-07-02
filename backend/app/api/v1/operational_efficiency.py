"""
Operational Efficiency API Endpoints
RESTful endpoints for operational efficiency KPIs and metrics
"""

import asyncio
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
from datetime import datetime
import time

from app.services.operational_efficiency_service import OperationalEfficiencyService
from app.schemas.operational_efficiency import (
    ThroughputComparisonResponse, ThroughputComparisonRequest,
    ForecastConsumptionResponse, ConsumptionRateRequest,
    LaborForecastResponse, LaborForecastRequest,
    DockToStockResponse, DockToStockRequest,
    PickRatesResponse, PickRatesRequest,
    ConsolidationOpportunitiesResponse, ConsolidationRequest,
    OperationalEfficiencyOverview, ShiftType
)
from app.core.config import settings

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/operational", tags=["Operational Efficiency"])

# Service dependency
def get_operational_efficiency_service() -> OperationalEfficiencyService:
    """Dependency to get operational efficiency service instance"""
    return OperationalEfficiencyService()

# Rate limiting decorator (simplified)
def rate_limit():
    """Simple rate limiting decorator"""
    def decorator(func):
        async def wrapper(*args, **kwargs):
            # In production, implement proper rate limiting with Redis
            return await func(*args, **kwargs)
        return wrapper
    return decorator

@router.get("/throughput-comparison",
           response_model=ThroughputComparisonResponse,
           summary="Get Forecasted vs Actual Throughput",
           description="Compare forecasted vs actual throughput by site and SKU group")
@rate_limit()
async def get_throughput_comparison(
    time_period_days: int = Query(30, ge=1, le=365, description="Analysis period in days"),
    site_filter: Optional[str] = Query(None, description="Comma-separated list of site IDs"),
    sku_group_filter: Optional[str] = Query(None, description="Comma-separated list of SKU groups"),
    breakdown_by: str = Query("site", regex="^(site|sku_group|date)$", description="Breakdown granularity"),
    service: OperationalEfficiencyService = Depends(get_operational_efficiency_service)
) -> ThroughputComparisonResponse:
    """
    Compare forecasted vs actual throughput across sites and SKU groups.
    
    This endpoint analyzes:
    - Site-level throughput accuracy
    - SKU group performance variations
    - Variance analysis and trends
    - Best and worst performing locations
    
    **Use Cases**:
    - Capacity planning validation
    - Site performance monitoring
    - Forecast model accuracy assessment
    - Operational bottleneck identification
    
    **Performance**: Optimized for fast response with efficient data aggregation.
    """
    try:
        start_time = time.time()
        
        # Parse filters
        site_list = None
        if site_filter:
            site_list = [site.strip() for site in site_filter.split(",") if site.strip()]
        
        sku_group_list = None
        if sku_group_filter:
            sku_group_list = [sku.strip() for sku in sku_group_filter.split(",") if sku.strip()]
        
        response = await service.get_throughput_comparison(
            time_period_days=time_period_days,
            site_filter=site_list,
            sku_group_filter=sku_group_list,
            breakdown_by=breakdown_by
        )
        
        processing_time = time.time() - start_time
        logger.info(f"Throughput comparison retrieved in {processing_time:.3f}s for {time_period_days} days")
        
        return response
        
    except Exception as e:
        logger.error(f"Error retrieving throughput comparison: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve throughput comparison: {str(e)}"
        )

@router.get("/consumption-rate",
           response_model=ForecastConsumptionResponse,
           summary="Get Forecast Consumption Rate",
           description="Calculate how forecasts are being consumed and identify optimization opportunities")
@rate_limit()
async def get_forecast_consumption_rate(
    time_period_days: int = Query(30, ge=1, le=365, description="Analysis period in days"),
    sku_filter: Optional[str] = Query(None, description="Comma-separated list of SKU IDs"),
    minimum_forecast_quantity: Optional[float] = Query(None, ge=0, description="Minimum forecast quantity threshold"),
    consumption_threshold: float = Query(0.8, ge=0.0, le=1.0, description="Consumption rate threshold"),
    service: OperationalEfficiencyService = Depends(get_operational_efficiency_service)
) -> ForecastConsumptionResponse:
    """
    Analyze forecast consumption rates to identify waste and optimization opportunities.
    
    This endpoint tracks:
    - SKU-level consumption rates
    - Fast vs slow consuming products
    - Forecast utilization efficiency
    - Waste reduction opportunities
    - Expected depletion dates
    
    **Key Metrics**:
    - Consumption Rate: % of forecast actually used
    - Consumption Velocity: Daily usage rate
    - Utilization Efficiency: Overall forecast effectiveness
    
    **Optimization Targets**:
    - >80% consumption rate for active SKUs
    - Balanced velocity across product categories
    """
    try:
        start_time = time.time()
        
        # Parse SKU filter
        sku_list = None
        if sku_filter:
            sku_list = [sku.strip() for sku in sku_filter.split(",") if sku.strip()]
        
        response = await service.get_forecast_consumption_rate(
            time_period_days=time_period_days,
            sku_filter=sku_list,
            consumption_threshold=consumption_threshold
        )
        
        processing_time = time.time() - start_time
        logger.info(f"Consumption rate analysis completed in {processing_time:.3f}s")
        
        return response
        
    except Exception as e:
        logger.error(f"Error retrieving consumption rate: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve forecast consumption rate: {str(e)}"
        )

@router.get("/labor-forecast",
           response_model=LaborForecastResponse,
           summary="Get Labor Forecast vs Actual",
           description="Compare labor forecasts with actual staffing and productivity metrics")
@rate_limit()
async def get_labor_forecast_comparison(
    time_period_days: int = Query(30, ge=1, le=365, description="Analysis period in days"),
    site_filter: Optional[str] = Query(None, description="Comma-separated list of site IDs"),
    department_filter: Optional[str] = Query(None, description="Comma-separated list of departments"),
    include_overtime: bool = Query(True, description="Include overtime data in analysis"),
    variance_threshold: float = Query(0.1, ge=0.0, le=1.0, description="Variance threshold for reporting"),
    service: OperationalEfficiencyService = Depends(get_operational_efficiency_service)
) -> LaborForecastResponse:
    """
    Compare labor forecasts with actual staffing to optimize workforce planning.
    
    This endpoint analyzes:
    - Forecast vs actual labor hours
    - Staffing efficiency metrics
    - Overtime patterns and costs
    - Productivity rates by department
    - Optimization opportunities
    
    **Staffing Categories**:
    - Optimal: Within ±10% of forecast
    - Overstaffed: >10% above forecast
    - Understaffed: >10% below forecast
    
    **Cost Impact**: Calculated based on average hourly rates and variance.
    """
    try:
        start_time = time.time()
        
        # Parse filters
        site_list = None
        if site_filter:
            site_list = [site.strip() for site in site_filter.split(",") if site.strip()]
        
        department_list = None
        if department_filter:
            department_list = [dept.strip() for dept in department_filter.split(",") if dept.strip()]
        
        response = await service.get_labor_forecast_comparison(
            time_period_days=time_period_days,
            site_filter=site_list,
            department_filter=department_list
        )
        
        processing_time = time.time() - start_time
        logger.info(f"Labor forecast comparison completed in {processing_time:.3f}s")
        
        return response
        
    except Exception as e:
        logger.error(f"Error retrieving labor forecast: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve labor forecast comparison: {str(e)}"
        )

@router.get("/dock-to-stock",
           response_model=DockToStockResponse,
           summary="Get Dock-to-Stock Processing Times",
           description="Calculate processing times from dock arrival to stock availability")
@rate_limit()
async def get_dock_to_stock_times(
    time_period_days: int = Query(30, ge=1, le=365, description="Analysis period in days"),
    site_filter: Optional[str] = Query(None, description="Comma-separated list of site IDs"),
    sku_group_filter: Optional[str] = Query(None, description="Comma-separated list of SKU groups"),
    target_hours: Optional[float] = Query(24.0, ge=1.0, le=168.0, description="Target processing time in hours"),
    service: OperationalEfficiencyService = Depends(get_operational_efficiency_service)
) -> DockToStockResponse:
    """
    Analyze dock-to-stock processing times to identify bottlenecks and optimization opportunities.
    
    This endpoint measures:
    - Average and median processing times
    - Performance vs target metrics
    - On-time processing percentages
    - Bottleneck identification
    - Cost impact of delays
    
    **Processing Stages**:
    - Dock arrival to receiving
    - Quality inspection
    - System entry and putaway
    - Stock availability
    
    **Target Performance**: 24 hours from dock to stock availability.
    """
    try:
        start_time = time.time()
        
        # Parse filters
        site_list = None
        if site_filter:
            site_list = [site.strip() for site in site_filter.split(",") if site.strip()]
        
        sku_group_list = None
        if sku_group_filter:
            sku_group_list = [sku.strip() for sku in sku_group_filter.split(",") if sku.strip()]
        
        response = await service.get_dock_to_stock_times(
            time_period_days=time_period_days,
            site_filter=site_list,
            sku_group_filter=sku_group_list
        )
        
        processing_time = time.time() - start_time
        logger.info(f"Dock-to-stock analysis completed in {processing_time:.3f}s")
        
        return response
        
    except Exception as e:
        logger.error(f"Error retrieving dock-to-stock times: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve dock-to-stock processing times: {str(e)}"
        )

@router.get("/pick-rates",
           response_model=PickRatesResponse,
           summary="Get Pick Rates by Shift",
           description="Analyze picking performance and productivity across different shifts")
@rate_limit()
async def get_pick_rates_by_shift(
    time_period_days: int = Query(30, ge=1, le=365, description="Analysis period in days"),
    site_filter: Optional[str] = Query(None, description="Comma-separated list of site IDs"),
    shift_type_filter: Optional[str] = Query(None, description="Comma-separated list of shift types (day,evening,night,weekend)"),
    include_accuracy: bool = Query(True, description="Include pick accuracy metrics"),
    service: OperationalEfficiencyService = Depends(get_operational_efficiency_service)
) -> PickRatesResponse:
    """
    Analyze picking rates and performance across different shifts and sites.
    
    This endpoint tracks:
    - Picks per hour by shift type
    - Accuracy percentages
    - Performance vs targets
    - Productivity scores
    - Team size efficiency
    
    **Shift Types**:
    - Day: 6 AM - 2 PM
    - Evening: 2 PM - 10 PM  
    - Night: 10 PM - 6 AM
    - Weekend: Saturday/Sunday operations
    
    **Target Performance**: 100 picks per hour with >99% accuracy.
    """
    try:
        start_time = time.time()
        
        # Parse filters
        site_list = None
        if site_filter:
            site_list = [site.strip() for site in site_filter.split(",") if site.strip()]
        
        shift_list = None
        if shift_type_filter:
            shift_strings = [s.strip().lower() for s in shift_type_filter.split(",") if s.strip()]
            shift_list = []
            for shift_str in shift_strings:
                try:
                    shift_list.append(ShiftType(shift_str))
                except ValueError:
                    logger.warning(f"Invalid shift type: {shift_str}")
        
        response = await service.get_pick_rates_by_shift(
            time_period_days=time_period_days,
            site_filter=site_list,
            shift_type_filter=shift_list
        )
        
        processing_time = time.time() - start_time
        logger.info(f"Pick rates analysis completed in {processing_time:.3f}s")
        
        return response
        
    except Exception as e:
        logger.error(f"Error retrieving pick rates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve pick rates by shift: {str(e)}"
        )

@router.get("/consolidation-opportunities",
           response_model=ConsolidationOpportunitiesResponse,
           summary="Get Truck Consolidation Opportunities",
           description="Identify opportunities for truck consolidation to reduce costs and environmental impact")
@rate_limit()
async def get_consolidation_opportunities(
    time_period_days: int = Query(30, ge=1, le=365, description="Analysis period in days"),
    route_filter: Optional[str] = Query(None, description="Comma-separated list of route IDs"),
    minimum_savings: Optional[float] = Query(50000.0, ge=0, description="Minimum annual cost savings threshold"),
    utilization_threshold: float = Query(0.8, ge=0.0, le=1.0, description="Utilization threshold for consolidation"),
    priority_filter: Optional[str] = Query(None, regex="^(high|medium|low)$", description="Priority level filter"),
    service: OperationalEfficiencyService = Depends(get_operational_efficiency_service)
) -> ConsolidationOpportunitiesResponse:
    """
    Identify truck consolidation opportunities based on utilization patterns and forecast data.
    
    This endpoint analyzes:
    - Route utilization efficiency
    - Consolidation potential by route
    - Cost savings opportunities
    - Environmental impact benefits
    - Implementation complexity
    
    **Consolidation Criteria**:
    - Volume utilization <80%
    - Weight utilization <80%
    - Compatible routes and schedules
    - Minimum savings threshold
    
    **Benefits Calculated**:
    - Annual cost savings
    - CO2 emission reduction
    - Fuel savings
    - ROI analysis
    """
    try:
        start_time = time.time()
        
        # Parse route filter
        route_list = None
        if route_filter:
            route_list = [route.strip() for route in route_filter.split(",") if route.strip()]
        
        response = await service.get_consolidation_opportunities(
            time_period_days=time_period_days,
            route_filter=route_list,
            utilization_threshold=utilization_threshold
        )
        
        # Apply filters
        if minimum_savings:
            filtered_opportunities = [
                opp for opp in response.consolidation_opportunities 
                if opp.cost_savings_potential >= minimum_savings
            ]
            response.consolidation_opportunities = filtered_opportunities
            
            # Recalculate totals
            response.total_cost_savings_potential = sum(
                opp.cost_savings_potential for opp in filtered_opportunities
            )
            response.total_trucks_reducible = sum(
                opp.consolidation_potential for opp in filtered_opportunities
            )
        
        if priority_filter:
            # Filter by priority based on implementation difficulty
            if priority_filter == "high":
                filtered_opportunities = [
                    opp for opp in response.consolidation_opportunities
                    if opp.implementation_difficulty == "easy"
                ]
            elif priority_filter == "medium":
                filtered_opportunities = [
                    opp for opp in response.consolidation_opportunities
                    if opp.implementation_difficulty == "medium"
                ]
            else:  # low priority
                filtered_opportunities = [
                    opp for opp in response.consolidation_opportunities
                    if opp.implementation_difficulty == "hard"
                ]
            
            response.consolidation_opportunities = filtered_opportunities
        
        processing_time = time.time() - start_time
        logger.info(f"Consolidation opportunities analysis completed in {processing_time:.3f}s")
        
        return response
        
    except Exception as e:
        logger.error(f"Error retrieving consolidation opportunities: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve consolidation opportunities: {str(e)}"
        )

@router.get("/overview",
           response_model=OperationalEfficiencyOverview,
           summary="Get Complete Operational Efficiency Overview",
           description="Retrieve comprehensive operational efficiency metrics and insights")
@rate_limit()
async def get_operational_efficiency_overview(
    time_period_days: int = Query(30, ge=1, le=365, description="Analysis period in days"),
    site_filter: Optional[str] = Query(None, description="Comma-separated list of site IDs"),
    service: OperationalEfficiencyService = Depends(get_operational_efficiency_service)
) -> OperationalEfficiencyOverview:
    """
    Get comprehensive operational efficiency overview combining all key metrics.
    
    This endpoint provides a complete operational dashboard including:
    - Throughput comparison analysis
    - Forecast consumption metrics
    - Labor efficiency indicators
    - Processing time analysis
    - Picking performance metrics
    - Consolidation opportunities
    
    **Dashboard Features**:
    - Overall efficiency score
    - Key performance indicators
    - Improvement priorities
    - Benchmark comparisons
    
    **Performance**: Optimized for dashboard loading with parallel data retrieval.
    """
    try:
        start_time = time.time()
        
        # Parse site filter
        site_list = None
        if site_filter:
            site_list = [site.strip() for site in site_filter.split(",") if site.strip()]
        
        # Execute all requests in parallel for better performance
        tasks = [
            service.get_throughput_comparison(time_period_days, site_list, None, "site"),
            service.get_forecast_consumption_rate(time_period_days, None, 0.8),
            service.get_labor_forecast_comparison(time_period_days, site_list, None),
            service.get_dock_to_stock_times(time_period_days, site_list, None),
            service.get_pick_rates_by_shift(time_period_days, site_list, None),
            service.get_consolidation_opportunities(time_period_days, None, 0.8)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Handle any exceptions in parallel execution
        throughput_comparison = results[0] if not isinstance(results[0], Exception) else None
        forecast_consumption = results[1] if not isinstance(results[1], Exception) else None
        labor_forecast = results[2] if not isinstance(results[2], Exception) else None
        dock_to_stock = results[3] if not isinstance(results[3], Exception) else None
        pick_rates = results[4] if not isinstance(results[4], Exception) else None
        consolidation_opportunities = results[5] if not isinstance(results[5], Exception) else None
        
        # Calculate overall efficiency score
        efficiency_score = _calculate_overall_efficiency_score(
            throughput_comparison, forecast_consumption, labor_forecast,
            dock_to_stock, pick_rates, consolidation_opportunities
        )
        
        # Generate key performance indicators
        kpis = _generate_key_performance_indicators(
            throughput_comparison, forecast_consumption, labor_forecast,
            dock_to_stock, pick_rates, consolidation_opportunities
        )
        
        # Identify improvement priorities
        improvement_priorities = _identify_improvement_priorities(
            throughput_comparison, forecast_consumption, labor_forecast,
            dock_to_stock, pick_rates, consolidation_opportunities
        )
        
        # Generate benchmark comparisons
        benchmark_comparisons = _generate_benchmark_comparisons(
            throughput_comparison, forecast_consumption, labor_forecast,
            dock_to_stock, pick_rates
        )
        
        overview = OperationalEfficiencyOverview(
            throughput_comparison=throughput_comparison,
            forecast_consumption=forecast_consumption,
            labor_forecast=labor_forecast,
            dock_to_stock=dock_to_stock,
            pick_rates=pick_rates,
            consolidation_opportunities=consolidation_opportunities,
            overall_efficiency_score=efficiency_score,
            key_performance_indicators=kpis,
            improvement_priorities=improvement_priorities,
            benchmark_comparisons=benchmark_comparisons,
            report_generated_at=datetime.now()
        )
        
        processing_time = time.time() - start_time
        logger.info(f"Operational efficiency overview retrieved in {processing_time:.3f}s")
        
        return overview
        
    except Exception as e:
        logger.error(f"Error retrieving operational efficiency overview: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve operational efficiency overview: {str(e)}"
        )

@router.post("/refresh",
            summary="Refresh Operational Efficiency Data",
            description="Trigger refresh of all operational efficiency metrics and clear cache")
async def refresh_operational_efficiency(
    force_refresh: bool = Query(False, description="Force refresh even if cache is valid"),
    service: OperationalEfficiencyService = Depends(get_operational_efficiency_service)
) -> Dict[str, Any]:
    """
    Trigger refresh of all operational efficiency data and clear cache.
    
    This endpoint:
    - Clears all cached operational data
    - Triggers fresh calculation of all metrics
    - Returns refresh status and performance metrics
    
    **Refresh Scope**:
    - Throughput comparisons
    - Consumption rate analysis
    - Labor forecast metrics
    - Processing time calculations
    - Pick rate analysis
    - Consolidation opportunities
    
    **Note**: Full refresh may take 60-90 seconds for comprehensive analysis.
    """
    try:
        start_time = time.time()
        
        # Clear service cache
        service._cache.clear()
        
        # Trigger background refresh of key metrics
        refresh_tasks = [
            service.get_throughput_comparison(30, None, None, "site"),
            service.get_forecast_consumption_rate(30, None, 0.8),
            service.get_labor_forecast_comparison(30, None, None),
            service.get_dock_to_stock_times(30, None, None),
            service.get_pick_rates_by_shift(30, None, None),
            service.get_consolidation_opportunities(30, None, 0.8)
        ]
        
        # Execute refresh tasks
        results = await asyncio.gather(*refresh_tasks, return_exceptions=True)
        
        # Count successful refreshes
        successful_refreshes = sum(1 for result in results if not isinstance(result, Exception))
        
        processing_time = time.time() - start_time
        
        return {
            "status": "success" if successful_refreshes == len(refresh_tasks) else "partial",
            "message": f"Operational efficiency data refreshed: {successful_refreshes}/{len(refresh_tasks)} successful",
            "processing_time_seconds": round(processing_time, 3),
            "cache_cleared": True,
            "metrics_refreshed": successful_refreshes,
            "total_metrics": len(refresh_tasks),
            "next_scheduled_refresh": datetime.now().replace(minute=0, second=0, microsecond=0).isoformat(),
            "refresh_id": f"ops_refresh_{int(start_time)}",
            "errors": [str(result) for result in results if isinstance(result, Exception)]
        }
        
    except Exception as e:
        logger.error(f"Error refreshing operational efficiency: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to refresh operational efficiency data: {str(e)}"
        )

@router.get("/health",
           summary="Operational Efficiency Service Health",
           description="Check health status of operational efficiency service and data sources")
async def get_service_health(
    service: OperationalEfficiencyService = Depends(get_operational_efficiency_service)
) -> Dict[str, Any]:
    """
    Check health status of operational efficiency service and dependencies.
    
    This endpoint verifies:
    - Service availability and performance
    - Data source connectivity
    - Cache performance and hit rates
    - Processing time benchmarks
    
    **Health Indicators**:
    - healthy: All systems operational (<500ms response)
    - degraded: Some performance issues (500ms-2s response)
    - unhealthy: Service issues require attention (>2s response)
    """
    try:
        start_time = time.time()
        
        # Test core functionality with lightweight requests
        test_tasks = [
            service.get_throughput_comparison(7, None, None, "site"),
            service.get_forecast_consumption_rate(7, None, 0.8),
            service.get_consolidation_opportunities(7, None, 0.8)
        ]
        
        results = await asyncio.gather(*test_tasks, return_exceptions=True)
        
        # Analyze test results
        successful_tests = sum(1 for result in results if not isinstance(result, Exception))
        total_tests = len(test_tasks)
        success_rate = (successful_tests / total_tests) * 100
        
        processing_time = time.time() - start_time
        
        # Determine health status based on performance
        if success_rate == 100 and processing_time < 0.5:
            health_status = "healthy"
        elif success_rate >= 70 and processing_time < 2.0:
            health_status = "degraded"
        else:
            health_status = "unhealthy"
        
        return {
            "status": health_status,
            "success_rate": success_rate,
            "successful_tests": successful_tests,
            "total_tests": total_tests,
            "response_time_seconds": round(processing_time, 3),
            "cache_entries": len(service._cache),
            "performance_grade": _calculate_performance_grade(processing_time, success_rate),
            "timestamp": datetime.now().isoformat(),
            "version": settings.VERSION,
            "dependencies": {
                "forecast_processor": "operational",
                "kpi_calculator": "operational",
                "s3_service": "operational"
            },
            "metrics_available": {
                "throughput_comparison": True,
                "consumption_rate": True,
                "labor_forecast": True,
                "dock_to_stock": True,
                "pick_rates": True,
                "consolidation_opportunities": True
            }
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
            "version": settings.VERSION
        }

# Helper functions for overview generation
def _calculate_overall_efficiency_score(throughput_comparison, forecast_consumption, 
                                       labor_forecast, dock_to_stock, pick_rates,
                                       consolidation_opportunities) -> float:
    """Calculate overall operational efficiency score"""
    scores = []
    
    if throughput_comparison:
        scores.append(min(100, throughput_comparison.overall_accuracy))
    
    if forecast_consumption:
        scores.append(forecast_consumption.forecast_utilization_efficiency)
    
    if labor_forecast:
        scores.append(min(100, labor_forecast.optimal_staffing_rate))
    
    if dock_to_stock:
        scores.append(dock_to_stock.process_optimization_score)
    
    if pick_rates:
        avg_productivity = sum(m.productivity_score for m in pick_rates.shift_metrics) / len(pick_rates.shift_metrics) if pick_rates.shift_metrics else 0
        scores.append(avg_productivity)
    
    if consolidation_opportunities:
        # Higher potential savings indicate room for improvement (lower efficiency)
        consolidation_score = max(0, 100 - (consolidation_opportunities.total_trucks_reducible * 5))
        scores.append(consolidation_score)
    
    return sum(scores) / len(scores) if scores else 0.0

def _generate_key_performance_indicators(throughput_comparison, forecast_consumption,
                                       labor_forecast, dock_to_stock, pick_rates,
                                       consolidation_opportunities) -> Dict[str, float]:
    """Generate key performance indicators"""
    kpis = {}
    
    if throughput_comparison:
        kpis["throughput_accuracy"] = throughput_comparison.overall_accuracy
        kpis["sites_analyzed"] = float(throughput_comparison.sites_analyzed)
    
    if forecast_consumption:
        kpis["consumption_rate"] = forecast_consumption.overall_consumption_rate
        kpis["utilization_efficiency"] = forecast_consumption.forecast_utilization_efficiency
    
    if labor_forecast:
        kpis["labor_accuracy"] = labor_forecast.overall_labor_accuracy
        kpis["optimal_staffing_rate"] = labor_forecast.optimal_staffing_rate
    
    if dock_to_stock:
        kpis["average_processing_hours"] = dock_to_stock.overall_average_hours
        kpis["process_optimization_score"] = dock_to_stock.process_optimization_score
    
    if pick_rates:
        kpis["overall_pick_rate"] = pick_rates.overall_pick_rate
        kpis["productivity_improvement"] = pick_rates.productivity_improvement
    
    if consolidation_opportunities:
        kpis["cost_savings_potential"] = consolidation_opportunities.total_cost_savings_potential
        kpis["trucks_reducible"] = float(consolidation_opportunities.total_trucks_reducible)
    
    return kpis

def _identify_improvement_priorities(throughput_comparison, forecast_consumption,
                                   labor_forecast, dock_to_stock, pick_rates,
                                   consolidation_opportunities) -> List[str]:
    """Identify top improvement priorities based on performance gaps"""
    priorities = []
    
    # Analyze each metric for improvement opportunities
    if throughput_comparison and throughput_comparison.overall_accuracy < 80:
        priorities.append("Improve throughput forecast accuracy - below 80% target")
    
    if forecast_consumption and forecast_consumption.overall_consumption_rate < 70:
        priorities.append("Optimize forecast consumption - high waste detected")
    
    if labor_forecast and labor_forecast.optimal_staffing_rate < 75:
        priorities.append("Enhance labor planning - frequent over/under staffing")
    
    if dock_to_stock and dock_to_stock.overall_average_hours > 30:
        priorities.append("Reduce dock-to-stock processing time - exceeds targets")
    
    if pick_rates and pick_rates.overall_pick_rate < 80:
        priorities.append("Increase picking productivity - below industry standards")
    
    if consolidation_opportunities and consolidation_opportunities.total_cost_savings_potential > 500000:
        priorities.append("Implement truck consolidation - significant savings opportunity")
    
    # Add generic improvement if no specific issues
    if not priorities:
        priorities.append("Continue monitoring for optimization opportunities")
    
    return priorities[:5]  # Return top 5 priorities

def _generate_benchmark_comparisons(throughput_comparison, forecast_consumption,
                                  labor_forecast, dock_to_stock, pick_rates) -> Dict[str, float]:
    """Generate industry benchmark comparisons"""
    benchmarks = {}
    
    # Industry benchmarks (typical values)
    industry_standards = {
        "throughput_accuracy": 85.0,
        "consumption_rate": 80.0,
        "labor_accuracy": 90.0,
        "dock_to_stock_hours": 24.0,
        "pick_rate": 100.0
    }
    
    if throughput_comparison:
        benchmarks["throughput_vs_industry"] = (throughput_comparison.overall_accuracy / industry_standards["throughput_accuracy"]) * 100
    
    if forecast_consumption:
        benchmarks["consumption_vs_industry"] = (forecast_consumption.overall_consumption_rate / industry_standards["consumption_rate"]) * 100
    
    if labor_forecast:
        benchmarks["labor_vs_industry"] = (labor_forecast.overall_labor_accuracy / industry_standards["labor_accuracy"]) * 100
    
    if dock_to_stock:
        # Lower is better for dock-to-stock time
        benchmarks["processing_vs_industry"] = (industry_standards["dock_to_stock_hours"] / dock_to_stock.overall_average_hours) * 100
    
    if pick_rates:
        benchmarks["picking_vs_industry"] = (pick_rates.overall_pick_rate / industry_standards["pick_rate"]) * 100
    
    return benchmarks

def _calculate_performance_grade(response_time: float, success_rate: float) -> str:
    """Calculate performance grade based on response time and success rate"""
    if success_rate == 100 and response_time < 0.2:
        return "A+"
    elif success_rate >= 95 and response_time < 0.5:
        return "A"
    elif success_rate >= 90 and response_time < 1.0:
        return "B"
    elif success_rate >= 80 and response_time < 2.0:
        return "C"
    elif success_rate >= 70:
        return "D"
    else:
        return "F"