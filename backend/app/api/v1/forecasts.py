"""
Forecast API endpoints
ML-powered demand and volume forecasting
"""

from fastapi import APIRouter, Query, HTTPException, BackgroundTasks
from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta
from pydantic import BaseModel, Field
import boto3
import json
import pandas as pd

from app.core.config import settings
from app.services.forecast_service import ForecastService
from app.schemas.forecast import (
    ForecastResponse, 
    ForecastRequest, 
    TimeHorizon,
    AccuracyMetricsResponse
)

router = APIRouter()
forecast_service = ForecastService()

class ForecastSummary(BaseModel):
    """Summary statistics for forecasts"""
    total_items: int
    forecast_horizon: int
    confidence_intervals: List[str]
    accuracy_metrics: Dict[str, float]
    last_updated: datetime

@router.get("/", response_model=List[ForecastResponse])
async def get_forecasts(
    time_horizon: TimeHorizon = Query(TimeHorizon.WEEK_1, description="Forecast time horizon"),
    sku_filter: Optional[List[str]] = Query(None, description="Filter by SKU IDs"),
    warehouse_filter: Optional[List[str]] = Query(None, description="Filter by warehouse codes"),
    limit: int = Query(50, le=settings.MAX_FORECAST_ITEMS_PER_REQUEST, description="Maximum results"),
    offset: int = Query(0, ge=0, description="Results offset for pagination")
):
    """
    Get demand forecasts for specified time horizon and filters
    
    Returns forecasts with confidence intervals and metadata
    """
    try:
        # Convert time horizon to days
        horizon_mapping = {
            TimeHorizon.DAY_1: 1,
            TimeHorizon.WEEK_1: 7,
            TimeHorizon.WEEK_2: 14,
            TimeHorizon.WEEK_4: 28
        }
        
        horizon_days = horizon_mapping[time_horizon]
        
        # Get forecasts from service
        forecasts = await forecast_service.get_forecasts(
            horizon_days=horizon_days,
            sku_filter=sku_filter,
            warehouse_filter=warehouse_filter,
            limit=limit,
            offset=offset
        )
        
        return forecasts
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve forecasts: {str(e)}"
        )

@router.get("/summary", response_model=ForecastSummary)
async def get_forecast_summary():
    """
    Get summary statistics for all available forecasts
    """
    try:
        summary = await forecast_service.get_forecast_summary()
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve forecast summary: {str(e)}"
        )

@router.get("/volume", response_model=List[Dict[str, Any]])
async def get_volume_forecasts(
    time_horizon: TimeHorizon = Query(TimeHorizon.WEEK_1),
    aggregation: str = Query("daily", regex="^(daily|weekly|monthly)$")
):
    """
    Get volume forecasts aggregated by time period
    """
    try:
        volume_forecasts = await forecast_service.get_volume_forecasts(
            time_horizon=time_horizon,
            aggregation=aggregation
        )
        
        return volume_forecasts
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve volume forecasts: {str(e)}"
        )

@router.get("/accuracy", response_model=AccuracyMetricsResponse)
async def get_forecast_accuracy(
    start_date: Optional[date] = Query(None, description="Start date for accuracy calculation"),
    end_date: Optional[date] = Query(None, description="End date for accuracy calculation"),
    sku_filter: Optional[List[str]] = Query(None, description="Filter by SKU IDs")
):
    """
    Get forecast accuracy metrics (MAPE, WAPE, Bias)
    """
    try:
        # Default to last 30 days if no dates provided
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()
            
        accuracy_metrics = await forecast_service.calculate_accuracy_metrics(
            start_date=start_date,
            end_date=end_date,
            sku_filter=sku_filter
        )
        
        return accuracy_metrics
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to calculate accuracy metrics: {str(e)}"
        )

@router.post("/generate")
async def trigger_forecast_generation(
    request: ForecastRequest,
    background_tasks: BackgroundTasks
):
    """
    Trigger new forecast generation for specified parameters
    """
    try:
        # Validate request parameters
        if request.horizon_days not in [1, 7, 14, 28]:
            raise HTTPException(
                status_code=400,
                detail="Horizon days must be 1, 7, 14, or 28"
            )
        
        # Add background task for forecast generation
        background_tasks.add_task(
            forecast_service.generate_new_forecasts,
            request.dict()
        )
        
        return {
            "message": "Forecast generation started",
            "request_id": f"forecast_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "estimated_completion": datetime.now() + timedelta(hours=2),
            "status": "processing"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to trigger forecast generation: {str(e)}"
        )

@router.get("/trends/{sku_id}")
async def get_forecast_trends(
    sku_id: str,
    days_back: int = Query(90, ge=30, le=365, description="Days of historical data")
):
    """
    Get forecast vs actual trends for a specific SKU
    """
    try:
        trends = await forecast_service.get_forecast_trends(
            sku_id=sku_id,
            days_back=days_back
        )
        
        return {
            "sku_id": sku_id,
            "period_days": days_back,
            "data_points": len(trends),
            "trends": trends,
            "statistics": {
                "avg_forecast_accuracy": sum(t.get("accuracy", 0) for t in trends) / len(trends) if trends else 0,
                "trend_direction": "stable"  # Could be calculated from data
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve forecast trends: {str(e)}"
        )

@router.get("/export/csv")
async def export_forecasts_csv(
    time_horizon: TimeHorizon = Query(TimeHorizon.WEEK_1),
    sku_filter: Optional[List[str]] = Query(None),
    format_type: str = Query("business", regex="^(business|technical)$")
):
    """
    Export forecasts to CSV format
    """
    try:
        csv_data = await forecast_service.export_to_csv(
            time_horizon=time_horizon,
            sku_filter=sku_filter,
            format_type=format_type
        )
        
        from fastapi.responses import Response
        
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=forecasts_{time_horizon.value}_{datetime.now().strftime('%Y%m%d')}.csv"
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export forecasts: {str(e)}"
        )

@router.get("/status")
async def get_forecast_service_status():
    """
    Get status of forecast service and last update times
    """
    try:
        status = await forecast_service.get_service_status()
        
        return {
            "service_status": "operational",
            "last_forecast_update": status.get("last_update"),
            "data_freshness_hours": status.get("freshness_hours", 0),
            "active_predictors": status.get("active_predictors", 0),
            "forecast_accuracy": status.get("current_accuracy", 0.0),
            "system_health": "healthy" if status.get("health_score", 0) > 0.8 else "degraded"
        }
        
    except Exception as e:
        return {
            "service_status": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }