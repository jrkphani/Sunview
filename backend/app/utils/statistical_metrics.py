"""
Statistical Metrics Utilities
Advanced statistical calculations for forecast analysis and risk assessment
"""

import numpy as np
import pandas as pd
from typing import List, Tuple, Dict, Optional, Union
from scipy import stats
from scipy.stats import norm, t, chi2
from statsmodels.tsa.seasonal import seasonal_decompose
from statsmodels.tsa.stattools import adfuller, kpss
import warnings
warnings.filterwarnings('ignore')


def calculate_mape(actual: np.ndarray, forecast: np.ndarray) -> float:
    """
    Calculate Mean Absolute Percentage Error (MAPE)
    
    Args:
        actual: Array of actual values
        forecast: Array of forecasted values
        
    Returns:
        MAPE value as percentage
    """
    mask = actual != 0
    return np.mean(np.abs((actual[mask] - forecast[mask]) / actual[mask])) * 100


def calculate_wape(actual: np.ndarray, forecast: np.ndarray) -> float:
    """
    Calculate Weighted Absolute Percentage Error (WAPE)
    
    Args:
        actual: Array of actual values
        forecast: Array of forecasted values
        
    Returns:
        WAPE value as percentage
    """
    return np.sum(np.abs(actual - forecast)) / np.sum(np.abs(actual)) * 100


def calculate_mae(actual: np.ndarray, forecast: np.ndarray) -> float:
    """
    Calculate Mean Absolute Error (MAE)
    
    Args:
        actual: Array of actual values
        forecast: Array of forecasted values
        
    Returns:
        MAE value
    """
    return np.mean(np.abs(actual - forecast))


def calculate_rmse(actual: np.ndarray, forecast: np.ndarray) -> float:
    """
    Calculate Root Mean Square Error (RMSE)
    
    Args:
        actual: Array of actual values
        forecast: Array of forecasted values
        
    Returns:
        RMSE value
    """
    return np.sqrt(np.mean((actual - forecast) ** 2))


def calculate_bias(actual: np.ndarray, forecast: np.ndarray) -> float:
    """
    Calculate Forecast Bias
    
    Args:
        actual: Array of actual values
        forecast: Array of forecasted values
        
    Returns:
        Bias value (positive means over-forecasting)
    """
    return np.mean(forecast - actual)


def calculate_smape(actual: np.ndarray, forecast: np.ndarray) -> float:
    """
    Calculate Symmetric Mean Absolute Percentage Error (SMAPE)
    
    Args:
        actual: Array of actual values
        forecast: Array of forecasted values
        
    Returns:
        SMAPE value as percentage
    """
    denominator = (np.abs(actual) + np.abs(forecast)) / 2
    mask = denominator != 0
    return np.mean(np.abs(actual[mask] - forecast[mask]) / denominator[mask]) * 100


def calculate_all_accuracy_metrics(actual: np.ndarray, forecast: np.ndarray) -> Dict[str, float]:
    """
    Calculate all accuracy metrics at once
    
    Args:
        actual: Array of actual values
        forecast: Array of forecasted values
        
    Returns:
        Dictionary of all accuracy metrics
    """
    return {
        'mape': calculate_mape(actual, forecast),
        'wape': calculate_wape(actual, forecast),
        'mae': calculate_mae(actual, forecast),
        'rmse': calculate_rmse(actual, forecast),
        'bias': calculate_bias(actual, forecast),
        'smape': calculate_smape(actual, forecast),
        'mse': np.mean((actual - forecast) ** 2)
    }


def calculate_confidence_interval_frequentist(
    data: np.ndarray, 
    confidence_level: float = 0.95
) -> Tuple[float, float]:
    """
    Calculate frequentist confidence interval
    
    Args:
        data: Array of data points
        confidence_level: Confidence level (default 0.95)
        
    Returns:
        Tuple of (lower_bound, upper_bound)
    """
    n = len(data)
    mean = np.mean(data)
    std_err = stats.sem(data)
    interval = std_err * t.ppf((1 + confidence_level) / 2, n - 1)
    
    return mean - interval, mean + interval


def calculate_confidence_interval_bootstrap(
    data: np.ndarray, 
    confidence_level: float = 0.95,
    n_bootstrap: int = 1000
) -> Tuple[float, float]:
    """
    Calculate bootstrap confidence interval
    
    Args:
        data: Array of data points
        confidence_level: Confidence level (default 0.95)
        n_bootstrap: Number of bootstrap samples
        
    Returns:
        Tuple of (lower_bound, upper_bound)
    """
    bootstrap_means = []
    n = len(data)
    
    for _ in range(n_bootstrap):
        sample = np.random.choice(data, size=n, replace=True)
        bootstrap_means.append(np.mean(sample))
    
    alpha = 1 - confidence_level
    lower_percentile = (alpha / 2) * 100
    upper_percentile = (1 - alpha / 2) * 100
    
    return np.percentile(bootstrap_means, [lower_percentile, upper_percentile])


def calculate_prediction_interval(
    forecast: float,
    std_error: float,
    confidence_level: float = 0.95,
    df: Optional[int] = None
) -> Tuple[float, float]:
    """
    Calculate prediction interval for a forecast
    
    Args:
        forecast: Point forecast value
        std_error: Standard error of forecast
        confidence_level: Confidence level
        df: Degrees of freedom (None for normal distribution)
        
    Returns:
        Tuple of (lower_bound, upper_bound)
    """
    if df is None:
        # Use normal distribution
        z_score = norm.ppf((1 + confidence_level) / 2)
        margin = z_score * std_error
    else:
        # Use t-distribution
        t_score = t.ppf((1 + confidence_level) / 2, df)
        margin = t_score * std_error
    
    return forecast - margin, forecast + margin


def detect_outliers_zscore(data: np.ndarray, threshold: float = 3.0) -> np.ndarray:
    """
    Detect outliers using Z-score method
    
    Args:
        data: Array of data points
        threshold: Z-score threshold (default 3.0)
        
    Returns:
        Boolean array indicating outliers
    """
    z_scores = np.abs(stats.zscore(data))
    return z_scores > threshold


def detect_outliers_iqr(data: np.ndarray, k: float = 1.5) -> np.ndarray:
    """
    Detect outliers using Interquartile Range (IQR) method
    
    Args:
        data: Array of data points
        k: IQR multiplier (default 1.5)
        
    Returns:
        Boolean array indicating outliers
    """
    Q1 = np.percentile(data, 25)
    Q3 = np.percentile(data, 75)
    IQR = Q3 - Q1
    
    lower_bound = Q1 - k * IQR
    upper_bound = Q3 + k * IQR
    
    return (data < lower_bound) | (data > upper_bound)


def detect_outliers_isolation(data: np.ndarray, contamination: float = 0.1) -> np.ndarray:
    """
    Detect outliers using statistical isolation method
    
    Args:
        data: Array of data points
        contamination: Expected proportion of outliers
        
    Returns:
        Boolean array indicating outliers
    """
    # Use Mahalanobis distance for multivariate outlier detection
    if data.ndim == 1:
        data = data.reshape(-1, 1)
    
    mean = np.mean(data, axis=0)
    cov = np.cov(data.T)
    inv_cov = np.linalg.inv(cov) if np.linalg.det(cov) != 0 else np.linalg.pinv(cov)
    
    distances = []
    for point in data:
        diff = point - mean
        distance = np.sqrt(diff.T @ inv_cov @ diff)
        distances.append(distance)
    
    threshold = np.percentile(distances, (1 - contamination) * 100)
    return np.array(distances) > threshold


def time_series_decomposition(
    data: pd.Series,
    model: str = 'additive',
    period: Optional[int] = None
) -> Dict[str, pd.Series]:
    """
    Perform time series decomposition
    
    Args:
        data: Time series data
        model: 'additive' or 'multiplicative'
        period: Seasonal period (auto-detected if None)
        
    Returns:
        Dictionary with trend, seasonal, and residual components
    """
    if period is None:
        # Simple period detection
        period = estimate_seasonal_period(data)
    
    decomposition = seasonal_decompose(data, model=model, period=period)
    
    return {
        'trend': decomposition.trend,
        'seasonal': decomposition.seasonal,
        'residual': decomposition.resid,
        'observed': data
    }


def estimate_seasonal_period(data: pd.Series) -> int:
    """
    Estimate seasonal period from time series data
    
    Args:
        data: Time series data
        
    Returns:
        Estimated seasonal period
    """
    # Use autocorrelation to find seasonal period
    from statsmodels.tsa.stattools import acf
    
    acf_values = acf(data.dropna(), nlags=min(len(data) // 2, 40))
    
    # Find peaks in ACF
    peaks = []
    for i in range(1, len(acf_values) - 1):
        if acf_values[i] > acf_values[i-1] and acf_values[i] > acf_values[i+1]:
            peaks.append(i)
    
    # Return first significant peak as period
    return peaks[0] if peaks else 12  # Default to 12 for monthly data


def calculate_seasonality_strength(seasonal: pd.Series, residual: pd.Series) -> float:
    """
    Calculate strength of seasonality in time series
    
    Args:
        seasonal: Seasonal component
        residual: Residual component
        
    Returns:
        Seasonality strength (0-1)
    """
    var_seasonal = np.var(seasonal.dropna())
    var_residual = np.var(residual.dropna())
    
    if var_seasonal + var_residual == 0:
        return 0.0
    
    return 1 - var_residual / (var_seasonal + var_residual)


def calculate_trend_strength(trend: pd.Series, residual: pd.Series) -> float:
    """
    Calculate strength of trend in time series
    
    Args:
        trend: Trend component
        residual: Residual component
        
    Returns:
        Trend strength (0-1)
    """
    # Detrend the series
    detrended = trend.dropna() + residual.dropna()
    var_detrended = np.var(detrended)
    var_residual = np.var(residual.dropna())
    
    if var_detrended == 0:
        return 0.0
    
    return 1 - var_residual / var_detrended


def test_stationarity(data: pd.Series) -> Dict[str, Union[bool, float]]:
    """
    Test time series stationarity using multiple tests
    
    Args:
        data: Time series data
        
    Returns:
        Dictionary with test results
    """
    # Augmented Dickey-Fuller test
    adf_result = adfuller(data.dropna())
    
    # KPSS test
    kpss_result = kpss(data.dropna())
    
    return {
        'adf_statistic': adf_result[0],
        'adf_pvalue': adf_result[1],
        'adf_stationary': adf_result[1] < 0.05,
        'kpss_statistic': kpss_result[0],
        'kpss_pvalue': kpss_result[1],
        'kpss_stationary': kpss_result[1] > 0.05,
        'is_stationary': (adf_result[1] < 0.05) and (kpss_result[1] > 0.05)
    }


def calculate_forecast_intervals(
    point_forecasts: np.ndarray,
    residuals: np.ndarray,
    confidence_levels: List[float] = [0.5, 0.8, 0.95]
) -> Dict[float, Tuple[np.ndarray, np.ndarray]]:
    """
    Calculate multiple forecast confidence intervals
    
    Args:
        point_forecasts: Array of point forecasts
        residuals: Historical forecast residuals
        confidence_levels: List of confidence levels
        
    Returns:
        Dictionary mapping confidence level to (lower, upper) bounds
    """
    std_error = np.std(residuals)
    intervals = {}
    
    for level in confidence_levels:
        z_score = norm.ppf((1 + level) / 2)
        margin = z_score * std_error
        
        lower = point_forecasts - margin
        upper = point_forecasts + margin
        
        intervals[level] = (lower, upper)
    
    return intervals


def calculate_volatility(data: np.ndarray, method: str = 'std') -> float:
    """
    Calculate time series volatility
    
    Args:
        data: Time series data
        method: Volatility calculation method ('std', 'garch', 'ewma')
        
    Returns:
        Volatility measure
    """
    if method == 'std':
        return np.std(data)
    elif method == 'ewma':
        # Exponentially weighted moving average volatility
        returns = np.diff(data) / data[:-1]
        ewma_var = pd.Series(returns).ewm(span=20).var()
        return np.sqrt(ewma_var.iloc[-1])
    else:
        # Simple standard deviation as default
        return np.std(data)


def calculate_information_criteria(
    residuals: np.ndarray,
    n_params: int
) -> Dict[str, float]:
    """
    Calculate information criteria for model selection
    
    Args:
        residuals: Model residuals
        n_params: Number of model parameters
        
    Returns:
        Dictionary with AIC, BIC, and HQIC values
    """
    n = len(residuals)
    sse = np.sum(residuals ** 2)
    
    # Akaike Information Criterion
    aic = n * np.log(sse / n) + 2 * n_params
    
    # Bayesian Information Criterion
    bic = n * np.log(sse / n) + n_params * np.log(n)
    
    # Hannan-Quinn Information Criterion
    hqic = n * np.log(sse / n) + 2 * n_params * np.log(np.log(n))
    
    return {
        'aic': aic,
        'bic': bic,
        'hqic': hqic
    }