"""
Machine Learning Anomaly Detection Models
Advanced anomaly detection for supply chain data
"""

import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional, Union
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
import joblib
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')


class AnomalyDetector:
    """
    Multi-method anomaly detection system
    """
    
    def __init__(self):
        self.models = {}
        self.scalers = {}
        self.thresholds = {}
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize anomaly detection models"""
        # Isolation Forest for general anomaly detection
        self.models['isolation_forest'] = IsolationForest(
            contamination=0.1,
            random_state=42,
            n_estimators=100
        )
        
        # Local Outlier Factor for density-based detection
        self.models['lof'] = LocalOutlierFactor(
            contamination=0.1,
            novelty=True,
            n_neighbors=20
        )
        
        # Initialize scalers
        self.scalers['standard'] = StandardScaler()
    
    def detect_anomalies(
        self,
        data: pd.DataFrame,
        method: str = 'ensemble',
        features: Optional[List[str]] = None
    ) -> Dict[str, Union[np.ndarray, List[Dict]]]:
        """
        Detect anomalies in the data using specified method
        
        Args:
            data: DataFrame with time series data
            method: Detection method ('isolation_forest', 'lof', 'statistical', 'ensemble')
            features: List of features to use for detection
            
        Returns:
            Dictionary with anomaly indicators and details
        """
        if features is None:
            features = self._select_features(data)
        
        X = data[features].values
        
        # Scale the data
        X_scaled = self.scalers['standard'].fit_transform(X)
        
        if method == 'ensemble':
            # Use multiple methods and combine results
            results = self._ensemble_detection(X_scaled, data)
        elif method == 'isolation_forest':
            results = self._isolation_forest_detection(X_scaled, data)
        elif method == 'lof':
            results = self._lof_detection(X_scaled, data)
        elif method == 'statistical':
            results = self._statistical_detection(data)
        else:
            raise ValueError(f"Unknown detection method: {method}")
        
        return results
    
    def _ensemble_detection(
        self,
        X_scaled: np.ndarray,
        data: pd.DataFrame
    ) -> Dict[str, Union[np.ndarray, List[Dict]]]:
        """Ensemble anomaly detection combining multiple methods"""
        # Get predictions from different methods
        iso_scores = self._get_isolation_scores(X_scaled)
        lof_scores = self._get_lof_scores(X_scaled)
        stat_scores = self._get_statistical_scores(data)
        
        # Combine scores (weighted average)
        weights = {'isolation': 0.4, 'lof': 0.3, 'statistical': 0.3}
        
        combined_scores = (
            weights['isolation'] * iso_scores +
            weights['lof'] * lof_scores +
            weights['statistical'] * stat_scores
        )
        
        # Determine anomalies based on combined scores
        threshold = np.percentile(combined_scores, 90)
        anomalies = combined_scores > threshold
        
        # Create detailed results
        anomaly_details = []
        for idx in np.where(anomalies)[0]:
            anomaly_details.append({
                'index': int(idx),
                'timestamp': data.index[idx] if hasattr(data.index, 'to_pydatetime') else idx,
                'anomaly_score': float(combined_scores[idx]),
                'confidence': float(self._calculate_confidence(combined_scores[idx], threshold)),
                'detection_methods': self._get_detection_methods(
                    iso_scores[idx], lof_scores[idx], stat_scores[idx]
                ),
                'anomaly_type': self._classify_anomaly_type(data.iloc[idx])
            })
        
        return {
            'anomalies': anomalies,
            'anomaly_scores': combined_scores,
            'anomaly_details': anomaly_details,
            'total_anomalies': int(np.sum(anomalies)),
            'anomaly_rate': float(np.mean(anomalies))
        }
    
    def _isolation_forest_detection(
        self,
        X_scaled: np.ndarray,
        data: pd.DataFrame
    ) -> Dict[str, Union[np.ndarray, List[Dict]]]:
        """Isolation Forest anomaly detection"""
        # Fit the model
        self.models['isolation_forest'].fit(X_scaled)
        
        # Get anomaly predictions (-1 for anomaly, 1 for normal)
        predictions = self.models['isolation_forest'].predict(X_scaled)
        anomaly_scores = self.models['isolation_forest'].score_samples(X_scaled)
        
        # Convert to boolean (True for anomaly)
        anomalies = predictions == -1
        
        # Normalize scores to 0-1 range
        normalized_scores = (anomaly_scores - anomaly_scores.min()) / (
            anomaly_scores.max() - anomaly_scores.min()
        )
        
        return {
            'anomalies': anomalies,
            'anomaly_scores': normalized_scores,
            'method': 'isolation_forest'
        }
    
    def _lof_detection(
        self,
        X_scaled: np.ndarray,
        data: pd.DataFrame
    ) -> Dict[str, Union[np.ndarray, List[Dict]]]:
        """Local Outlier Factor anomaly detection"""
        # Fit the model
        self.models['lof'].fit(X_scaled)
        
        # Get anomaly predictions
        predictions = self.models['lof'].predict(X_scaled)
        lof_scores = self.models['lof'].score_samples(X_scaled)
        
        # Convert to boolean
        anomalies = predictions == -1
        
        # Normalize scores
        normalized_scores = (lof_scores - lof_scores.min()) / (
            lof_scores.max() - lof_scores.min()
        )
        
        return {
            'anomalies': anomalies,
            'anomaly_scores': normalized_scores,
            'method': 'lof'
        }
    
    def _statistical_detection(self, data: pd.DataFrame) -> Dict[str, Union[np.ndarray, List[Dict]]]:
        """Statistical anomaly detection using z-scores and IQR"""
        anomaly_matrix = []
        
        for column in data.select_dtypes(include=[np.number]).columns:
            # Z-score method
            z_scores = np.abs((data[column] - data[column].mean()) / data[column].std())
            z_anomalies = z_scores > 3
            
            # IQR method
            Q1 = data[column].quantile(0.25)
            Q3 = data[column].quantile(0.75)
            IQR = Q3 - Q1
            iqr_anomalies = (data[column] < (Q1 - 1.5 * IQR)) | (data[column] > (Q3 + 1.5 * IQR))
            
            # Combine methods
            combined = z_anomalies | iqr_anomalies
            anomaly_matrix.append(combined.values)
        
        # Any anomaly in any feature
        anomalies = np.any(anomaly_matrix, axis=0)
        
        # Calculate anomaly scores
        anomaly_scores = np.mean(anomaly_matrix, axis=0)
        
        return {
            'anomalies': anomalies,
            'anomaly_scores': anomaly_scores,
            'method': 'statistical'
        }
    
    def _get_isolation_scores(self, X_scaled: np.ndarray) -> np.ndarray:
        """Get normalized isolation forest scores"""
        self.models['isolation_forest'].fit(X_scaled)
        scores = self.models['isolation_forest'].score_samples(X_scaled)
        return 1 - (scores - scores.min()) / (scores.max() - scores.min())
    
    def _get_lof_scores(self, X_scaled: np.ndarray) -> np.ndarray:
        """Get normalized LOF scores"""
        self.models['lof'].fit(X_scaled)
        scores = self.models['lof'].score_samples(X_scaled)
        return 1 - (scores - scores.min()) / (scores.max() - scores.min())
    
    def _get_statistical_scores(self, data: pd.DataFrame) -> np.ndarray:
        """Get statistical anomaly scores"""
        scores = []
        
        for column in data.select_dtypes(include=[np.number]).columns:
            z_scores = np.abs((data[column] - data[column].mean()) / data[column].std())
            scores.append(z_scores.values)
        
        return np.mean(scores, axis=0) / 3  # Normalize by typical threshold
    
    def _select_features(self, data: pd.DataFrame) -> List[str]:
        """Automatically select features for anomaly detection"""
        # Select numeric columns
        numeric_cols = data.select_dtypes(include=[np.number]).columns.tolist()
        
        # Remove columns with too many missing values
        valid_cols = []
        for col in numeric_cols:
            if data[col].notna().sum() / len(data) > 0.8:
                valid_cols.append(col)
        
        return valid_cols
    
    def _calculate_confidence(self, score: float, threshold: float) -> float:
        """Calculate confidence level for anomaly detection"""
        if score <= threshold:
            return 0.0
        
        # Sigmoid-like function for confidence
        relative_score = (score - threshold) / threshold
        confidence = 1 / (1 + np.exp(-5 * relative_score))
        
        return min(confidence, 0.99)
    
    def _get_detection_methods(
        self,
        iso_score: float,
        lof_score: float,
        stat_score: float
    ) -> List[str]:
        """Determine which methods detected the anomaly"""
        methods = []
        
        if iso_score > 0.7:
            methods.append('isolation_forest')
        if lof_score > 0.7:
            methods.append('local_outlier_factor')
        if stat_score > 0.7:
            methods.append('statistical')
        
        return methods
    
    def _classify_anomaly_type(self, data_point: pd.Series) -> str:
        """Classify the type of anomaly based on data characteristics"""
        # This is a simplified classification - extend based on domain knowledge
        if 'forecast' in data_point.index and 'actual' in data_point.index:
            deviation = abs(data_point['forecast'] - data_point['actual']) / data_point['actual']
            if deviation > 0.3:
                return 'forecast_deviation'
        
        if 'inventory' in data_point.index:
            if data_point['inventory'] <= 0:
                return 'stockout'
            elif data_point['inventory'] > data_point.get('capacity', float('inf')) * 0.9:
                return 'excess_inventory'
        
        if 'demand' in data_point.index:
            # Check for demand spikes (simplified)
            return 'demand_anomaly'
        
        return 'general_anomaly'
    
    def train_custom_model(
        self,
        training_data: pd.DataFrame,
        labels: Optional[np.ndarray] = None,
        model_type: str = 'isolation_forest'
    ):
        """Train a custom anomaly detection model"""
        features = self._select_features(training_data)
        X = training_data[features].values
        X_scaled = self.scalers['standard'].fit_transform(X)
        
        if model_type == 'isolation_forest':
            model = IsolationForest(contamination=0.1, random_state=42)
        elif model_type == 'lof':
            model = LocalOutlierFactor(contamination=0.1, novelty=True)
        else:
            raise ValueError(f"Unknown model type: {model_type}")
        
        model.fit(X_scaled)
        self.models[f'custom_{model_type}'] = model
    
    def save_model(self, model_name: str, filepath: str):
        """Save a trained model to disk"""
        if model_name in self.models:
            joblib.dump(self.models[model_name], filepath)
        else:
            raise ValueError(f"Model {model_name} not found")
    
    def load_model(self, model_name: str, filepath: str):
        """Load a trained model from disk"""
        self.models[model_name] = joblib.load(filepath)


class TimeSeriesAnomalyDetector:
    """
    Specialized anomaly detector for time series data
    """
    
    def __init__(self, seasonality_period: int = 7):
        self.seasonality_period = seasonality_period
        self.trend_model = None
        self.seasonal_model = None
    
    def detect_time_series_anomalies(
        self,
        ts_data: pd.Series,
        window_size: int = 30,
        n_std: float = 3.0
    ) -> Dict[str, Union[np.ndarray, List[Dict]]]:
        """
        Detect anomalies in time series data
        
        Args:
            ts_data: Time series data
            window_size: Window size for rolling statistics
            n_std: Number of standard deviations for threshold
            
        Returns:
            Dictionary with anomaly detection results
        """
        # Decompose time series
        from statsmodels.tsa.seasonal import seasonal_decompose
        
        try:
            decomposition = seasonal_decompose(
                ts_data,
                model='additive',
                period=self.seasonality_period
            )
            
            # Analyze residuals for anomalies
            residuals = decomposition.resid.dropna()
            
            # Rolling statistics
            rolling_mean = residuals.rolling(window=window_size, center=True).mean()
            rolling_std = residuals.rolling(window=window_size, center=True).std()
            
            # Detect anomalies
            upper_bound = rolling_mean + n_std * rolling_std
            lower_bound = rolling_mean - n_std * rolling_std
            
            anomalies = (residuals > upper_bound) | (residuals < lower_bound)
            
            # Calculate anomaly scores
            z_scores = np.abs((residuals - rolling_mean) / rolling_std)
            anomaly_scores = z_scores / n_std  # Normalize
            
            # Create detailed results
            anomaly_details = []
            for idx in anomalies[anomalies].index:
                anomaly_details.append({
                    'timestamp': idx,
                    'value': float(ts_data[idx]),
                    'expected_value': float(decomposition.trend[idx] + decomposition.seasonal[idx]),
                    'residual': float(residuals[idx]),
                    'anomaly_score': float(anomaly_scores[idx]),
                    'type': 'spike' if residuals[idx] > 0 else 'dip'
                })
            
            return {
                'anomalies': anomalies,
                'anomaly_scores': anomaly_scores,
                'anomaly_details': anomaly_details,
                'decomposition': {
                    'trend': decomposition.trend,
                    'seasonal': decomposition.seasonal,
                    'residual': decomposition.resid
                }
            }
            
        except Exception as e:
            # Fallback to simple statistical method
            return self._simple_time_series_detection(ts_data, n_std)
    
    def _simple_time_series_detection(
        self,
        ts_data: pd.Series,
        n_std: float = 3.0
    ) -> Dict[str, Union[np.ndarray, List[Dict]]]:
        """Simple statistical anomaly detection for time series"""
        mean = ts_data.mean()
        std = ts_data.std()
        
        z_scores = np.abs((ts_data - mean) / std)
        anomalies = z_scores > n_std
        
        return {
            'anomalies': anomalies,
            'anomaly_scores': z_scores / n_std,
            'method': 'simple_statistical'
        }
    
    def detect_changepoints(
        self,
        ts_data: pd.Series,
        method: str = 'cusum'
    ) -> List[datetime]:
        """
        Detect changepoints in time series
        
        Args:
            ts_data: Time series data
            method: Detection method ('cusum', 'pelt')
            
        Returns:
            List of changepoint timestamps
        """
        if method == 'cusum':
            return self._cusum_changepoint_detection(ts_data)
        else:
            raise ValueError(f"Unknown changepoint method: {method}")
    
    def _cusum_changepoint_detection(
        self,
        ts_data: pd.Series,
        threshold: float = 5.0
    ) -> List[datetime]:
        """CUSUM changepoint detection"""
        mean = ts_data.mean()
        std = ts_data.std()
        
        # Calculate CUSUM
        cusum_pos = np.zeros(len(ts_data))
        cusum_neg = np.zeros(len(ts_data))
        
        for i in range(1, len(ts_data)):
            cusum_pos[i] = max(0, cusum_pos[i-1] + (ts_data.iloc[i] - mean - 0.5 * std))
            cusum_neg[i] = max(0, cusum_neg[i-1] - (ts_data.iloc[i] - mean + 0.5 * std))
        
        # Detect changepoints
        changepoints = []
        threshold_value = threshold * std
        
        for i in range(len(ts_data)):
            if cusum_pos[i] > threshold_value or cusum_neg[i] > threshold_value:
                changepoints.append(ts_data.index[i])
                # Reset CUSUM after detection
                cusum_pos[i] = 0
                cusum_neg[i] = 0
        
        return changepoints