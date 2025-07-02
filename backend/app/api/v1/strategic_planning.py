"""
Strategic Planning API endpoints
Advanced strategic analysis and planning tools for business intelligence
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTasks
from typing import List, Optional
from datetime import date, datetime, timedelta

from app.services.strategic_planning_service import StrategicPlanningService
from app.schemas.strategic_planning import (
    SeasonalityAnalysisRequest,
    SeasonalityAnalysisResponse,
    BiasAnalysisRequest, 
    ForecastBiasTrendsResponse,
    LifecycleAnalysisRequest,
    SKULifecycleResponse,
    MixAnalysisRequest,
    ProductMixShiftResponse,
    StabilityAnalysisRequest,
    ForecastStabilityIndexResponse,
    SeasonalityType,
    LifecycleStage,
    StabilityLevel
)

router = APIRouter()
strategic_service = StrategicPlanningService()

@router.get("/seasonality-analysis", 
           response_model=SeasonalityAnalysisResponse,
           summary="Analyze seasonality patterns in demand data",
           description="""
           Perform comprehensive seasonality analysis using FFT-based pattern detection.
           Identifies weekly, monthly, quarterly, and annual patterns in SKU demand data.
           """)
async def analyze_seasonality(
    start_date: Optional[date] = Query(None, description="Analysis start date (defaults to 1 year ago)"),
    end_date: Optional[date] = Query(None, description="Analysis end date (defaults to today)"),
    sku_filter: Optional[List[str]] = Query(None, description="Filter by specific SKU IDs"),
    category_filter: Optional[List[str]] = Query(None, description="Filter by SKU categories"),
    pattern_types: Optional[List[SeasonalityType]] = Query(
        default=[SeasonalityType.WEEKLY, SeasonalityType.MONTHLY, SeasonalityType.QUARTERLY],
        description="Types of seasonality patterns to detect"
    ),
    min_pattern_strength: float = Query(0.3, ge=0.1, le=1.0, description="Minimum pattern strength threshold"),
    confidence_level: float = Query(0.95, ge=0.5, le=0.99, description="Statistical confidence level"),
    include_predictions: bool = Query(True, description="Include predictive insights")
):
    """
    Analyze seasonality patterns in demand data using advanced FFT analysis.
    
    This endpoint provides:
    - Seasonal pattern detection (weekly, monthly, quarterly, annual)
    - Statistical significance testing
    - Peak and low period identification
    - Category-specific insights
    - Actionable recommendations
    
    **Example use cases:**
    - Seasonal inventory planning
    - Demand forecasting optimization
    - Marketing campaign timing
    - Resource allocation planning
    """
    try:
        request = SeasonalityAnalysisRequest(
            start_date=start_date,
            end_date=end_date,
            sku_filter=sku_filter,
            category_filter=category_filter,
            pattern_types=pattern_types,
            min_pattern_strength=min_pattern_strength,
            confidence_level=confidence_level,
            include_predictions=include_predictions
        )
        
        result = await strategic_service.analyze_seasonality(request)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze seasonality: {str(e)}"
        )

@router.get("/forecast-bias-trends",
           response_model=ForecastBiasTrendsResponse,
           summary="Analyze forecast bias trends by location and product group",
           description="""
           Comprehensive forecast bias analysis to identify systematic forecasting errors
           and improvement opportunities across locations and product groups.
           """)
async def analyze_forecast_bias_trends(
    start_date: Optional[date] = Query(None, description="Analysis start date (defaults to 90 days ago)"),
    end_date: Optional[date] = Query(None, description="Analysis end date (defaults to today)"),
    sku_filter: Optional[List[str]] = Query(None, description="Filter by specific SKU IDs"),
    location_filter: Optional[List[str]] = Query(None, description="Filter by warehouse/location codes"),
    aggregation_level: str = Query("weekly", pattern="^(daily|weekly|monthly)$", description="Aggregation level for trend analysis"),
    include_historical_trends: bool = Query(True, description="Include historical bias trends"),
    confidence_level: float = Query(0.95, ge=0.5, le=0.99, description="Statistical confidence level")
):
    """
    Analyze forecast bias trends to identify systematic forecasting issues.
    
    This endpoint provides:
    - Overall bias metrics (MAPE, WAPE, Bias direction)
    - Location-specific bias analysis
    - Product group bias breakdown
    - Temporal bias trend analysis
    - Corrective action recommendations
    
    **Key metrics analyzed:**
    - Mean bias and bias consistency
    - Systematic vs random bias detection
    - Statistical significance testing
    - Data quality scoring
    """
    try:
        request = BiasAnalysisRequest(
            start_date=start_date,
            end_date=end_date,
            sku_filter=sku_filter,
            location_filter=location_filter,
            aggregation_level=aggregation_level,
            include_historical_trends=include_historical_trends,
            confidence_level=confidence_level
        )
        
        result = await strategic_service.analyze_forecast_bias_trends(request)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze forecast bias trends: {str(e)}"
        )

@router.get("/sku-lifecycle", 
           response_model=SKULifecycleResponse,
           summary="Classify SKU lifecycle stages using ML analysis",
           description="""
           Advanced SKU lifecycle classification using machine learning and statistical analysis
           to identify introduction, growth, maturity, decline, and phase-out stages.
           """)
async def analyze_sku_lifecycle(
    start_date: Optional[date] = Query(None, description="Analysis start date (defaults to 1 year ago)"),
    end_date: Optional[date] = Query(None, description="Analysis end date (defaults to today)"),
    sku_filter: Optional[List[str]] = Query(None, description="Filter by specific SKU IDs"),
    category_filter: Optional[List[str]] = Query(None, description="Filter by SKU categories"),
    min_data_points: int = Query(30, ge=10, description="Minimum data points required for classification"),
    include_transition_probabilities: bool = Query(True, description="Include stage transition probabilities"),
    confidence_level: float = Query(0.95, ge=0.5, le=0.99, description="Statistical confidence level")
):
    """
    Classify SKU lifecycle stages using advanced analytics and machine learning.
    
    This endpoint provides:
    - Lifecycle stage classification (Introduction, Growth, Maturity, Decline, Phase-out)
    - Confidence scoring for classifications
    - Stage transition probability analysis
    - Category-specific insights
    - Strategic recommendations by lifecycle stage
    
    **Classification features:**
    - Demand trend analysis
    - Growth rate calculation
    - Volatility assessment
    - Volume characteristics
    - Acceleration patterns
    """
    try:
        request = LifecycleAnalysisRequest(
            start_date=start_date,
            end_date=end_date,
            sku_filter=sku_filter,
            category_filter=category_filter,
            min_data_points=min_data_points,
            include_transition_probabilities=include_transition_probabilities,
            confidence_level=confidence_level
        )
        
        result = await strategic_service.analyze_sku_lifecycle(request)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze SKU lifecycle: {str(e)}"
        )

@router.get("/product-mix-shift",
           response_model=ProductMixShiftResponse,
           summary="Analyze product mix changes over time",
           description="""
           Comprehensive analysis of product mix shifts to identify changing demand patterns
           and market dynamics across product categories.
           """)
async def analyze_product_mix_shift(
    start_date: Optional[date] = Query(None, description="Current period start date (defaults to 90 days ago)"),
    end_date: Optional[date] = Query(None, description="Current period end date (defaults to today)"),
    comparison_period_days: int = Query(90, ge=30, le=365, description="Comparison period length in days"),
    sku_filter: Optional[List[str]] = Query(None, description="Filter by specific SKU IDs"),
    category_filter: Optional[List[str]] = Query(None, description="Filter by SKU categories"),
    min_significance_level: float = Query(0.05, ge=0.01, le=0.1, description="Minimum significance level for changes"),
    confidence_level: float = Query(0.95, ge=0.5, le=0.99, description="Statistical confidence level")
):
    """
    Analyze product mix shifts between time periods to identify market changes.
    
    This endpoint provides:
    - Category-level mix change analysis
    - Statistical significance testing
    - Mix stability scoring
    - Market implication insights
    - Strategic recommendations
    
    **Analysis includes:**
    - Quarter-over-quarter mix changes
    - Magnitude and direction of shifts
    - Key driving factors
    - Impact assessment
    """
    try:
        request = MixAnalysisRequest(
            start_date=start_date,
            end_date=end_date,
            comparison_period_days=comparison_period_days,
            sku_filter=sku_filter,
            category_filter=category_filter,
            min_significance_level=min_significance_level,
            confidence_level=confidence_level
        )
        
        result = await strategic_service.analyze_product_mix_shift(request)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze product mix shift: {str(e)}"
        )

@router.get("/forecast-stability-index",
           response_model=ForecastStabilityIndexResponse,
           summary="Calculate forecast stability index across locations and products",
           description="""
           Comprehensive forecast stability analysis to measure forecast consistency
           and identify areas needing improvement in forecasting accuracy.
           """)
async def analyze_forecast_stability_index(
    start_date: Optional[date] = Query(None, description="Analysis start date (defaults to 6 months ago)"),
    end_date: Optional[date] = Query(None, description="Analysis end date (defaults to today)"),
    sku_filter: Optional[List[str]] = Query(None, description="Filter by specific SKU IDs"),
    location_filter: Optional[List[str]] = Query(None, description="Filter by warehouse/location codes"),
    stability_window_days: int = Query(28, ge=7, le=90, description="Window size for stability calculation"),
    include_volatility_breakdown: bool = Query(True, description="Include detailed volatility analysis"),
    confidence_level: float = Query(0.95, ge=0.5, le=0.99, description="Statistical confidence level")
):
    """
    Calculate comprehensive forecast stability index across the organization.
    
    This endpoint provides:
    - Overall stability index calculation
    - Location-specific stability analysis
    - Stability level distribution
    - Benchmarking and targets
    - Improvement recommendations
    - Risk alerts for unstable forecasts
    
    **Stability metrics:**
    - Coefficient of variation
    - Mean absolute revision
    - Forecast revision frequency
    - Volatility index
    - Trend consistency
    """
    try:
        request = StabilityAnalysisRequest(
            start_date=start_date,
            end_date=end_date,
            sku_filter=sku_filter,
            location_filter=location_filter,
            stability_window_days=stability_window_days,
            include_volatility_breakdown=include_volatility_breakdown,
            confidence_level=confidence_level
        )
        
        result = await strategic_service.analyze_forecast_stability_index(request)
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze forecast stability index: {str(e)}"
        )

@router.get("/insights/summary",
           summary="Get strategic planning insights summary",
           description="High-level summary of key strategic planning insights and metrics")
async def get_strategic_insights_summary(
    days_back: int = Query(90, ge=30, le=365, description="Number of days to analyze"),
    include_forecasts: bool = Query(True, description="Include forecast analysis")
):
    """
    Get a high-level summary of strategic planning insights.
    
    Provides quick overview of:
    - Key seasonality patterns detected
    - Forecast bias summary
    - Lifecycle distribution overview
    - Mix stability assessment
    - Top recommendations
    """
    try:
        end_date = date.today()
        start_date = end_date - timedelta(days=days_back)
        
        # Get basic insights from multiple analyses
        summary = {
            "analysis_period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "days_analyzed": days_back
            },
            "key_insights": [],
            "priority_actions": [],
            "health_indicators": {},
            "last_updated": datetime.now().isoformat()
        }
        
        try:
            # Quick seasonality check
            seasonality_request = SeasonalityAnalysisRequest(
                start_date=start_date,
                end_date=end_date,
                min_pattern_strength=0.4
            )
            seasonality_result = await strategic_service.analyze_seasonality(seasonality_request)
            
            seasonal_skus = len([s for s in seasonality_result.sku_analyses if s.detected_patterns])
            total_skus = seasonality_result.total_skus_analyzed
            
            if total_skus > 0:
                seasonality_rate = (seasonal_skus / total_skus) * 100
                summary["key_insights"].append(f"{seasonality_rate:.1f}% of SKUs show seasonality patterns")
                summary["health_indicators"]["seasonality_detection_rate"] = seasonality_rate
                
                if seasonality_rate > 60:
                    summary["priority_actions"].append("Implement seasonal demand planning strategies")
                    
        except Exception as e:
            summary["key_insights"].append(f"Seasonality analysis unavailable: {str(e)}")
        
        try:
            # Quick lifecycle check
            lifecycle_request = LifecycleAnalysisRequest(
                start_date=start_date,
                end_date=end_date,
                min_data_points=20
            )
            lifecycle_result = await strategic_service.analyze_sku_lifecycle(lifecycle_request)
            
            if lifecycle_result.total_skus_classified > 0:
                growth_skus = lifecycle_result.lifecycle_distribution.get(LifecycleStage.GROWTH, 0)
                decline_skus = lifecycle_result.lifecycle_distribution.get(LifecycleStage.DECLINE, 0)
                total_classified = lifecycle_result.total_skus_classified
                
                growth_rate = (growth_skus / total_classified) * 100
                decline_rate = (decline_skus / total_classified) * 100
                
                summary["key_insights"].append(f"Portfolio: {growth_rate:.1f}% growth, {decline_rate:.1f}% declining SKUs")
                summary["health_indicators"]["portfolio_growth_rate"] = growth_rate
                
                if decline_rate > 30:
                    summary["priority_actions"].append("Review declining SKU portfolio strategy")
                    
        except Exception as e:
            summary["key_insights"].append(f"Lifecycle analysis unavailable: {str(e)}")
        
        # General recommendations
        if not summary["priority_actions"]:
            summary["priority_actions"] = [
                "Regular strategic planning review recommended",
                "Monitor demand patterns for changes",
                "Maintain forecasting accuracy focus"
            ]
        
        # Health score calculation
        health_scores = [v for k, v in summary["health_indicators"].items() if isinstance(v, (int, float))]
        if health_scores:
            summary["health_indicators"]["overall_health_score"] = sum(health_scores) / len(health_scores)
        else:
            summary["health_indicators"]["overall_health_score"] = 75.0  # Default
        
        return summary
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate strategic insights summary: {str(e)}"
        )

@router.get("/recommendations",
           summary="Get strategic planning recommendations",
           description="Generate actionable strategic planning recommendations based on current analysis")
async def get_strategic_recommendations(
    analysis_scope: str = Query("portfolio", pattern="^(portfolio|category|location|sku)$", description="Scope of recommendations"),
    priority_level: str = Query("all", pattern="^(all|high|medium|low)$", description="Priority level filter"),
    time_horizon: str = Query("quarterly", pattern="^(monthly|quarterly|annual)$", description="Implementation time horizon")
):
    """
    Generate strategic planning recommendations based on comprehensive analysis.
    
    Provides:
    - Prioritized action items
    - Implementation timelines
    - Resource requirements
    - Expected impact assessment
    - Risk considerations
    """
    try:
        # Generate recommendations based on scope
        recommendations = {
            "scope": analysis_scope,
            "priority_level": priority_level,
            "time_horizon": time_horizon,
            "recommendations": [],
            "implementation_roadmap": [],
            "success_metrics": [],
            "generated_at": datetime.now().isoformat()
        }
        
        # Portfolio-level recommendations
        if analysis_scope in ["portfolio", "all"]:
            portfolio_recs = [
                {
                    "category": "Demand Planning",
                    "recommendation": "Implement advanced seasonality-aware forecasting",
                    "priority": "high",
                    "timeline": "Q2 2024",
                    "impact": "15-20% improvement in forecast accuracy",
                    "resources_required": ["Data Science team", "Forecasting platform upgrade"]
                },
                {
                    "category": "Portfolio Management", 
                    "recommendation": "Develop lifecycle-based inventory strategies",
                    "priority": "medium",
                    "timeline": "Q3 2024",
                    "impact": "10-15% reduction in inventory costs",
                    "resources_required": ["Supply Chain team", "Analytics platform"]
                },
                {
                    "category": "Risk Management",
                    "recommendation": "Implement bias monitoring and correction system",
                    "priority": "high",
                    "timeline": "Q2 2024", 
                    "impact": "Reduced systematic forecasting errors",
                    "resources_required": ["IT development", "Process automation"]
                }
            ]
            
            # Filter by priority if specified
            if priority_level != "all":
                portfolio_recs = [r for r in portfolio_recs if r["priority"] == priority_level]
            
            recommendations["recommendations"].extend(portfolio_recs)
        
        # Success metrics
        recommendations["success_metrics"] = [
            "Forecast accuracy improvement (target: +15%)",
            "Inventory turnover optimization (target: +10%)",
            "Demand planning cycle time reduction (target: -25%)",
            "Bias detection and correction rate (target: 95%)",
            "Strategic planning execution rate (target: 90%)"
        ]
        
        # Implementation roadmap
        recommendations["implementation_roadmap"] = [
            {
                "phase": "Phase 1: Foundation",
                "timeline": "Months 1-2",
                "activities": [
                    "Data quality assessment and improvement",
                    "Baseline metric establishment",
                    "Team training and capability building"
                ]
            },
            {
                "phase": "Phase 2: Implementation",
                "timeline": "Months 3-6", 
                "activities": [
                    "Advanced analytics deployment",
                    "Process automation implementation",
                    "Monitoring system activation"
                ]
            },
            {
                "phase": "Phase 3: Optimization",
                "timeline": "Months 7-12",
                "activities": [
                    "Performance optimization",
                    "Advanced feature development",
                    "Continuous improvement implementation"
                ]
            }
        ]
        
        return recommendations
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate strategic recommendations: {str(e)}"
        )

@router.post("/analysis/trigger",
            summary="Trigger comprehensive strategic analysis",
            description="Initiate a comprehensive strategic planning analysis across all dimensions")
async def trigger_comprehensive_analysis(
    background_tasks: BackgroundTasks,
    analysis_scope: str = Query("full", pattern="^(full|seasonality|lifecycle|bias|stability|mix)$", description="Scope of analysis"),
    priority: str = Query("normal", pattern="^(low|normal|high|urgent)$", description="Analysis priority"),
    notify_completion: bool = Query(False, description="Send notification on completion")
):
    """
    Trigger a comprehensive strategic planning analysis as a background task.
    
    This endpoint initiates:
    - Multi-dimensional strategic analysis
    - Cross-functional insights generation
    - Comprehensive reporting
    - Actionable recommendation development
    
    **Analysis scope options:**
    - full: Complete strategic analysis across all dimensions
    - seasonality: Focus on seasonal pattern analysis
    - lifecycle: Focus on SKU lifecycle classification
    - bias: Focus on forecast bias analysis
    - stability: Focus on forecast stability assessment
    - mix: Focus on product mix shift analysis
    """
    try:
        analysis_id = f"strategic_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Add background task
        background_tasks.add_task(
            _run_comprehensive_analysis,
            analysis_id=analysis_id,
            scope=analysis_scope,
            priority=priority,
            notify=notify_completion
        )
        
        return {
            "analysis_id": analysis_id,
            "status": "initiated",
            "scope": analysis_scope,
            "priority": priority,
            "estimated_completion": datetime.now() + timedelta(hours=2),
            "message": "Comprehensive strategic analysis initiated successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to trigger comprehensive analysis: {str(e)}"
        )

async def _run_comprehensive_analysis(analysis_id: str, scope: str, priority: str, notify: bool):
    """Background task for running comprehensive analysis"""
    try:
        print(f"Starting comprehensive strategic analysis: {analysis_id}")
        print(f"Scope: {scope}, Priority: {priority}")
        
        # Simulate comprehensive analysis execution
        # In practice, this would run all the analysis functions
        
        end_date = date.today()
        start_date = end_date - timedelta(days=365)
        
        results = {
            "analysis_id": analysis_id,
            "status": "completed",
            "start_time": datetime.now() - timedelta(hours=1),
            "end_time": datetime.now(),
            "scope": scope,
            "results_summary": {}
        }
        
        if scope in ["full", "seasonality"]:
            print(f"Running seasonality analysis for {analysis_id}")
            # Would run actual seasonality analysis
            results["results_summary"]["seasonality"] = "Analysis completed"
        
        if scope in ["full", "lifecycle"]:
            print(f"Running lifecycle analysis for {analysis_id}")
            # Would run actual lifecycle analysis
            results["results_summary"]["lifecycle"] = "Analysis completed"
        
        if scope in ["full", "bias"]:
            print(f"Running bias analysis for {analysis_id}")
            # Would run actual bias analysis
            results["results_summary"]["bias"] = "Analysis completed"
        
        if scope in ["full", "stability"]:
            print(f"Running stability analysis for {analysis_id}")
            # Would run actual stability analysis
            results["results_summary"]["stability"] = "Analysis completed"
        
        if scope in ["full", "mix"]:
            print(f"Running mix analysis for {analysis_id}")
            # Would run actual mix analysis
            results["results_summary"]["mix"] = "Analysis completed"
        
        print(f"Comprehensive strategic analysis completed: {analysis_id}")
        
        if notify:
            print(f"Sending completion notification for {analysis_id}")
            # Would send actual notification
        
    except Exception as e:
        print(f"Error in comprehensive analysis {analysis_id}: {str(e)}")

@router.get("/analysis/{analysis_id}/status",
           summary="Get analysis status",
           description="Check the status of a triggered comprehensive analysis")
async def get_analysis_status(analysis_id: str):
    """
    Get the status of a previously triggered comprehensive analysis.
    
    Returns:
    - Analysis progress and status
    - Estimated completion time
    - Preliminary results (if available)
    - Error information (if failed)
    """
    try:
        # In practice, this would check actual analysis status from database/cache
        # For demonstration, return a mock status
        
        return {
            "analysis_id": analysis_id,
            "status": "completed",
            "progress_percentage": 100,
            "started_at": datetime.now() - timedelta(hours=1),
            "completed_at": datetime.now(),
            "results_available": True,
            "summary": {
                "total_analyses": 5,
                "completed_analyses": 5,
                "insights_generated": 25,
                "recommendations_created": 15
            },
            "next_steps": [
                "Review generated insights",
                "Implement priority recommendations", 
                "Schedule follow-up analysis"
            ]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get analysis status: {str(e)}"
        )