"""
Export API endpoints
Data export functionality for reports and analysis
"""

from fastapi import APIRouter, Query, HTTPException, Response
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from pydantic import BaseModel
import json
import csv
import io

router = APIRouter()

class ExportFormat(str):
    CSV = "csv"
    JSON = "json"
    PDF = "pdf"

class ExportRequest(BaseModel):
    """Request model for data export"""
    data_type: str  # "forecasts", "kpis", "insights"
    format: str
    date_range: Optional[Dict[str, str]] = None
    filters: Optional[Dict[str, Any]] = None
    include_metadata: bool = True

@router.post("/")
async def create_export(request: ExportRequest):
    """
    Create an export job for specified data
    """
    try:
        export_id = f"export_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Validate request
        valid_data_types = ["forecasts", "kpis", "insights", "comprehensive"]
        if request.data_type not in valid_data_types:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid data_type. Must be one of: {valid_data_types}"
            )
        
        valid_formats = ["csv", "json", "pdf"]
        if request.format not in valid_formats:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid format. Must be one of: {valid_formats}"
            )
        
        return {
            "export_id": export_id,
            "status": "created",
            "data_type": request.data_type,
            "format": request.format,
            "created_at": datetime.now().isoformat(),
            "estimated_completion": (datetime.now() + timedelta(minutes=5)).isoformat(),
            "download_url": f"/api/v1/export/{export_id}/download"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create export: {str(e)}"
        )

@router.get("/{export_id}/status")
async def get_export_status(export_id: str):
    """
    Get status of an export job
    """
    try:
        # Demo status - in production this would check actual job status
        return {
            "export_id": export_id,
            "status": "completed",
            "progress_percentage": 100,
            "created_at": (datetime.now() - timedelta(minutes=2)).isoformat(),
            "completed_at": datetime.now().isoformat(),
            "file_size_bytes": 15420,
            "record_count": 150,
            "download_url": f"/api/v1/export/{export_id}/download"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get export status: {str(e)}"
        )

@router.get("/{export_id}/download")
async def download_export(export_id: str):
    """
    Download completed export file
    """
    try:
        # Generate demo export data based on export_id
        # In production, this would retrieve the actual generated file
        
        if "forecast" in export_id.lower():
            return await generate_forecast_export()
        elif "kpi" in export_id.lower():
            return await generate_kpi_export()
        elif "insight" in export_id.lower():
            return await generate_insight_export()
        else:
            return await generate_comprehensive_export()
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download export: {str(e)}"
        )

@router.get("/forecasts/csv")
async def export_forecasts_csv(
    time_horizon: str = Query("7d", regex="^(1d|7d|14d|28d)$"),
    sku_filter: Optional[List[str]] = Query(None)
):
    """
    Direct CSV export of forecast data
    """
    try:
        # Generate CSV data
        csv_buffer = io.StringIO()
        writer = csv.writer(csv_buffer)
        
        # Write header
        writer.writerow([
            "SKU_ID", "Warehouse", "Forecast_Date", "Predicted_Value", 
            "Confidence_Lower", "Confidence_Upper", "Accuracy_Score", "Generated_At"
        ])
        
        # Write demo data
        demo_skus = sku_filter if sku_filter else ["108362593", "108294939", "108194568"]
        horizon_days = int(time_horizon.replace('d', ''))
        
        for sku in demo_skus:
            for day in range(horizon_days):
                forecast_date = (datetime.now() + timedelta(days=day+1)).date()
                predicted_value = 100 + (hash(sku) % 100)
                
                writer.writerow([
                    sku,
                    "PHILIPS",
                    forecast_date.isoformat(),
                    predicted_value,
                    predicted_value * 0.9,
                    predicted_value * 1.1,
                    0.85,
                    datetime.now().date().isoformat()
                ])
        
        csv_content = csv_buffer.getvalue()
        csv_buffer.close()
        
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=forecasts_{time_horizon}_{datetime.now().strftime('%Y%m%d')}.csv"
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export forecasts CSV: {str(e)}"
        )

@router.get("/kpis/json")
async def export_kpis_json(
    time_period: str = Query("30d", regex="^(7d|30d|90d)$")
):
    """
    Direct JSON export of KPI data
    """
    try:
        kpi_data = {
            "export_metadata": {
                "generated_at": datetime.now().isoformat(),
                "time_period": time_period,
                "data_source": "gxo_signify_pilot"
            },
            "dashboard_kpis": {
                "forecast_accuracy": 85.2,
                "truck_utilization_improvement": 12.8,
                "cost_savings_percentage": 15.3,
                "demand_prediction_accuracy": 88.5
            },
            "detailed_metrics": {
                "accuracy_metrics": {
                    "mape": 12.8,
                    "wape": 10.3,
                    "bias": -2.1,
                    "ci_coverage": 0.88
                },
                "efficiency_metrics": {
                    "truck_utilization_rate": 78.5,
                    "fill_rate": 94.2,
                    "cost_per_shipment": 145.60
                },
                "business_impact": {
                    "monthly_savings": 45000,
                    "roi_percentage": 285.7,
                    "customer_satisfaction": 4.2
                }
            },
            "trends": {
                "accuracy_trend": [
                    {"date": "2025-06-01", "value": 83.1},
                    {"date": "2025-06-15", "value": 84.8},
                    {"date": "2025-07-01", "value": 85.2}
                ],
                "utilization_trend": [
                    {"date": "2025-06-01", "value": 76.2},
                    {"date": "2025-06-15", "value": 77.8},
                    {"date": "2025-07-01", "value": 78.5}
                ]
            }
        }
        
        return Response(
            content=json.dumps(kpi_data, indent=2),
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=kpis_{time_period}_{datetime.now().strftime('%Y%m%d')}.json"
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export KPIs JSON: {str(e)}"
        )

async def generate_forecast_export():
    """Generate demo forecast export"""
    csv_data = "SKU_ID,Predicted_Value,Confidence,Date\n108362593,125.5,0.85,2025-07-02\n108294939,89.3,0.82,2025-07-02"
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=forecast_export.csv"}
    )

async def generate_kpi_export():
    """Generate demo KPI export"""
    kpi_data = {
        "forecast_accuracy": 85.2,
        "truck_utilization": 78.5,
        "cost_savings": 15.3,
        "export_date": datetime.now().isoformat()
    }
    return Response(
        content=json.dumps(kpi_data, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=kpi_export.json"}
    )

async def generate_insight_export():
    """Generate demo insight export"""
    insights_data = {
        "insights": [
            {
                "title": "Peak Volume Consolidation Opportunity",
                "impact_score": 8.5,
                "category": "operational_efficiency"
            },
            {
                "title": "Demand Intelligence Sharing Opportunity", 
                "impact_score": 7.8,
                "category": "strategic_partnership"
            }
        ],
        "export_date": datetime.now().isoformat()
    }
    return Response(
        content=json.dumps(insights_data, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=insights_export.json"}
    )

async def generate_comprehensive_export():
    """Generate comprehensive export with all data"""
    comprehensive_data = {
        "summary": {
            "export_type": "comprehensive",
            "generated_at": datetime.now().isoformat(),
            "includes": ["forecasts", "kpis", "insights"]
        },
        "forecasts": {"total_skus": 2504, "accuracy": 85.2},
        "kpis": {"truck_utilization": 78.5, "cost_savings": 15.3},
        "insights": {"total_insights": 23, "high_priority": 6}
    }
    return Response(
        content=json.dumps(comprehensive_data, indent=2),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=comprehensive_export.json"}
    )