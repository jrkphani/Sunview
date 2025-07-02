"""
KPI Calculation Utilities
Comprehensive utilities for calculating forecast accuracy metrics, performance indicators, and business KPIs
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple, Union
from datetime import datetime, timedelta
import logging
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

class AccuracyMetricType(Enum):
    """Types of accuracy metrics"""
    MAPE = "mape"  # Mean Absolute Percentage Error
    WAPE = "wape"  # Weighted Absolute Percentage Error
    MAE = "mae"    # Mean Absolute Error
    RMSE = "rmse"  # Root Mean Square Error
    BIAS = "bias"  # Forecast Bias
    TRACKING_SIGNAL = "tracking_signal"

@dataclass
class AccuracyResult:
    """Result container for accuracy calculations"""
    metric_type: AccuracyMetricType
    value: float
    confidence_interval: Optional[Tuple[float, float]] = None
    sample_size: int = 0
    calculation_date: datetime = None

@dataclass
class SKUPerformance:
    """SKU-level performance metrics"""
    sku_id: str
    forecast_accuracy: float
    forecast_error: float
    volume_forecast: float
    actual_volume: float
    error_percentage: float
    bias: float
    trend_direction: str

class KPICalculator:
    """Comprehensive KPI calculation engine"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
    
    def calculate_mape(self, actual: np.ndarray, forecast: np.ndarray, 
                      exclude_zeros: bool = True) -> AccuracyResult:
        """
        Calculate Mean Absolute Percentage Error (MAPE)
        
        Args:
            actual: Array of actual values
            forecast: Array of forecasted values
            exclude_zeros: Whether to exclude zero actual values
            
        Returns:
            AccuracyResult with MAPE calculation
        """
        try:
            actual = np.array(actual)
            forecast = np.array(forecast)
            
            if len(actual) != len(forecast):
                raise ValueError("Actual and forecast arrays must have same length")
            
            # Remove NaN values
            mask = ~(np.isnan(actual) | np.isnan(forecast))
            actual_clean = actual[mask]
            forecast_clean = forecast[mask]
            
            if exclude_zeros:
                zero_mask = actual_clean != 0
                actual_clean = actual_clean[zero_mask]
                forecast_clean = forecast_clean[zero_mask]
            
            if len(actual_clean) == 0:
                return AccuracyResult(
                    metric_type=AccuracyMetricType.MAPE,
                    value=np.inf,
                    sample_size=0,
                    calculation_date=datetime.now()
                )
            
            # Calculate MAPE
            percentage_errors = np.abs((actual_clean - forecast_clean) / actual_clean) * 100
            mape = np.mean(percentage_errors)
            
            # Calculate confidence interval (bootstrap method)
            ci_lower, ci_upper = self._bootstrap_confidence_interval(
                actual_clean, forecast_clean, self.calculate_mape_value
            )
            
            return AccuracyResult(
                metric_type=AccuracyMetricType.MAPE,
                value=float(mape),
                confidence_interval=(ci_lower, ci_upper),
                sample_size=len(actual_clean),
                calculation_date=datetime.now()
            )
            
        except Exception as e:
            self.logger.error(f"Error calculating MAPE: {str(e)}")
            return AccuracyResult(
                metric_type=AccuracyMetricType.MAPE,
                value=np.inf,
                sample_size=0,
                calculation_date=datetime.now()
            )
    
    def calculate_wape(self, actual: np.ndarray, forecast: np.ndarray) -> AccuracyResult:
        """
        Calculate Weighted Absolute Percentage Error (WAPE)
        
        Args:
            actual: Array of actual values
            forecast: Array of forecasted values
            
        Returns:
            AccuracyResult with WAPE calculation
        """
        try:
            actual = np.array(actual)
            forecast = np.array(forecast)
            
            # Remove NaN values
            mask = ~(np.isnan(actual) | np.isnan(forecast))
            actual_clean = actual[mask]
            forecast_clean = forecast[mask]
            
            if len(actual_clean) == 0:
                return AccuracyResult(
                    metric_type=AccuracyMetricType.WAPE,
                    value=np.inf,
                    sample_size=0,
                    calculation_date=datetime.now()
                )
            
            # Calculate WAPE
            total_absolute_error = np.sum(np.abs(actual_clean - forecast_clean))
            total_actual = np.sum(np.abs(actual_clean))
            
            if total_actual == 0:
                wape = np.inf
            else:
                wape = (total_absolute_error / total_actual) * 100
            
            return AccuracyResult(
                metric_type=AccuracyMetricType.WAPE,
                value=float(wape),
                sample_size=len(actual_clean),
                calculation_date=datetime.now()
            )
            
        except Exception as e:
            self.logger.error(f"Error calculating WAPE: {str(e)}")
            return AccuracyResult(
                metric_type=AccuracyMetricType.WAPE,
                value=np.inf,
                sample_size=0,
                calculation_date=datetime.now()
            )
    
    def calculate_bias(self, actual: np.ndarray, forecast: np.ndarray) -> AccuracyResult:
        """
        Calculate forecast bias (average forecast error)
        
        Args:
            actual: Array of actual values
            forecast: Array of forecasted values
            
        Returns:
            AccuracyResult with bias calculation
        """
        try:
            actual = np.array(actual)
            forecast = np.array(forecast)
            
            # Remove NaN values
            mask = ~(np.isnan(actual) | np.isnan(forecast))
            actual_clean = actual[mask]
            forecast_clean = forecast[mask]
            
            if len(actual_clean) == 0:
                return AccuracyResult(
                    metric_type=AccuracyMetricType.BIAS,
                    value=0.0,
                    sample_size=0,
                    calculation_date=datetime.now()
                )
            
            # Calculate bias as mean error
            errors = forecast_clean - actual_clean
            bias = np.mean(errors)
            
            return AccuracyResult(
                metric_type=AccuracyMetricType.BIAS,
                value=float(bias),
                sample_size=len(actual_clean),
                calculation_date=datetime.now()
            )
            
        except Exception as e:
            self.logger.error(f"Error calculating bias: {str(e)}")
            return AccuracyResult(
                metric_type=AccuracyMetricType.BIAS,
                value=0.0,
                sample_size=0,
                calculation_date=datetime.now()
            )
    
    def calculate_rmse(self, actual: np.ndarray, forecast: np.ndarray) -> AccuracyResult:
        """
        Calculate Root Mean Square Error (RMSE)
        
        Args:
            actual: Array of actual values
            forecast: Array of forecasted values
            
        Returns:
            AccuracyResult with RMSE calculation
        """
        try:
            actual = np.array(actual)
            forecast = np.array(forecast)
            
            # Remove NaN values
            mask = ~(np.isnan(actual) | np.isnan(forecast))
            actual_clean = actual[mask]
            forecast_clean = forecast[mask]
            
            if len(actual_clean) == 0:
                return AccuracyResult(
                    metric_type=AccuracyMetricType.RMSE,
                    value=np.inf,
                    sample_size=0,
                    calculation_date=datetime.now()
                )
            
            # Calculate RMSE
            squared_errors = (actual_clean - forecast_clean) ** 2
            rmse = np.sqrt(np.mean(squared_errors))
            
            return AccuracyResult(
                metric_type=AccuracyMetricType.RMSE,
                value=float(rmse),
                sample_size=len(actual_clean),
                calculation_date=datetime.now()
            )
            
        except Exception as e:
            self.logger.error(f"Error calculating RMSE: {str(e)}")
            return AccuracyResult(
                metric_type=AccuracyMetricType.RMSE,
                value=np.inf,
                sample_size=0,
                calculation_date=datetime.now()
            )
    
    def calculate_all_accuracy_metrics(self, actual: np.ndarray, 
                                     forecast: np.ndarray) -> Dict[str, AccuracyResult]:
        """
        Calculate all accuracy metrics at once
        
        Args:
            actual: Array of actual values
            forecast: Array of forecasted values
            
        Returns:
            Dictionary of all accuracy metrics
        """
        return {
            'mape': self.calculate_mape(actual, forecast),
            'wape': self.calculate_wape(actual, forecast),
            'bias': self.calculate_bias(actual, forecast),
            'rmse': self.calculate_rmse(actual, forecast)
        }
    
    def analyze_sku_performance(self, forecast_data: pd.DataFrame, 
                              actual_data: pd.DataFrame) -> List[SKUPerformance]:
        """
        Analyze performance metrics for each SKU
        
        Args:
            forecast_data: DataFrame with columns ['sku_id', 'timestamp', 'forecast_value']
            actual_data: DataFrame with columns ['sku_id', 'timestamp', 'actual_value']
            
        Returns:
            List of SKUPerformance objects
        """
        try:
            # Merge forecast and actual data
            merged_data = pd.merge(
                forecast_data, actual_data,
                on=['sku_id', 'timestamp'],
                how='inner'
            )
            
            sku_performances = []
            
            for sku_id in merged_data['sku_id'].unique():
                sku_data = merged_data[merged_data['sku_id'] == sku_id]
                
                if len(sku_data) == 0:
                    continue
                
                actual_values = sku_data['actual_value'].values
                forecast_values = sku_data['forecast_value'].values
                
                # Calculate metrics
                mape_result = self.calculate_mape(actual_values, forecast_values)
                bias_result = self.calculate_bias(actual_values, forecast_values)
                
                # Calculate total volumes
                total_forecast = np.sum(forecast_values)
                total_actual = np.sum(actual_values)
                
                # Calculate error percentage
                if total_actual != 0:
                    error_percentage = abs((total_forecast - total_actual) / total_actual) * 100
                else:
                    error_percentage = np.inf
                
                # Determine trend direction
                if len(actual_values) > 1:
                    recent_actual = np.mean(actual_values[-7:]) if len(actual_values) >= 7 else actual_values[-1]
                    older_actual = np.mean(actual_values[:7]) if len(actual_values) >= 14 else actual_values[0]
                    
                    if recent_actual > older_actual * 1.05:
                        trend_direction = "increasing"
                    elif recent_actual < older_actual * 0.95:
                        trend_direction = "decreasing"
                    else:
                        trend_direction = "stable"
                else:
                    trend_direction = "insufficient_data"
                
                sku_performance = SKUPerformance(
                    sku_id=str(sku_id),
                    forecast_accuracy=100 - mape_result.value if mape_result.value != np.inf else 0,
                    forecast_error=mape_result.value,
                    volume_forecast=total_forecast,
                    actual_volume=total_actual,
                    error_percentage=error_percentage,
                    bias=bias_result.value,
                    trend_direction=trend_direction
                )
                
                sku_performances.append(sku_performance)
            
            return sku_performances
            
        except Exception as e:
            self.logger.error(f"Error analyzing SKU performance: {str(e)}")
            return []
    
    def calculate_truck_utilization_metrics(self, utilization_data: pd.DataFrame,
                                          baseline_utilization: float = 75.0) -> Dict[str, Any]:
        """
        Calculate truck utilization metrics and improvements
        
        Args:
            utilization_data: DataFrame with utilization percentages over time
            baseline_utilization: Baseline utilization percentage for comparison
            
        Returns:
            Dictionary with utilization metrics
        """
        try:
            if len(utilization_data) == 0:
                return {
                    'current_utilization': 0.0,
                    'seven_day_average': 0.0,
                    'improvement_vs_baseline': 0.0,
                    'trend_direction': 'insufficient_data',
                    'peak_utilization': 0.0,
                    'utilization_variance': 0.0
                }
            
            # Calculate metrics
            current_utilization = utilization_data['utilization_percentage'].iloc[-1]
            seven_day_avg = utilization_data['utilization_percentage'].tail(7).mean()
            improvement = seven_day_avg - baseline_utilization
            
            # Calculate trend
            if len(utilization_data) >= 14:
                recent_avg = utilization_data['utilization_percentage'].tail(7).mean()
                previous_avg = utilization_data['utilization_percentage'].iloc[-14:-7].mean()
                
                if recent_avg > previous_avg * 1.02:
                    trend_direction = "improving"
                elif recent_avg < previous_avg * 0.98:
                    trend_direction = "declining"
                else:
                    trend_direction = "stable"
            else:
                trend_direction = "insufficient_data"
            
            peak_utilization = utilization_data['utilization_percentage'].max()
            utilization_variance = utilization_data['utilization_percentage'].var()
            
            return {
                'current_utilization': float(current_utilization),
                'seven_day_average': float(seven_day_avg),
                'improvement_vs_baseline': float(improvement),
                'trend_direction': trend_direction,
                'peak_utilization': float(peak_utilization),
                'utilization_variance': float(utilization_variance)
            }
            
        except Exception as e:
            self.logger.error(f"Error calculating truck utilization metrics: {str(e)}")
            return {
                'current_utilization': 0.0,
                'seven_day_average': 0.0,
                'improvement_vs_baseline': 0.0,
                'trend_direction': 'error',
                'peak_utilization': 0.0,
                'utilization_variance': 0.0
            }
    
    def calculate_inventory_doh(self, inventory_data: pd.DataFrame,
                              demand_data: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate Days of Inventory on Hand (DOH) by SKU group
        
        Args:
            inventory_data: DataFrame with inventory levels
            demand_data: DataFrame with daily demand
            
        Returns:
            Dictionary with DOH metrics
        """
        try:
            # Merge inventory and demand data
            merged_data = pd.merge(
                inventory_data, demand_data,
                on=['sku_id', 'date'],
                how='inner'
            )
            
            doh_metrics = {}
            
            for sku_id in merged_data['sku_id'].unique():
                sku_data = merged_data[merged_data['sku_id'] == sku_id]
                
                if len(sku_data) == 0:
                    continue
                
                # Calculate average daily demand (last 30 days)
                recent_demand = sku_data['demand'].tail(30)
                avg_daily_demand = recent_demand.mean()
                
                if avg_daily_demand > 0:
                    current_inventory = sku_data['inventory_level'].iloc[-1]
                    doh = current_inventory / avg_daily_demand
                else:
                    doh = np.inf
                
                doh_metrics[str(sku_id)] = {
                    'current_inventory': float(sku_data['inventory_level'].iloc[-1]),
                    'avg_daily_demand': float(avg_daily_demand),
                    'days_of_inventory': float(doh) if doh != np.inf else 999,
                    'status': self._classify_doh_status(doh)
                }
            
            # Calculate overall metrics
            overall_doh = [metrics['days_of_inventory'] for metrics in doh_metrics.values() 
                          if metrics['days_of_inventory'] < 999]
            
            return {
                'sku_level_doh': doh_metrics,
                'average_doh': float(np.mean(overall_doh)) if overall_doh else 0.0,
                'median_doh': float(np.median(overall_doh)) if overall_doh else 0.0,
                'skus_analyzed': len(doh_metrics),
                'calculation_date': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error calculating inventory DOH: {str(e)}")
            return {
                'sku_level_doh': {},
                'average_doh': 0.0,
                'median_doh': 0.0,
                'skus_analyzed': 0,
                'calculation_date': datetime.now().isoformat()
            }
    
    def calculate_otif_performance(self, delivery_data: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate On-Time In-Full (OTIF) performance metrics
        
        Args:
            delivery_data: DataFrame with delivery performance data
            
        Returns:
            Dictionary with OTIF metrics
        """
        try:
            if len(delivery_data) == 0:
                return {
                    'overall_otif_percentage': 0.0,
                    'on_time_percentage': 0.0,
                    'in_full_percentage': 0.0,
                    'total_deliveries': 0,
                    'trend_direction': 'insufficient_data'
                }
            
            # Calculate OTIF metrics
            total_deliveries = len(delivery_data)
            on_time_deliveries = delivery_data['on_time'].sum()
            in_full_deliveries = delivery_data['in_full'].sum()
            otif_deliveries = (delivery_data['on_time'] & delivery_data['in_full']).sum()
            
            otif_percentage = (otif_deliveries / total_deliveries) * 100
            on_time_percentage = (on_time_deliveries / total_deliveries) * 100
            in_full_percentage = (in_full_deliveries / total_deliveries) * 100
            
            # Calculate trend
            if len(delivery_data) >= 60:  # Need at least 60 records for trend analysis
                recent_otif = delivery_data.tail(30)
                previous_otif = delivery_data.iloc[-60:-30]
                
                recent_percentage = ((recent_otif['on_time'] & recent_otif['in_full']).sum() / len(recent_otif)) * 100
                previous_percentage = ((previous_otif['on_time'] & previous_otif['in_full']).sum() / len(previous_otif)) * 100
                
                if recent_percentage > previous_percentage * 1.02:
                    trend_direction = "improving"
                elif recent_percentage < previous_percentage * 0.98:
                    trend_direction = "declining"
                else:
                    trend_direction = "stable"
            else:
                trend_direction = "insufficient_data"
            
            return {
                'overall_otif_percentage': float(otif_percentage),
                'on_time_percentage': float(on_time_percentage),
                'in_full_percentage': float(in_full_percentage),
                'total_deliveries': int(total_deliveries),
                'trend_direction': trend_direction,
                'calculation_date': datetime.now().isoformat()
            }
            
        except Exception as e:
            self.logger.error(f"Error calculating OTIF performance: {str(e)}")
            return {
                'overall_otif_percentage': 0.0,
                'on_time_percentage': 0.0,
                'in_full_percentage': 0.0,
                'total_deliveries': 0,
                'trend_direction': 'error'
            }
    
    def _classify_doh_status(self, doh: float) -> str:
        """Classify DOH status based on days"""
        if doh == np.inf or doh > 90:
            return "excess"
        elif doh > 30:
            return "high"
        elif doh > 7:
            return "normal"
        elif doh > 0:
            return "low"
        else:
            return "stockout"
    
    def _bootstrap_confidence_interval(self, actual: np.ndarray, forecast: np.ndarray,
                                     metric_func, n_bootstrap: int = 1000, 
                                     confidence_level: float = 0.95) -> Tuple[float, float]:
        """Calculate bootstrap confidence interval for a metric"""
        try:
            bootstrap_metrics = []
            n = len(actual)
            
            for _ in range(n_bootstrap):
                # Bootstrap sample
                indices = np.random.choice(n, size=n, replace=True)
                sample_actual = actual[indices]
                sample_forecast = forecast[indices]
                
                # Calculate metric for bootstrap sample
                metric_value = self.calculate_mape_value(sample_actual, sample_forecast)
                bootstrap_metrics.append(metric_value)
            
            bootstrap_metrics = np.array(bootstrap_metrics)
            alpha = 1 - confidence_level
            
            lower_percentile = (alpha / 2) * 100
            upper_percentile = (1 - alpha / 2) * 100
            
            ci_lower = np.percentile(bootstrap_metrics, lower_percentile)
            ci_upper = np.percentile(bootstrap_metrics, upper_percentile)
            
            return ci_lower, ci_upper
            
        except Exception:
            return 0.0, 100.0  # Default wide interval
    
    def calculate_mape_value(self, actual: np.ndarray, forecast: np.ndarray) -> float:
        """Helper method to calculate MAPE value only"""
        mask = actual != 0
        if np.sum(mask) == 0:
            return np.inf
        
        actual_clean = actual[mask]
        forecast_clean = forecast[mask]
        
        percentage_errors = np.abs((actual_clean - forecast_clean) / actual_clean) * 100
        return np.mean(percentage_errors)