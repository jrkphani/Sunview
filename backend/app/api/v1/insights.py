"""
Insights API endpoints
Strategic business insights from ML analysis
"""

from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional, Dict, Any
from datetime import datetime, date, timedelta
from pydantic import BaseModel, Field
from enum import Enum

router = APIRouter()

class InsightCategory(str, Enum):
    """Insight categories aligned with business strategy"""
    OPERATIONAL_EFFICIENCY = "operational_efficiency"
    STRATEGIC_PARTNERSHIP = "strategic_partnership"
    COMMERCIAL_OPPORTUNITY = "commercial_opportunity"
    RISK_RESILIENCE = "risk_resilience"

class Priority(str, Enum):
    """Insight priority levels"""
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class InsightResponse(BaseModel):
    """Response model for business insights"""
    id: str
    category: InsightCategory
    priority: Priority
    title: str
    description: str
    impact_score: float = Field(..., ge=0.0, le=10.0)
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    created_at: datetime
    data_sources: List[str]
    recommendations: List[str]
    expected_benefit: Optional[str] = None

@router.get("/", response_model=List[InsightResponse])
async def get_insights(
    categories: Optional[List[InsightCategory]] = Query(None),
    priority: Optional[Priority] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0, ge=0)
):
    """
    Get strategic business insights from ML analysis
    """
    try:
        # Demo insights based on our forecasting analysis
        demo_insights = [
            InsightResponse(
                id="insight_001",
                category=InsightCategory.OPERATIONAL_EFFICIENCY,
                priority=Priority.HIGH,
                title="Peak Volume Consolidation Opportunity",
                description="Analysis shows 23% of shipments occur during Tuesday-Thursday peak. Consolidating orders can improve truck utilization by 15%.",
                impact_score=8.5,
                confidence_score=0.92,
                created_at=datetime.now() - timedelta(hours=2),
                data_sources=["volume_forecasts", "shipment_patterns", "truck_utilization"],
                recommendations=[
                    "Implement Tuesday-Thursday consolidation strategy",
                    "Increase Tuesday capacity by 20%",
                    "Offer incentives for off-peak delivery scheduling"
                ],
                expected_benefit="$45,000/month cost reduction"
            ),
            InsightResponse(
                id="insight_002", 
                category=InsightCategory.STRATEGIC_PARTNERSHIP,
                priority=Priority.HIGH,
                title="Demand Intelligence Sharing Opportunity",
                description="SKU 108362593 shows 92% forecast accuracy. Sharing this intelligence with Signify can enable better production planning.",
                impact_score=7.8,
                confidence_score=0.89,
                created_at=datetime.now() - timedelta(hours=4),
                data_sources=["forecast_accuracy", "sku_performance", "customer_feedback"],
                recommendations=[
                    "Establish weekly demand intelligence sharing",
                    "Create joint planning sessions for high-accuracy SKUs",
                    "Develop real-time visibility dashboard for Signify"
                ],
                expected_benefit="Improved partnership value, potential contract expansion"
            ),
            InsightResponse(
                id="insight_003",
                category=InsightCategory.COMMERCIAL_OPPORTUNITY,
                priority=Priority.MEDIUM,
                title="Value-Added Services for Low-Volume SKUs",
                description="SKUs with <50 units/month show 35% higher margins but 18% lower service levels. Premium handling service opportunity identified.",
                impact_score=6.2,
                confidence_score=0.76,
                created_at=datetime.now() - timedelta(days=1),
                data_sources=["volume_analysis", "margin_data", "service_levels"],
                recommendations=[
                    "Develop premium handling service tier",
                    "Target 15% service fee for expedited processing",
                    "Pilot with top 5 low-volume, high-margin SKUs"
                ],
                expected_benefit="$12,000/month additional revenue"
            ),
            InsightResponse(
                id="insight_004",
                category=InsightCategory.RISK_RESILIENCE,
                priority=Priority.MEDIUM,
                title="Weekend Forecast Vulnerability",
                description="Weekend forecasts show 28% higher variance. Risk of stockouts for critical SKUs during Monday restocking.",
                impact_score=5.9,
                confidence_score=0.84,
                created_at=datetime.now() - timedelta(days=2),
                data_sources=["forecast_variance", "weekend_patterns", "stockout_history"],
                recommendations=[
                    "Implement Monday pre-positioning strategy",
                    "Increase safety stock for critical SKUs by 15%",
                    "Develop weekend demand sensing algorithms"
                ],
                expected_benefit="Reduced stockout risk, improved Monday performance"
            ),
            InsightResponse(
                id="insight_005",
                category=InsightCategory.OPERATIONAL_EFFICIENCY,
                priority=Priority.LOW,
                title="Route Optimization for High-Volume Corridors",
                description="Routes serving top 10 SKUs can be optimized for 8% efficiency gain through machine learning-based planning.",
                impact_score=4.3,
                confidence_score=0.72,
                created_at=datetime.now() - timedelta(days=3),
                data_sources=["route_data", "volume_corridors", "ml_optimization"],
                recommendations=[
                    "Implement ML-based route optimization",
                    "Focus on top 10 high-volume SKU routes",
                    "Measure efficiency gains over 90-day period"
                ],
                expected_benefit="8% route efficiency improvement"
            )
        ]
        
        # Apply filters
        filtered_insights = demo_insights
        
        if categories:
            filtered_insights = [i for i in filtered_insights if i.category in categories]
        
        if priority:
            filtered_insights = [i for i in filtered_insights if i.priority == priority]
        
        # Apply pagination
        paginated_insights = filtered_insights[offset:offset+limit]
        
        return paginated_insights
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve insights: {str(e)}"
        )

@router.get("/{insight_id}")
async def get_insight_detail(insight_id: str):
    """
    Get detailed view of a specific insight with explainability
    """
    try:
        # Demo detailed insight
        if insight_id == "insight_001":
            return {
                "insight": {
                    "id": insight_id,
                    "title": "Peak Volume Consolidation Opportunity",
                    "category": "operational_efficiency",
                    "priority": "high",
                    "impact_score": 8.5,
                    "confidence_score": 0.92
                },
                "detailed_analysis": {
                    "data_period": "90 days",
                    "samples_analyzed": 8703,
                    "statistical_significance": 0.99,
                    "key_findings": [
                        "Tuesday shipments: 18% above average",
                        "Wednesday shipments: 15% above average", 
                        "Thursday shipments: 12% above average",
                        "Weekend shipments: 45% below average"
                    ]
                },
                "explainability": {
                    "methodology": "Time-series clustering analysis with volume pattern recognition",
                    "confidence_factors": [
                        "Consistent pattern across 13 weeks",
                        "Statistical significance > 99%",
                        "Validated against historical truck utilization data"
                    ],
                    "limitations": [
                        "Seasonal variations not fully accounted",
                        "Customer behavior changes may affect patterns"
                    ]
                },
                "implementation_roadmap": [
                    {
                        "phase": "Phase 1 (Week 1-2)",
                        "actions": "Analyze customer willingness for delivery flexibility",
                        "resources": "1 analyst, customer survey"
                    },
                    {
                        "phase": "Phase 2 (Week 3-4)", 
                        "actions": "Pilot consolidation with top 3 customers",
                        "resources": "Operations team, system modifications"
                    },
                    {
                        "phase": "Phase 3 (Week 5-8)",
                        "actions": "Full implementation and impact measurement",
                        "resources": "Full operations team, monitoring dashboard"
                    }
                ]
            }
        
        else:
            return {
                "insight": {
                    "id": insight_id,
                    "title": "Sample Insight",
                    "category": "operational_efficiency",
                    "priority": "medium"
                },
                "detailed_analysis": {
                    "message": "Detailed analysis available for pilot insights"
                }
            }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve insight detail: {str(e)}"
        )

@router.get("/categories/summary")
async def get_insights_by_category():
    """
    Get summary of insights grouped by category
    """
    try:
        return {
            "operational_efficiency": {
                "total_insights": 8,
                "high_priority": 3,
                "avg_impact_score": 7.2,
                "key_themes": ["Consolidation", "Route optimization", "Capacity planning"]
            },
            "strategic_partnership": {
                "total_insights": 5,
                "high_priority": 2,
                "avg_impact_score": 6.8,
                "key_themes": ["Demand intelligence", "Joint planning", "Visibility"]
            },
            "commercial_opportunity": {
                "total_insights": 6,
                "high_priority": 1,
                "avg_impact_score": 5.9,
                "key_themes": ["Value-added services", "Premium tiers", "Revenue expansion"]
            },
            "risk_resilience": {
                "total_insights": 4,
                "high_priority": 1,
                "avg_impact_score": 6.1,
                "key_themes": ["Forecast variance", "Contingency planning", "Risk mitigation"]
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve category summary: {str(e)}"
        )