"""
Time Series Analysis Utilities
Advanced time series processing and analysis methods
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timedelta
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.metrics import silhouette_score
import warnings
from scipy import signal
from scipy.interpolate import interp1d

class TimeSeriesAnalyzer:
    """Advanced time series analysis and processing utilities"""
    
    def __init__(self):
        self.scaler = StandardScaler()
        self.min_max_scaler = MinMaxScaler()
        
    def calculate_stability_index(self, 
                                 data: np.ndarray, 
                                 window_size: int = 7) -> Dict[str, Any]:
        """
        Calculate comprehensive stability index for time series
        
        Args:
            data: Time series data
            window_size: Rolling window size for calculations
            
        Returns:
            Dictionary with stability metrics
        """
        try:
            if len(data) < window_size * 2:
                return {
                    'stability_index': 0.0,
                    'stability_level': 'insufficient_data',
                    'volatility_score': 1.0,
                    'trend_consistency': 0.0,
                    'error': 'Insufficient data for stability analysis'
                }
            
            # Calculate rolling statistics
            rolling_mean = self._rolling_window_stats(data, window_size, 'mean')
            rolling_std = self._rolling_window_stats(data, window_size, 'std')
            
            # Coefficient of variation for each window
            cv_values = rolling_std / rolling_mean
            cv_values = cv_values[~np.isnan(cv_values)]
            
            if len(cv_values) == 0:
                return {
                    'stability_index': 0.0,
                    'stability_level': 'no_valid_windows',
                    'volatility_score': 1.0,
                    'trend_consistency': 0.0
                }
            
            # Stability metrics
            mean_cv = np.mean(cv_values)
            cv_consistency = 1.0 - np.std(cv_values)  # Lower std = more consistent
            
            # Trend consistency (measure how consistent the direction changes are)
            trend_consistency = self._calculate_trend_consistency(data, window_size)
            
            # Overall stability index (0-1, higher is more stable)
            volatility_penalty = min(mean_cv, 2.0) / 2.0  # Normalize CV
            stability_index = max(0.0, 1.0 - volatility_penalty) * cv_consistency * trend_consistency
            
            # Classify stability level
            stability_level = self._classify_stability_level(stability_index)
            
            return {
                'stability_index': float(stability_index),
                'stability_level': stability_level,
                'volatility_score': float(mean_cv),
                'cv_consistency': float(cv_consistency),
                'trend_consistency': float(trend_consistency),
                'rolling_cv_mean': float(mean_cv),
                'rolling_cv_std': float(np.std(cv_values))
            }
            
        except Exception as e:
            return {
                'stability_index': 0.0,
                'stability_level': 'error',
                'volatility_score': 1.0,
                'trend_consistency': 0.0,
                'error': str(e)
            }
    
    def _rolling_window_stats(self, data: np.ndarray, window_size: int, stat: str) -> np.ndarray:
        """Calculate rolling window statistics"""
        try:
            result = np.full(len(data), np.nan)
            
            for i in range(window_size - 1, len(data)):
                window_data = data[i - window_size + 1:i + 1]
                
                if stat == 'mean':
                    result[i] = np.mean(window_data)
                elif stat == 'std':
                    result[i] = np.std(window_data, ddof=1)
                elif stat == 'median':
                    result[i] = np.median(window_data)
                elif stat == 'min':
                    result[i] = np.min(window_data)
                elif stat == 'max':
                    result[i] = np.max(window_data)
            
            return result
            
        except:
            return np.full(len(data), np.nan)
    
    def _calculate_trend_consistency(self, data: np.ndarray, window_size: int) -> float:
        """Calculate how consistent the trend direction is"""
        try:
            if len(data) < window_size * 2:
                return 0.0
            
            # Calculate rolling slopes
            slopes = []
            for i in range(window_size, len(data) - window_size):
                window_data = data[i - window_size:i + window_size]
                x = np.arange(len(window_data))
                slope = np.polyfit(x, window_data, 1)[0]
                slopes.append(slope)
            
            if len(slopes) < 2:
                return 0.0
            
            slopes = np.array(slopes)
            
            # Count sign changes in slope
            sign_changes = np.sum(np.diff(np.sign(slopes)) != 0)
            max_possible_changes = len(slopes) - 1
            
            # Consistency is inverse of change frequency
            if max_possible_changes > 0:
                consistency = 1.0 - (sign_changes / max_possible_changes)
            else:
                consistency = 1.0
            
            return max(0.0, consistency)
            
        except:
            return 0.0
    
    def _classify_stability_level(self, stability_index: float) -> str:
        """Classify stability index into levels"""
        if stability_index >= 0.8:
            return 'very_stable'
        elif stability_index >= 0.6:
            return 'stable'
        elif stability_index >= 0.4:
            return 'moderate'
        elif stability_index >= 0.2:
            return 'volatile'
        else:
            return 'very_volatile'
    
    def classify_lifecycle_stage(self, 
                                data: np.ndarray, 
                                timestamps: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """
        Classify SKU lifecycle stage based on demand patterns
        
        Args:
            data: Demand time series data
            timestamps: Optional timestamps
            
        Returns:
            Dictionary with lifecycle classification
        """
        try:
            if len(data) < 10:
                return {
                    'lifecycle_stage': 'insufficient_data',
                    'confidence': 0.0,
                    'metrics': {},
                    'reasoning': 'Insufficient data for lifecycle classification'
                }
            
            # Calculate key metrics for lifecycle classification
            metrics = self._calculate_lifecycle_metrics(data)
            
            # Apply classification rules
            stage, confidence, reasoning = self._apply_lifecycle_rules(metrics)
            
            return {
                'lifecycle_stage': stage,
                'confidence': confidence,
                'metrics': metrics,
                'reasoning': reasoning,
                'recommendations': self._get_lifecycle_recommendations(stage)
            }
            
        except Exception as e:
            return {
                'lifecycle_stage': 'error',
                'confidence': 0.0,
                'metrics': {},
                'reasoning': f'Error in classification: {str(e)}'
            }
    
    def _calculate_lifecycle_metrics(self, data: np.ndarray) -> Dict[str, float]:
        """Calculate metrics for lifecycle classification"""
        try:
            # Trend analysis
            x = np.arange(len(data))
            trend_slope = np.polyfit(x, data, 1)[0]
            
            # Growth rate calculation
            if len(data) >= 4:
                first_quarter = np.mean(data[:len(data)//4])
                last_quarter = np.mean(data[-len(data)//4:])
                growth_rate = (last_quarter - first_quarter) / first_quarter if first_quarter > 0 else 0.0
            else:
                growth_rate = 0.0
            
            # Variance and stability
            variance = np.var(data, ddof=1)
            cv = np.std(data, ddof=1) / np.mean(data) if np.mean(data) > 0 else 0.0
            
            # Peak detection
            from scipy.signal import find_peaks
            peaks, _ = find_peaks(data, height=np.mean(data))
            peak_frequency = len(peaks) / len(data)
            
            # Volume characteristics
            mean_volume = np.mean(data)
            max_volume = np.max(data)
            volume_ratio = mean_volume / max_volume if max_volume > 0 else 0.0
            
            # Acceleration (second derivative)
            if len(data) >= 3:
                acceleration = np.mean(np.diff(data, n=2))
            else:
                acceleration = 0.0
            
            return {
                'trend_slope': float(trend_slope),
                'growth_rate': float(growth_rate),
                'variance': float(variance),
                'coefficient_of_variation': float(cv),
                'peak_frequency': float(peak_frequency),
                'mean_volume': float(mean_volume),
                'volume_ratio': float(volume_ratio),
                'acceleration': float(acceleration)
            }
            
        except Exception as e:
            return {
                'trend_slope': 0.0,
                'growth_rate': 0.0,
                'variance': 0.0,
                'coefficient_of_variation': 0.0,
                'peak_frequency': 0.0,
                'mean_volume': 0.0,
                'volume_ratio': 0.0,
                'acceleration': 0.0,
                'error': str(e)
            }
    
    def _apply_lifecycle_rules(self, metrics: Dict[str, float]) -> Tuple[str, float, str]:
        """Apply business rules for lifecycle classification"""
        try:
            slope = metrics['trend_slope']
            growth_rate = metrics['growth_rate']
            cv = metrics['coefficient_of_variation']
            acceleration = metrics['acceleration']
            volume_ratio = metrics['volume_ratio']
            
            # Classification rules with confidence scoring
            if growth_rate > 0.2 and slope > 0 and acceleration > 0:
                return 'growth', 0.9, 'Strong positive growth with acceleration'
            
            elif growth_rate > 0.05 and slope > 0:
                return 'growth', 0.7, 'Positive growth trend observed'
            
            elif abs(growth_rate) < 0.05 and abs(slope) < 0.1 and cv < 0.3:
                return 'maturity', 0.8, 'Stable demand with low volatility'
            
            elif growth_rate < -0.1 and slope < 0:
                if acceleration < -0.1:
                    return 'decline', 0.9, 'Declining demand with negative acceleration'
                else:
                    return 'decline', 0.7, 'Declining demand trend'
            
            elif growth_rate < -0.2 and volume_ratio < 0.3:
                return 'phase_out', 0.8, 'Severe decline indicating phase-out'
            
            elif cv > 0.5:
                return 'introduction', 0.6, 'High volatility suggests introduction phase'
            
            else:
                return 'maturity', 0.5, 'Default classification - stable pattern'
            
        except:
            return 'unknown', 0.0, 'Error in classification rules'
    
    def _get_lifecycle_recommendations(self, stage: str) -> List[str]:
        """Get recommendations based on lifecycle stage"""
        recommendations = {
            'introduction': [
                'Monitor demand patterns closely',
                'Flexible inventory management',
                'Focus on demand generation',
                'Prepare for potential growth'
            ],
            'growth': [
                'Scale inventory and capacity',
                'Optimize supply chain efficiency',
                'Plan for peak demand periods',
                'Monitor competitive threats'
            ],
            'maturity': [
                'Optimize operational efficiency',
                'Focus on cost management',
                'Maintain service levels',
                'Consider product differentiation'
            ],
            'decline': [
                'Reduce inventory levels gradually',
                'Optimize remaining demand',
                'Consider product alternatives',
                'Plan exit strategy if needed'
            ],
            'phase_out': [
                'Minimize inventory exposure',
                'Communicate with stakeholders',
                'Plan orderly discontinuation',
                'Support transition to alternatives'
            ]
        }
        
        return recommendations.get(stage, ['Monitor and reassess regularly'])
    
    def detect_change_points(self, 
                           data: np.ndarray, 
                           min_segment_length: int = 5) -> Dict[str, Any]:
        """
        Detect structural change points in time series
        
        Args:
            data: Time series data
            min_segment_length: Minimum length of segments
            
        Returns:
            Dictionary with change point detection results
        """
        try:
            if len(data) < min_segment_length * 2:
                return {
                    'change_points': [],
                    'segments': [],
                    'change_point_count': 0,
                    'error': 'Insufficient data for change point detection'
                }
            
            # Use cumulative sum method for change point detection
            change_points = self._cumsum_change_point_detection(data, min_segment_length)
            
            # Create segments based on change points
            segments = self._create_segments(data, change_points)
            
            return {
                'change_points': change_points,
                'segments': segments,
                'change_point_count': len(change_points),
                'segment_statistics': self._calculate_segment_statistics(segments)
            }
            
        except Exception as e:
            return {
                'change_points': [],
                'segments': [],
                'change_point_count': 0,
                'error': str(e)
            }
    
    def _cumsum_change_point_detection(self, data: np.ndarray, min_length: int) -> List[int]:
        """Detect change points using cumulative sum method"""
        try:
            # Normalize data
            normalized_data = (data - np.mean(data)) / np.std(data)
            
            # Calculate cumulative sum
            cumsum = np.cumsum(normalized_data)
            
            # Find potential change points
            change_points = []
            
            for i in range(min_length, len(data) - min_length):
                # Calculate deviation from linear trend
                expected = cumsum[0] + (cumsum[-1] - cumsum[0]) * i / (len(data) - 1)
                deviation = abs(cumsum[i] - expected)
                
                # Threshold for change point detection
                threshold = 2.0 * np.std(cumsum)
                
                if deviation > threshold:
                    # Check if this is a local maximum in deviation
                    local_max = True
                    for j in range(max(0, i - 3), min(len(data), i + 4)):
                        if j != i:
                            expected_j = cumsum[0] + (cumsum[-1] - cumsum[0]) * j / (len(data) - 1)
                            deviation_j = abs(cumsum[j] - expected_j)
                            if deviation_j > deviation:
                                local_max = False
                                break
                    
                    if local_max:
                        change_points.append(i)
            
            # Remove change points that are too close to each other
            filtered_change_points = []
            for cp in change_points:
                if not filtered_change_points or cp - filtered_change_points[-1] >= min_length:
                    filtered_change_points.append(cp)
            
            return filtered_change_points
            
        except:
            return []
    
    def _create_segments(self, data: np.ndarray, change_points: List[int]) -> List[Dict[str, Any]]:
        """Create segments based on change points"""
        try:
            segments = []
            start_indices = [0] + change_points
            end_indices = change_points + [len(data) - 1]
            
            for i, (start, end) in enumerate(zip(start_indices, end_indices)):
                segment_data = data[start:end + 1]
                
                segments.append({
                    'segment_id': i,
                    'start_index': start,
                    'end_index': end,
                    'length': len(segment_data),
                    'data': segment_data.tolist(),
                    'mean': float(np.mean(segment_data)),
                    'std': float(np.std(segment_data, ddof=1)) if len(segment_data) > 1 else 0.0,
                    'trend': float(np.polyfit(range(len(segment_data)), segment_data, 1)[0]) if len(segment_data) > 1 else 0.0
                })
            
            return segments
            
        except:
            return []
    
    def _calculate_segment_statistics(self, segments: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Calculate statistics for segments"""
        try:
            if not segments:
                return {}
            
            segment_lengths = [seg['length'] for seg in segments]
            segment_means = [seg['mean'] for seg in segments]
            segment_trends = [seg['trend'] for seg in segments]
            
            return {
                'average_segment_length': float(np.mean(segment_lengths)),
                'segment_length_std': float(np.std(segment_lengths)),
                'mean_level_changes': float(np.std(segment_means)),
                'trend_variability': float(np.std(segment_trends)),
                'total_segments': len(segments)
            }
            
        except:
            return {}
    
    def calculate_forecast_revision_metrics(self, 
                                          forecast_history: List[np.ndarray]) -> Dict[str, Any]:
        """
        Calculate metrics for forecast revision analysis
        
        Args:
            forecast_history: List of forecast arrays (ordered by revision time)
            
        Returns:
            Dictionary with revision metrics
        """
        try:
            if len(forecast_history) < 2:
                return {
                    'revision_frequency': 0.0,
                    'mean_absolute_revision': 0.0,
                    'revision_volatility': 0.0,
                    'error': 'Insufficient forecast history'
                }
            
            # Calculate revisions between consecutive forecasts
            revisions = []
            for i in range(1, len(forecast_history)):
                current = forecast_history[i]
                previous = forecast_history[i-1]
                
                # Ensure same length for comparison
                min_length = min(len(current), len(previous))
                revision = current[:min_length] - previous[:min_length]
                revisions.append(revision)
            
            # Combine all revisions
            all_revisions = np.concatenate(revisions)
            
            # Calculate metrics
            revision_frequency = len(revisions) / len(forecast_history)
            mean_absolute_revision = np.mean(np.abs(all_revisions))
            revision_volatility = np.std(all_revisions, ddof=1)
            
            # Revision consistency (lower is more consistent)
            revision_consistency = 1.0 / (1.0 + revision_volatility)
            
            return {
                'revision_frequency': float(revision_frequency),
                'mean_absolute_revision': float(mean_absolute_revision),
                'revision_volatility': float(revision_volatility),
                'revision_consistency': float(revision_consistency),
                'total_revisions': len(revisions),
                'revision_magnitude_distribution': {
                    'min': float(np.min(np.abs(all_revisions))),
                    'max': float(np.max(np.abs(all_revisions))),
                    'median': float(np.median(np.abs(all_revisions))),
                    'q75': float(np.percentile(np.abs(all_revisions), 75)),
                    'q95': float(np.percentile(np.abs(all_revisions), 95))
                }
            }
            
        except Exception as e:
            return {
                'revision_frequency': 0.0,
                'mean_absolute_revision': 0.0,
                'revision_volatility': 0.0,
                'revision_consistency': 0.0,
                'error': str(e)
            }
    
    def interpolate_missing_values(self, 
                                  data: np.ndarray, 
                                  method: str = 'linear') -> np.ndarray:
        """
        Interpolate missing values in time series
        
        Args:
            data: Time series with potential missing values (NaN)
            method: Interpolation method ('linear', 'polynomial', 'spline')
            
        Returns:
            Array with interpolated values
        """
        try:
            if not np.any(np.isnan(data)):
                return data.copy()
            
            # Find valid indices
            valid_indices = ~np.isnan(data)
            valid_x = np.where(valid_indices)[0]
            valid_y = data[valid_indices]
            
            if len(valid_y) < 2:
                # Not enough valid points for interpolation
                return np.full_like(data, np.nanmean(data))
            
            # Create interpolation function
            if method == 'linear':
                interp_func = interp1d(valid_x, valid_y, kind='linear', 
                                     bounds_error=False, fill_value='extrapolate')
            elif method == 'polynomial':
                degree = min(3, len(valid_y) - 1)
                poly_coeffs = np.polyfit(valid_x, valid_y, degree)
                interp_func = lambda x: np.polyval(poly_coeffs, x)
            elif method == 'spline':
                interp_func = interp1d(valid_x, valid_y, kind='cubic', 
                                     bounds_error=False, fill_value='extrapolate')
            else:
                raise ValueError(f"Unknown interpolation method: {method}")
            
            # Interpolate missing values
            all_indices = np.arange(len(data))
            interpolated = data.copy()
            missing_indices = np.isnan(data)
            
            if np.any(missing_indices):
                interpolated[missing_indices] = interp_func(all_indices[missing_indices])
            
            return interpolated
            
        except Exception as e:
            # Fallback: use mean imputation
            return np.where(np.isnan(data), np.nanmean(data), data)