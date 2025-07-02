"""
SKU Lifecycle Classifier Service
Machine learning-based classification of SKU lifecycle stages
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime, date, timedelta
import asyncio
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import cross_val_score
from sklearn.cluster import KMeans
import warnings

from app.utils.statistical_analysis import StatisticalAnalyzer
from app.utils.time_series_utils import TimeSeriesAnalyzer
from app.services.s3_data_service import S3DataService
from app.schemas.strategic_planning import (
    LifecycleStage,
    LifecycleMetrics,
    SKULifecycleClassification,
    SKULifecycleResponse,
    AnalysisPeriod
)

class LifecycleClassifierService:
    """Service for classifying SKU lifecycle stages using ML and statistical analysis"""
    
    def __init__(self):
        self.statistical_analyzer = StatisticalAnalyzer()
        self.time_series_analyzer = TimeSeriesAnalyzer()
        self.s3_service = S3DataService()
        self.scaler = StandardScaler()
        self.classifier = None
        self.feature_names = [
            'trend_slope', 'growth_rate', 'variance', 'coefficient_of_variation',
            'peak_frequency', 'mean_volume', 'volume_ratio', 'acceleration',
            'seasonality_strength', 'stability_index', 'volume_growth_rate',
            'demand_consistency', 'recent_performance'
        ]
        
    async def classify_sku_lifecycles(self,
                                    sku_filter: Optional[List[str]] = None,
                                    category_filter: Optional[List[str]] = None,
                                    start_date: Optional[date] = None,
                                    end_date: Optional[date] = None,
                                    min_data_points: int = 30,
                                    include_transition_probabilities: bool = True) -> SKULifecycleResponse:
        """
        Classify SKU lifecycle stages using advanced analytics
        
        Args:
            sku_filter: Filter by specific SKUs
            category_filter: Filter by SKU categories
            start_date: Analysis start date
            end_date: Analysis end date
            min_data_points: Minimum data points required for classification
            include_transition_probabilities: Include stage transition predictions
            
        Returns:
            Comprehensive lifecycle classification response
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
            
            # Convert to DataFrame for processing
            df = pd.DataFrame(demand_data)
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            
            # Apply filters
            df = self._apply_filters(df, sku_filter, category_filter, start_date, end_date)
            
            if df.empty:
                return self._create_empty_response(start_date, end_date, "No data after applying filters")
            
            # Analyze each SKU
            sku_classifications = []
            lifecycle_distribution = {stage: 0 for stage in LifecycleStage}
            category_insights = {}
            
            unique_skus = df['item_id'].unique()
            
            for sku_id in unique_skus:
                sku_data = df[df['item_id'] == sku_id].copy()
                
                if len(sku_data) >= min_data_points:
                    classification = await self._classify_single_sku(
                        sku_id, sku_data, include_transition_probabilities
                    )
                    
                    if classification:
                        sku_classifications.append(classification)
                        lifecycle_distribution[classification.current_stage] += 1
                        
                        # Update category insights
                        category = classification.category or 'Unknown'
                        if category not in category_insights:
                            category_insights[category] = {
                                'sku_count': 0,
                                'lifecycle_distribution': {stage: 0 for stage in LifecycleStage},
                                'average_confidence': 0.0,
                                'risk_factors': set()
                            }
                        
                        category_insights[category]['sku_count'] += 1
                        category_insights[category]['lifecycle_distribution'][classification.current_stage] += 1
                        category_insights[category]['risk_factors'].update(classification.risk_factors)
            
            # Calculate category averages
            for category in category_insights:
                classified_skus = [c for c in sku_classifications if (c.category or 'Unknown') == category]
                if classified_skus:
                    category_insights[category]['average_confidence'] = np.mean([c.confidence_score for c in classified_skus])
                    # Convert set to list for JSON serialization
                    category_insights[category]['risk_factors'] = list(category_insights[category]['risk_factors'])
            
            # Generate transition predictions
            transition_predictions = []
            if include_transition_probabilities:
                transition_predictions = self._generate_transition_predictions(sku_classifications)
            
            # Generate strategic recommendations
            strategic_recommendations = self._generate_strategic_recommendations(
                sku_classifications, lifecycle_distribution, category_insights
            )
            
            # Create analysis period
            analysis_period = AnalysisPeriod(
                start_date=start_date,
                end_date=end_date,
                total_days=(end_date - start_date).days,
                data_points=len(df)
            )
            
            return SKULifecycleResponse(
                analysis_period=analysis_period,
                total_skus_classified=len(sku_classifications),
                lifecycle_distribution=lifecycle_distribution,
                sku_classifications=sku_classifications,
                category_insights=category_insights,
                transition_predictions=transition_predictions,
                strategic_recommendations=strategic_recommendations
            )
            
        except Exception as e:
            return self._create_empty_response(
                start_date or date.today() - timedelta(days=365),
                end_date or date.today(),
                f"Error in lifecycle classification: {str(e)}"
            )
    
    async def _classify_single_sku(self,
                                 sku_id: str,
                                 sku_data: pd.DataFrame,
                                 include_transitions: bool) -> Optional[SKULifecycleClassification]:
        """Classify lifecycle stage for a single SKU"""
        try:
            # Prepare time series data
            sku_data = sku_data.sort_values('timestamp')
            demand_values = sku_data['target_value'].values
            timestamps = sku_data['timestamp'].values
            
            # Calculate comprehensive metrics
            metrics = await self._calculate_comprehensive_metrics(demand_values, timestamps)
            
            # Use rule-based classification with confidence scoring
            stage, confidence, reasoning = self._classify_using_rules(metrics)
            
            # Calculate transition probabilities if requested
            transition_probabilities = {}
            if include_transitions:
                transition_probabilities = self._calculate_transition_probabilities(metrics, stage)
            
            # Generate recommendations and risk factors
            recommended_actions = self._generate_sku_recommendations(stage, metrics)
            risk_factors = self._identify_risk_factors(metrics, stage)
            
            # Determine SKU category
            category = self._infer_sku_category(sku_id)
            
            # Create lifecycle metrics object
            lifecycle_metrics = LifecycleMetrics(
                demand_trend_slope=metrics.get('trend_slope', 0.0),
                volume_growth_rate=metrics.get('growth_rate', 0.0),
                demand_variance=metrics.get('variance', 0.0),
                time_since_introduction=self._estimate_time_since_introduction(sku_data),
                revenue_contribution=self._estimate_revenue_contribution(demand_values)
            )
            
            return SKULifecycleClassification(
                sku_id=sku_id,
                category=category,
                current_stage=stage,
                confidence_score=confidence,
                lifecycle_metrics=lifecycle_metrics,
                stage_transition_probability=transition_probabilities,
                recommended_actions=recommended_actions,
                risk_factors=risk_factors
            )
            
        except Exception as e:
            print(f"Error classifying SKU {sku_id}: {str(e)}")
            return None
    
    async def _calculate_comprehensive_metrics(self,
                                             demand_values: np.ndarray,
                                             timestamps: np.ndarray) -> Dict[str, float]:
        """Calculate comprehensive metrics for lifecycle classification"""
        try:
            metrics = {}
            
            # Basic trend analysis
            trend_result = self.statistical_analyzer.analyze_trend(demand_values)
            metrics['trend_slope'] = trend_result.get('slope', 0.0)
            metrics['trend_r_squared'] = trend_result.get('r_squared', 0.0)
            
            # Growth rate analysis
            if len(demand_values) >= 8:
                first_quarter = np.mean(demand_values[:len(demand_values)//4])
                last_quarter = np.mean(demand_values[-len(demand_values)//4:])
                metrics['growth_rate'] = (last_quarter - first_quarter) / first_quarter if first_quarter > 0 else 0.0
            else:
                metrics['growth_rate'] = 0.0
            
            # Volatility metrics
            volatility_result = self.statistical_analyzer.calculate_volatility_metrics(demand_values)
            metrics.update(volatility_result)
            
            # Seasonality strength
            seasonality_result = self.statistical_analyzer.detect_seasonality_fft(demand_values)
            metrics['seasonality_strength'] = seasonality_result.get('dominant_strength', 0.0)
            
            # Stability index
            stability_result = self.time_series_analyzer.calculate_stability_index(demand_values)
            metrics['stability_index'] = stability_result.get('stability_index', 0.0)
            
            # Volume characteristics
            metrics['mean_volume'] = float(np.mean(demand_values))
            metrics['max_volume'] = float(np.max(demand_values))
            metrics['volume_ratio'] = metrics['mean_volume'] / metrics['max_volume'] if metrics['max_volume'] > 0 else 0.0
            
            # Peak frequency analysis
            from scipy.signal import find_peaks
            peaks, _ = find_peaks(demand_values, height=np.mean(demand_values))
            metrics['peak_frequency'] = len(peaks) / len(demand_values)
            
            # Acceleration (rate of change of trend)
            if len(demand_values) >= 3:
                acceleration = np.mean(np.diff(demand_values, n=2))
                metrics['acceleration'] = float(acceleration)
            else:
                metrics['acceleration'] = 0.0
            
            # Recent performance vs historical
            if len(demand_values) >= 10:
                recent_data = demand_values[-len(demand_values)//3:]  # Last third
                historical_data = demand_values[:len(demand_values)//3]  # First third
                
                recent_mean = np.mean(recent_data)
                historical_mean = np.mean(historical_data)
                
                metrics['recent_performance'] = (recent_mean - historical_mean) / historical_mean if historical_mean > 0 else 0.0
            else:
                metrics['recent_performance'] = 0.0
            
            # Volume growth rate (different from overall growth rate)
            if len(demand_values) >= 6:
                mid_point = len(demand_values) // 2
                first_half_mean = np.mean(demand_values[:mid_point])
                second_half_mean = np.mean(demand_values[mid_point:])
                metrics['volume_growth_rate'] = (second_half_mean - first_half_mean) / first_half_mean if first_half_mean > 0 else 0.0
            else:
                metrics['volume_growth_rate'] = 0.0
            
            # Demand consistency (inverse of CV)
            cv = metrics.get('coefficient_of_variation', 1.0)
            metrics['demand_consistency'] = 1.0 / (1.0 + cv)
            
            return metrics
            
        except Exception as e:
            print(f"Error calculating metrics: {str(e)}")
            return {}
    
    def _classify_using_rules(self, metrics: Dict[str, float]) -> Tuple[LifecycleStage, float, str]:
        """Classify lifecycle stage using business rules"""
        try:
            # Extract key metrics
            growth_rate = metrics.get('growth_rate', 0.0)
            trend_slope = metrics.get('trend_slope', 0.0)
            cv = metrics.get('coefficient_of_variation', 0.0)
            acceleration = metrics.get('acceleration', 0.0)
            recent_performance = metrics.get('recent_performance', 0.0)
            stability_index = metrics.get('stability_index', 0.5)
            volume_ratio = metrics.get('volume_ratio', 0.5)
            
            # Classification rules with confidence scoring
            
            # Introduction phase: High volatility, inconsistent patterns
            if cv > 0.6 and stability_index < 0.4:
                confidence = min(0.9, cv + (1.0 - stability_index))
                return LifecycleStage.INTRODUCTION, confidence, "High volatility and low stability indicate introduction phase"
            
            # Growth phase: Strong positive trends
            if growth_rate > 0.15 and trend_slope > 0 and acceleration > 0:
                confidence = min(0.95, 0.7 + growth_rate + (trend_slope / abs(trend_slope) if trend_slope != 0 else 0))
                return LifecycleStage.GROWTH, confidence, "Strong positive growth with acceleration"
            
            elif growth_rate > 0.05 and trend_slope > 0:
                confidence = min(0.8, 0.6 + growth_rate)
                return LifecycleStage.GROWTH, confidence, "Positive growth trend detected"
            
            # Decline phase: Negative trends
            if growth_rate < -0.1 and trend_slope < 0:
                if acceleration < -0.05:
                    confidence = min(0.9, 0.7 + abs(growth_rate) + abs(acceleration))
                    return LifecycleStage.DECLINE, confidence, "Declining demand with negative acceleration"
                else:
                    confidence = min(0.8, 0.6 + abs(growth_rate))
                    return LifecycleStage.DECLINE, confidence, "Declining demand trend"
            
            # Phase-out: Severe decline or very low volume
            if growth_rate < -0.25 or (volume_ratio < 0.2 and recent_performance < -0.3):
                confidence = min(0.85, 0.7 + abs(growth_rate) + abs(recent_performance))
                return LifecycleStage.PHASE_OUT, confidence, "Severe decline indicating phase-out"
            
            # Maturity phase: Stable patterns (default for stable cases)
            if abs(growth_rate) < 0.05 and cv < 0.3 and stability_index > 0.6:
                confidence = min(0.85, stability_index + (1.0 - cv))
                return LifecycleStage.MATURITY, confidence, "Stable demand with low volatility"
            
            # Default to maturity with lower confidence
            confidence = 0.5
            return LifecycleStage.MATURITY, confidence, "Default classification based on moderate stability"
            
        except Exception as e:
            return LifecycleStage.MATURITY, 0.3, f"Error in classification: {str(e)}"
    
    def _calculate_transition_probabilities(self,
                                          metrics: Dict[str, float],
                                          current_stage: LifecycleStage) -> Dict[LifecycleStage, float]:
        """Calculate probabilities of transitioning to other lifecycle stages"""
        try:
            # Initialize all probabilities to 0
            probabilities = {stage: 0.0 for stage in LifecycleStage}
            
            # Extract key metrics
            growth_rate = metrics.get('growth_rate', 0.0)
            trend_slope = metrics.get('trend_slope', 0.0)
            cv = metrics.get('coefficient_of_variation', 0.0)
            stability_index = metrics.get('stability_index', 0.5)
            recent_performance = metrics.get('recent_performance', 0.0)
            
            if current_stage == LifecycleStage.INTRODUCTION:
                # From introduction, can go to growth or maturity
                if growth_rate > 0.1 and trend_slope > 0:
                    probabilities[LifecycleStage.GROWTH] = min(0.8, 0.5 + growth_rate)
                    probabilities[LifecycleStage.MATURITY] = 0.2
                else:
                    probabilities[LifecycleStage.MATURITY] = 0.6
                    probabilities[LifecycleStage.DECLINE] = 0.3 if recent_performance < -0.1 else 0.1
                probabilities[LifecycleStage.INTRODUCTION] = 0.1
                
            elif current_stage == LifecycleStage.GROWTH:
                # From growth, likely to go to maturity, possible to continue growth or decline
                probabilities[LifecycleStage.MATURITY] = 0.6 if stability_index > 0.5 else 0.4
                probabilities[LifecycleStage.GROWTH] = 0.3 if growth_rate > 0.05 else 0.1
                probabilities[LifecycleStage.DECLINE] = 0.2 if recent_performance < -0.05 else 0.05
                
            elif current_stage == LifecycleStage.MATURITY:
                # From maturity, can stay mature, go to decline, or occasionally return to growth
                probabilities[LifecycleStage.MATURITY] = 0.7 if stability_index > 0.6 else 0.5
                probabilities[LifecycleStage.DECLINE] = 0.3 if recent_performance < -0.05 else 0.15
                probabilities[LifecycleStage.GROWTH] = 0.1 if growth_rate > 0.1 else 0.02
                
            elif current_stage == LifecycleStage.DECLINE:
                # From decline, likely to continue declining or phase out
                probabilities[LifecycleStage.DECLINE] = 0.6 if growth_rate > -0.2 else 0.4
                probabilities[LifecycleStage.PHASE_OUT] = 0.4 if growth_rate < -0.15 else 0.2
                probabilities[LifecycleStage.MATURITY] = 0.15 if recent_performance > 0 else 0.05
                
            elif current_stage == LifecycleStage.PHASE_OUT:
                # From phase-out, likely to stay in phase-out
                probabilities[LifecycleStage.PHASE_OUT] = 0.9
                probabilities[LifecycleStage.DECLINE] = 0.1
            
            # Normalize probabilities to sum to 1
            total_prob = sum(probabilities.values())
            if total_prob > 0:
                probabilities = {stage: prob / total_prob for stage, prob in probabilities.items()}
            
            return probabilities
            
        except Exception as e:
            # Return uniform distribution on error
            return {stage: 0.2 for stage in LifecycleStage}
    
    def _generate_sku_recommendations(self,
                                    stage: LifecycleStage,
                                    metrics: Dict[str, float]) -> List[str]:
        """Generate SKU-specific recommendations based on lifecycle stage"""
        recommendations = []
        
        try:
            base_recommendations = {
                LifecycleStage.INTRODUCTION: [
                    "Monitor demand patterns closely for stabilization",
                    "Maintain flexible inventory levels",
                    "Focus on demand generation and market penetration",
                    "Prepare for potential rapid growth"
                ],
                LifecycleStage.GROWTH: [
                    "Scale inventory and capacity planning",
                    "Optimize supply chain efficiency for increased volume",
                    "Plan for peak demand periods and capacity constraints",
                    "Monitor competitive threats and market saturation"
                ],
                LifecycleStage.MATURITY: [
                    "Optimize operational efficiency and cost management",
                    "Focus on maintaining consistent service levels",
                    "Consider product differentiation strategies",
                    "Implement steady-state inventory optimization"
                ],
                LifecycleStage.DECLINE: [
                    "Gradually reduce inventory levels and exposure",
                    "Optimize remaining demand and customer value",
                    "Consider product alternatives or substitutes",
                    "Plan potential exit strategy if decline accelerates"
                ],
                LifecycleStage.PHASE_OUT: [
                    "Minimize inventory exposure and carrying costs",
                    "Communicate discontinuation plans with stakeholders",
                    "Plan orderly discontinuation process",
                    "Support customer transition to alternative products"
                ]
            }
            
            recommendations.extend(base_recommendations.get(stage, []))
            
            # Add metric-specific recommendations
            cv = metrics.get('coefficient_of_variation', 0.0)
            if cv > 0.5:
                recommendations.append("Implement safety stock buffers due to high demand volatility")
            
            growth_rate = metrics.get('growth_rate', 0.0)
            if growth_rate > 0.2:
                recommendations.append("Consider aggressive capacity expansion due to strong growth")
            elif growth_rate < -0.2:
                recommendations.append("Implement demand preservation strategies to slow decline")
            
            seasonality_strength = metrics.get('seasonality_strength', 0.0)
            if seasonality_strength > 0.4:
                recommendations.append("Develop seasonal inventory and capacity plans")
                
        except Exception as e:
            recommendations.append(f"Error generating recommendations: {str(e)}")
        
        return recommendations
    
    def _identify_risk_factors(self,
                             metrics: Dict[str, float],
                             stage: LifecycleStage) -> List[str]:
        """Identify risk factors for the SKU"""
        risk_factors = []
        
        try:
            # High volatility risk
            cv = metrics.get('coefficient_of_variation', 0.0)
            if cv > 0.6:
                risk_factors.append("High demand volatility")
            
            # Declining trend risk
            growth_rate = metrics.get('growth_rate', 0.0)
            if growth_rate < -0.1:
                risk_factors.append("Declining demand trend")
            
            # Low stability risk
            stability_index = metrics.get('stability_index', 0.5)
            if stability_index < 0.3:
                risk_factors.append("Low forecast stability")
            
            # Accelerating decline risk
            acceleration = metrics.get('acceleration', 0.0)
            if acceleration < -0.1:
                risk_factors.append("Accelerating demand decline")
            
            # Poor recent performance
            recent_performance = metrics.get('recent_performance', 0.0)
            if recent_performance < -0.2:
                risk_factors.append("Poor recent performance")
            
            # Stage-specific risks
            if stage == LifecycleStage.INTRODUCTION and cv > 0.8:
                risk_factors.append("Extremely high introduction phase volatility")
            elif stage == LifecycleStage.GROWTH and growth_rate < 0.05:
                risk_factors.append("Growth stage with insufficient growth rate")
            elif stage == LifecycleStage.DECLINE and growth_rate < -0.3:
                risk_factors.append("Rapid decline risk")
                
        except Exception as e:
            risk_factors.append(f"Error identifying risks: {str(e)}")
        
        return risk_factors
    
    def _estimate_time_since_introduction(self, sku_data: pd.DataFrame) -> Optional[int]:
        """Estimate days since SKU introduction (simplified approach)"""
        try:
            # Use the earliest timestamp in our data as a proxy
            # In practice, this would come from product master data
            earliest_date = sku_data['timestamp'].min()
            days_in_data = (datetime.now() - earliest_date).days
            
            # Estimate that we have about 70% of the actual product lifecycle
            estimated_total_days = int(days_in_data / 0.7)
            return estimated_total_days
            
        except:
            return None
    
    def _estimate_revenue_contribution(self, demand_values: np.ndarray) -> float:
        """Estimate revenue contribution (simplified approach)"""
        try:
            # Simplified: use mean demand as proxy for revenue contribution
            # In practice, would multiply by price and calculate actual revenue
            mean_demand = np.mean(demand_values)
            # Normalize to a 0-1 scale (assuming max reasonable demand of 1000)
            normalized_contribution = min(1.0, mean_demand / 1000.0)
            return float(normalized_contribution)
            
        except:
            return 0.0
    
    def _infer_sku_category(self, sku_id: str) -> Optional[str]:
        """Infer SKU category from SKU ID (simplified)"""
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
            
            # Category filter (simplified)
            if category_filter:
                category_skus = []
                for category in category_filter:
                    if category == 'Electronics':
                        category_skus.extend([sku for sku in df['item_id'].unique() if sku.startswith('108')])
                    elif category == 'Lighting':
                        category_skus.extend([sku for sku in df['item_id'].unique() if sku.startswith('107')])
                    elif category == 'Accessories':
                        category_skus.extend([sku for sku in df['item_id'].unique() if sku.startswith('109')])
                
                if category_skus:
                    df = df[df['item_id'].isin(category_skus)]
            
            return df
            
        except Exception as e:
            print(f"Error applying filters: {str(e)}")
            return pd.DataFrame()
    
    def _generate_transition_predictions(self,
                                       classifications: List[SKULifecycleClassification]) -> List[Dict[str, Any]]:
        """Generate transition predictions across all SKUs"""
        predictions = []
        
        try:
            # Aggregate transition probabilities by current stage
            stage_transitions = {}
            
            for classification in classifications:
                current_stage = classification.current_stage
                if current_stage not in stage_transitions:
                    stage_transitions[current_stage] = {
                        'sku_count': 0,
                        'avg_transitions': {stage: 0.0 for stage in LifecycleStage}
                    }
                
                stage_transitions[current_stage]['sku_count'] += 1
                
                for next_stage, prob in classification.stage_transition_probability.items():
                    stage_transitions[current_stage]['avg_transitions'][next_stage] += prob
            
            # Calculate averages
            for current_stage, data in stage_transitions.items():
                count = data['sku_count']
                if count > 0:
                    avg_transitions = {
                        stage: prob / count
                        for stage, prob in data['avg_transitions'].items()
                    }
                    
                    predictions.append({
                        'current_stage': current_stage.value,
                        'sku_count': count,
                        'transition_probabilities': {
                            stage.value: prob for stage, prob in avg_transitions.items()
                        },
                        'most_likely_transition': max(avg_transitions, key=avg_transitions.get).value,
                        'transition_confidence': max(avg_transitions.values())
                    })
                    
        except Exception as e:
            predictions.append({
                'error': f"Error generating transition predictions: {str(e)}"
            })
        
        return predictions
    
    def _generate_strategic_recommendations(self,
                                          classifications: List[SKULifecycleClassification],
                                          lifecycle_distribution: Dict[LifecycleStage, int],
                                          category_insights: Dict[str, Any]) -> List[str]:
        """Generate strategic recommendations based on portfolio analysis"""
        recommendations = []
        
        try:
            total_skus = len(classifications)
            if total_skus == 0:
                return ["No SKUs available for strategic analysis"]
            
            # Portfolio composition analysis
            growth_percentage = (lifecycle_distribution[LifecycleStage.GROWTH] / total_skus) * 100
            mature_percentage = (lifecycle_distribution[LifecycleStage.MATURITY] / total_skus) * 100
            decline_percentage = (lifecycle_distribution[LifecycleStage.DECLINE] / total_skus) * 100
            
            recommendations.append(f"Portfolio composition: {growth_percentage:.1f}% growth, {mature_percentage:.1f}% mature, {decline_percentage:.1f}% declining")
            
            # Strategic recommendations based on composition
            if growth_percentage < 20:
                recommendations.append("Consider investing in new product development - low growth SKU percentage")
            
            if decline_percentage > 30:
                recommendations.append("High declining SKU percentage - implement portfolio rationalization strategy")
            
            if mature_percentage > 60:
                recommendations.append("Mature-heavy portfolio - focus on operational efficiency and cost optimization")
            
            # Category-specific recommendations
            for category, insights in category_insights.items():
                category_skus = insights['sku_count']
                if category_skus >= 3:  # Only for categories with sufficient SKUs
                    category_growth = insights['lifecycle_distribution'][LifecycleStage.GROWTH]
                    category_decline = insights['lifecycle_distribution'][LifecycleStage.DECLINE]
                    
                    if category_decline > category_growth:
                        recommendations.append(f"{category} category showing more declining than growing SKUs - review category strategy")
            
            # Risk-based recommendations
            high_risk_skus = [c for c in classifications if len(c.risk_factors) >= 3]
            if len(high_risk_skus) > total_skus * 0.2:
                recommendations.append("High number of SKUs with multiple risk factors - implement proactive risk management")
            
            # Confidence-based recommendations
            low_confidence_classifications = [c for c in classifications if c.confidence_score < 0.6]
            if len(low_confidence_classifications) > total_skus * 0.3:
                recommendations.append("Many SKUs have low classification confidence - consider gathering more data or external validation")
                
        except Exception as e:
            recommendations.append(f"Error generating strategic recommendations: {str(e)}")
        
        return recommendations
    
    def _create_empty_response(self, start_date: date, end_date: date, reason: str) -> SKULifecycleResponse:
        """Create empty response for error cases"""
        analysis_period = AnalysisPeriod(
            start_date=start_date,
            end_date=end_date,
            total_days=(end_date - start_date).days,
            data_points=0
        )
        
        return SKULifecycleResponse(
            analysis_period=analysis_period,
            total_skus_classified=0,
            lifecycle_distribution={stage: 0 for stage in LifecycleStage},
            sku_classifications=[],
            category_insights={},
            transition_predictions=[],
            strategic_recommendations=[reason, "Ensure sufficient data is available for lifecycle analysis"]
        )