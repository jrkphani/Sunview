"""
Statistical Analysis Utilities
Advanced statistical methods for forecast analysis and business intelligence
"""

import numpy as np
import pandas as pd
from scipy import stats, signal
from scipy.fft import fft, fftfreq
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score
from sklearn.preprocessing import StandardScaler
from typing import Dict, List, Tuple, Optional, Any
import warnings
from datetime import datetime, timedelta
import math

class StatisticalAnalyzer:
    """Comprehensive statistical analysis utilities"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        
    def detect_seasonality_fft(self, 
                               data: np.ndarray, 
                               timestamps: Optional[np.ndarray] = None,
                               min_strength: float = 0.3) -> Dict[str, Any]:
        """
        Detect seasonality patterns using FFT analysis
        
        Args:
            data: Time series data
            timestamps: Optional timestamps for the data
            min_strength: Minimum strength threshold for pattern detection
            
        Returns:
            Dictionary with seasonality analysis results
        """
        try:
            if len(data) < 14:  # Need at least 2 weeks of data
                return {
                    'has_seasonality': False,
                    'patterns': [],
                    'dominant_period': None,
                    'strength': 0.0,
                    'error': 'Insufficient data for seasonality detection'
                }
            
            # Remove trend and mean
            detrended = self._detrend_data(data)
            
            # Perform FFT
            fft_values = fft(detrended)
            frequencies = fftfreq(len(detrended))
            
            # Calculate power spectral density
            power = np.abs(fft_values) ** 2
            
            # Find peaks in the power spectrum
            peaks, properties = signal.find_peaks(
                power[:len(power)//2],  # Only positive frequencies
                height=np.max(power) * 0.1,  # At least 10% of max power
                distance=3  # Minimum distance between peaks
            )
            
            # Convert frequency indices to periods
            periods = []
            strengths = []
            
            for peak_idx in peaks:
                if frequencies[peak_idx] > 0:  # Avoid zero frequency
                    period = 1.0 / frequencies[peak_idx]
                    if 2 <= period <= len(data) / 2:  # Reasonable period range
                        strength = power[peak_idx] / np.sum(power)
                        if strength >= min_strength:
                            periods.append(period)
                            strengths.append(strength)
            
            # Sort by strength
            if periods:
                sorted_indices = np.argsort(strengths)[::-1]
                periods = [periods[i] for i in sorted_indices]
                strengths = [strengths[i] for i in sorted_indices]
                
                # Classify periods
                patterns = []
                for period, strength in zip(periods, strengths):
                    pattern_type = self._classify_period(period)
                    patterns.append({
                        'type': pattern_type,
                        'period': period,
                        'strength': strength,
                        'frequency': 1.0 / period
                    })
                
                return {
                    'has_seasonality': True,
                    'patterns': patterns,
                    'dominant_period': periods[0],
                    'dominant_strength': strengths[0],
                    'all_periods': periods,
                    'all_strengths': strengths
                }
            else:
                return {
                    'has_seasonality': False,
                    'patterns': [],
                    'dominant_period': None,
                    'strength': 0.0
                }
                
        except Exception as e:
            return {
                'has_seasonality': False,
                'patterns': [],
                'dominant_period': None,
                'strength': 0.0,
                'error': str(e)
            }
    
    def _detrend_data(self, data: np.ndarray) -> np.ndarray:
        """Remove linear trend from data"""
        try:
            x = np.arange(len(data))
            slope, intercept, _, _, _ = stats.linregress(x, data)
            trend = slope * x + intercept
            return data - trend
        except:
            return data - np.mean(data)
    
    def _classify_period(self, period: float) -> str:
        """Classify period into seasonality type"""
        if 6.5 <= period <= 7.5:
            return 'weekly'
        elif 28 <= period <= 32:
            return 'monthly'
        elif 85 <= period <= 95:
            return 'quarterly'
        elif 360 <= period <= 370:
            return 'annual'
        else:
            return 'custom'
    
    def calculate_forecast_bias(self, 
                              forecasts: np.ndarray, 
                              actuals: np.ndarray) -> Dict[str, float]:
        """
        Calculate comprehensive forecast bias metrics
        
        Args:
            forecasts: Forecast values
            actuals: Actual values
            
        Returns:
            Dictionary with bias metrics
        """
        try:
            if len(forecasts) != len(actuals) or len(forecasts) == 0:
                raise ValueError("Forecasts and actuals must have same non-zero length")
            
            # Remove any NaN values
            mask = ~(np.isnan(forecasts) | np.isnan(actuals))
            forecasts = forecasts[mask]
            actuals = actuals[mask]
            
            if len(forecasts) == 0:
                raise ValueError("No valid data points after removing NaN values")
            
            # Calculate bias metrics
            errors = forecasts - actuals
            absolute_errors = np.abs(errors)
            percentage_errors = (errors / actuals) * 100
            
            # Basic bias metrics
            mean_bias = np.mean(errors)
            median_bias = np.median(errors)
            mean_absolute_error = np.mean(absolute_errors)
            
            # Percentage-based metrics
            mean_percentage_error = np.mean(percentage_errors)
            mean_absolute_percentage_error = np.mean(np.abs(percentage_errors))
            
            # Weighted metrics
            weights = np.abs(actuals) / np.sum(np.abs(actuals))
            weighted_bias = np.sum(weights * errors)
            
            # Bias direction and magnitude
            bias_direction = "over" if mean_bias > 0 else "under" if mean_bias < 0 else "neutral"
            
            # Test for systematic bias
            t_stat, p_value = stats.ttest_1samp(errors, 0)
            is_systematic = p_value < 0.05
            
            # Bias consistency (lower is more consistent)
            bias_consistency = np.std(errors)
            
            return {
                'mean_bias': float(mean_bias),
                'median_bias': float(median_bias),
                'mean_absolute_error': float(mean_absolute_error),
                'mean_percentage_error': float(mean_percentage_error),
                'mean_absolute_percentage_error': float(mean_absolute_percentage_error),
                'weighted_bias': float(weighted_bias),
                'bias_direction': bias_direction,
                'is_systematic': bool(is_systematic),
                'bias_consistency': float(bias_consistency),
                'p_value': float(p_value),
                't_statistic': float(t_stat),
                'sample_size': len(forecasts)
            }
            
        except Exception as e:
            return {
                'mean_bias': 0.0,
                'median_bias': 0.0,
                'mean_absolute_error': 0.0,
                'mean_percentage_error': 0.0,
                'mean_absolute_percentage_error': 0.0,
                'weighted_bias': 0.0,
                'bias_direction': 'unknown',
                'is_systematic': False,
                'bias_consistency': 0.0,
                'p_value': 1.0,
                't_statistic': 0.0,
                'sample_size': 0,
                'error': str(e)
            }
    
    def analyze_trend(self, 
                     data: np.ndarray, 
                     timestamps: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """
        Analyze trend in time series data
        
        Args:
            data: Time series data
            timestamps: Optional timestamps
            
        Returns:
            Dictionary with trend analysis results
        """
        try:
            if len(data) < 3:
                return {
                    'has_trend': False,
                    'trend_direction': 'insufficient_data',
                    'slope': 0.0,
                    'r_squared': 0.0,
                    'p_value': 1.0
                }
            
            x = np.arange(len(data)) if timestamps is None else timestamps
            x = x.reshape(-1, 1)
            
            # Fit linear regression
            model = LinearRegression()
            model.fit(x, data)
            
            # Calculate predictions and R-squared
            predictions = model.predict(x)
            r_squared = r2_score(data, predictions)
            
            # Statistical significance test
            n = len(data)
            t_stat = model.coef_[0] * np.sqrt((n - 2) / (1 - r_squared)) / np.sqrt(np.sum((x.flatten() - np.mean(x.flatten()))**2))
            p_value = 2 * (1 - stats.t.cdf(np.abs(t_stat), n - 2))
            
            # Trend classification
            slope = model.coef_[0]
            if p_value < 0.05:
                if slope > 0:
                    trend_direction = 'increasing'
                elif slope < 0:
                    trend_direction = 'decreasing'
                else:
                    trend_direction = 'stable'
                has_trend = True
            else:
                trend_direction = 'stable'
                has_trend = False
            
            return {
                'has_trend': has_trend,
                'trend_direction': trend_direction,
                'slope': float(slope),
                'intercept': float(model.intercept_),
                'r_squared': float(r_squared),
                'p_value': float(p_value),
                't_statistic': float(t_stat)
            }
            
        except Exception as e:
            return {
                'has_trend': False,
                'trend_direction': 'error',
                'slope': 0.0,
                'intercept': 0.0,
                'r_squared': 0.0,
                'p_value': 1.0,
                't_statistic': 0.0,
                'error': str(e)
            }
    
    def calculate_volatility_metrics(self, data: np.ndarray) -> Dict[str, float]:
        """
        Calculate comprehensive volatility metrics
        
        Args:
            data: Time series data
            
        Returns:
            Dictionary with volatility metrics
        """
        try:
            if len(data) < 2:
                return {
                    'coefficient_of_variation': 0.0,
                    'standard_deviation': 0.0,
                    'variance': 0.0,
                    'volatility_score': 0.0,
                    'relative_volatility': 0.0
                }
            
            # Basic volatility metrics
            mean_val = np.mean(data)
            std_val = np.std(data, ddof=1)
            var_val = np.var(data, ddof=1)
            
            # Coefficient of variation
            cv = std_val / mean_val if mean_val != 0 else 0.0
            
            # Normalized volatility score (0-1 scale)
            volatility_score = min(cv, 2.0) / 2.0  # Cap at 2.0 for normalization
            
            # Relative volatility (compared to typical business volatility)
            relative_volatility = cv / 0.2 if cv > 0 else 0.0  # 20% CV as baseline
            
            return {
                'coefficient_of_variation': float(cv),
                'standard_deviation': float(std_val),
                'variance': float(var_val),
                'volatility_score': float(volatility_score),
                'relative_volatility': float(relative_volatility),
                'mean': float(mean_val)
            }
            
        except Exception as e:
            return {
                'coefficient_of_variation': 0.0,
                'standard_deviation': 0.0,
                'variance': 0.0,
                'volatility_score': 0.0,
                'relative_volatility': 0.0,
                'mean': 0.0,
                'error': str(e)
            }
    
    def detect_outliers(self, 
                       data: np.ndarray, 
                       method: str = 'iqr',
                       threshold: float = 1.5) -> Dict[str, Any]:
        """
        Detect outliers in data using various methods
        
        Args:
            data: Data array
            method: Method to use ('iqr', 'zscore', 'modified_zscore')
            threshold: Threshold for outlier detection
            
        Returns:
            Dictionary with outlier detection results
        """
        try:
            outlier_indices = []
            
            if method == 'iqr':
                Q1 = np.percentile(data, 25)
                Q3 = np.percentile(data, 75)
                IQR = Q3 - Q1
                lower_bound = Q1 - threshold * IQR
                upper_bound = Q3 + threshold * IQR
                outlier_indices = np.where((data < lower_bound) | (data > upper_bound))[0]
                
            elif method == 'zscore':
                z_scores = np.abs(stats.zscore(data))
                outlier_indices = np.where(z_scores > threshold)[0]
                
            elif method == 'modified_zscore':
                median = np.median(data)
                mad = np.median(np.abs(data - median))
                modified_z_scores = 0.6745 * (data - median) / mad
                outlier_indices = np.where(np.abs(modified_z_scores) > threshold)[0]
            
            return {
                'outlier_indices': outlier_indices.tolist(),
                'outlier_count': len(outlier_indices),
                'outlier_percentage': (len(outlier_indices) / len(data)) * 100,
                'method_used': method,
                'threshold': threshold
            }
            
        except Exception as e:
            return {
                'outlier_indices': [],
                'outlier_count': 0,
                'outlier_percentage': 0.0,
                'method_used': method,
                'threshold': threshold,
                'error': str(e)
            }
    
    def calculate_statistical_significance(self, 
                                         sample1: np.ndarray, 
                                         sample2: np.ndarray,
                                         test_type: str = 'ttest') -> Dict[str, Any]:
        """
        Calculate statistical significance between two samples
        
        Args:
            sample1: First sample
            sample2: Second sample
            test_type: Type of test ('ttest', 'wilcoxon', 'ks')
            
        Returns:
            Dictionary with statistical test results
        """
        try:
            if test_type == 'ttest':
                statistic, p_value = stats.ttest_ind(sample1, sample2)
                test_name = "Independent t-test"
                
            elif test_type == 'wilcoxon':
                statistic, p_value = stats.mannwhitneyu(sample1, sample2)
                test_name = "Mann-Whitney U test"
                
            elif test_type == 'ks':
                statistic, p_value = stats.ks_2samp(sample1, sample2)
                test_name = "Kolmogorov-Smirnov test"
                
            else:
                raise ValueError(f"Unknown test type: {test_type}")
            
            # Determine significance levels
            significance_levels = {
                'p < 0.001': p_value < 0.001,
                'p < 0.01': p_value < 0.01,
                'p < 0.05': p_value < 0.05,
                'p < 0.10': p_value < 0.10
            }
            
            is_significant = p_value < 0.05
            
            return {
                'test_name': test_name,
                'statistic': float(statistic),
                'p_value': float(p_value),
                'is_significant': is_significant,
                'significance_levels': significance_levels,
                'effect_size': self._calculate_effect_size(sample1, sample2)
            }
            
        except Exception as e:
            return {
                'test_name': test_type,
                'statistic': 0.0,
                'p_value': 1.0,
                'is_significant': False,
                'significance_levels': {},
                'effect_size': 0.0,
                'error': str(e)
            }
    
    def _calculate_effect_size(self, sample1: np.ndarray, sample2: np.ndarray) -> float:
        """Calculate Cohen's d effect size"""
        try:
            mean1, mean2 = np.mean(sample1), np.mean(sample2)
            std1, std2 = np.std(sample1, ddof=1), np.std(sample2, ddof=1)
            n1, n2 = len(sample1), len(sample2)
            
            # Pooled standard deviation
            pooled_std = np.sqrt(((n1 - 1) * std1**2 + (n2 - 1) * std2**2) / (n1 + n2 - 2))
            
            # Cohen's d
            cohens_d = (mean1 - mean2) / pooled_std
            return float(cohens_d)
            
        except:
            return 0.0
    
    def time_series_decomposition(self, 
                                 data: np.ndarray, 
                                 period: Optional[int] = None) -> Dict[str, Any]:
        """
        Decompose time series into trend, seasonal, and residual components
        
        Args:
            data: Time series data
            period: Seasonal period (auto-detected if None)
            
        Returns:
            Dictionary with decomposition results
        """
        try:
            if len(data) < 10:
                return {
                    'trend': data.copy(),
                    'seasonal': np.zeros_like(data),
                    'residual': np.zeros_like(data),
                    'period': 1,
                    'error': 'Insufficient data for decomposition'
                }
            
            # Auto-detect period if not provided
            if period is None:
                seasonality_result = self.detect_seasonality_fft(data)
                if seasonality_result['has_seasonality']:
                    period = max(2, int(seasonality_result['dominant_period']))
                else:
                    period = min(7, len(data) // 3)  # Default to weekly or data length / 3
            
            # Simple moving average for trend
            trend = self._calculate_trend_component(data, period)
            
            # Detrend the data
            detrended = data - trend
            
            # Calculate seasonal component
            seasonal = self._calculate_seasonal_component(detrended, period)
            
            # Residual component
            residual = data - trend - seasonal
            
            return {
                'trend': trend,
                'seasonal': seasonal,
                'residual': residual,
                'period': period,
                'trend_strength': float(np.std(trend) / np.std(data)),
                'seasonal_strength': float(np.std(seasonal) / np.std(data)),
                'residual_strength': float(np.std(residual) / np.std(data))
            }
            
        except Exception as e:
            return {
                'trend': data.copy(),
                'seasonal': np.zeros_like(data),
                'residual': np.zeros_like(data),
                'period': 1,
                'error': str(e)
            }
    
    def _calculate_trend_component(self, data: np.ndarray, period: int) -> np.ndarray:
        """Calculate trend component using centered moving average"""
        try:
            if period <= 1:
                return np.full_like(data, np.mean(data))
            
            # Calculate centered moving average
            trend = np.zeros_like(data)
            half_period = period // 2
            
            for i in range(len(data)):
                start_idx = max(0, i - half_period)
                end_idx = min(len(data), i + half_period + 1)
                trend[i] = np.mean(data[start_idx:end_idx])
            
            return trend
            
        except:
            return np.full_like(data, np.mean(data))
    
    def _calculate_seasonal_component(self, detrended: np.ndarray, period: int) -> np.ndarray:
        """Calculate seasonal component"""
        try:
            if period <= 1:
                return np.zeros_like(detrended)
            
            seasonal = np.zeros_like(detrended)
            
            # Calculate average for each position in the period
            for i in range(period):
                positions = np.arange(i, len(detrended), period)
                if len(positions) > 0:
                    seasonal_value = np.mean(detrended[positions])
                    seasonal[positions] = seasonal_value
            
            return seasonal
            
        except:
            return np.zeros_like(detrended)