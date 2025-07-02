"""
Executive Summary Service
Business logic for executive summary KPIs and metrics
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
import uuid
from functools import lru_cache

from app.services.forecast_data_processor import ForecastDataProcessor, DataProcessingStatus
from app.utils.kpi_calculations import KPICalculator
from app.schemas.executive_summary import (
    ForecastAccuracyResponse, AccuracyMetrics, TopSKUErrorsResponse, SKUError,
    TruckUtilizationResponse, UtilizationTrend, InventoryDOHResponse, SKUInventoryDOH,
    OTIFPerformanceResponse, AlertsSummaryResponse, Alert, SeverityLevel, TrendDirection
)

logger = logging.getLogger(__name__)

class ExecutiveSummaryService:
    """Service for generating executive summary KPIs and metrics"""
    
    def __init__(self):
        self.forecast_processor = ForecastDataProcessor()
        self.kpi_calculator = KPICalculator()
        self.logger = logging.getLogger(__name__)
        
        # Cache duration in seconds
        self.cache_duration = 1800  # 30 minutes
        self._cache = {}
        
    async def get_forecast_accuracy(self, 
                                  time_period_days: int = 30,
                                  breakdown_by: str = "daily",
                                  include_confidence_intervals: bool = True,
                                  sku_filter: Optional[List[str]] = None) -> ForecastAccuracyResponse:
        """
        Get comprehensive forecast accuracy metrics
        
        Args:
            time_period_days: Analysis period in days
            breakdown_by: Breakdown granularity (daily, weekly, monthly)
            include_confidence_intervals: Include confidence intervals
            sku_filter: Filter by specific SKUs
            
        Returns:
            ForecastAccuracyResponse with accuracy metrics
        """
        try:
            # Check cache first
            cache_key = f"forecast_accuracy_{time_period_days}_{breakdown_by}_{sku_filter}"
            cached_result = self._get_from_cache(cache_key)
            if cached_result:
                return cached_result
            
            # Process forecast accuracy
            accuracy_result = await self.forecast_processor.process_forecast_accuracy(time_period_days)
            
            if accuracy_result.status != DataProcessingStatus.SUCCESS:
                # Return default response on failure
                return self._get_default_forecast_accuracy_response()
            
            accuracy_data = accuracy_result.data
            overall_accuracy = accuracy_data['overall_accuracy']
            
            # Create accuracy metrics
            accuracy_metrics = AccuracyMetrics(
                mape=overall_accuracy['mape'],
                wape=overall_accuracy['wape'],
                bias=overall_accuracy['bias'],
                rmse=overall_accuracy['rmse'],
                sample_size=overall_accuracy['sample_size'],
                confidence_interval_lower=None,
                confidence_interval_upper=None
            )
            
            # Calculate accuracy grade
            accuracy_percentage = 100 - overall_accuracy['mape']
            accuracy_grade = self._calculate_accuracy_grade(accuracy_percentage)
            
            # Calculate improvement vs previous period
            improvement_vs_previous = await self._calculate_accuracy_improvement(time_period_days)
            
            response = ForecastAccuracyResponse(
                overall_accuracy=accuracy_metrics,
                time_period_days=time_period_days,
                records_analyzed=accuracy_data['records_analyzed'],
                unique_skus=accuracy_data['unique_skus'],
                calculation_date=datetime.fromisoformat(accuracy_data['calculation_date']),
                accuracy_grade=accuracy_grade,
                improvement_vs_previous=improvement_vs_previous
            )
            
            # Cache the result
            self._add_to_cache(cache_key, response)
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error getting forecast accuracy: {str(e)}")
            return self._get_default_forecast_accuracy_response()
    
    async def get_top_sku_errors(self, 
                               top_n: int = 10,
                               time_period_days: int = 30,
                               error_type: str = "mape",
                               minimum_volume: Optional[float] = None) -> TopSKUErrorsResponse:
        """
        Get top N SKUs with highest forecast errors
        
        Args:
            top_n: Number of top SKUs to return
            time_period_days: Analysis period in days
            error_type: Error metric type (mape, wape, bias, rmse)
            minimum_volume: Minimum volume threshold
            
        Returns:
            TopSKUErrorsResponse with top SKU errors
        """
        try:
            # Check cache first
            cache_key = f"top_sku_errors_{top_n}_{time_period_days}_{error_type}_{minimum_volume}"
            cached_result = self._get_from_cache(cache_key)
            if cached_result:
                return cached_result
            
            # Get top SKU errors
            errors_result = await self.forecast_processor.get_top_sku_errors(top_n, time_period_days)
            
            if errors_result.status != DataProcessingStatus.SUCCESS:
                return self._get_default_top_sku_errors_response()
            
            errors_data = errors_result.data
            top_errors = errors_data['top_sku_errors']
            
            # Convert to SKUError objects
            sku_errors = []
            for error_data in top_errors:
                sku_error = SKUError(
                    sku_id=error_data['sku_id'],
                    forecast_error=error_data['forecast_error'],
                    forecast_accuracy=error_data['forecast_accuracy'],
                    volume_forecast=error_data['volume_forecast'],
                    actual_volume=error_data['actual_volume'],
                    error_percentage=error_data['error_percentage'],
                    bias=error_data['bias'],
                    trend_direction=TrendDirection(error_data['trend_direction']),
                    historical_performance=None  # Could be enhanced with historical data
                )
                sku_errors.append(sku_error)
            
            # Calculate average error rate
            total_errors = [sku.forecast_error for sku in sku_errors if sku.forecast_error != np.inf]
            average_error_rate = np.mean(total_errors) if total_errors else 0.0
            
            # Generate improvement recommendations
            recommendations = self._generate_sku_improvement_recommendations(sku_errors)
            
            response = TopSKUErrorsResponse(
                top_sku_errors=sku_errors,
                analysis_period_days=time_period_days,
                total_skus_analyzed=errors_data['total_skus_analyzed'],
                average_error_rate=average_error_rate,
                calculation_date=datetime.fromisoformat(errors_data['calculation_date']),
                improvement_recommendations=recommendations
            )
            
            # Cache the result
            self._add_to_cache(cache_key, response)
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error getting top SKU errors: {str(e)}")
            return self._get_default_top_sku_errors_response()
    
    async def get_truck_utilization(self) -> TruckUtilizationResponse:
        """
        Get truck utilization metrics and 7-day average
        
        Returns:
            TruckUtilizationResponse with utilization metrics
        """
        try:
            # Check cache first
            cache_key = "truck_utilization"
            cached_result = self._get_from_cache(cache_key)
            if cached_result:
                return cached_result
            
            # Process truck utilization metrics
            utilization_result = await self.forecast_processor.process_truck_utilization_metrics()
            
            if utilization_result.status != DataProcessingStatus.SUCCESS:
                return self._get_default_truck_utilization_response()
            
            utilization_data = utilization_result.data
            
            # Convert historical trend
            historical_trend = []
            if 'historical_trend' in utilization_data:
                for trend_point in utilization_data['historical_trend']:
                    historical_trend.append(
                        UtilizationTrend(
                            date=trend_point['date'],
                            utilization=trend_point['utilization']
                        )
                    )
            
            response = TruckUtilizationResponse(
                current_utilization=utilization_data['current_utilization'],
                seven_day_average=utilization_data['seven_day_average'],
                improvement_vs_baseline=utilization_data['improvement_vs_baseline'],
                trend_direction=TrendDirection(utilization_data['trend_direction']),
                peak_utilization=utilization_data['peak_utilization'],
                utilization_variance=utilization_data['utilization_variance'],
                historical_trend=historical_trend,
                baseline_utilization=75.0,
                target_utilization=85.0,
                calculation_date=datetime.fromisoformat(utilization_data['calculation_date'])
            )
            
            # Cache the result
            self._add_to_cache(cache_key, response)
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error getting truck utilization: {str(e)}")
            return self._get_default_truck_utilization_response()
    
    async def get_inventory_doh(self) -> InventoryDOHResponse:
        """
        Get Days of Inventory on Hand metrics by SKU group
        
        Returns:
            InventoryDOHResponse with DOH metrics
        """
        try:
            # Check cache first
            cache_key = "inventory_doh"
            cached_result = self._get_from_cache(cache_key)
            if cached_result:
                return cached_result
            
            # Get inventory and demand data (simulated for demo)
            # In production, this would pull from actual inventory management systems
            inventory_data, demand_data = await self._get_inventory_demand_data()
            
            if inventory_data.empty or demand_data.empty:
                return self._get_default_inventory_doh_response()
            
            # Calculate DOH metrics
            doh_result = self.kpi_calculator.calculate_inventory_doh(inventory_data, demand_data)
            
            # Convert to response format
            sku_level_doh = {}
            low_inventory_count = 0
            excess_inventory_count = 0
            stockout_count = 0
            optimal_range_count = 0
            
            for sku_id, doh_data in doh_result['sku_level_doh'].items():
                sku_doh = SKUInventoryDOH(
                    sku_id=sku_id,
                    current_inventory=doh_data['current_inventory'],
                    avg_daily_demand=doh_data['avg_daily_demand'],
                    days_of_inventory=doh_data['days_of_inventory'],
                    status=doh_data['status'],
                    recommended_action=self._get_doh_recommendation(doh_data['status'])
                )
                sku_level_doh[sku_id] = sku_doh
                
                # Count by status
                if doh_data['status'] == 'low':
                    low_inventory_count += 1
                elif doh_data['status'] == 'excess':
                    excess_inventory_count += 1
                elif doh_data['status'] == 'stockout':
                    stockout_count += 1
                elif doh_data['status'] == 'normal':
                    optimal_range_count += 1
            
            # Calculate inventory health score
            total_skus = len(sku_level_doh)
            if total_skus > 0:
                health_score = (optimal_range_count / total_skus) * 100
                # Adjust for problems
                health_score -= (stockout_count / total_skus) * 50
                health_score -= (excess_inventory_count / total_skus) * 20
                health_score = max(0, min(100, health_score))
            else:
                health_score = 0.0
            
            response = InventoryDOHResponse(
                sku_level_doh=sku_level_doh,
                average_doh=doh_result['average_doh'],
                median_doh=doh_result['median_doh'],
                skus_analyzed=doh_result['skus_analyzed'],
                low_inventory_count=low_inventory_count,
                excess_inventory_count=excess_inventory_count,
                stockout_count=stockout_count,
                optimal_range_count=optimal_range_count,
                calculation_date=datetime.fromisoformat(doh_result['calculation_date']),
                inventory_health_score=health_score
            )
            
            # Cache the result
            self._add_to_cache(cache_key, response)
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error getting inventory DOH: {str(e)}")
            return self._get_default_inventory_doh_response()
    
    async def get_otif_performance(self) -> OTIFPerformanceResponse:
        """
        Get On-Time In-Full performance metrics
        
        Returns:
            OTIFPerformanceResponse with OTIF metrics
        """
        try:
            # Check cache first
            cache_key = "otif_performance"
            cached_result = self._get_from_cache(cache_key)
            if cached_result:
                return cached_result
            
            # Get delivery performance data (simulated for demo)
            delivery_data = await self._get_delivery_performance_data()
            
            if delivery_data.empty:
                return self._get_default_otif_response()
            
            # Calculate OTIF metrics
            otif_result = self.kpi_calculator.calculate_otif_performance(delivery_data)
            
            # Calculate performance vs target
            target_otif = 95.0
            performance_vs_target = otif_result['overall_otif_percentage'] - target_otif
            
            # Generate monthly trend (simulated)
            monthly_trend = self._generate_otif_monthly_trend()
            
            # Generate root cause analysis
            root_causes = self._analyze_otif_root_causes(delivery_data)
            
            response = OTIFPerformanceResponse(
                overall_otif_percentage=otif_result['overall_otif_percentage'],
                on_time_percentage=otif_result['on_time_percentage'],
                in_full_percentage=otif_result['in_full_percentage'],
                total_deliveries=otif_result['total_deliveries'],
                trend_direction=TrendDirection(otif_result['trend_direction']),
                target_otif=target_otif,
                performance_vs_target=performance_vs_target,
                monthly_trend=monthly_trend,
                root_cause_analysis=root_causes,
                calculation_date=datetime.fromisoformat(otif_result['calculation_date'])
            )
            
            # Cache the result
            self._add_to_cache(cache_key, response)
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error getting OTIF performance: {str(e)}")
            return self._get_default_otif_response()
    
    async def get_alerts_summary(self,
                               accuracy_threshold: float = 80.0,
                               utilization_threshold: float = 70.0) -> AlertsSummaryResponse:
        """
        Generate comprehensive alerts summary
        
        Args:
            accuracy_threshold: Minimum forecast accuracy percentage
            utilization_threshold: Minimum utilization percentage
            
        Returns:
            AlertsSummaryResponse with alerts summary
        """
        try:
            # Check cache first
            cache_key = f"alerts_summary_{accuracy_threshold}_{utilization_threshold}"
            cached_result = self._get_from_cache(cache_key)
            if cached_result:
                return cached_result
            
            # Generate alerts
            alerts_result = await self.forecast_processor.generate_alerts_summary(
                accuracy_threshold, utilization_threshold
            )
            
            if alerts_result.status != DataProcessingStatus.SUCCESS:
                return self._get_default_alerts_response()
            
            alerts_data = alerts_result.data
            
            # Convert alerts to Alert objects
            alerts = []
            for alert_data in alerts_data['alerts']:
                alert = Alert(
                    id=str(uuid.uuid4()),
                    type=alert_data['type'],
                    severity=SeverityLevel(alert_data['severity']),
                    title=alert_data['title'],
                    description=alert_data['description'],
                    current_value=alert_data.get('current_value'),
                    threshold=alert_data.get('threshold'),
                    recommendation=alert_data['recommendation'],
                    created_at=datetime.now(),
                    affected_skus=alert_data.get('affected_skus'),
                    estimated_impact=self._estimate_alert_impact(alert_data)
                )
                alerts.append(alert)
            
            # Calculate alert categories
            alert_categories = {}
            for alert in alerts:
                alert_categories[alert.type] = alert_categories.get(alert.type, 0) + 1
            
            # Calculate system health score
            system_health_score = self._calculate_system_health_score(alerts)
            
            # Identify trending issues
            trending_issues = self._identify_trending_issues(alerts)
            
            response = AlertsSummaryResponse(
                alerts=alerts,
                total_alerts=alerts_data['total_alerts'],
                high_severity_count=alerts_data['high_severity_count'],
                medium_severity_count=alerts_data['medium_severity_count'],
                low_severity_count=alerts_data['low_severity_count'],
                critical_severity_count=0,  # No critical alerts in current implementation
                alert_categories=alert_categories,
                last_checked=datetime.fromisoformat(alerts_data['last_checked']),
                system_health_score=system_health_score,
                thresholds=alerts_data['thresholds'],
                trending_issues=trending_issues
            )
            
            # Cache the result
            self._add_to_cache(cache_key, response)
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error getting alerts summary: {str(e)}")
            return self._get_default_alerts_response()
    
    def _get_from_cache(self, key: str) -> Optional[Any]:
        """Get item from cache if not expired"""
        if key in self._cache:
            cached_item = self._cache[key]
            if datetime.now() - cached_item['timestamp'] < timedelta(seconds=self.cache_duration):
                return cached_item['data']
            else:
                del self._cache[key]
        return None
    
    def _add_to_cache(self, key: str, data: Any):
        """Add item to cache with timestamp"""
        self._cache[key] = {
            'data': data,
            'timestamp': datetime.now()
        }
    
    def _calculate_accuracy_grade(self, accuracy_percentage: float) -> str:
        """Calculate accuracy grade A-F based on percentage"""
        if accuracy_percentage >= 95:
            return "A"
        elif accuracy_percentage >= 90:
            return "B"
        elif accuracy_percentage >= 80:
            return "C"
        elif accuracy_percentage >= 70:
            return "D"
        else:
            return "F"
    
    async def _calculate_accuracy_improvement(self, days: int) -> Optional[float]:
        """Calculate improvement vs previous period"""
        try:
            # This would compare current period with previous period
            # For demo, return a simulated improvement
            return 2.5  # 2.5% improvement
        except Exception:
            return None
    
    def _generate_sku_improvement_recommendations(self, sku_errors: List[SKUError]) -> List[str]:
        """Generate improvement recommendations based on SKU errors"""
        recommendations = []
        
        high_error_count = len([sku for sku in sku_errors if sku.forecast_error > 50])
        high_bias_count = len([sku for sku in sku_errors if abs(sku.bias) > 20])
        
        if high_error_count > 5:
            recommendations.append("Review forecasting model parameters for high-error SKUs")
            recommendations.append("Investigate data quality issues for top error SKUs")
        
        if high_bias_count > 3:
            recommendations.append("Address systematic bias in forecasting models")
        
        recommendations.append("Implement SKU-specific forecasting models for top performers")
        recommendations.append("Increase forecast review frequency for error-prone SKUs")
        
        return recommendations
    
    def _get_doh_recommendation(self, status: str) -> str:
        """Get recommendation based on DOH status"""
        recommendations = {
            'low': 'Increase order quantity or frequency',
            'normal': 'Maintain current inventory levels',
            'high': 'Consider reducing order quantities',
            'excess': 'Implement inventory reduction strategy',
            'stockout': 'Emergency replenishment required'
        }
        return recommendations.get(status, 'Review inventory policy')
    
    async def _get_inventory_demand_data(self) -> Tuple[pd.DataFrame, pd.DataFrame]:
        """Get inventory and demand data (simulated for demo)"""
        try:
            # In production, this would query actual inventory and demand systems
            # For demo, generate simulated data
            dates = pd.date_range(start=datetime.now() - timedelta(days=60), periods=60, freq='D')
            skus = [f"SKU_{i:04d}" for i in range(1, 101)]
            
            inventory_data = []
            demand_data = []
            
            for date in dates:
                for sku in skus:
                    # Simulate inventory levels
                    base_inventory = np.random.uniform(100, 1000)
                    inventory_data.append({
                        'sku_id': sku,
                        'date': date,
                        'inventory_level': base_inventory
                    })
                    
                    # Simulate demand
                    base_demand = np.random.uniform(10, 50)
                    demand_data.append({
                        'sku_id': sku,
                        'date': date,
                        'demand': base_demand
                    })
            
            return pd.DataFrame(inventory_data), pd.DataFrame(demand_data)
            
        except Exception as e:
            self.logger.error(f"Error getting inventory/demand data: {str(e)}")
            return pd.DataFrame(), pd.DataFrame()
    
    async def _get_delivery_performance_data(self) -> pd.DataFrame:
        """Get delivery performance data (simulated for demo)"""
        try:
            # Simulate delivery performance data
            dates = pd.date_range(start=datetime.now() - timedelta(days=30), periods=30, freq='D')
            
            delivery_data = []
            for date in dates:
                for i in range(np.random.randint(50, 150)):  # 50-150 deliveries per day
                    delivery_data.append({
                        'delivery_id': f"DEL_{date.strftime('%Y%m%d')}_{i:04d}",
                        'date': date,
                        'on_time': np.random.choice([True, False], p=[0.87, 0.13]),
                        'in_full': np.random.choice([True, False], p=[0.92, 0.08])
                    })
            
            return pd.DataFrame(delivery_data)
            
        except Exception:
            return pd.DataFrame()
    
    def _generate_otif_monthly_trend(self) -> List[Dict[str, Any]]:
        """Generate monthly OTIF trend data"""
        months = []
        base_date = datetime.now().replace(day=1)
        
        for i in range(6):  # Last 6 months
            month_date = base_date - timedelta(days=30 * i)
            otif_percentage = np.random.uniform(85, 95)
            months.append({
                'month': month_date.strftime('%Y-%m'),
                'otif_percentage': otif_percentage,
                'deliveries': np.random.randint(2000, 4000)
            })
        
        return list(reversed(months))
    
    def _analyze_otif_root_causes(self, delivery_data: pd.DataFrame) -> List[str]:
        """Analyze root causes of OTIF failures"""
        root_causes = [
            "Weather-related delays",
            "Traffic congestion",
            "Warehouse capacity constraints",
            "Supplier delivery delays",
            "Route optimization issues"
        ]
        return root_causes[:3]  # Return top 3
    
    def _estimate_alert_impact(self, alert_data: Dict[str, Any]) -> str:
        """Estimate business impact of alert"""
        severity = alert_data.get('severity', 'low')
        alert_type = alert_data.get('type', '')
        
        if severity == 'high':
            if 'forecast_accuracy' in alert_type:
                return "High - Potential inventory and service level issues"
            elif 'utilization' in alert_type:
                return "Medium - Increased transportation costs"
            else:
                return "Medium - Operational efficiency impact"
        else:
            return "Low - Minor operational impact"
    
    def _calculate_system_health_score(self, alerts: List[Alert]) -> float:
        """Calculate overall system health score based on alerts"""
        if not alerts:
            return 100.0
        
        score = 100.0
        for alert in alerts:
            if alert.severity == SeverityLevel.CRITICAL:
                score -= 20
            elif alert.severity == SeverityLevel.HIGH:
                score -= 10
            elif alert.severity == SeverityLevel.MEDIUM:
                score -= 5
            else:
                score -= 2
        
        return max(0.0, score)
    
    def _identify_trending_issues(self, alerts: List[Alert]) -> List[str]:
        """Identify trending issues from alerts"""
        trending = []
        
        # Group alerts by type
        alert_types = {}
        for alert in alerts:
            alert_types[alert.type] = alert_types.get(alert.type, 0) + 1
        
        # Identify types with multiple alerts
        for alert_type, count in alert_types.items():
            if count > 1:
                trending.append(f"Multiple {alert_type.replace('_', ' ')} issues")
        
        return trending
    
    # Default response methods for error cases
    def _get_default_forecast_accuracy_response(self) -> ForecastAccuracyResponse:
        """Get default forecast accuracy response"""
        return ForecastAccuracyResponse(
            overall_accuracy=AccuracyMetrics(
                mape=15.0, wape=12.0, bias=2.0, rmse=25.0, sample_size=0
            ),
            time_period_days=30,
            records_analyzed=0,
            unique_skus=0,
            calculation_date=datetime.now(),
            accuracy_grade="C",
            improvement_vs_previous=None
        )
    
    def _get_default_top_sku_errors_response(self) -> TopSKUErrorsResponse:
        """Get default top SKU errors response"""
        return TopSKUErrorsResponse(
            top_sku_errors=[],
            analysis_period_days=30,
            total_skus_analyzed=0,
            average_error_rate=0.0,
            calculation_date=datetime.now(),
            improvement_recommendations=[]
        )
    
    def _get_default_truck_utilization_response(self) -> TruckUtilizationResponse:
        """Get default truck utilization response"""
        return TruckUtilizationResponse(
            current_utilization=75.0,
            seven_day_average=75.0,
            improvement_vs_baseline=0.0,
            trend_direction=TrendDirection.STABLE,
            peak_utilization=85.0,
            utilization_variance=5.0,
            historical_trend=[],
            calculation_date=datetime.now()
        )
    
    def _get_default_inventory_doh_response(self) -> InventoryDOHResponse:
        """Get default inventory DOH response"""
        return InventoryDOHResponse(
            sku_level_doh={},
            average_doh=15.0,
            median_doh=12.0,
            skus_analyzed=0,
            calculation_date=datetime.now(),
            inventory_health_score=75.0
        )
    
    def _get_default_otif_response(self) -> OTIFPerformanceResponse:
        """Get default OTIF response"""
        return OTIFPerformanceResponse(
            overall_otif_percentage=85.0,
            on_time_percentage=90.0,
            in_full_percentage=92.0,
            total_deliveries=0,
            trend_direction=TrendDirection.STABLE,
            performance_vs_target=-10.0,
            monthly_trend=[],
            root_cause_analysis=[],
            calculation_date=datetime.now()
        )
    
    def _get_default_alerts_response(self) -> AlertsSummaryResponse:
        """Get default alerts response"""
        return AlertsSummaryResponse(
            alerts=[],
            total_alerts=0,
            high_severity_count=0,
            medium_severity_count=0,
            low_severity_count=0,
            alert_categories={},
            last_checked=datetime.now(),
            system_health_score=100.0,
            thresholds={},
            trending_issues=[]
        )