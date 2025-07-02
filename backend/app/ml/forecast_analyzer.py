"""
Forecast Analysis ML Models
Advanced machine learning models for forecast analysis and improvement
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Union
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, ElasticNet
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import TimeSeriesSplit, cross_val_score
from sklearn.metrics import mean_squared_error, mean_absolute_error
import xgboost as xgb
from prophet import Prophet
from statsmodels.tsa.arima.model import ARIMA
from statsmodels.tsa.statespace.sarimax import SARIMAX
import warnings
warnings.filterwarnings('ignore')


class ForecastAnalyzer:
    """
    Comprehensive forecast analysis and model comparison system
    """
    
    def __init__(self):
        self.models = {}
        self.model_performance = {}
        self.scalers = {}
        self._initialize_models()
    
    def _initialize_models(self):
        """Initialize forecast models"""
        # Traditional ML models
        self.models['random_forest'] = RandomForestRegressor(
            n_estimators=100,
            random_state=42,
            n_jobs=-1
        )
        
        self.models['gradient_boosting'] = GradientBoostingRegressor(
            n_estimators=100,
            random_state=42
        )
        
        self.models['xgboost'] = xgb.XGBRegressor(
            n_estimators=100,
            random_state=42,
            n_jobs=-1
        )
        
        self.models['elastic_net'] = ElasticNet(
            alpha=0.1,
            l1_ratio=0.5,
            random_state=42
        )
        
        # Initialize scalers
        self.scalers['standard'] = StandardScaler()
    
    def analyze_forecast_performance(
        self,
        actual: pd.Series,
        forecasts: Dict[str, pd.Series],
        metrics: List[str] = ['mape', 'rmse', 'mae', 'bias']
    ) -> Dict[str, Dict[str, float]]:
        """
        Analyze performance of multiple forecast models
        
        Args:
            actual: Actual values
            forecasts: Dictionary of forecast series by model name
            metrics: List of metrics to calculate
            
        Returns:
            Performance metrics by model
        """
        performance = {}
        
        for model_name, forecast in forecasts.items():
            # Align actual and forecast
            aligned_actual, aligned_forecast = self._align_series(actual, forecast)
            
            if len(aligned_actual) == 0:
                continue
            
            model_metrics = {}
            
            if 'mape' in metrics:
                model_metrics['mape'] = self._calculate_mape(aligned_actual, aligned_forecast)
            if 'rmse' in metrics:
                model_metrics['rmse'] = np.sqrt(mean_squared_error(aligned_actual, aligned_forecast))
            if 'mae' in metrics:
                model_metrics['mae'] = mean_absolute_error(aligned_actual, aligned_forecast)
            if 'bias' in metrics:
                model_metrics['bias'] = np.mean(aligned_forecast - aligned_actual)
            if 'wape' in metrics:
                model_metrics['wape'] = self._calculate_wape(aligned_actual, aligned_forecast)
            if 'smape' in metrics:
                model_metrics['smape'] = self._calculate_smape(aligned_actual, aligned_forecast)
            
            # Additional advanced metrics
            model_metrics['directional_accuracy'] = self._calculate_directional_accuracy(
                aligned_actual, aligned_forecast
            )
            model_metrics['tracking_signal'] = self._calculate_tracking_signal(
                aligned_actual, aligned_forecast
            )
            
            performance[model_name] = model_metrics
        
        # Add ensemble performance if multiple models
        if len(forecasts) > 1:
            ensemble_forecast = self._create_ensemble_forecast(forecasts)
            aligned_actual, aligned_ensemble = self._align_series(actual, ensemble_forecast)
            
            ensemble_metrics = {}
            for metric in metrics:
                if metric == 'mape':
                    ensemble_metrics['mape'] = self._calculate_mape(aligned_actual, aligned_ensemble)
                elif metric == 'rmse':
                    ensemble_metrics['rmse'] = np.sqrt(mean_squared_error(aligned_actual, aligned_ensemble))
                elif metric == 'mae':
                    ensemble_metrics['mae'] = mean_absolute_error(aligned_actual, aligned_ensemble)
                elif metric == 'bias':
                    ensemble_metrics['bias'] = np.mean(aligned_ensemble - aligned_actual)
            
            performance['ensemble'] = ensemble_metrics
        
        return performance
    
    def compare_models(
        self,
        historical_data: pd.DataFrame,
        target_column: str,
        feature_columns: List[str],
        test_size: int = 30,
        cv_folds: int = 5
    ) -> Dict[str, Any]:
        """
        Compare multiple forecasting models
        
        Args:
            historical_data: Historical data for training
            target_column: Target variable column name
            feature_columns: Feature columns to use
            test_size: Test set size
            cv_folds: Number of cross-validation folds
            
        Returns:
            Model comparison results
        """
        # Prepare data
        X = historical_data[feature_columns].values
        y = historical_data[target_column].values
        
        # Split data
        train_size = len(X) - test_size
        X_train, X_test = X[:train_size], X[train_size:]
        y_train, y_test = y[:train_size], y[train_size:]
        
        # Scale features
        X_train_scaled = self.scalers['standard'].fit_transform(X_train)
        X_test_scaled = self.scalers['standard'].transform(X_test)
        
        results = {}
        
        # Train and evaluate each model
        for model_name, model in self.models.items():
            if model_name in ['prophet', 'arima', 'sarimax']:
                continue  # Skip time series specific models
            
            # Train model
            model.fit(X_train_scaled, y_train)
            
            # Make predictions
            y_pred = model.predict(X_test_scaled)
            
            # Calculate metrics
            metrics = {
                'rmse': np.sqrt(mean_squared_error(y_test, y_pred)),
                'mae': mean_absolute_error(y_test, y_pred),
                'mape': self._calculate_mape(y_test, y_pred),
                'r2': model.score(X_test_scaled, y_test)
            }
            
            # Cross-validation score
            tscv = TimeSeriesSplit(n_splits=cv_folds)
            cv_scores = cross_val_score(
                model, X_train_scaled, y_train,
                cv=tscv, scoring='neg_mean_squared_error'
            )
            metrics['cv_rmse'] = np.sqrt(-cv_scores.mean())
            metrics['cv_std'] = np.sqrt(cv_scores.std())
            
            # Feature importance (if available)
            if hasattr(model, 'feature_importances_'):
                metrics['feature_importance'] = dict(
                    zip(feature_columns, model.feature_importances_)
                )
            
            results[model_name] = metrics
        
        # Determine best model
        best_model = min(results.items(), key=lambda x: x[1]['rmse'])
        
        return {
            'model_performance': results,
            'best_model': best_model[0],
            'best_metrics': best_model[1],
            'ranking': sorted(results.keys(), key=lambda x: results[x]['rmse'])
        }
    
    def decompose_forecast_error(
        self,
        actual: pd.Series,
        forecast: pd.Series
    ) -> Dict[str, float]:
        """
        Decompose forecast error into components
        
        Args:
            actual: Actual values
            forecast: Forecast values
            
        Returns:
            Error decomposition
        """
        aligned_actual, aligned_forecast = self._align_series(actual, forecast)
        
        errors = aligned_forecast - aligned_actual
        
        # Bias component
        bias = np.mean(errors)
        
        # Variance component
        variance = np.var(errors)
        
        # Decompose variance
        trend_error = self._calculate_trend_error(aligned_actual, aligned_forecast)
        seasonal_error = self._calculate_seasonal_error(errors)
        random_error = variance - trend_error - seasonal_error
        
        # Calculate proportions
        total_error = np.mean(errors ** 2)
        
        return {
            'total_error': total_error,
            'bias': bias,
            'bias_squared': bias ** 2,
            'variance': variance,
            'trend_error': trend_error,
            'seasonal_error': seasonal_error,
            'random_error': max(0, random_error),
            'bias_proportion': (bias ** 2) / total_error if total_error > 0 else 0,
            'variance_proportion': variance / total_error if total_error > 0 else 0
        }
    
    def optimize_ensemble_weights(
        self,
        actual: pd.Series,
        forecasts: Dict[str, pd.Series],
        method: str = 'minimize_rmse'
    ) -> Dict[str, float]:
        """
        Optimize ensemble weights for multiple forecasts
        
        Args:
            actual: Actual values
            forecasts: Dictionary of forecasts by model
            method: Optimization method
            
        Returns:
            Optimal weights for each model
        """
        from scipy.optimize import minimize
        
        # Align all series
        aligned_data = {'actual': actual}
        for name, forecast in forecasts.items():
            aligned_data[name] = forecast
        
        aligned_df = pd.DataFrame(aligned_data).dropna()
        
        if len(aligned_df) == 0:
            # Equal weights if no data
            return {name: 1.0 / len(forecasts) for name in forecasts.keys()}
        
        actual_values = aligned_df['actual'].values
        forecast_matrix = aligned_df.drop('actual', axis=1).values
        
        # Objective function
        def objective(weights):
            ensemble = np.dot(forecast_matrix, weights)
            if method == 'minimize_rmse':
                return np.sqrt(mean_squared_error(actual_values, ensemble))
            elif method == 'minimize_mae':
                return mean_absolute_error(actual_values, ensemble)
            else:
                return np.sqrt(mean_squared_error(actual_values, ensemble))
        
        # Constraints: weights sum to 1, all non-negative
        constraints = [
            {'type': 'eq', 'fun': lambda w: np.sum(w) - 1},
            {'type': 'ineq', 'fun': lambda w: w}
        ]
        
        # Initial weights (equal)
        n_models = len(forecasts)
        initial_weights = np.ones(n_models) / n_models
        
        # Optimize
        result = minimize(
            objective,
            initial_weights,
            method='SLSQP',
            constraints=constraints,
            bounds=[(0, 1) for _ in range(n_models)]
        )
        
        # Return optimized weights
        model_names = list(forecasts.keys())
        return dict(zip(model_names, result.x))
    
    def _align_series(
        self,
        series1: pd.Series,
        series2: pd.Series
    ) -> Tuple[np.ndarray, np.ndarray]:
        """Align two series by common index"""
        common_index = series1.index.intersection(series2.index)
        return series1[common_index].values, series2[common_index].values
    
    def _calculate_mape(self, actual: np.ndarray, forecast: np.ndarray) -> float:
        """Calculate Mean Absolute Percentage Error"""
        mask = actual != 0
        if np.sum(mask) == 0:
            return np.inf
        return np.mean(np.abs((actual[mask] - forecast[mask]) / actual[mask])) * 100
    
    def _calculate_wape(self, actual: np.ndarray, forecast: np.ndarray) -> float:
        """Calculate Weighted Absolute Percentage Error"""
        total_actual = np.sum(np.abs(actual))
        if total_actual == 0:
            return np.inf
        return np.sum(np.abs(actual - forecast)) / total_actual * 100
    
    def _calculate_smape(self, actual: np.ndarray, forecast: np.ndarray) -> float:
        """Calculate Symmetric Mean Absolute Percentage Error"""
        denominator = (np.abs(actual) + np.abs(forecast)) / 2
        mask = denominator != 0
        if np.sum(mask) == 0:
            return np.inf
        return np.mean(np.abs(actual[mask] - forecast[mask]) / denominator[mask]) * 100
    
    def _calculate_directional_accuracy(
        self,
        actual: np.ndarray,
        forecast: np.ndarray
    ) -> float:
        """Calculate directional accuracy (trend prediction accuracy)"""
        if len(actual) < 2:
            return 0.0
        
        actual_direction = np.diff(actual) > 0
        forecast_direction = np.diff(forecast) > 0
        
        return np.mean(actual_direction == forecast_direction) * 100
    
    def _calculate_tracking_signal(
        self,
        actual: np.ndarray,
        forecast: np.ndarray
    ) -> float:
        """Calculate tracking signal for bias detection"""
        errors = forecast - actual
        cumulative_error = np.sum(errors)
        mad = np.mean(np.abs(errors))
        
        if mad == 0:
            return 0.0
        
        return cumulative_error / mad
    
    def _create_ensemble_forecast(
        self,
        forecasts: Dict[str, pd.Series],
        weights: Optional[Dict[str, float]] = None
    ) -> pd.Series:
        """Create ensemble forecast from multiple models"""
        if weights is None:
            # Equal weights
            weights = {name: 1.0 / len(forecasts) for name in forecasts.keys()}
        
        # Find common index
        common_index = None
        for forecast in forecasts.values():
            if common_index is None:
                common_index = forecast.index
            else:
                common_index = common_index.intersection(forecast.index)
        
        # Create weighted ensemble
        ensemble = pd.Series(index=common_index, dtype=float)
        ensemble[:] = 0.0
        
        for name, forecast in forecasts.items():
            weight = weights.get(name, 0)
            ensemble += weight * forecast[common_index]
        
        return ensemble
    
    def _calculate_trend_error(
        self,
        actual: np.ndarray,
        forecast: np.ndarray
    ) -> float:
        """Calculate trend component of error"""
        # Fit linear trends
        x = np.arange(len(actual))
        
        actual_trend = np.polyfit(x, actual, 1)
        forecast_trend = np.polyfit(x, forecast, 1)
        
        # Trend difference
        trend_diff = actual_trend[0] - forecast_trend[0]
        
        return trend_diff ** 2 * np.var(x)
    
    def _calculate_seasonal_error(
        self,
        errors: np.ndarray,
        period: int = 7
    ) -> float:
        """Calculate seasonal component of error"""
        if len(errors) < 2 * period:
            return 0.0
        
        # Simple seasonal decomposition of errors
        seasonal_avg = np.zeros(period)
        counts = np.zeros(period)
        
        for i, error in enumerate(errors):
            seasonal_avg[i % period] += error
            counts[i % period] += 1
        
        seasonal_avg /= np.maximum(counts, 1)
        
        # Variance of seasonal component
        return np.var(seasonal_avg)


class AdvancedForecastModels:
    """
    Advanced time series forecasting models
    """
    
    def __init__(self):
        self.prophet_model = None
        self.arima_model = None
        self.sarimax_model = None
    
    def fit_prophet(
        self,
        data: pd.DataFrame,
        seasonality_mode: str = 'multiplicative',
        changepoint_prior_scale: float = 0.05
    ) -> Prophet:
        """
        Fit Prophet model
        
        Args:
            data: DataFrame with 'ds' and 'y' columns
            seasonality_mode: 'additive' or 'multiplicative'
            changepoint_prior_scale: Flexibility of trend changes
            
        Returns:
            Fitted Prophet model
        """
        self.prophet_model = Prophet(
            seasonality_mode=seasonality_mode,
            changepoint_prior_scale=changepoint_prior_scale,
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False
        )
        
        self.prophet_model.fit(data)
        return self.prophet_model
    
    def fit_arima(
        self,
        data: pd.Series,
        order: Tuple[int, int, int] = (1, 1, 1),
        seasonal_order: Optional[Tuple[int, int, int, int]] = None
    ) -> Union[ARIMA, SARIMAX]:
        """
        Fit ARIMA or SARIMAX model
        
        Args:
            data: Time series data
            order: ARIMA order (p, d, q)
            seasonal_order: Seasonal order (P, D, Q, S)
            
        Returns:
            Fitted model
        """
        if seasonal_order:
            self.sarimax_model = SARIMAX(
                data,
                order=order,
                seasonal_order=seasonal_order
            )
            fitted_model = self.sarimax_model.fit(disp=0)
        else:
            self.arima_model = ARIMA(data, order=order)
            fitted_model = self.arima_model.fit()
        
        return fitted_model
    
    def auto_arima_forecast(
        self,
        data: pd.Series,
        forecast_horizon: int,
        seasonal: bool = True
    ) -> pd.Series:
        """
        Automatic ARIMA model selection and forecasting
        
        Args:
            data: Historical time series
            forecast_horizon: Number of periods to forecast
            seasonal: Whether to consider seasonality
            
        Returns:
            Forecast series
        """
        from pmdarima import auto_arima
        
        # Auto ARIMA
        model = auto_arima(
            data,
            seasonal=seasonal,
            m=7 if seasonal else 1,  # Weekly seasonality
            stepwise=True,
            suppress_warnings=True,
            error_action='ignore'
        )
        
        # Generate forecast
        forecast = model.predict(n_periods=forecast_horizon)
        
        # Create forecast index
        last_date = data.index[-1]
        forecast_dates = pd.date_range(
            start=last_date + pd.Timedelta(days=1),
            periods=forecast_horizon,
            freq='D'
        )
        
        return pd.Series(forecast, index=forecast_dates)