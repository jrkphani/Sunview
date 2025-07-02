"""
Operational Efficiency Service
Business logic for operational efficiency KPIs and metrics
"""

import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta, date
import pandas as pd
import numpy as np
from functools import lru_cache

from app.services.forecast_data_processor import ForecastDataProcessor, DataProcessingStatus
from app.utils.kpi_calculations import KPICalculator
from app.schemas.operational_efficiency import (
    ThroughputComparisonResponse, ThroughputComparison, ForecastConsumptionResponse,
    ConsumptionRateMetrics, LaborForecastResponse, LaborMetrics, DockToStockResponse,
    DockToStockMetrics, PickRatesResponse, PickRateMetrics, ConsolidationOpportunitiesResponse,
    ConsolidationOpportunity, TrendDirection, PerformanceStatus, ShiftType
)

logger = logging.getLogger(__name__)

class OperationalEfficiencyService:
    """Service for generating operational efficiency KPIs and metrics"""
    
    def __init__(self):
        self.forecast_processor = ForecastDataProcessor()
        self.kpi_calculator = KPICalculator()
        self.logger = logging.getLogger(__name__)
        
        # Cache duration in seconds
        self.cache_duration = 1800  # 30 minutes
        self._cache = {}
        
    async def get_throughput_comparison(self,
                                      time_period_days: int = 30,
                                      site_filter: Optional[List[str]] = None,
                                      sku_group_filter: Optional[List[str]] = None,
                                      breakdown_by: str = "site") -> ThroughputComparisonResponse:
        """
        Get forecasted vs actual throughput comparison by site/SKU
        
        Args:
            time_period_days: Analysis period in days
            site_filter: Filter by specific sites
            sku_group_filter: Filter by SKU groups
            breakdown_by: Breakdown granularity (site, sku_group, date)
            
        Returns:
            ThroughputComparisonResponse with throughput comparisons
        """
        try:
            # Check cache first
            cache_key = f"throughput_comparison_{time_period_days}_{site_filter}_{sku_group_filter}_{breakdown_by}"
            cached_result = self._get_from_cache(cache_key)
            if cached_result:
                return cached_result
            
            # Get throughput data
            throughput_data = await self._get_throughput_data(time_period_days, site_filter, sku_group_filter)
            
            if throughput_data.empty:
                return self._get_default_throughput_response()
            
            # Calculate comparisons
            site_comparisons = []
            accuracy_scores = []
            
            for _, row in throughput_data.iterrows():
                # Calculate variance and accuracy
                if row['actual_throughput'] > 0:
                    variance_percentage = ((row['forecasted_throughput'] - row['actual_throughput']) / row['actual_throughput']) * 100
                    accuracy_percentage = 100 - abs(variance_percentage)
                else:
                    variance_percentage = 0.0
                    accuracy_percentage = 0.0
                
                comparison = ThroughputComparison(
                    date=str(row['date']),
                    site_id=row['site_id'],
                    sku_group=row.get('sku_group'),
                    forecasted_throughput=row['forecasted_throughput'],
                    actual_throughput=row['actual_throughput'],
                    variance_percentage=variance_percentage,
                    accuracy_percentage=accuracy_percentage
                )
                site_comparisons.append(comparison)
                accuracy_scores.append(accuracy_percentage)
            
            # Calculate overall metrics
            overall_accuracy = np.mean(accuracy_scores) if accuracy_scores else 0.0
            total_variance = np.sum([comp.variance_percentage for comp in site_comparisons])
            
            # Find best and worst performing sites
            site_accuracy = {}
            for comp in site_comparisons:
                if comp.site_id not in site_accuracy:
                    site_accuracy[comp.site_id] = []
                site_accuracy[comp.site_id].append(comp.accuracy_percentage)
            
            site_avg_accuracy = {site: np.mean(accuracies) for site, accuracies in site_accuracy.items()}
            best_site = max(site_avg_accuracy, key=site_avg_accuracy.get) if site_avg_accuracy else "N/A"
            worst_site = min(site_avg_accuracy, key=site_avg_accuracy.get) if site_avg_accuracy else "N/A"
            
            # Determine trend direction
            trend_direction = self._calculate_throughput_trend(throughput_data)
            
            # Generate recommendations
            recommendations = self._generate_throughput_recommendations(site_comparisons)
            
            response = ThroughputComparisonResponse(
                site_comparisons=site_comparisons,
                overall_accuracy=overall_accuracy,
                total_variance=total_variance,
                best_performing_site=best_site,
                worst_performing_site=worst_site,
                trend_direction=trend_direction,
                analysis_period_days=time_period_days,
                sites_analyzed=len(site_avg_accuracy),
                calculation_date=datetime.now(),
                recommendations=recommendations
            )
            
            # Cache the result
            self._add_to_cache(cache_key, response)
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error getting throughput comparison: {str(e)}")
            return self._get_default_throughput_response()
    
    async def get_forecast_consumption_rate(self,
                                          time_period_days: int = 30,
                                          sku_filter: Optional[List[str]] = None,
                                          consumption_threshold: float = 0.8) -> ForecastConsumptionResponse:
        """
        Calculate forecast consumption rate metrics
        
        Args:
            time_period_days: Analysis period in days
            sku_filter: Filter by specific SKUs
            consumption_threshold: Consumption rate threshold
            
        Returns:
            ForecastConsumptionResponse with consumption metrics
        """
        try:
            # Check cache first
            cache_key = f"consumption_rate_{time_period_days}_{sku_filter}_{consumption_threshold}"
            cached_result = self._get_from_cache(cache_key)
            if cached_result:
                return cached_result
            
            # Get consumption data
            consumption_data = await self._get_consumption_data(time_period_days, sku_filter)
            
            if consumption_data.empty:
                return self._get_default_consumption_response()
            
            # Calculate consumption metrics
            sku_consumption_rates = []
            consumption_rates = []
            
            for sku_id in consumption_data['sku_id'].unique():
                sku_data = consumption_data[consumption_data['sku_id'] == sku_id]
                
                forecast_generated = sku_data['forecast_quantity'].sum()
                forecast_consumed = sku_data['consumed_quantity'].sum()
                
                if forecast_generated > 0:
                    consumption_rate = (forecast_consumed / forecast_generated) * 100
                else:
                    consumption_rate = 0.0
                
                remaining_forecast = forecast_generated - forecast_consumed
                
                # Calculate consumption velocity (daily)
                days_with_consumption = len(sku_data[sku_data['consumed_quantity'] > 0])
                if days_with_consumption > 0:
                    consumption_velocity = forecast_consumed / days_with_consumption
                else:
                    consumption_velocity = 0.0
                
                # Estimate depletion date
                if consumption_velocity > 0 and remaining_forecast > 0:
                    days_to_depletion = remaining_forecast / consumption_velocity
                    expected_depletion = date.today() + timedelta(days=int(days_to_depletion))
                else:
                    expected_depletion = None
                
                # Determine consumption trend
                consumption_trend = self._calculate_consumption_trend(sku_data)
                
                metrics = ConsumptionRateMetrics(
                    sku_id=sku_id,
                    forecast_generated=forecast_generated,
                    forecast_consumed=forecast_consumed,
                    consumption_rate=consumption_rate,
                    remaining_forecast=remaining_forecast,
                    consumption_velocity=consumption_velocity,
                    expected_depletion_date=expected_depletion,
                    consumption_trend=consumption_trend
                )
                
                sku_consumption_rates.append(metrics)
                consumption_rates.append(consumption_rate)
            
            # Calculate overall metrics
            overall_consumption_rate = np.mean(consumption_rates) if consumption_rates else 0.0
            
            # Identify fast and slow consuming SKUs
            fast_consuming_skus = [sku.sku_id for sku in sku_consumption_rates if sku.consumption_rate > 90]
            slow_consuming_skus = [sku.sku_id for sku in sku_consumption_rates if sku.consumption_rate < 50]
            
            # Calculate average consumption velocity
            velocities = [sku.consumption_velocity for sku in sku_consumption_rates if sku.consumption_velocity > 0]
            average_consumption_velocity = np.mean(velocities) if velocities else 0.0
            
            # Calculate forecast utilization efficiency
            forecast_utilization_efficiency = min(100.0, overall_consumption_rate * 1.2)  # Adjust for efficiency
            
            # Generate waste reduction opportunities
            waste_opportunities = self._identify_waste_reduction_opportunities(sku_consumption_rates)
            
            response = ForecastConsumptionResponse(
                sku_consumption_rates=sku_consumption_rates,
                overall_consumption_rate=overall_consumption_rate,
                fast_consuming_skus=fast_consuming_skus,
                slow_consuming_skus=slow_consuming_skus,
                average_consumption_velocity=average_consumption_velocity,
                forecast_utilization_efficiency=forecast_utilization_efficiency,
                waste_reduction_opportunities=waste_opportunities,
                calculation_date=datetime.now()
            )
            
            # Cache the result
            self._add_to_cache(cache_key, response)
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error getting consumption rate: {str(e)}")
            return self._get_default_consumption_response()
    
    async def get_labor_forecast_comparison(self,
                                          time_period_days: int = 30,
                                          site_filter: Optional[List[str]] = None,
                                          department_filter: Optional[List[str]] = None) -> LaborForecastResponse:
        """
        Compare labor forecast vs actual staffing
        
        Args:
            time_period_days: Analysis period in days
            site_filter: Filter by specific sites
            department_filter: Filter by departments
            
        Returns:
            LaborForecastResponse with labor metrics
        """
        try:
            # Check cache first
            cache_key = f"labor_forecast_{time_period_days}_{site_filter}_{department_filter}"
            cached_result = self._get_from_cache(cache_key)
            if cached_result:
                return cached_result
            
            # Get labor data
            labor_data = await self._get_labor_data(time_period_days, site_filter, department_filter)
            
            if labor_data.empty:
                return self._get_default_labor_response()
            
            # Calculate labor metrics
            labor_metrics = []
            hour_variances = []
            cost_variances = []
            overstaff_count = 0
            understaff_count = 0
            
            for _, row in labor_data.iterrows():
                variance_hours = row['actual_hours'] - row['forecasted_hours']
                
                # Calculate efficiency
                if row['forecasted_hours'] > 0:
                    efficiency_percentage = (row['actual_hours'] / row['forecasted_hours']) * 100
                else:
                    efficiency_percentage = 100.0
                
                # Calculate cost variance (assuming $25/hour average)
                cost_variance = variance_hours * 25.0
                
                # Count staffing situations
                if variance_hours > 8:  # More than 1 person-day over
                    overstaff_count += 1
                elif variance_hours < -8:  # More than 1 person-day under
                    understaff_count += 1
                
                metrics = LaborMetrics(
                    date=str(row['date']),
                    site_id=row['site_id'],
                    department=row['department'],
                    forecasted_hours=row['forecasted_hours'],
                    actual_hours=row['actual_hours'],
                    forecasted_headcount=row['forecasted_headcount'],
                    actual_headcount=row['actual_headcount'],
                    productivity_rate=row.get('productivity_rate', 50.0),
                    efficiency_percentage=efficiency_percentage,
                    overtime_hours=row.get('overtime_hours', 0.0),
                    variance_hours=variance_hours,
                    cost_variance=cost_variance
                )
                
                labor_metrics.append(metrics)
                hour_variances.append(abs(variance_hours))
                cost_variances.append(abs(cost_variance))
            
            # Calculate overall metrics
            overall_accuracy = 100 - (np.mean(hour_variances) / np.mean([m.forecasted_hours for m in labor_metrics])) * 100
            total_hour_variance = sum(hour_variances)
            total_cost_impact = sum(cost_variances)
            
            # Calculate optimal staffing rate
            total_situations = len(labor_metrics)
            optimal_situations = total_situations - overstaff_count - understaff_count
            optimal_staffing_rate = (optimal_situations / total_situations) * 100 if total_situations > 0 else 0.0
            
            # Calculate productivity trend
            productivity_trend = self._calculate_productivity_trend(labor_data)
            
            # Generate recommendations
            recommendations = self._generate_labor_recommendations(labor_metrics, overstaff_count, understaff_count)
            
            response = LaborForecastResponse(
                labor_metrics=labor_metrics,
                overall_labor_accuracy=overall_accuracy,
                total_hour_variance=total_hour_variance,
                cost_impact=total_cost_impact,
                overstaff_situations=overstaff_count,
                understaff_situations=understaff_count,
                optimal_staffing_rate=optimal_staffing_rate,
                productivity_trend=productivity_trend,
                recommendations=recommendations,
                calculation_date=datetime.now()
            )
            
            # Cache the result
            self._add_to_cache(cache_key, response)
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error getting labor forecast: {str(e)}")
            return self._get_default_labor_response()
    
    async def get_dock_to_stock_times(self,
                                    time_period_days: int = 30,
                                    site_filter: Optional[List[str]] = None,
                                    sku_group_filter: Optional[List[str]] = None) -> DockToStockResponse:
        """
        Calculate dock-to-stock processing times
        
        Args:
            time_period_days: Analysis period in days
            site_filter: Filter by specific sites
            sku_group_filter: Filter by SKU groups
            
        Returns:
            DockToStockResponse with processing time metrics
        """
        try:
            # Check cache first
            cache_key = f"dock_to_stock_{time_period_days}_{site_filter}_{sku_group_filter}"
            cached_result = self._get_from_cache(cache_key)
            if cached_result:
                return cached_result
            
            # Get dock-to-stock data
            dock_data = await self._get_dock_to_stock_data(time_period_days, site_filter, sku_group_filter)
            
            if dock_data.empty:
                return self._get_default_dock_to_stock_response()
            
            # Calculate metrics by site and SKU group
            site_metrics = []
            all_processing_times = []
            
            for (site_id, sku_group), group_data in dock_data.groupby(['site_id', 'sku_group']):
                processing_times = group_data['processing_hours'].values
                target_hours = 24.0  # 24 hour target
                
                avg_processing_hours = np.mean(processing_times)
                median_processing_hours = np.median(processing_times)
                performance_vs_target = ((target_hours - avg_processing_hours) / target_hours) * 100
                on_time_percentage = (sum(processing_times <= target_hours) / len(processing_times)) * 100
                volume_processed = len(group_data)
                
                # Identify bottlenecks (simulated)
                bottleneck_stages = self._identify_bottleneck_stages(avg_processing_hours)
                
                # Calculate improvement opportunity
                if avg_processing_hours > target_hours:
                    improvement_opportunity = avg_processing_hours - target_hours
                else:
                    improvement_opportunity = 0.0
                
                metrics = DockToStockMetrics(
                    site_id=site_id,
                    sku_group=sku_group,
                    average_dock_to_stock_hours=avg_processing_hours,
                    median_dock_to_stock_hours=median_processing_hours,
                    target_dock_to_stock_hours=target_hours,
                    performance_vs_target=performance_vs_target,
                    on_time_percentage=on_time_percentage,
                    volume_processed=volume_processed,
                    bottleneck_stages=bottleneck_stages,
                    improvement_opportunity=improvement_opportunity
                )
                
                site_metrics.append(metrics)
                all_processing_times.extend(processing_times)
            
            # Calculate overall metrics
            overall_average_hours = np.mean(all_processing_times) if all_processing_times else 0.0
            
            # Find best and worst performing sites
            site_performance = {m.site_id: m.average_dock_to_stock_hours for m in site_metrics}
            best_site = min(site_performance, key=site_performance.get) if site_performance else "N/A"
            worst_site = max(site_performance, key=site_performance.get) if site_performance else "N/A"
            
            # Calculate trend direction
            trend_direction = self._calculate_dock_to_stock_trend(dock_data)
            
            # Calculate total improvement opportunity and cost
            total_improvement_hours = sum(m.improvement_opportunity for m in site_metrics)
            cost_of_delays = total_improvement_hours * 50.0  # $50 per hour cost
            
            # Calculate process optimization score
            on_time_rates = [m.on_time_percentage for m in site_metrics]
            process_optimization_score = np.mean(on_time_rates) if on_time_rates else 0.0
            
            # Generate recommendations
            recommendations = self._generate_dock_to_stock_recommendations(site_metrics)
            
            response = DockToStockResponse(
                site_metrics=site_metrics,
                overall_average_hours=overall_average_hours,
                best_performing_site=best_site,
                worst_performing_site=worst_site,
                trend_direction=trend_direction,
                total_improvement_opportunity=total_improvement_hours,
                cost_of_delays=cost_of_delays,
                process_optimization_score=process_optimization_score,
                recommendations=recommendations,
                calculation_date=datetime.now()
            )
            
            # Cache the result
            self._add_to_cache(cache_key, response)
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error getting dock-to-stock times: {str(e)}")
            return self._get_default_dock_to_stock_response()
    
    async def get_pick_rates_by_shift(self,
                                    time_period_days: int = 30,
                                    site_filter: Optional[List[str]] = None,
                                    shift_type_filter: Optional[List[ShiftType]] = None) -> PickRatesResponse:
        """
        Calculate pick rates by shift and performance metrics
        
        Args:
            time_period_days: Analysis period in days
            site_filter: Filter by specific sites
            shift_type_filter: Filter by shift types
            
        Returns:
            PickRatesResponse with pick rate metrics
        """
        try:
            # Check cache first
            cache_key = f"pick_rates_{time_period_days}_{site_filter}_{shift_type_filter}"
            cached_result = self._get_from_cache(cache_key)
            if cached_result:
                return cached_result
            
            # Get pick rate data
            pick_data = await self._get_pick_rate_data(time_period_days, site_filter, shift_type_filter)
            
            if pick_data.empty:
                return self._get_default_pick_rates_response()
            
            # Calculate shift metrics
            shift_metrics = []
            all_pick_rates = []
            
            for _, row in pick_data.iterrows():
                picks_per_hour = row['total_picks'] / row['total_hours'] if row['total_hours'] > 0 else 0.0
                target_pick_rate = 100.0  # 100 picks per hour target
                performance_vs_target = (picks_per_hour / target_pick_rate) * 100 if target_pick_rate > 0 else 0.0
                
                # Calculate accuracy
                if row['total_picks'] > 0:
                    accuracy_percentage = ((row['total_picks'] - row['error_count']) / row['total_picks']) * 100
                else:
                    accuracy_percentage = 100.0
                
                # Calculate productivity score
                productivity_score = min(100.0, (performance_vs_target + accuracy_percentage) / 2)
                
                metrics = PickRateMetrics(
                    site_id=row['site_id'],
                    shift_type=ShiftType(row['shift_type']),
                    shift_date=str(row['shift_date']),
                    total_picks=row['total_picks'],
                    total_hours=row['total_hours'],
                    picks_per_hour=picks_per_hour,
                    target_pick_rate=target_pick_rate,
                    performance_vs_target=performance_vs_target,
                    accuracy_percentage=accuracy_percentage,
                    error_count=row['error_count'],
                    team_size=row['team_size'],
                    productivity_score=productivity_score
                )
                
                shift_metrics.append(metrics)
                all_pick_rates.append(picks_per_hour)
            
            # Calculate overall metrics
            overall_pick_rate = np.mean(all_pick_rates) if all_pick_rates else 0.0
            
            # Find best and worst performing shifts
            best_shift = max(shift_metrics, key=lambda x: x.productivity_score) if shift_metrics else None
            worst_shift = min(shift_metrics, key=lambda x: x.productivity_score) if shift_metrics else None
            
            best_shift_dict = {
                'site_id': best_shift.site_id,
                'shift_type': best_shift.shift_type.value,
                'productivity_score': best_shift.productivity_score
            } if best_shift else {}
            
            worst_shift_dict = {
                'site_id': worst_shift.site_id,
                'shift_type': worst_shift.shift_type.value,
                'productivity_score': worst_shift.productivity_score
            } if worst_shift else {}
            
            # Create shift performance ranking
            shift_ranking = []
            for metrics in sorted(shift_metrics, key=lambda x: x.productivity_score, reverse=True)[:10]:
                shift_ranking.append({
                    'site_id': metrics.site_id,
                    'shift_type': metrics.shift_type.value,
                    'shift_date': metrics.shift_date,
                    'productivity_score': metrics.productivity_score,
                    'picks_per_hour': metrics.picks_per_hour
                })
            
            # Calculate accuracy trend
            accuracy_values = [m.accuracy_percentage for m in shift_metrics]
            accuracy_trend = self._calculate_accuracy_trend(accuracy_values)
            
            # Calculate productivity improvement
            # This would compare to baseline - for demo, use a simulated value
            productivity_improvement = 5.2  # 5.2% improvement
            
            # Generate optimization opportunities
            optimization_opportunities = self._generate_pick_rate_optimizations(shift_metrics)
            
            response = PickRatesResponse(
                shift_metrics=shift_metrics,
                overall_pick_rate=overall_pick_rate,
                best_performing_shift=best_shift_dict,
                worst_performing_shift=worst_shift_dict,
                shift_performance_ranking=shift_ranking,
                accuracy_trend=accuracy_trend,
                productivity_improvement=productivity_improvement,
                optimization_opportunities=optimization_opportunities,
                calculation_date=datetime.now()
            )
            
            # Cache the result
            self._add_to_cache(cache_key, response)
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error getting pick rates: {str(e)}")
            return self._get_default_pick_rates_response()
    
    async def get_consolidation_opportunities(self,
                                            time_period_days: int = 30,
                                            route_filter: Optional[List[str]] = None,
                                            utilization_threshold: float = 0.8) -> ConsolidationOpportunitiesResponse:
        """
        Identify truck consolidation opportunities from forecast data
        
        Args:
            time_period_days: Analysis period in days
            route_filter: Filter by specific routes
            utilization_threshold: Utilization threshold for consolidation
            
        Returns:
            ConsolidationOpportunitiesResponse with consolidation opportunities
        """
        try:
            # Check cache first
            cache_key = f"consolidation_{time_period_days}_{route_filter}_{utilization_threshold}"
            cached_result = self._get_from_cache(cache_key)
            if cached_result:
                return cached_result
            
            # Get consolidation data
            route_data = await self._get_route_utilization_data(time_period_days, route_filter)
            
            if route_data.empty:
                return self._get_default_consolidation_response()
            
            # Identify consolidation opportunities
            consolidation_opportunities = []
            total_cost_savings = 0.0
            total_trucks_reducible = 0
            
            for route_id in route_data['route_id'].unique():
                route_info = route_data[route_data['route_id'] == route_id].iloc[0]
                
                current_trucks = route_info['current_trucks']
                volume_utilization = route_info['volume_utilization']
                weight_utilization = route_info['weight_utilization']
                
                # Calculate consolidation potential
                avg_utilization = (volume_utilization + weight_utilization) / 2
                if avg_utilization < utilization_threshold * 100:
                    # Calculate how many trucks could be saved
                    optimal_trucks = max(1, int(current_trucks * (avg_utilization / 100) / utilization_threshold))
                    trucks_reducible = current_trucks - optimal_trucks
                    
                    if trucks_reducible > 0:
                        # Calculate cost savings (estimate $500 per truck per day)
                        daily_savings = trucks_reducible * 500
                        annual_savings = daily_savings * 250  # 250 working days
                        
                        # Calculate environmental impact
                        co2_reduction = trucks_reducible * 0.5  # 0.5 tons CO2 per truck per day
                        fuel_savings = trucks_reducible * 50  # 50 gallons per truck per day
                        
                        # Determine implementation difficulty
                        if trucks_reducible == 1:
                            difficulty = "easy"
                        elif trucks_reducible <= 3:
                            difficulty = "medium"
                        else:
                            difficulty = "hard"
                        
                        # Calculate priority score
                        priority_score = (annual_savings / 10000) + (trucks_reducible * 10) + (100 - avg_utilization)
                        
                        opportunity = ConsolidationOpportunity(
                            route_id=route_id,
                            origin_site=route_info['origin_site'],
                            destination_site=route_info['destination_site'],
                            current_trucks=current_trucks,
                            recommended_trucks=optimal_trucks,
                            consolidation_potential=trucks_reducible,
                            volume_utilization=volume_utilization,
                            weight_utilization=weight_utilization,
                            cost_savings_potential=annual_savings,
                            environmental_impact={
                                'co2_reduction_tons_per_year': co2_reduction * 250,
                                'fuel_savings_gallons_per_year': fuel_savings * 250
                            },
                            implementation_difficulty=difficulty,
                            priority_score=priority_score
                        )
                        
                        consolidation_opportunities.append(opportunity)
                        total_cost_savings += annual_savings
                        total_trucks_reducible += trucks_reducible
            
            # Sort by priority score
            consolidation_opportunities.sort(key=lambda x: x.priority_score, reverse=True)
            
            # Categorize opportunities
            quick_wins = [opp for opp in consolidation_opportunities 
                         if opp.implementation_difficulty == "easy" and opp.cost_savings_potential > 50000]
            long_term_opportunities = [opp for opp in consolidation_opportunities 
                                     if opp.implementation_difficulty in ["medium", "hard"]]
            
            # Calculate total environmental benefits
            total_co2_reduction = sum(opp.environmental_impact['co2_reduction_tons_per_year'] 
                                    for opp in consolidation_opportunities)
            total_fuel_savings = sum(opp.environmental_impact['fuel_savings_gallons_per_year'] 
                                   for opp in consolidation_opportunities)
            
            environmental_benefits = {
                'total_co2_reduction_tons': total_co2_reduction,
                'total_fuel_savings_gallons': total_fuel_savings,
                'equivalent_cars_off_road': total_co2_reduction / 4.6  # Average car produces 4.6 tons CO2/year
            }
            
            # Generate implementation roadmap
            implementation_roadmap = self._generate_consolidation_roadmap(consolidation_opportunities)
            
            # Calculate ROI analysis
            implementation_cost = len(consolidation_opportunities) * 25000  # $25k per route optimization
            roi_percentage = (total_cost_savings - implementation_cost) / implementation_cost * 100 if implementation_cost > 0 else 0
            
            roi_analysis = {
                'total_investment': implementation_cost,
                'annual_savings': total_cost_savings,
                'roi_percentage': roi_percentage,
                'payback_period_months': (implementation_cost / (total_cost_savings / 12)) if total_cost_savings > 0 else 0
            }
            
            response = ConsolidationOpportunitiesResponse(
                consolidation_opportunities=consolidation_opportunities,
                total_cost_savings_potential=total_cost_savings,
                total_trucks_reducible=total_trucks_reducible,
                environmental_benefits=environmental_benefits,
                quick_wins=quick_wins,
                long_term_opportunities=long_term_opportunities,
                implementation_roadmap=implementation_roadmap,
                roi_analysis=roi_analysis,
                calculation_date=datetime.now()
            )
            
            # Cache the result
            self._add_to_cache(cache_key, response)
            
            return response
            
        except Exception as e:
            self.logger.error(f"Error getting consolidation opportunities: {str(e)}")
            return self._get_default_consolidation_response()
    
    # Helper methods for data retrieval (simulated for demo)
    async def _get_throughput_data(self, days: int, site_filter: Optional[List[str]], 
                                 sku_group_filter: Optional[List[str]]) -> pd.DataFrame:
        """Get throughput data (simulated)"""
        try:
            dates = pd.date_range(start=datetime.now() - timedelta(days=days), periods=days, freq='D')
            sites = site_filter or [f"SITE_{i:03d}" for i in range(1, 11)]
            sku_groups = sku_group_filter or ["Electronics", "Clothing", "Home", "Books"]
            
            data = []
            for date in dates:
                for site in sites:
                    for sku_group in sku_groups:
                        forecasted = np.random.uniform(1000, 5000)
                        actual = forecasted * np.random.uniform(0.8, 1.2)  # ±20% variance
                        
                        data.append({
                            'date': date,
                            'site_id': site,
                            'sku_group': sku_group,
                            'forecasted_throughput': forecasted,
                            'actual_throughput': actual
                        })
            
            return pd.DataFrame(data)
        except Exception:
            return pd.DataFrame()
    
    async def _get_consumption_data(self, days: int, sku_filter: Optional[List[str]]) -> pd.DataFrame:
        """Get consumption data (simulated)"""
        try:
            dates = pd.date_range(start=datetime.now() - timedelta(days=days), periods=days, freq='D')
            skus = sku_filter or [f"SKU_{i:04d}" for i in range(1, 101)]
            
            data = []
            for date in dates:
                for sku in skus:
                    forecast_qty = np.random.uniform(100, 1000)
                    consumed_qty = forecast_qty * np.random.uniform(0.6, 0.95)  # 60-95% consumption
                    
                    data.append({
                        'date': date,
                        'sku_id': sku,
                        'forecast_quantity': forecast_qty,
                        'consumed_quantity': consumed_qty
                    })
            
            return pd.DataFrame(data)
        except Exception:
            return pd.DataFrame()
    
    async def _get_labor_data(self, days: int, site_filter: Optional[List[str]], 
                            department_filter: Optional[List[str]]) -> pd.DataFrame:
        """Get labor data (simulated)"""
        try:
            dates = pd.date_range(start=datetime.now() - timedelta(days=days), periods=days, freq='D')
            sites = site_filter or [f"SITE_{i:03d}" for i in range(1, 6)]
            departments = department_filter or ["Receiving", "Picking", "Packing", "Shipping"]
            
            data = []
            for date in dates:
                for site in sites:
                    for dept in departments:
                        forecasted_hours = np.random.uniform(40, 120)
                        actual_hours = forecasted_hours * np.random.uniform(0.9, 1.1)  # ±10% variance
                        forecasted_headcount = int(forecasted_hours / 8)
                        actual_headcount = int(actual_hours / 8)
                        
                        data.append({
                            'date': date,
                            'site_id': site,
                            'department': dept,
                            'forecasted_hours': forecasted_hours,
                            'actual_hours': actual_hours,
                            'forecasted_headcount': forecasted_headcount,
                            'actual_headcount': actual_headcount,
                            'productivity_rate': np.random.uniform(40, 60),
                            'overtime_hours': max(0, actual_hours - 40)
                        })
            
            return pd.DataFrame(data)
        except Exception:
            return pd.DataFrame()
    
    async def _get_dock_to_stock_data(self, days: int, site_filter: Optional[List[str]], 
                                    sku_group_filter: Optional[List[str]]) -> pd.DataFrame:
        """Get dock-to-stock data (simulated)"""
        try:
            sites = site_filter or [f"SITE_{i:03d}" for i in range(1, 6)]
            sku_groups = sku_group_filter or ["Electronics", "Clothing", "Home", "Books"]
            
            data = []
            for _ in range(days * 10):  # 10 shipments per day on average
                site = np.random.choice(sites)
                sku_group = np.random.choice(sku_groups)
                processing_hours = np.random.uniform(12, 48)  # 12-48 hours processing time
                
                data.append({
                    'site_id': site,
                    'sku_group': sku_group,
                    'processing_hours': processing_hours
                })
            
            return pd.DataFrame(data)
        except Exception:
            return pd.DataFrame()
    
    async def _get_pick_rate_data(self, days: int, site_filter: Optional[List[str]], 
                                shift_filter: Optional[List[ShiftType]]) -> pd.DataFrame:
        """Get pick rate data (simulated)"""
        try:
            dates = pd.date_range(start=datetime.now() - timedelta(days=days), periods=days, freq='D')
            sites = site_filter or [f"SITE_{i:03d}" for i in range(1, 6)]
            shifts = shift_filter or [ShiftType.DAY, ShiftType.EVENING, ShiftType.NIGHT]
            
            data = []
            for date in dates:
                for site in sites:
                    for shift in shifts:
                        total_picks = np.random.randint(500, 2000)
                        total_hours = 8.0
                        error_count = np.random.randint(0, int(total_picks * 0.05))
                        team_size = np.random.randint(5, 15)
                        
                        data.append({
                            'shift_date': date,
                            'site_id': site,
                            'shift_type': shift.value,
                            'total_picks': total_picks,
                            'total_hours': total_hours,
                            'error_count': error_count,
                            'team_size': team_size
                        })
            
            return pd.DataFrame(data)
        except Exception:
            return pd.DataFrame()
    
    async def _get_route_utilization_data(self, days: int, 
                                        route_filter: Optional[List[str]]) -> pd.DataFrame:
        """Get route utilization data (simulated)"""
        try:
            routes = route_filter or [f"ROUTE_{i:03d}" for i in range(1, 21)]
            
            data = []
            for route_id in routes:
                current_trucks = np.random.randint(2, 8)
                volume_utilization = np.random.uniform(60, 95)  # 60-95% utilization
                weight_utilization = np.random.uniform(65, 90)   # 65-90% utilization
                
                data.append({
                    'route_id': route_id,
                    'origin_site': f"SITE_{np.random.randint(1, 6):03d}",
                    'destination_site': f"SITE_{np.random.randint(1, 6):03d}",
                    'current_trucks': current_trucks,
                    'volume_utilization': volume_utilization,
                    'weight_utilization': weight_utilization
                })
            
            return pd.DataFrame(data)
        except Exception:
            return pd.DataFrame()
    
    # Cache helper methods
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
    
    # Trend calculation methods
    def _calculate_throughput_trend(self, data: pd.DataFrame) -> TrendDirection:
        """Calculate throughput trend direction"""
        if len(data) < 7:
            return TrendDirection.INSUFFICIENT_DATA
        
        recent_avg = data.tail(7)['actual_throughput'].mean()
        previous_avg = data.iloc[-14:-7]['actual_throughput'].mean() if len(data) >= 14 else recent_avg
        
        if recent_avg > previous_avg * 1.05:
            return TrendDirection.INCREASING
        elif recent_avg < previous_avg * 0.95:
            return TrendDirection.DECREASING
        else:
            return TrendDirection.STABLE
    
    def _calculate_consumption_trend(self, data: pd.DataFrame) -> TrendDirection:
        """Calculate consumption trend direction"""
        if len(data) < 7:
            return TrendDirection.INSUFFICIENT_DATA
        
        recent_rate = data.tail(7)['consumed_quantity'].mean()
        previous_rate = data.iloc[-14:-7]['consumed_quantity'].mean() if len(data) >= 14 else recent_rate
        
        if recent_rate > previous_rate * 1.05:
            return TrendDirection.INCREASING
        elif recent_rate < previous_rate * 0.95:
            return TrendDirection.DECREASING
        else:
            return TrendDirection.STABLE
    
    def _calculate_productivity_trend(self, data: pd.DataFrame) -> TrendDirection:
        """Calculate productivity trend direction"""
        if len(data) < 7:
            return TrendDirection.INSUFFICIENT_DATA
        
        data['efficiency'] = data['actual_hours'] / data['forecasted_hours']
        recent_efficiency = data.tail(7)['efficiency'].mean()
        previous_efficiency = data.iloc[-14:-7]['efficiency'].mean() if len(data) >= 14 else recent_efficiency
        
        # Lower efficiency ratio is better (less variance from forecast)
        if recent_efficiency < previous_efficiency * 0.95:
            return TrendDirection.INCREASING  # Improving
        elif recent_efficiency > previous_efficiency * 1.05:
            return TrendDirection.DECREASING  # Declining
        else:
            return TrendDirection.STABLE
    
    def _calculate_dock_to_stock_trend(self, data: pd.DataFrame) -> TrendDirection:
        """Calculate dock-to-stock trend direction"""
        if len(data) < 20:
            return TrendDirection.INSUFFICIENT_DATA
        
        recent_avg = data.tail(10)['processing_hours'].mean()
        previous_avg = data.iloc[-20:-10]['processing_hours'].mean()
        
        # Lower processing time is better
        if recent_avg < previous_avg * 0.95:
            return TrendDirection.INCREASING  # Improving
        elif recent_avg > previous_avg * 1.05:
            return TrendDirection.DECREASING  # Declining
        else:
            return TrendDirection.STABLE
    
    def _calculate_accuracy_trend(self, accuracy_values: List[float]) -> TrendDirection:
        """Calculate accuracy trend direction"""
        if len(accuracy_values) < 7:
            return TrendDirection.INSUFFICIENT_DATA
        
        recent_avg = np.mean(accuracy_values[-7:])
        previous_avg = np.mean(accuracy_values[-14:-7]) if len(accuracy_values) >= 14 else recent_avg
        
        if recent_avg > previous_avg + 2:
            return TrendDirection.INCREASING
        elif recent_avg < previous_avg - 2:
            return TrendDirection.DECREASING
        else:
            return TrendDirection.STABLE
    
    # Recommendation generation methods
    def _generate_throughput_recommendations(self, comparisons: List[ThroughputComparison]) -> List[str]:
        """Generate throughput improvement recommendations"""
        recommendations = []
        
        high_variance_sites = [c.site_id for c in comparisons if abs(c.variance_percentage) > 20]
        if high_variance_sites:
            recommendations.append(f"Review forecasting models for sites with high variance: {', '.join(set(high_variance_sites[:3]))}")
        
        low_accuracy_sites = [c.site_id for c in comparisons if c.accuracy_percentage < 80]
        if low_accuracy_sites:
            recommendations.append("Implement real-time capacity monitoring for underperforming sites")
        
        recommendations.append("Consider dynamic forecasting adjustments based on site-specific patterns")
        return recommendations
    
    def _identify_waste_reduction_opportunities(self, consumption_rates: List[ConsumptionRateMetrics]) -> List[Dict[str, Any]]:
        """Identify waste reduction opportunities"""
        opportunities = []
        
        slow_skus = [sku for sku in consumption_rates if sku.consumption_rate < 70]
        if slow_skus:
            total_waste = sum(sku.remaining_forecast for sku in slow_skus)
            opportunities.append({
                'type': 'slow_consumption',
                'description': f'Reduce forecast quantities for {len(slow_skus)} slow-consuming SKUs',
                'potential_savings': total_waste * 0.5,  # Estimate 50% savings
                'affected_skus': [sku.sku_id for sku in slow_skus[:5]]
            })
        
        return opportunities
    
    def _generate_labor_recommendations(self, metrics: List[LaborMetrics], 
                                      overstaff: int, understaff: int) -> List[str]:
        """Generate labor optimization recommendations"""
        recommendations = []
        
        if overstaff > understaff:
            recommendations.append("Implement flexible staffing model to reduce overstaffing")
        elif understaff > overstaff:
            recommendations.append("Improve demand forecasting to prevent understaffing")
        
        high_variance_depts = {}
        for metric in metrics:
            if abs(metric.variance_hours) > 16:  # More than 2 person-days
                high_variance_depts[metric.department] = high_variance_depts.get(metric.department, 0) + 1
        
        if high_variance_depts:
            top_dept = max(high_variance_depts, key=high_variance_depts.get)
            recommendations.append(f"Focus on improving forecast accuracy for {top_dept} department")
        
        return recommendations
    
    def _identify_bottleneck_stages(self, avg_hours: float) -> List[str]:
        """Identify bottleneck stages based on processing time"""
        bottlenecks = []
        
        if avg_hours > 36:
            bottlenecks.append("Receiving dock capacity")
        if avg_hours > 30:
            bottlenecks.append("Quality inspection")
        if avg_hours > 24:
            bottlenecks.append("Inventory management system")
        
        return bottlenecks or ["No major bottlenecks identified"]
    
    def _generate_dock_to_stock_recommendations(self, metrics: List[DockToStockMetrics]) -> List[str]:
        """Generate dock-to-stock improvement recommendations"""
        recommendations = []
        
        slow_sites = [m.site_id for m in metrics if m.average_dock_to_stock_hours > 30]
        if slow_sites:
            recommendations.append(f"Optimize receiving processes at slow sites: {', '.join(slow_sites[:3])}")
        
        high_volume_sites = [m for m in metrics if m.volume_processed > 100]
        if high_volume_sites:
            avg_hours = np.mean([m.average_dock_to_stock_hours for m in high_volume_sites])
            if avg_hours > 24:
                recommendations.append("Consider additional staffing during peak volume periods")
        
        recommendations.append("Implement automated sorting and putaway systems")
        return recommendations
    
    def _generate_pick_rate_optimizations(self, metrics: List[PickRateMetrics]) -> List[str]:
        """Generate pick rate optimization opportunities"""
        optimizations = []
        
        low_performers = [m for m in metrics if m.productivity_score < 70]
        if low_performers:
            optimizations.append("Provide additional training for underperforming shifts")
        
        high_error_shifts = [m for m in metrics if m.accuracy_percentage < 95]
        if high_error_shifts:
            optimizations.append("Implement pick verification technology to reduce errors")
        
        optimizations.append("Optimize pick path algorithms and warehouse layout")
        return optimizations
    
    def _generate_consolidation_roadmap(self, opportunities: List[ConsolidationOpportunity]) -> List[Dict[str, Any]]:
        """Generate implementation roadmap for consolidation"""
        roadmap = []
        
        # Phase 1: Quick wins
        quick_wins = [opp for opp in opportunities if opp.implementation_difficulty == "easy"]
        if quick_wins:
            roadmap.append({
                'phase': 'Phase 1 - Quick Wins',
                'duration_weeks': 4,
                'routes': [opp.route_id for opp in quick_wins[:5]],
                'expected_savings': sum(opp.cost_savings_potential for opp in quick_wins[:5])
            })
        
        # Phase 2: Medium complexity
        medium_ops = [opp for opp in opportunities if opp.implementation_difficulty == "medium"]
        if medium_ops:
            roadmap.append({
                'phase': 'Phase 2 - Medium Complexity',
                'duration_weeks': 8,
                'routes': [opp.route_id for opp in medium_ops[:3]],
                'expected_savings': sum(opp.cost_savings_potential for opp in medium_ops[:3])
            })
        
        return roadmap
    
    # Default response methods
    def _get_default_throughput_response(self) -> ThroughputComparisonResponse:
        """Get default throughput response"""
        return ThroughputComparisonResponse(
            site_comparisons=[],
            overall_accuracy=0.0,
            total_variance=0.0,
            best_performing_site="N/A",
            worst_performing_site="N/A",
            trend_direction=TrendDirection.INSUFFICIENT_DATA,
            analysis_period_days=30,
            sites_analyzed=0,
            calculation_date=datetime.now(),
            recommendations=[]
        )
    
    def _get_default_consumption_response(self) -> ForecastConsumptionResponse:
        """Get default consumption response"""
        return ForecastConsumptionResponse(
            sku_consumption_rates=[],
            overall_consumption_rate=0.0,
            fast_consuming_skus=[],
            slow_consuming_skus=[],
            average_consumption_velocity=0.0,
            forecast_utilization_efficiency=0.0,
            waste_reduction_opportunities=[],
            calculation_date=datetime.now()
        )
    
    def _get_default_labor_response(self) -> LaborForecastResponse:
        """Get default labor response"""
        return LaborForecastResponse(
            labor_metrics=[],
            overall_labor_accuracy=0.0,
            total_hour_variance=0.0,
            cost_impact=0.0,
            overstaff_situations=0,
            understaff_situations=0,
            optimal_staffing_rate=0.0,
            productivity_trend=TrendDirection.INSUFFICIENT_DATA,
            recommendations=[],
            calculation_date=datetime.now()
        )
    
    def _get_default_dock_to_stock_response(self) -> DockToStockResponse:
        """Get default dock-to-stock response"""
        return DockToStockResponse(
            site_metrics=[],
            overall_average_hours=0.0,
            best_performing_site="N/A",
            worst_performing_site="N/A",
            trend_direction=TrendDirection.INSUFFICIENT_DATA,
            total_improvement_opportunity=0.0,
            cost_of_delays=0.0,
            process_optimization_score=0.0,
            recommendations=[],
            calculation_date=datetime.now()
        )
    
    def _get_default_pick_rates_response(self) -> PickRatesResponse:
        """Get default pick rates response"""
        return PickRatesResponse(
            shift_metrics=[],
            overall_pick_rate=0.0,
            best_performing_shift={},
            worst_performing_shift={},
            shift_performance_ranking=[],
            accuracy_trend=TrendDirection.INSUFFICIENT_DATA,
            productivity_improvement=0.0,
            optimization_opportunities=[],
            calculation_date=datetime.now()
        )
    
    def _get_default_consolidation_response(self) -> ConsolidationOpportunitiesResponse:
        """Get default consolidation response"""
        return ConsolidationOpportunitiesResponse(
            consolidation_opportunities=[],
            total_cost_savings_potential=0.0,
            total_trucks_reducible=0,
            environmental_benefits={},
            quick_wins=[],
            long_term_opportunities=[],
            implementation_roadmap=[],
            roi_analysis={},
            calculation_date=datetime.now()
        )