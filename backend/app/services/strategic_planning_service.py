"""
Strategic Planning Service
Comprehensive strategic planning analysis integrating all analytics components
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, date, timedelta
import asyncio
from functools import lru_cache

from app.utils.statistical_analysis import StatisticalAnalyzer
from app.utils.time_series_utils import TimeSeriesAnalyzer
from app.services.s3_data_service import S3DataService
from app.services.seasonality_analyzer import SeasonalityAnalyzerService
from app.services.lifecycle_classifier import LifecycleClassifierService
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
    BiasMetrics,
    LocationBiasAnalysis,
    ProductMixMetrics,
    CategoryMixAnalysis,
    StabilityMetrics,
    LocationStabilityAnalysis,
    StabilityLevel,
    StatisticalSignificance,
    AnalysisPeriod
)

class StrategicPlanningService:
    """Service for comprehensive strategic planning analysis"""
    
    def __init__(self):
        self.statistical_analyzer = StatisticalAnalyzer()
        self.time_series_analyzer = TimeSeriesAnalyzer()
        self.s3_service = S3DataService()
        self.seasonality_service = SeasonalityAnalyzerService()
        self.lifecycle_service = LifecycleClassifierService()
        
    async def analyze_seasonality(self, request: SeasonalityAnalysisRequest) -> SeasonalityAnalysisResponse:
        """Perform seasonality analysis using the dedicated service"""
        return await self.seasonality_service.analyze_seasonality(
            sku_filter=request.sku_filter,
            category_filter=request.category_filter,
            start_date=request.start_date,
            end_date=request.end_date,
            pattern_types=request.pattern_types,
            min_pattern_strength=request.min_pattern_strength
        )
    
    async def analyze_forecast_bias_trends(self, request: BiasAnalysisRequest) -> ForecastBiasTrendsResponse:
        """
        Analyze forecast bias trends by location and product group
        
        Args:
            request: Bias analysis request parameters
            
        Returns:
            Comprehensive bias analysis response
        """
        try:
            # Set default date range if not provided
            end_date = request.end_date or date.today()
            start_date = request.start_date or end_date - timedelta(days=90)
            
            # Get forecast and actual data
            demand_data = await self.s3_service.get_demand_forecast_data(limit=None)
            
            if not demand_data:
                return self._create_empty_bias_response(start_date, end_date, "No forecast data available")
            
            # Convert to DataFrame and add synthetic actual values for demonstration
            df = pd.DataFrame(demand_data)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            
            # Generate synthetic actual values (in practice, would come from actual sales data)
            df['actual_value'] = df['target_value'] * (0.9 + np.random.random(len(df)) * 0.2)
            
            # Apply filters
            df = self._apply_bias_filters(df, request, start_date, end_date)
            
            if df.empty:
                return self._create_empty_bias_response(start_date, end_date, "No data after applying filters")
            
            # Calculate overall bias metrics
            overall_bias = self._calculate_overall_bias(df)
            
            # Analyze bias by location
            location_analyses = await self._analyze_bias_by_location(df, request.aggregation_level)
            
            # Analyze temporal trends
            temporal_trends = self._analyze_temporal_bias_trends(df, request.aggregation_level)
            
            # Identify bias patterns
            bias_patterns = self._identify_bias_patterns(location_analyses, temporal_trends)
            
            # Generate corrective actions
            corrective_actions = self._generate_corrective_actions(overall_bias, location_analyses)
            
            # Create analysis period
            analysis_period = AnalysisPeriod(
                start_date=start_date,
                end_date=end_date,
                total_days=(end_date - start_date).days,
                data_points=len(df)
            )
            
            return ForecastBiasTrendsResponse(
                analysis_period=analysis_period,
                overall_bias_metrics=overall_bias,
                location_analyses=location_analyses,
                temporal_trends=temporal_trends,
                bias_patterns=bias_patterns,
                corrective_actions=corrective_actions
            )
            
        except Exception as e:
            return self._create_empty_bias_response(
                start_date or date.today() - timedelta(days=90),
                end_date or date.today(),
                f"Error in bias analysis: {str(e)}"
            )
    
    async def analyze_sku_lifecycle(self, request: LifecycleAnalysisRequest) -> SKULifecycleResponse:
        """Perform SKU lifecycle analysis using the dedicated service"""
        return await self.lifecycle_service.classify_sku_lifecycles(
            sku_filter=request.sku_filter,
            category_filter=request.category_filter,
            start_date=request.start_date,
            end_date=request.end_date,
            min_data_points=request.min_data_points,
            include_transition_probabilities=request.include_transition_probabilities
        )
    
    async def analyze_product_mix_shift(self, request: MixAnalysisRequest) -> ProductMixShiftResponse:
        """
        Analyze product mix shifts over time
        
        Args:
            request: Mix analysis request parameters
            
        Returns:
            Product mix shift analysis response
        """
        try:
            # Set default date ranges
            end_date = request.end_date or date.today()
            start_date = request.start_date or end_date - timedelta(days=90)
            comparison_end = start_date - timedelta(days=1)
            comparison_start = comparison_end - timedelta(days=request.comparison_period_days)
            
            # Get demand data
            demand_data = await self.s3_service.get_demand_forecast_data(limit=None)
            
            if not demand_data:
                return self._create_empty_mix_response(start_date, end_date, "No demand data available")
            
            # Convert to DataFrame
            df = pd.DataFrame(demand_data)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            
            # Apply filters
            df = self._apply_mix_filters(df, request)
            
            if df.empty:
                return self._create_empty_mix_response(start_date, end_date, "No data after applying filters")
            
            # Split data into current and comparison periods
            current_data = df[
                (df['timestamp'].dt.date >= start_date) & 
                (df['timestamp'].dt.date <= end_date)
            ]
            comparison_data = df[
                (df['timestamp'].dt.date >= comparison_start) & 
                (df['timestamp'].dt.date <= comparison_end)
            ]
            
            # Analyze mix shifts by category
            category_analyses = self._analyze_category_mix_shifts(
                current_data, comparison_data, request.min_significance_level
            )
            
            # Calculate overall mix stability
            overall_stability = self._calculate_mix_stability(category_analyses)
            
            # Identify significant shifts
            significant_shifts = self._identify_significant_shifts(
                category_analyses, request.min_significance_level
            )
            
            # Generate insights
            market_implications = self._generate_market_implications(category_analyses)
            strategic_insights = self._generate_strategic_insights(category_analyses, significant_shifts)
            
            # Create analysis periods
            analysis_period = AnalysisPeriod(
                start_date=start_date,
                end_date=end_date,
                total_days=(end_date - start_date).days,
                data_points=len(current_data)
            )
            
            comparison_period = AnalysisPeriod(
                start_date=comparison_start,
                end_date=comparison_end,
                total_days=(comparison_end - comparison_start).days,
                data_points=len(comparison_data)
            )
            
            return ProductMixShiftResponse(
                analysis_period=analysis_period,
                comparison_period=comparison_period,
                overall_mix_stability=overall_stability,
                category_analyses=category_analyses,
                significant_shifts=significant_shifts,
                market_implications=market_implications,
                strategic_insights=strategic_insights
            )
            
        except Exception as e:
            return self._create_empty_mix_response(
                start_date or date.today() - timedelta(days=90),
                end_date or date.today(),
                f"Error in mix analysis: {str(e)}"
            )
    
    async def analyze_forecast_stability_index(self, request: StabilityAnalysisRequest) -> ForecastStabilityIndexResponse:
        """
        Analyze forecast stability across products and locations
        
        Args:
            request: Stability analysis request parameters
            
        Returns:
            Forecast stability index response
        """
        try:
            # Set default date range
            end_date = request.end_date or date.today()
            start_date = request.start_date or end_date - timedelta(days=180)  # 6 months default
            
            # Get forecast data
            demand_data = await self.s3_service.get_demand_forecast_data(limit=None)
            
            if not demand_data:
                return self._create_empty_stability_response(start_date, end_date, "No forecast data available")
            
            # Convert to DataFrame
            df = pd.DataFrame(demand_data)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            
            # Apply filters
            df = self._apply_stability_filters(df, request, start_date, end_date)
            
            if df.empty:
                return self._create_empty_stability_response(start_date, end_date, "No data after applying filters")
            
            # Analyze stability by location
            location_analyses = await self._analyze_stability_by_location(
                df, request.stability_window_days, request.include_volatility_breakdown
            )
            
            # Calculate overall stability index
            overall_stability = self._calculate_overall_stability_index(location_analyses)
            
            # Create stability distribution
            stability_distribution = self._create_stability_distribution(location_analyses)
            
            # Generate benchmarks
            stability_benchmarks = self._generate_stability_benchmarks(location_analyses)
            
            # Generate recommendations and alerts
            improvement_recommendations = self._generate_stability_recommendations(location_analyses)
            risk_alerts = self._generate_stability_risk_alerts(location_analyses)
            
            # Create analysis period
            analysis_period = AnalysisPeriod(
                start_date=start_date,
                end_date=end_date,
                total_days=(end_date - start_date).days,
                data_points=len(df)
            )
            
            return ForecastStabilityIndexResponse(
                analysis_period=analysis_period,
                overall_stability_index=overall_stability,
                stability_distribution=stability_distribution,
                location_analyses=location_analyses,
                stability_benchmarks=stability_benchmarks,
                improvement_recommendations=improvement_recommendations,
                risk_alerts=risk_alerts
            )
            
        except Exception as e:
            return self._create_empty_stability_response(
                start_date or date.today() - timedelta(days=180),
                end_date or date.today(),
                f"Error in stability analysis: {str(e)}"
            )
    
    # Helper methods for bias analysis
    def _calculate_overall_bias(self, df: pd.DataFrame) -> BiasMetrics:
        """Calculate overall bias metrics across all data"""
        try:
            forecasts = df['target_value'].values
            actuals = df['actual_value'].values
            
            bias_result = self.statistical_analyzer.calculate_forecast_bias(forecasts, actuals)
            
            return BiasMetrics(
                mean_bias=bias_result['mean_bias'],
                median_bias=bias_result['median_bias'],
                bias_percentage=bias_result['mean_percentage_error'],
                systematic_bias=bias_result['is_systematic'],
                bias_direction=bias_result['bias_direction']
            )
            
        except Exception as e:
            return BiasMetrics(
                mean_bias=0.0,
                median_bias=0.0,
                bias_percentage=0.0,
                systematic_bias=False,
                bias_direction='unknown'
            )
    
    async def _analyze_bias_by_location(self, df: pd.DataFrame, aggregation_level: str) -> List[LocationBiasAnalysis]:
        """Analyze bias by location/warehouse"""
        location_analyses = []
        
        try:
            # Group by location (using source_file as proxy for location)
            locations = df['source_file'].unique() if 'source_file' in df.columns else ['WAREHOUSE_01']
            
            for i, location in enumerate(locations):
                location_code = f"WH_{i+1:02d}"
                location_name = f"Warehouse {i+1}"
                
                if 'source_file' in df.columns:
                    location_data = df[df['source_file'] == location]
                else:
                    # Split data evenly across synthetic locations
                    start_idx = i * len(df) // len(locations)
                    end_idx = (i + 1) * len(df) // len(locations)
                    location_data = df.iloc[start_idx:end_idx]
                
                if len(location_data) < 5:
                    continue
                
                # Calculate location bias metrics
                forecasts = location_data['target_value'].values
                actuals = location_data['actual_value'].values
                
                bias_result = self.statistical_analyzer.calculate_forecast_bias(forecasts, actuals)
                
                location_bias = BiasMetrics(
                    mean_bias=bias_result['mean_bias'],
                    median_bias=bias_result['median_bias'],
                    bias_percentage=bias_result['mean_percentage_error'],
                    systematic_bias=bias_result['is_systematic'],
                    bias_direction=bias_result['bias_direction']
                )
                
                # Calculate product group bias (simplified)
                product_groups = {}
                if len(location_data) > 10:
                    # Split into product groups based on SKU prefix
                    for prefix in ['108', '107', '109']:
                        group_data = location_data[location_data['item_id'].str.startswith(prefix)]
                        if len(group_data) >= 3:
                            group_forecasts = group_data['target_value'].values
                            group_actuals = group_data['actual_value'].values
                            group_bias = self.statistical_analyzer.calculate_forecast_bias(group_forecasts, group_actuals)
                            
                            product_groups[f"Category_{prefix}"] = BiasMetrics(
                                mean_bias=group_bias['mean_bias'],
                                median_bias=group_bias['median_bias'],
                                bias_percentage=group_bias['mean_percentage_error'],
                                systematic_bias=group_bias['is_systematic'],
                                bias_direction=group_bias['bias_direction']
                            )
                
                # Calculate trend analysis
                trend_analysis = self._calculate_bias_trends(location_data, aggregation_level)
                
                # Calculate data quality score
                data_quality_score = self._calculate_data_quality_score(location_data)
                
                location_analyses.append(LocationBiasAnalysis(
                    location_code=location_code,
                    location_name=location_name,
                    bias_metrics=location_bias,
                    product_groups=product_groups,
                    trend_analysis=trend_analysis,
                    data_quality_score=data_quality_score
                ))
                
        except Exception as e:
            print(f"Error in location bias analysis: {str(e)}")
        
        return location_analyses
    
    def _calculate_bias_trends(self, data: pd.DataFrame, aggregation_level: str) -> Dict[str, float]:
        """Calculate bias trend metrics"""
        try:
            if aggregation_level == 'weekly':
                data['period'] = data['timestamp'].dt.isocalendar().week
            elif aggregation_level == 'monthly':
                data['period'] = data['timestamp'].dt.month
            else:  # daily
                data['period'] = data['timestamp'].dt.dayofyear
            
            period_bias = []
            for period in data['period'].unique():
                period_data = data[data['period'] == period]
                if len(period_data) >= 2:
                    forecasts = period_data['target_value'].values
                    actuals = period_data['actual_value'].values
                    bias_result = self.statistical_analyzer.calculate_forecast_bias(forecasts, actuals)
                    period_bias.append(bias_result['mean_bias'])
            
            if len(period_bias) >= 2:
                trend_slope = np.polyfit(range(len(period_bias)), period_bias, 1)[0]
                trend_r_squared = self.statistical_analyzer.analyze_trend(np.array(period_bias))['r_squared']
                return {
                    'bias_trend_slope': float(trend_slope),
                    'trend_strength': float(trend_r_squared),
                    'trend_periods': len(period_bias)
                }
            else:
                return {'bias_trend_slope': 0.0, 'trend_strength': 0.0, 'trend_periods': 0}
                
        except:
            return {'bias_trend_slope': 0.0, 'trend_strength': 0.0, 'trend_periods': 0}
    
    def _calculate_data_quality_score(self, data: pd.DataFrame) -> float:
        """Calculate data quality score for location"""
        try:
            # Factors affecting data quality
            completeness = 1.0 - (data.isnull().sum().sum() / (len(data) * len(data.columns)))
            
            # Consistency (low variance in bias)
            forecasts = data['target_value'].values
            actuals = data['actual_value'].values
            errors = forecasts - actuals
            consistency = 1.0 / (1.0 + np.std(errors))
            
            # Recency (more recent data gets higher score)
            max_date = data['timestamp'].max()
            min_date = data['timestamp'].min()
            days_span = (max_date - min_date).days
            recency = min(1.0, 30.0 / max(1, days_span))  # 30 days is optimal
            
            # Overall score
            quality_score = (completeness * 0.4 + consistency * 0.4 + recency * 0.2)
            return float(min(1.0, max(0.0, quality_score)))
            
        except:
            return 0.5
    
    # Helper methods for mix analysis
    def _analyze_category_mix_shifts(self, 
                                   current_data: pd.DataFrame, 
                                   comparison_data: pd.DataFrame,
                                   min_significance: float) -> List[CategoryMixAnalysis]:
        """Analyze mix shifts by category"""
        category_analyses = []
        
        try:
            # Calculate current period mix
            current_total = current_data['target_value'].sum()
            current_category_sums = {}
            
            for prefix, category in [('108', 'Electronics'), ('107', 'Lighting'), ('109', 'Accessories')]:
                current_cat_data = current_data[current_data['item_id'].str.startswith(prefix)]
                current_category_sums[category] = current_cat_data['target_value'].sum()
            
            # Calculate comparison period mix
            comparison_total = comparison_data['target_value'].sum()
            comparison_category_sums = {}
            
            for prefix, category in [('108', 'Electronics'), ('107', 'Lighting'), ('109', 'Accessories')]:
                comp_cat_data = comparison_data[comparison_data['item_id'].str.startswith(prefix)]
                comparison_category_sums[category] = comp_cat_data['target_value'].sum()
            
            # Analyze each category
            for category in ['Electronics', 'Lighting', 'Accessories']:
                current_sum = current_category_sums.get(category, 0)
                comparison_sum = comparison_category_sums.get(category, 0)
                
                current_mix_pct = (current_sum / current_total * 100) if current_total > 0 else 0
                comparison_mix_pct = (comparison_sum / comparison_total * 100) if comparison_total > 0 else 0
                
                mix_change = current_mix_pct - comparison_mix_pct
                
                # Calculate mix metrics
                mix_metrics = self._calculate_mix_metrics(
                    current_sum, comparison_sum, current_total, comparison_total, min_significance
                )
                
                # Determine impact assessment
                if abs(mix_change) < 1.0:
                    impact = "Minimal impact"
                elif abs(mix_change) < 3.0:
                    impact = "Moderate impact"
                else:
                    impact = "Significant impact"
                
                # Identify key drivers
                key_drivers = self._identify_mix_drivers(category, mix_change)
                
                category_analyses.append(CategoryMixAnalysis(
                    category_name=category,
                    current_mix_percentage=current_mix_pct,
                    previous_mix_percentage=comparison_mix_pct,
                    mix_change=mix_change,
                    mix_metrics=mix_metrics,
                    key_drivers=key_drivers,
                    impact_assessment=impact
                ))
                
        except Exception as e:
            print(f"Error in category mix analysis: {str(e)}")
        
        return category_analyses
    
    def _calculate_mix_metrics(self, 
                             current_sum: float, 
                             comparison_sum: float,
                             current_total: float, 
                             comparison_total: float,
                             min_significance: float) -> ProductMixMetrics:
        """Calculate product mix metrics"""
        try:
            # Mix shift magnitude
            current_ratio = current_sum / current_total if current_total > 0 else 0
            comparison_ratio = comparison_sum / comparison_total if comparison_total > 0 else 0
            shift_magnitude = abs(current_ratio - comparison_ratio)
            
            # Shift direction
            if current_ratio > comparison_ratio:
                shift_direction = "increasing"
            elif current_ratio < comparison_ratio:
                shift_direction = "decreasing"
            else:
                shift_direction = "stable"
            
            # Statistical significance (simplified chi-square test approximation)
            expected_current = comparison_ratio * current_total
            if expected_current > 0:
                chi_square = ((current_sum - expected_current) ** 2) / expected_current
                p_value = max(0.001, min(0.999, 1.0 - min(1.0, chi_square / 10.0)))  # Simplified
            else:
                p_value = 1.0
            
            significance = StatisticalSignificance(
                p_value=p_value,
                confidence_level=1.0 - p_value,
                is_significant=p_value < min_significance
            )
            
            # Contribution change
            contribution_change = current_ratio - comparison_ratio
            
            return ProductMixMetrics(
                mix_shift_magnitude=shift_magnitude,
                mix_shift_direction=shift_direction,
                statistical_significance=significance,
                contribution_change=contribution_change
            )
            
        except Exception as e:
            return ProductMixMetrics(
                mix_shift_magnitude=0.0,
                mix_shift_direction="unknown",
                statistical_significance=StatisticalSignificance(p_value=1.0, confidence_level=0.0, is_significant=False),
                contribution_change=0.0
            )
    
    def _identify_mix_drivers(self, category: str, mix_change: float) -> List[str]:
        """Identify key drivers of mix changes"""
        drivers = []
        
        try:
            if abs(mix_change) > 2.0:  # Significant change
                if mix_change > 0:
                    drivers.extend([
                        f"Increased demand for {category} products",
                        "Market expansion in category",
                        "Successful promotional activities"
                    ])
                else:
                    drivers.extend([
                        f"Decreased demand for {category} products",
                        "Market saturation effects",
                        "Competitive pressures"
                    ])
            
            # Category-specific drivers
            if category == 'Electronics':
                if mix_change > 0:
                    drivers.append("Technology adoption trends")
                else:
                    drivers.append("Product lifecycle maturation")
            elif category == 'Lighting':
                if mix_change > 0:
                    drivers.append("Infrastructure development")
                else:
                    drivers.append("Energy efficiency transitions")
                    
        except Exception as e:
            drivers.append(f"Analysis error: {str(e)}")
        
        return drivers
    
    # Helper methods for stability analysis
    async def _analyze_stability_by_location(self, 
                                           df: pd.DataFrame, 
                                           window_days: int,
                                           include_volatility: bool) -> List[LocationStabilityAnalysis]:
        """Analyze forecast stability by location"""
        location_analyses = []
        
        try:
            # Group by location (simplified)
            locations = ['WAREHOUSE_01', 'WAREHOUSE_02', 'WAREHOUSE_03']
            
            for i, location_code in enumerate(locations):
                # Split data for different locations
                start_idx = i * len(df) // len(locations)
                end_idx = (i + 1) * len(df) // len(locations)
                location_data = df.iloc[start_idx:end_idx]
                
                if len(location_data) < window_days:
                    continue
                
                # Calculate stability metrics
                values = location_data['target_value'].values
                stability_result = self.time_series_analyzer.calculate_stability_index(values, window_days)
                
                stability_metrics = StabilityMetrics(
                    coefficient_of_variation=stability_result.get('volatility_score', 0.0),
                    mean_absolute_revision=self._calculate_revision_metric(values),
                    forecast_revision_frequency=self._calculate_revision_frequency(values),
                    stability_score=stability_result.get('stability_index', 0.0),
                    volatility_index=stability_result.get('volatility_score', 0.0)
                )
                
                # Classify stability level
                stability_level = self._classify_stability_level(stability_metrics.stability_score)
                
                # Product stability breakdown
                product_breakdown = {}
                if include_volatility:
                    product_breakdown = self._calculate_product_stability_breakdown(location_data, window_days)
                
                # Stability trends
                stability_trends = self._calculate_stability_trends(values, window_days)
                
                # Improvement opportunities
                improvement_opportunities = self._identify_stability_improvements(stability_metrics, stability_level)
                
                location_analyses.append(LocationStabilityAnalysis(
                    location_code=location_code,
                    location_name=f"Warehouse {i+1}",
                    stability_level=stability_level,
                    stability_metrics=stability_metrics,
                    product_stability_breakdown=product_breakdown,
                    stability_trends=stability_trends,
                    improvement_opportunities=improvement_opportunities
                ))
                
        except Exception as e:
            print(f"Error in stability analysis: {str(e)}")
        
        return location_analyses
    
    def _classify_stability_level(self, stability_score: float) -> StabilityLevel:
        """Classify stability score into levels"""
        if stability_score >= 0.8:
            return StabilityLevel.VERY_STABLE
        elif stability_score >= 0.6:
            return StabilityLevel.STABLE
        elif stability_score >= 0.4:
            return StabilityLevel.MODERATE
        elif stability_score >= 0.2:
            return StabilityLevel.VOLATILE
        else:
            return StabilityLevel.VERY_VOLATILE
    
    def _calculate_revision_metric(self, values: np.ndarray) -> float:
        """Calculate mean absolute revision metric"""
        try:
            if len(values) < 2:
                return 0.0
            
            # Calculate period-over-period changes as proxy for revisions
            revisions = np.abs(np.diff(values))
            return float(np.mean(revisions))
            
        except:
            return 0.0
    
    def _calculate_revision_frequency(self, values: np.ndarray) -> float:
        """Calculate revision frequency"""
        try:
            if len(values) < 2:
                return 0.0
            
            # Count significant changes (>5% change as revision)
            changes = np.abs(np.diff(values)) / values[:-1]
            significant_changes = np.sum(changes > 0.05)
            frequency = significant_changes / len(changes)
            return float(frequency)
            
        except:
            return 0.0
    
    # Additional helper methods for filters and empty responses
    def _apply_bias_filters(self, df: pd.DataFrame, request: BiasAnalysisRequest, start_date: date, end_date: date) -> pd.DataFrame:
        """Apply filters for bias analysis"""
        try:
            # Date filter
            df = df[(df['timestamp'].dt.date >= start_date) & (df['timestamp'].dt.date <= end_date)]
            
            # SKU filter
            if request.sku_filter:
                df = df[df['item_id'].isin(request.sku_filter)]
            
            # Location filter (simplified)
            if request.location_filter:
                # Would normally filter by actual location field
                pass
            
            return df
            
        except:
            return pd.DataFrame()
    
    def _apply_mix_filters(self, df: pd.DataFrame, request: MixAnalysisRequest) -> pd.DataFrame:
        """Apply filters for mix analysis"""
        try:
            # SKU filter
            if request.sku_filter:
                df = df[df['item_id'].isin(request.sku_filter)]
            
            # Category filter (simplified)
            if request.category_filter:
                category_skus = []
                for category in request.category_filter:
                    if category == 'Electronics':
                        category_skus.extend([sku for sku in df['item_id'].unique() if sku.startswith('108')])
                    elif category == 'Lighting':
                        category_skus.extend([sku for sku in df['item_id'].unique() if sku.startswith('107')])
                    elif category == 'Accessories':
                        category_skus.extend([sku for sku in df['item_id'].unique() if sku.startswith('109')])
                
                if category_skus:
                    df = df[df['item_id'].isin(category_skus)]
            
            return df
            
        except:
            return pd.DataFrame()
    
    def _apply_stability_filters(self, df: pd.DataFrame, request: StabilityAnalysisRequest, start_date: date, end_date: date) -> pd.DataFrame:
        """Apply filters for stability analysis"""
        try:
            # Date filter
            df = df[(df['timestamp'].dt.date >= start_date) & (df['timestamp'].dt.date <= end_date)]
            
            # SKU filter
            if request.sku_filter:
                df = df[df['item_id'].isin(request.sku_filter)]
            
            # Location filter
            if request.location_filter:
                # Would normally filter by actual location field
                pass
            
            return df
            
        except:
            return pd.DataFrame()
    
    # Methods for creating empty responses
    def _create_empty_bias_response(self, start_date: date, end_date: date, reason: str) -> ForecastBiasTrendsResponse:
        """Create empty bias response"""
        analysis_period = AnalysisPeriod(
            start_date=start_date,
            end_date=end_date,
            total_days=(end_date - start_date).days,
            data_points=0
        )
        
        return ForecastBiasTrendsResponse(
            analysis_period=analysis_period,
            overall_bias_metrics=BiasMetrics(
                mean_bias=0.0,
                median_bias=0.0,
                bias_percentage=0.0,
                systematic_bias=False,
                bias_direction='unknown'
            ),
            location_analyses=[],
            temporal_trends=[],
            bias_patterns=[reason],
            corrective_actions=["Ensure sufficient data is available for bias analysis"]
        )
    
    def _create_empty_mix_response(self, start_date: date, end_date: date, reason: str) -> ProductMixShiftResponse:
        """Create empty mix response"""
        analysis_period = AnalysisPeriod(
            start_date=start_date,
            end_date=end_date,
            total_days=(end_date - start_date).days,
            data_points=0
        )
        
        return ProductMixShiftResponse(
            analysis_period=analysis_period,
            comparison_period=analysis_period,
            overall_mix_stability=0.0,
            category_analyses=[],
            significant_shifts=[],
            market_implications=[reason],
            strategic_insights=["Ensure sufficient data is available for mix analysis"]
        )
    
    def _create_empty_stability_response(self, start_date: date, end_date: date, reason: str) -> ForecastStabilityIndexResponse:
        """Create empty stability response"""
        analysis_period = AnalysisPeriod(
            start_date=start_date,
            end_date=end_date,
            total_days=(end_date - start_date).days,
            data_points=0
        )
        
        return ForecastStabilityIndexResponse(
            analysis_period=analysis_period,
            overall_stability_index=0.0,
            stability_distribution={level: 0 for level in StabilityLevel},
            location_analyses=[],
            stability_benchmarks={},
            improvement_recommendations=[reason],
            risk_alerts=["Ensure sufficient data is available for stability analysis"]
        )
    
    # Additional helper methods for generating insights and recommendations
    def _analyze_temporal_bias_trends(self, df: pd.DataFrame, aggregation_level: str) -> List[Dict[str, Any]]:
        """Analyze temporal bias trends"""
        trends = []
        
        try:
            # Group by time period
            if aggregation_level == 'weekly':
                df['period'] = df['timestamp'].dt.isocalendar().week
                period_name = 'week'
            elif aggregation_level == 'monthly':
                df['period'] = df['timestamp'].dt.month
                period_name = 'month'
            else:  # daily
                df['period'] = df['timestamp'].dt.dayofyear
                period_name = 'day'
            
            for period in sorted(df['period'].unique()):
                period_data = df[df['period'] == period]
                if len(period_data) >= 2:
                    forecasts = period_data['target_value'].values
                    actuals = period_data['actual_value'].values
                    bias_result = self.statistical_analyzer.calculate_forecast_bias(forecasts, actuals)
                    
                    trends.append({
                        'period': int(period),
                        'period_type': period_name,
                        'bias': bias_result['mean_bias'],
                        'bias_percentage': bias_result['mean_percentage_error'],
                        'data_points': len(period_data)
                    })
                    
        except Exception as e:
            trends.append({'error': str(e)})
        
        return trends
    
    def _identify_bias_patterns(self, location_analyses: List[LocationBiasAnalysis], temporal_trends: List[Dict[str, Any]]) -> List[str]:
        """Identify bias patterns"""
        patterns = []
        
        try:
            # Location-based patterns
            high_bias_locations = [loc for loc in location_analyses if abs(loc.bias_metrics.mean_bias) > 50]
            if high_bias_locations:
                patterns.append(f"{len(high_bias_locations)} locations show high bias levels")
            
            # Systematic bias patterns
            systematic_locations = [loc for loc in location_analyses if loc.bias_metrics.systematic_bias]
            if systematic_locations:
                patterns.append(f"{len(systematic_locations)} locations show systematic bias")
            
            # Temporal patterns
            if temporal_trends:
                bias_values = [t.get('bias', 0) for t in temporal_trends if 'bias' in t]
                if bias_values:
                    if all(b > 0 for b in bias_values):
                        patterns.append("Consistent over-forecasting across all periods")
                    elif all(b < 0 for b in bias_values):
                        patterns.append("Consistent under-forecasting across all periods")
                    else:
                        patterns.append("Mixed bias patterns across different periods")
                        
        except Exception as e:
            patterns.append(f"Error identifying patterns: {str(e)}")
        
        return patterns
    
    def _generate_corrective_actions(self, overall_bias: BiasMetrics, location_analyses: List[LocationBiasAnalysis]) -> List[str]:
        """Generate corrective actions for bias issues"""
        actions = []
        
        try:
            # Overall bias corrections
            if abs(overall_bias.mean_bias) > 25:
                actions.append("Implement bias correction factors in forecasting models")
            
            if overall_bias.systematic_bias:
                actions.append("Investigate systematic forecasting errors and model calibration")
            
            # Location-specific actions
            problem_locations = [loc for loc in location_analyses if abs(loc.bias_metrics.mean_bias) > 50]
            if problem_locations:
                actions.append(f"Focus on improving forecasting accuracy for {len(problem_locations)} high-bias locations")
            
            # Data quality actions
            low_quality_locations = [loc for loc in location_analyses if loc.data_quality_score < 0.6]
            if low_quality_locations:
                actions.append("Improve data collection and validation processes for low-quality locations")
            
            # General recommendations
            actions.extend([
                "Implement regular bias monitoring and reporting",
                "Consider ensemble forecasting methods to reduce bias",
                "Establish bias thresholds and automated alerts"
            ])
            
        except Exception as e:
            actions.append(f"Error generating actions: {str(e)}")
        
        return actions
    
    # Additional helper methods for mix analysis
    def _calculate_mix_stability(self, category_analyses: List[CategoryMixAnalysis]) -> float:
        """Calculate overall mix stability"""
        try:
            if not category_analyses:
                return 0.0
            
            # Calculate stability as inverse of total mix change magnitude
            total_change = sum(abs(cat.mix_change) for cat in category_analyses)
            stability = max(0.0, 1.0 - (total_change / 100.0))  # Normalize to 0-1
            return float(stability)
            
        except:
            return 0.0
    
    def _identify_significant_shifts(self, category_analyses: List[CategoryMixAnalysis], min_significance: float) -> List[Dict[str, Any]]:
        """Identify statistically significant mix shifts"""
        significant_shifts = []
        
        try:
            for category in category_analyses:
                if category.mix_metrics.statistical_significance.is_significant:
                    significant_shifts.append({
                        'category': category.category_name,
                        'mix_change': category.mix_change,
                        'direction': category.mix_metrics.mix_shift_direction,
                        'magnitude': category.mix_metrics.mix_shift_magnitude,
                        'confidence': category.mix_metrics.statistical_significance.confidence_level,
                        'impact': category.impact_assessment
                    })
                    
        except Exception as e:
            significant_shifts.append({'error': str(e)})
        
        return significant_shifts
    
    def _generate_market_implications(self, category_analyses: List[CategoryMixAnalysis]) -> List[str]:
        """Generate market implications from mix analysis"""
        implications = []
        
        try:
            for category in category_analyses:
                if abs(category.mix_change) > 2.0:  # Significant change
                    if category.mix_change > 0:
                        implications.append(f"{category.category_name} category showing growth - potential market opportunity")
                    else:
                        implications.append(f"{category.category_name} category declining - may need strategic intervention")
            
            # Overall portfolio implications
            growing_categories = [cat for cat in category_analyses if cat.mix_change > 1.0]
            declining_categories = [cat for cat in category_analyses if cat.mix_change < -1.0]
            
            if len(growing_categories) > len(declining_categories):
                implications.append("Portfolio showing overall positive mix shifts")
            elif len(declining_categories) > len(growing_categories):
                implications.append("Portfolio showing concerning decline patterns")
            else:
                implications.append("Portfolio mix changes are balanced")
                
        except Exception as e:
            implications.append(f"Error generating implications: {str(e)}")
        
        return implications
    
    def _generate_strategic_insights(self, category_analyses: List[CategoryMixAnalysis], significant_shifts: List[Dict[str, Any]]) -> List[str]:
        """Generate strategic insights from mix analysis"""
        insights = []
        
        try:
            if significant_shifts:
                insights.append(f"{len(significant_shifts)} categories show statistically significant mix changes")
            
            # Identify dominant trends
            increasing_categories = [cat for cat in category_analyses if cat.mix_change > 0]
            if len(increasing_categories) > len(category_analyses) / 2:
                insights.append("Majority of categories showing positive mix trends")
            
            # Risk insights
            volatile_categories = [cat for cat in category_analyses if abs(cat.mix_change) > 5.0]
            if volatile_categories:
                insights.append(f"High volatility detected in {len(volatile_categories)} categories - monitor closely")
            
            # Strategic recommendations
            insights.extend([
                "Consider portfolio rebalancing based on mix trends",
                "Align inventory and capacity planning with mix shifts",
                "Monitor competitive dynamics in shifting categories"
            ])
            
        except Exception as e:
            insights.append(f"Error generating insights: {str(e)}")
        
        return insights
    
    # Additional helper methods for stability analysis
    def _calculate_overall_stability_index(self, location_analyses: List[LocationStabilityAnalysis]) -> float:
        """Calculate overall stability index"""
        try:
            if not location_analyses:
                return 0.0
            
            stability_scores = [loc.stability_metrics.stability_score for loc in location_analyses]
            return float(np.mean(stability_scores))
            
        except:
            return 0.0
    
    def _create_stability_distribution(self, location_analyses: List[LocationStabilityAnalysis]) -> Dict[StabilityLevel, int]:
        """Create stability level distribution"""
        distribution = {level: 0 for level in StabilityLevel}
        
        try:
            for location in location_analyses:
                distribution[location.stability_level] += 1
                
        except:
            pass
        
        return distribution
    
    def _generate_stability_benchmarks(self, location_analyses: List[LocationStabilityAnalysis]) -> Dict[str, float]:
        """Generate stability benchmarks"""
        benchmarks = {}
        
        try:
            if location_analyses:
                stability_scores = [loc.stability_metrics.stability_score for loc in location_analyses]
                volatility_scores = [loc.stability_metrics.volatility_index for loc in location_analyses]
                
                benchmarks = {
                    'average_stability': float(np.mean(stability_scores)),
                    'top_quartile_stability': float(np.percentile(stability_scores, 75)),
                    'bottom_quartile_stability': float(np.percentile(stability_scores, 25)),
                    'average_volatility': float(np.mean(volatility_scores)),
                    'target_stability': 0.8,  # Business target
                    'minimum_acceptable_stability': 0.4
                }
                
        except Exception as e:
            benchmarks['error'] = str(e)
        
        return benchmarks
    
    def _generate_stability_recommendations(self, location_analyses: List[LocationStabilityAnalysis]) -> List[str]:
        """Generate stability improvement recommendations"""
        recommendations = []
        
        try:
            # Location-specific recommendations
            unstable_locations = [loc for loc in location_analyses if loc.stability_level in [StabilityLevel.VOLATILE, StabilityLevel.VERY_VOLATILE]]
            if unstable_locations:
                recommendations.append(f"Implement stability improvement plans for {len(unstable_locations)} volatile locations")
            
            # Overall recommendations
            recommendations.extend([
                "Implement rolling forecast validation to improve stability",
                "Consider ensemble forecasting methods for high-volatility products",
                "Establish stability monitoring dashboards and alerts",
                "Review and update forecasting models quarterly"
            ])
            
            # Best practice sharing
            stable_locations = [loc for loc in location_analyses if loc.stability_level == StabilityLevel.VERY_STABLE]
            if stable_locations:
                recommendations.append(f"Share best practices from {len(stable_locations)} highly stable locations")
                
        except Exception as e:
            recommendations.append(f"Error generating recommendations: {str(e)}")
        
        return recommendations
    
    def _generate_stability_risk_alerts(self, location_analyses: List[LocationStabilityAnalysis]) -> List[str]:
        """Generate stability risk alerts"""
        alerts = []
        
        try:
            # High volatility alerts
            very_volatile = [loc for loc in location_analyses if loc.stability_level == StabilityLevel.VERY_VOLATILE]
            if very_volatile:
                alerts.append(f"CRITICAL: {len(very_volatile)} locations with very high volatility")
            
            # Declining stability alerts
            for location in location_analyses:
                if location.stability_trends:
                    # Check if stability is declining (simplified)
                    recent_trend = location.stability_trends[-1] if location.stability_trends else {}
                    if recent_trend.get('trend', 0) < -0.1:
                        alerts.append(f"WARNING: {location.location_code} showing declining stability trend")
            
            # Low revision frequency alerts (could indicate stale forecasts)
            low_revision = [loc for loc in location_analyses if loc.stability_metrics.forecast_revision_frequency < 0.1]
            if low_revision:
                alerts.append(f"INFO: {len(low_revision)} locations with low revision frequency - verify forecast freshness")
                
        except Exception as e:
            alerts.append(f"Error generating alerts: {str(e)}")
        
        return alerts
    
    def _calculate_product_stability_breakdown(self, location_data: pd.DataFrame, window_days: int) -> Dict[str, StabilityMetrics]:
        """Calculate stability breakdown by product category"""
        breakdown = {}
        
        try:
            # Group by product category (based on SKU prefix)
            for prefix, category in [('108', 'Electronics'), ('107', 'Lighting'), ('109', 'Accessories')]:
                category_data = location_data[location_data['item_id'].str.startswith(prefix)]
                
                if len(category_data) >= window_days:
                    values = category_data['target_value'].values
                    stability_result = self.time_series_analyzer.calculate_stability_index(values, window_days)
                    
                    breakdown[category] = StabilityMetrics(
                        coefficient_of_variation=stability_result.get('volatility_score', 0.0),
                        mean_absolute_revision=self._calculate_revision_metric(values),
                        forecast_revision_frequency=self._calculate_revision_frequency(values),
                        stability_score=stability_result.get('stability_index', 0.0),
                        volatility_index=stability_result.get('volatility_score', 0.0)
                    )
                    
        except Exception as e:
            breakdown['error'] = str(e)
        
        return breakdown
    
    def _calculate_stability_trends(self, values: np.ndarray, window_days: int) -> List[Dict[str, Any]]:
        """Calculate stability trends over time"""
        trends = []
        
        try:
            # Calculate rolling stability metrics
            if len(values) >= window_days * 2:
                for i in range(window_days, len(values), window_days // 2):  # Overlapping windows
                    window_data = values[i-window_days:i]
                    stability_result = self.time_series_analyzer.calculate_stability_index(window_data, window_days // 2)
                    
                    trends.append({
                        'period': i // (window_days // 2),
                        'stability_score': stability_result.get('stability_index', 0.0),
                        'volatility_score': stability_result.get('volatility_score', 0.0),
                        'trend': 0.0  # Would calculate trend between periods
                    })
                    
        except Exception as e:
            trends.append({'error': str(e)})
        
        return trends
    
    def _identify_stability_improvements(self, metrics: StabilityMetrics, level: StabilityLevel) -> List[str]:
        """Identify specific improvement opportunities"""
        improvements = []
        
        try:
            if level in [StabilityLevel.VOLATILE, StabilityLevel.VERY_VOLATILE]:
                improvements.extend([
                    "Implement demand smoothing techniques",
                    "Review forecasting model parameters",
                    "Consider external factor integration"
                ])
            
            if metrics.forecast_revision_frequency > 0.3:
                improvements.append("Reduce forecast revision frequency through improved accuracy")
            
            if metrics.coefficient_of_variation > 0.5:
                improvements.append("Address high coefficient of variation through better demand understanding")
            
            # General improvements
            improvements.extend([
                "Implement automated outlier detection",
                "Enhance data quality validation",
                "Consider machine learning model upgrades"
            ])
            
        except Exception as e:
            improvements.append(f"Error identifying improvements: {str(e)}")
        
        return improvements