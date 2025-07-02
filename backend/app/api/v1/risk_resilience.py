"""
Risk & Resilience API Endpoints
Comprehensive risk management and anomaly detection for supply chain resilience
"""

from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks, status
from typing import List, Dict, Any, Optional
from datetime import date, datetime, timedelta
import pandas as pd
import numpy as np
from pydantic import BaseModel, Field

from app.schemas.risk_resilience import (
    AnomalyDetectionResponse,
    AnomalyFlag,
    BufferCoverageResponse,
    BufferCoverageItem,
    SupplierRiskResponse,
    SupplierRiskItem,
    ScenarioRequest,
    ScenarioResponse,
    RiskMetricsResponse,
    RiskAlert
)
from app.services.anomaly_detection_service import AnomalyDetectionService
from app.services.risk_analysis_service import RiskAnalysisService
from app.services.scenario_planning_service import ScenarioPlanningService

router = APIRouter(prefix="/risk", tags=["risk-resilience"])

# Initialize services
anomaly_service = AnomalyDetectionService()
risk_service = RiskAnalysisService()
scenario_service = ScenarioPlanningService()


@router.get("/anomaly-detection", response_model=AnomalyDetectionResponse)
async def get_anomaly_detection(
    days_back: int = Query(7, ge=1, le=90, description="Number of days to look back"),
    confidence_threshold: float = Query(0.7, ge=0.0, le=1.0, description="Minimum confidence threshold"),
    category_filter: Optional[List[str]] = Query(None, description="Filter by anomaly categories"),
    severity_filter: Optional[List[str]] = Query(None, description="Filter by severity levels")
) -> AnomalyDetectionResponse:
    """
    Get anomaly detection results with timeline and detailed flags
    """
    try:
        # Get anomaly detection results
        anomalies = await anomaly_service.detect_anomalies(
            start_date=date.today() - timedelta(days=days_back),
            end_date=date.today(),
            confidence_threshold=confidence_threshold,
            category_filter=category_filter,
            severity_filter=severity_filter
        )
        
        # Calculate summary metrics
        total_anomalies = len(anomalies)
        critical_count = len([a for a in anomalies if a.severity == "critical"])
        high_count = len([a for a in anomalies if a.severity == "high"])
        medium_count = len([a for a in anomalies if a.severity == "medium"])
        
        # Get confidence distribution
        confidences = [a.confidence_score for a in anomalies]
        avg_confidence = np.mean(confidences) if confidences else 0.0
        
        return AnomalyDetectionResponse(
            total_anomalies=total_anomalies,
            critical_anomalies=critical_count,
            high_anomalies=high_count,
            medium_anomalies=medium_count,
            avg_confidence_score=avg_confidence,
            anomaly_flags=anomalies,
            analysis_period_days=days_back,
            last_updated=datetime.now()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving anomaly detection data: {str(e)}"
        )


@router.get("/anomaly-detection/{anomaly_id}")
async def get_anomaly_details(
    anomaly_id: str
) -> Dict[str, Any]:
    """
    Get detailed information about a specific anomaly
    """
    try:
        details = await anomaly_service.get_anomaly_details(anomaly_id)
        if not details:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Anomaly not found"
            )
        return details
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving anomaly details: {str(e)}"
        )


@router.get("/buffer-coverage", response_model=BufferCoverageResponse)
async def get_buffer_coverage(
    sku_filter: Optional[List[str]] = Query(None, description="Filter by SKU IDs"),
    site_filter: Optional[List[str]] = Query(None, description="Filter by site codes"),
    threshold_type: str = Query("days", description="Threshold type: days, units, or percentage"),
    include_forecast: bool = Query(True, description="Include forecast-based coverage calculation")
) -> BufferCoverageResponse:
    """
    Calculate buffer coverage for SKUs with red/yellow/green thresholds
    """
    try:
        # Get buffer coverage analysis
        coverage_items = await risk_service.calculate_buffer_coverage(
            sku_filter=sku_filter,
            site_filter=site_filter,
            threshold_type=threshold_type,
            include_forecast=include_forecast
        )
        
        # Calculate summary statistics
        total_skus = len(coverage_items)
        critical_count = len([item for item in coverage_items if item.status == "critical"])
        warning_count = len([item for item in coverage_items if item.status == "warning"])
        good_count = len([item for item in coverage_items if item.status == "good"])
        
        # Calculate average coverage
        coverage_values = [item.coverage_days for item in coverage_items if item.coverage_days is not None]
        avg_coverage = np.mean(coverage_values) if coverage_values else 0.0
        
        return BufferCoverageResponse(
            total_skus=total_skus,
            critical_coverage=critical_count,
            warning_coverage=warning_count,
            good_coverage=good_count,
            avg_coverage_days=avg_coverage,
            coverage_items=coverage_items,
            analysis_date=date.today(),
            threshold_configuration={
                "critical_threshold": 7,  # days
                "warning_threshold": 14,  # days
                "good_threshold": 21     # days
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating buffer coverage: {str(e)}"
        )


@router.get("/supplier-analysis", response_model=SupplierRiskResponse)
async def get_supplier_risk_analysis(
    risk_level_filter: Optional[List[str]] = Query(None, description="Filter by risk levels"),
    include_geographic: bool = Query(True, description="Include geographic risk analysis"),
    include_financial: bool = Query(True, description="Include financial stability analysis"),
    min_risk_score: float = Query(0.0, ge=0.0, le=100.0, description="Minimum risk score threshold")
) -> SupplierRiskResponse:
    """
    Analyze single-supplier dependencies and associated risks
    """
    try:
        # Get supplier risk analysis
        risk_items = await risk_service.analyze_supplier_risks(
            risk_level_filter=risk_level_filter,
            include_geographic=include_geographic,
            include_financial=include_financial,
            min_risk_score=min_risk_score
        )
        
        # Calculate summary statistics
        total_suppliers = len(set([item.supplier_id for item in risk_items]))
        single_supplier_skus = len([item for item in risk_items if item.is_single_supplier])
        high_risk_suppliers = len([item for item in risk_items if item.risk_level == "high"])
        
        # Calculate risk distribution
        risk_scores = [item.risk_score for item in risk_items]
        avg_risk_score = np.mean(risk_scores) if risk_scores else 0.0
        
        return SupplierRiskResponse(
            total_suppliers=total_suppliers,
            single_supplier_skus=single_supplier_skus,
            high_risk_suppliers=high_risk_suppliers,
            avg_risk_score=avg_risk_score,
            risk_items=risk_items,
            analysis_date=date.today(),
            risk_methodology={
                "factors": ["geographic_concentration", "financial_stability", "delivery_performance", "quality_metrics"],
                "weighting": {"geographic": 0.3, "financial": 0.4, "delivery": 0.2, "quality": 0.1}
            }
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing supplier risks: {str(e)}"
        )


@router.post("/scenario-planning", response_model=ScenarioResponse)
async def create_scenario_analysis(
    scenario_request: ScenarioRequest,
    background_tasks: BackgroundTasks
) -> ScenarioResponse:
    """
    Create and run scenario planning analysis
    """
    try:
        # Validate scenario parameters
        if not scenario_request.parameters:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Scenario parameters are required"
            )
        
        # Create scenario analysis
        scenario_id = await scenario_service.create_scenario(scenario_request)
        
        # Start background analysis
        background_tasks.add_task(
            scenario_service.run_scenario_analysis,
            scenario_id,
            scenario_request
        )
        
        return ScenarioResponse(
            scenario_id=scenario_id,
            status="running",
            created_at=datetime.now(),
            estimated_completion=datetime.now() + timedelta(minutes=5),
            parameters=scenario_request.parameters,
            baseline_metrics=await scenario_service.get_baseline_metrics()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating scenario analysis: {str(e)}"
        )


@router.get("/scenario-planning/{scenario_id}")
async def get_scenario_results(
    scenario_id: str
) -> Dict[str, Any]:
    """
    Get results from scenario planning analysis
    """
    try:
        results = await scenario_service.get_scenario_results(scenario_id)
        if not results:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Scenario not found"
            )
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving scenario results: {str(e)}"
        )


@router.get("/metrics/overview", response_model=RiskMetricsResponse)
async def get_risk_metrics_overview() -> RiskMetricsResponse:
    """
    Get comprehensive risk metrics overview
    """
    try:
        # Get risk metrics from all services
        risk_metrics = await risk_service.get_risk_overview()
        anomaly_metrics = await anomaly_service.get_anomaly_summary()
        
        # Calculate overall risk score
        overall_risk = (
            risk_metrics.get("supplier_risk", 0) * 0.3 +
            risk_metrics.get("buffer_risk", 0) * 0.4 +
            anomaly_metrics.get("anomaly_risk", 0) * 0.3
        )
        
        return RiskMetricsResponse(
            overall_risk_score=overall_risk,
            supplier_risk=risk_metrics.get("supplier_risk", 0),
            buffer_risk=risk_metrics.get("buffer_risk", 0),
            anomaly_risk=anomaly_metrics.get("anomaly_risk", 0),
            active_alerts=await risk_service.get_active_alerts(),
            risk_trends=await risk_service.get_risk_trends(days=30),
            last_assessment=datetime.now()
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving risk metrics: {str(e)}"
        )


@router.get("/alerts")
async def get_risk_alerts(
    severity_filter: Optional[List[str]] = Query(None, description="Filter by alert severity"),
    active_only: bool = Query(True, description="Return only active alerts"),
    limit: int = Query(50, ge=1, le=200, description="Maximum number of alerts to return")
) -> List[RiskAlert]:
    """
    Get current risk alerts and warnings
    """
    try:
        alerts = await risk_service.get_risk_alerts(
            severity_filter=severity_filter,
            active_only=active_only,
            limit=limit
        )
        return alerts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving risk alerts: {str(e)}"
        )


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_risk_alert(
    alert_id: str,
    user_id: str = Query(..., description="User acknowledging the alert"),
    notes: Optional[str] = Query(None, description="Optional acknowledgment notes")
) -> Dict[str, str]:
    """
    Acknowledge a risk alert
    """
    try:
        success = await risk_service.acknowledge_alert(alert_id, user_id, notes)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Alert not found"
            )
        return {"status": "acknowledged", "alert_id": alert_id}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error acknowledging alert: {str(e)}"
        )


@router.get("/health")
async def get_risk_service_health() -> Dict[str, Any]:
    """
    Health check endpoint for risk and resilience services
    """
    try:
        # Check all service components
        anomaly_health = await anomaly_service.health_check()
        risk_health = await risk_service.health_check()
        scenario_health = await scenario_service.health_check()
        
        overall_status = "healthy"
        if not all([anomaly_health["status"] == "healthy", 
                   risk_health["status"] == "healthy",
                   scenario_health["status"] == "healthy"]):
            overall_status = "degraded"
        
        return {
            "status": overall_status,
            "timestamp": datetime.now().isoformat(),
            "services": {
                "anomaly_detection": anomaly_health,
                "risk_analysis": risk_health,
                "scenario_planning": scenario_health
            },
            "version": "1.0.0"
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e),
            "version": "1.0.0"
        }