"""
Seasonality Analyzer Service
Advanced seasonality detection and analysis for SKU demand patterns
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
from app.schemas.strategic_planning import (
    SeasonalPattern, 
    SKUSeasonalityAnalysis, 
    SeasonalityAnalysisResponse,
    SeasonalityType,
    StatisticalSignificance,
    AnalysisPeriod
)

class SeasonalityAnalyzerService:
    """Service for analyzing seasonality patterns in demand data"""
    
    def __init__(self):
        self.statistical_analyzer = StatisticalAnalyzer()
        self.time_series_analyzer = TimeSeriesAnalyzer()
        self.s3_service = S3DataService()
        self.cache = {}
        
    async def analyze_seasonality(self, 
                                 sku_filter: Optional[List[str]] = None,
                                 category_filter: Optional[List[str]] = None,
                                 start_date: Optional[date] = None,
                                 end_date: Optional[date] = None,
                                 pattern_types: List[SeasonalityType] = None,
                                 min_pattern_strength: float = 0.3) -> SeasonalityAnalysisResponse:
        """
        Perform comprehensive seasonality analysis on SKU demand data
        
        Args:
            sku_filter: Filter by specific SKUs
            category_filter: Filter by SKU categories
            start_date: Analysis start date
            end_date: Analysis end date
            pattern_types: Types of seasonality to detect
            min_pattern_strength: Minimum pattern strength threshold
            
        Returns:
            Comprehensive seasonality analysis response
        """
        try:
            # Set default date range if not provided
            if not end_date:
                end_date = date.today()
            if not start_date:
                start_date = end_date - timedelta(days=365)  # 1 year of data
                
            # Get demand forecast data from S3
            demand_data = await self.s3_service.get_demand_forecast_data(limit=None)
            
            if not demand_data:
                return self._create_empty_response(start_date, end_date, "No demand data available")
            
            # Convert to DataFrame for easier processing
            df = pd.DataFrame(demand_data)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            
            # Apply filters
            df = self._apply_filters(df, sku_filter, category_filter, start_date, end_date)
            
            if df.empty:
                return self._create_empty_response(start_date, end_date, "No data after applying filters")
            
            # Group by SKU and analyze seasonality
            sku_analyses = []
            category_summary = {}
            
            unique_skus = df['item_id'].unique()
            
            for sku_id in unique_skus:
                sku_data = df[df['item_id'] == sku_id].copy()
                
                if len(sku_data) >= 14:  # Minimum 2 weeks of data
                    analysis = await self._analyze_sku_seasonality(
                        sku_id, sku_data, pattern_types, min_pattern_strength
                    )
                    if analysis:
                        sku_analyses.append(analysis)
                        
                        # Update category summary
                        category = analysis.category or 'Unknown'
                        if category not in category_summary:
                            category_summary[category] = {
                                'sku_count': 0,
                                'seasonal_skus': 0,
                                'dominant_patterns': {},
                                'average_strength': 0.0
                            }
                        
                        category_summary[category]['sku_count'] += 1
                        if analysis.detected_patterns:
                            category_summary[category]['seasonal_skus'] += 1
                            
                            # Track dominant patterns
                            if analysis.dominant_pattern:
                                pattern = analysis.dominant_pattern.value
                                if pattern not in category_summary[category]['dominant_patterns']:
                                    category_summary[category]['dominant_patterns'][pattern] = 0
                                category_summary[category]['dominant_patterns'][pattern] += 1
            
            # Calculate category averages
            for category in category_summary:
                if category_summary[category]['seasonal_skus'] > 0:
                    seasonal_analyses = [a for a in sku_analyses if (a.category or 'Unknown') == category and a.detected_patterns]
                    if seasonal_analyses:
                        category_summary[category]['average_strength'] = np.mean([a.seasonality_score for a in seasonal_analyses])
            
            # Generate insights and recommendations
            insights = self._generate_seasonality_insights(sku_analyses, category_summary)
            recommendations = self._generate_seasonality_recommendations(sku_analyses, category_summary)
            
            # Create analysis period
            analysis_period = AnalysisPeriod(
                start_date=start_date,
                end_date=end_date,
                total_days=(end_date - start_date).days,
                data_points=len(df)
            )
            
            return SeasonalityAnalysisResponse(
                analysis_period=analysis_period,
                total_skus_analyzed=len(unique_skus),
                sku_analyses=sku_analyses,
                category_summary=category_summary,
                insights=insights,
                recommendations=recommendations
            )
            
        except Exception as e:
            return self._create_empty_response(
                start_date or date.today() - timedelta(days=365), 
                end_date or date.today(), 
                f"Error in seasonality analysis: {str(e)}"
            )
    
    async def _analyze_sku_seasonality(self, 
                                     sku_id: str, 
                                     sku_data: pd.DataFrame,
                                     pattern_types: Optional[List[SeasonalityType]],
                                     min_pattern_strength: float) -> Optional[SKUSeasonalityAnalysis]:
        """Analyze seasonality for a single SKU"""
        try:
            # Prepare time series data
            sku_data = sku_data.sort_values('timestamp')
            demand_values = sku_data['target_value'].values
            timestamps = sku_data['timestamp'].values
            
            # Detect seasonality using FFT analysis
            seasonality_result = self.statistical_analyzer.detect_seasonality_fft(
                demand_values, timestamps, min_pattern_strength
            )
            
            if seasonality_result.get('error'):
                return None
            
            # Convert to SeasonalPattern objects
            detected_patterns = []
            dominant_pattern = None
            
            if seasonality_result['has_seasonality']:
                for pattern_info in seasonality_result['patterns']:
                    pattern_type = self._map_to_seasonality_type(pattern_info['type'])
                    
                    # Filter by requested pattern types
                    if pattern_types and pattern_type not in pattern_types:
                        continue
                    
                    pattern = SeasonalPattern(
                        pattern_type=pattern_type,
                        strength=pattern_info['strength'],
                        amplitude=self._calculate_amplitude(demand_values, pattern_info['period']),
                        period_length=int(pattern_info['period']),
                        phase_shift=self._calculate_phase_shift(demand_values, pattern_info['period']),
                        frequency_components=[pattern_info['frequency']]
                    )
                    detected_patterns.append(pattern)
                    
                    # Set dominant pattern (strongest one)
                    if not dominant_pattern or pattern.strength > detected_patterns[0].strength:
                        dominant_pattern = pattern_type
            
            # Calculate statistical significance
            significance = self._calculate_seasonality_significance(demand_values, detected_patterns)
            
            # Identify peak and low periods
            peak_periods, low_periods = self._identify_peak_low_periods(demand_values, timestamps, detected_patterns)
            
            # Determine SKU category (simplified - would normally come from data)
            category = self._infer_sku_category(sku_id)
            
            return SKUSeasonalityAnalysis(
                sku_id=sku_id,
                category=category,
                detected_patterns=detected_patterns,
                dominant_pattern=dominant_pattern,
                seasonality_score=seasonality_result.get('dominant_strength', 0.0),
                statistical_significance=significance,
                peak_periods=peak_periods,
                low_periods=low_periods
            )
            
        except Exception as e:
            print(f"Error analyzing SKU {sku_id}: {str(e)}")
            return None
    
    def _map_to_seasonality_type(self, pattern_type: str) -> SeasonalityType:
        """Map pattern type string to SeasonalityType enum"""
        mapping = {
            'weekly': SeasonalityType.WEEKLY,
            'monthly': SeasonalityType.MONTHLY,
            'quarterly': SeasonalityType.QUARTERLY,
            'annual': SeasonalityType.ANNUAL,
            'custom': SeasonalityType.WEEKLY  # Default fallback
        }
        return mapping.get(pattern_type, SeasonalityType.WEEKLY)
    
    def _calculate_amplitude(self, data: np.ndarray, period: float) -> float:
        """Calculate amplitude of seasonal pattern"""
        try:
            if period <= 1:
                return 0.0
            
            # Use FFT to estimate amplitude
            fft_values = np.fft.fft(data)
            frequencies = np.fft.fftfreq(len(data))
            
            # Find the frequency closest to our period
            target_freq = 1.0 / period
            freq_idx = np.argmin(np.abs(frequencies - target_freq))
            
            # Amplitude is twice the magnitude (for real signals)
            amplitude = 2 * np.abs(fft_values[freq_idx]) / len(data)
            return float(amplitude)
            
        except:
            return float(np.std(data))
    
    def _calculate_phase_shift(self, data: np.ndarray, period: float) -> Optional[float]:
        """Calculate phase shift of seasonal pattern"""
        try:
            if period <= 1:
                return None
            
            # Simple phase estimation using cross-correlation
            # Create a reference sine wave
            t = np.arange(len(data))
            reference = np.sin(2 * np.pi * t / period)
            
            # Calculate cross-correlation
            correlation = np.correlate(data - np.mean(data), reference, mode='full')
            
            # Find the lag that maximizes correlation
            max_corr_idx = np.argmax(correlation)
            phase_shift = (max_corr_idx - len(data) + 1) * 2 * np.pi / period
            
            return float(phase_shift)
            
        except:
            return None
    
    def _calculate_seasonality_significance(self, 
                                          data: np.ndarray, 
                                          patterns: List[SeasonalPattern]) -> StatisticalSignificance:
        """Calculate statistical significance of seasonality"""
        try:
            if not patterns:
                return StatisticalSignificance(
                    p_value=1.0,
                    confidence_level=0.0,
                    is_significant=False
                )
            
            # Use the strongest pattern for significance testing
            strongest_pattern = max(patterns, key=lambda p: p.strength)
            
            # Perform F-test for seasonality significance
            # This is a simplified approach - more sophisticated tests could be used
            n = len(data)
            
            # Calculate variance explained by seasonal pattern
            seasonal_variance = strongest_pattern.strength * np.var(data)
            residual_variance = np.var(data) - seasonal_variance
            
            if residual_variance <= 0:
                residual_variance = np.var(data) * 0.01  # Small non-zero value
            
            # F-statistic
            df1 = strongest_pattern.period_length - 1  # degrees of freedom for pattern
            df2 = n - strongest_pattern.period_length   # residual degrees of freedom
            
            if df2 <= 0:
                df2 = 1
            
            f_stat = (seasonal_variance / df1) / (residual_variance / df2)
            
            # Approximate p-value (simplified)
            p_value = max(0.001, 1.0 - strongest_pattern.strength)
            
            confidence_level = 1.0 - p_value
            is_significant = p_value < 0.05
            
            return StatisticalSignificance(
                p_value=p_value,
                confidence_level=confidence_level,
                is_significant=is_significant
            )
            
        except Exception as e:
            return StatisticalSignificance(
                p_value=1.0,
                confidence_level=0.0,
                is_significant=False
            )
    
    def _identify_peak_low_periods(self, 
                                  data: np.ndarray, 
                                  timestamps: np.ndarray, 
                                  patterns: List[SeasonalPattern]) -> Tuple[List[str], List[str]]:
        """Identify peak and low demand periods"""
        try:
            if not patterns:
                return [], []
            
            # Use the dominant pattern
            dominant_pattern = max(patterns, key=lambda p: p.strength)
            
            # Convert timestamps to datetime if needed
            if isinstance(timestamps[0], str):
                timestamps = pd.to_datetime(timestamps)
            
            peak_periods = []
            low_periods = []
            
            if dominant_pattern.pattern_type == SeasonalityType.WEEKLY:
                # Analyze by day of week
                df = pd.DataFrame({'value': data, 'timestamp': timestamps})
                df['day_of_week'] = df['timestamp'].dt.day_name()
                day_means = df.groupby('day_of_week')['value'].mean()
                
                # Find highest and lowest days
                peak_day = day_means.idxmax()
                low_day = day_means.idxmin()
                
                peak_periods = [peak_day]
                low_periods = [low_day]
                
            elif dominant_pattern.pattern_type == SeasonalityType.MONTHLY:
                # Analyze by month
                df = pd.DataFrame({'value': data, 'timestamp': timestamps})
                df['month'] = df['timestamp'].dt.month_name()
                month_means = df.groupby('month')['value'].mean()
                
                # Find highest and lowest months
                peak_month = month_means.idxmax()
                low_month = month_means.idxmin()
                
                peak_periods = [peak_month]
                low_periods = [low_month]
                
            elif dominant_pattern.pattern_type == SeasonalityType.QUARTERLY:
                # Analyze by quarter
                df = pd.DataFrame({'value': data, 'timestamp': timestamps})
                df['quarter'] = df['timestamp'].dt.quarter
                quarter_means = df.groupby('quarter')['value'].mean()
                
                # Find highest and lowest quarters
                peak_quarter = f"Q{quarter_means.idxmax()}"
                low_quarter = f"Q{quarter_means.idxmin()}"
                
                peak_periods = [peak_quarter]
                low_periods = [low_quarter]
            
            return peak_periods, low_periods
            
        except Exception as e:
            return [], []
    
    def _infer_sku_category(self, sku_id: str) -> Optional[str]:
        """Infer SKU category from SKU ID (simplified)"""
        # This is a simplified approach - in practice, would come from product data
        try:
            if sku_id.startswith('108'):
                return 'Electronics'
            elif sku_id.startswith('107'):
                return 'Lighting'
            elif sku_id.startswith('109'):
                return 'Accessories'
            else:
                return 'General'
        except:
            return None
    
    def _apply_filters(self, 
                      df: pd.DataFrame, 
                      sku_filter: Optional[List[str]], 
                      category_filter: Optional[List[str]],
                      start_date: date, 
                      end_date: date) -> pd.DataFrame:
        """Apply filters to the DataFrame"""
        try:
            # Date filter
            df = df[
                (df['timestamp'].dt.date >= start_date) & 
                (df['timestamp'].dt.date <= end_date)
            ]
            
            # SKU filter
            if sku_filter:
                df = df[df['item_id'].isin(sku_filter)]
            
            # Category filter (simplified - would need actual category data)
            if category_filter:
                # For now, just filter by SKU prefix as a proxy for category
                category_skus = []
                for category in category_filter:
                    if category == 'Electronics':
                        category_skus.extend([sku for sku in df['item_id'].unique() if sku.startswith('108')])
                    elif category == 'Lighting':
                        category_skus.extend([sku for sku in df['item_id'].unique() if sku.startswith('107')])
                
                if category_skus:
                    df = df[df['item_id'].isin(category_skus)]
            
            return df
            
        except Exception as e:
            print(f"Error applying filters: {str(e)}")
            return pd.DataFrame()
    
    def _generate_seasonality_insights(self, 
                                     sku_analyses: List[SKUSeasonalityAnalysis],
                                     category_summary: Dict[str, Any]) -> List[str]:
        """Generate business insights from seasonality analysis"""
        insights = []
        
        try:
            if not sku_analyses:
                return ["No seasonality patterns detected in the analyzed data"]
            
            # Overall seasonality prevalence
            seasonal_skus = [a for a in sku_analyses if a.detected_patterns]
            seasonality_rate = len(seasonal_skus) / len(sku_analyses) * 100
            
            insights.append(f"{seasonality_rate:.1f}% of analyzed SKUs show significant seasonality patterns")
            
            # Dominant pattern types
            pattern_counts = {}
            for analysis in seasonal_skus:
                if analysis.dominant_pattern:
                    pattern = analysis.dominant_pattern.value
                    pattern_counts[pattern] = pattern_counts.get(pattern, 0) + 1
            
            if pattern_counts:
                most_common_pattern = max(pattern_counts, key=pattern_counts.get)
                insights.append(f"Most common seasonality pattern is {most_common_pattern} ({pattern_counts[most_common_pattern]} SKUs)")
            
            # Category-specific insights
            for category, summary in category_summary.items():
                if summary['seasonal_skus'] > 0:
                    category_rate = (summary['seasonal_skus'] / summary['sku_count']) * 100
                    insights.append(f"{category} category shows {category_rate:.1f}% seasonality rate")
            
            # Strength distribution
            strengths = [a.seasonality_score for a in seasonal_skus]
            if strengths:
                avg_strength = np.mean(strengths)
                insights.append(f"Average seasonality strength is {avg_strength:.2f}")
                
                if avg_strength > 0.7:
                    insights.append("Strong seasonal patterns suggest significant demand planning opportunities")
                elif avg_strength > 0.4:
                    insights.append("Moderate seasonal patterns require careful inventory management")
            
        except Exception as e:
            insights.append(f"Error generating insights: {str(e)}")
        
        return insights
    
    def _generate_seasonality_recommendations(self, 
                                            sku_analyses: List[SKUSeasonalityAnalysis],
                                            category_summary: Dict[str, Any]) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []
        
        try:
            seasonal_skus = [a for a in sku_analyses if a.detected_patterns]
            
            if not seasonal_skus:
                return ["Consider investigating external factors that might influence demand patterns"]
            
            # General recommendations
            recommendations.append("Implement seasonal demand planning for identified SKUs")
            recommendations.append("Adjust inventory levels based on seasonal peak and low periods")
            
            # Pattern-specific recommendations
            weekly_patterns = [a for a in seasonal_skus if a.dominant_pattern == SeasonalityType.WEEKLY]
            if weekly_patterns:
                recommendations.append("Optimize weekly staffing and delivery schedules for weekly patterns")
            
            monthly_patterns = [a for a in seasonal_skus if a.dominant_pattern == SeasonalityType.MONTHLY]
            if monthly_patterns:
                recommendations.append("Plan monthly inventory cycles and promotional activities")
            
            quarterly_patterns = [a for a in seasonal_skus if a.dominant_pattern == SeasonalityType.QUARTERLY]
            if quarterly_patterns:
                recommendations.append("Align quarterly business planning with seasonal demand patterns")
            
            # High-strength pattern recommendations
            strong_patterns = [a for a in seasonal_skus if a.seasonality_score > 0.6]
            if strong_patterns:
                recommendations.append("Prioritize strong seasonal patterns for automated forecasting adjustments")
            
            # Category-specific recommendations
            for category, summary in category_summary.items():
                if summary['seasonal_skus'] > summary['sku_count'] * 0.7:  # >70% seasonal
                    recommendations.append(f"Develop category-specific seasonal strategy for {category}")
            
        except Exception as e:
            recommendations.append(f"Error generating recommendations: {str(e)}")
        
        return recommendations
    
    def _create_empty_response(self, start_date: date, end_date: date, reason: str) -> SeasonalityAnalysisResponse:
        """Create empty response for error cases"""
        analysis_period = AnalysisPeriod(
            start_date=start_date,
            end_date=end_date,
            total_days=(end_date - start_date).days,
            data_points=0
        )
        
        return SeasonalityAnalysisResponse(
            analysis_period=analysis_period,
            total_skus_analyzed=0,
            sku_analyses=[],
            category_summary={},
            insights=[reason],
            recommendations=["Ensure sufficient data is available for analysis"]
        )