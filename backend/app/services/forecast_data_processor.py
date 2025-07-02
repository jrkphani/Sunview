"""
Forecast Data Processor Service
Comprehensive service for processing forecast output data from S3 and generating KPIs
"""

import boto3
import pandas as pd
import numpy as np
import json
import io
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import asyncio
from functools import lru_cache
import logging
from dataclasses import dataclass
from enum import Enum

from app.core.config import settings
from app.utils.kpi_calculations import KPICalculator, AccuracyResult, SKUPerformance

logger = logging.getLogger(__name__)

class DataProcessingStatus(Enum):
    """Status of data processing operations"""
    SUCCESS = "success"
    PARTIAL_SUCCESS = "partial_success"
    FAILED = "failed"
    NO_DATA = "no_data"

@dataclass
class ProcessingResult:
    """Result container for data processing operations"""
    status: DataProcessingStatus
    message: str
    data: Optional[Any] = None
    records_processed: int = 0
    processing_time_seconds: float = 0.0
    errors: List[str] = None

class ForecastDataProcessor:
    """Service for processing forecast output data from S3"""
    
    def __init__(self):
        self.s3_client = boto3.client('s3', region_name=settings.AWS_REGION)
        self.bucket_name = settings.S3_BUCKET_NAME
        self.kpi_calculator = KPICalculator()
        self.logger = logging.getLogger(__name__)
        
        # Forecast output path in S3
        self.forecast_output_prefix = "forecasts/forecast-output/"
        self.processed_data_prefix = "processed/"
        
    async def get_forecast_output_data(self, 
                                     forecast_type: str = "demand",
                                     limit: Optional[int] = None) -> ProcessingResult:
        """
        Get forecast output data from S3 bucket
        
        Args:
            forecast_type: Type of forecast (demand, volume, utilization)
            limit: Optional limit on number of records
            
        Returns:
            ProcessingResult with forecast data
        """
        start_time = datetime.now()
        
        try:
            # List forecast output files
            prefix = f"{self.forecast_output_prefix}{forecast_type}/"
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=prefix
            )
            
            if 'Contents' not in response:
                return ProcessingResult(
                    status=DataProcessingStatus.NO_DATA,
                    message=f"No forecast output files found for {forecast_type}",
                    processing_time_seconds=(datetime.now() - start_time).total_seconds()
                )
            
            all_data = []
            errors = []
            
            # Process each forecast output file
            for obj in response['Contents']:
                try:
                    # Skip directory markers
                    if obj['Key'].endswith('/'):
                        continue
                        
                    # Get file content
                    file_response = self.s3_client.get_object(
                        Bucket=self.bucket_name,
                        Key=obj['Key']
                    )
                    
                    # Determine file format and process accordingly
                    if obj['Key'].endswith('.csv'):
                        data = self._process_csv_forecast_file(file_response['Body'])
                    elif obj['Key'].endswith('.json'):
                        data = self._process_json_forecast_file(file_response['Body'])
                    elif obj['Key'].endswith('.parquet'):
                        data = self._process_parquet_forecast_file(file_response['Body'])
                    else:
                        # Try CSV as default
                        data = self._process_csv_forecast_file(file_response['Body'])
                    
                    if data is not None and len(data) > 0:
                        # Add source file metadata
                        for record in data:
                            record['source_file'] = obj['Key']
                            record['last_modified'] = obj['LastModified'].isoformat()
                        
                        all_data.extend(data)
                        
                        # Apply limit if specified
                        if limit and len(all_data) >= limit:
                            all_data = all_data[:limit]
                            break
                    
                except Exception as e:
                    error_msg = f"Error processing file {obj['Key']}: {str(e)}"
                    errors.append(error_msg)
                    self.logger.warning(error_msg)
                    continue
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            if len(all_data) == 0:
                return ProcessingResult(
                    status=DataProcessingStatus.NO_DATA,
                    message=f"No valid forecast data found for {forecast_type}",
                    records_processed=0,
                    processing_time_seconds=processing_time,
                    errors=errors
                )
            
            status = DataProcessingStatus.SUCCESS if len(errors) == 0 else DataProcessingStatus.PARTIAL_SUCCESS
            
            return ProcessingResult(
                status=status,
                message=f"Successfully processed {len(all_data)} forecast records",
                data=all_data,
                records_processed=len(all_data),
                processing_time_seconds=processing_time,
                errors=errors
            )
            
        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            error_msg = f"Failed to get forecast output data: {str(e)}"
            self.logger.error(error_msg)
            
            return ProcessingResult(
                status=DataProcessingStatus.FAILED,
                message=error_msg,
                processing_time_seconds=processing_time,
                errors=[error_msg]
            )
    
    async def process_forecast_accuracy(self, 
                                      time_period_days: int = 30) -> ProcessingResult:
        """
        Process forecast accuracy metrics from S3 data
        
        Args:
            time_period_days: Number of days to analyze
            
        Returns:
            ProcessingResult with accuracy metrics
        """
        start_time = datetime.now()
        
        try:
            # Get forecast data
            forecast_result = await self.get_forecast_output_data("demand")
            if forecast_result.status in [DataProcessingStatus.FAILED, DataProcessingStatus.NO_DATA]:
                return forecast_result
            
            forecast_data = forecast_result.data
            
            # Get actual data (from processed inbound/outbound data)
            actual_result = await self._get_actual_demand_data(time_period_days)
            if actual_result.status in [DataProcessingStatus.FAILED, DataProcessingStatus.NO_DATA]:
                return actual_result
            
            actual_data = actual_result.data
            
            # Create DataFrames for processing
            forecast_df = pd.DataFrame(forecast_data)
            actual_df = pd.DataFrame(actual_data)
            
            # Ensure timestamp columns are datetime
            forecast_df['timestamp'] = pd.to_datetime(forecast_df['timestamp'])
            actual_df['timestamp'] = pd.to_datetime(actual_df['timestamp'])
            
            # Filter by time period
            cutoff_date = datetime.now() - timedelta(days=time_period_days)
            forecast_df = forecast_df[forecast_df['timestamp'] >= cutoff_date]
            actual_df = actual_df[actual_df['timestamp'] >= cutoff_date]
            
            # Merge forecast and actual data
            merged_df = pd.merge(
                forecast_df, actual_df,
                on=['item_id', 'timestamp'],
                how='inner',
                suffixes=('_forecast', '_actual')
            )
            
            if len(merged_df) == 0:
                return ProcessingResult(
                    status=DataProcessingStatus.NO_DATA,
                    message="No matching forecast and actual data found",
                    processing_time_seconds=(datetime.now() - start_time).total_seconds()
                )
            
            # Calculate accuracy metrics
            actual_values = merged_df['target_value_actual'].values
            forecast_values = merged_df['target_value_forecast'].values
            
            accuracy_metrics = self.kpi_calculator.calculate_all_accuracy_metrics(
                actual_values, forecast_values
            )
            
            # Analyze SKU performance
            sku_performance = self.kpi_calculator.analyze_sku_performance(
                forecast_df.rename(columns={'target_value': 'forecast_value'}),
                actual_df.rename(columns={'target_value': 'actual_value'})
            )
            
            # Prepare result data
            result_data = {
                'overall_accuracy': {
                    'mape': accuracy_metrics['mape'].value,
                    'wape': accuracy_metrics['wape'].value,
                    'bias': accuracy_metrics['bias'].value,
                    'rmse': accuracy_metrics['rmse'].value,
                    'sample_size': accuracy_metrics['mape'].sample_size
                },
                'sku_performance': [
                    {
                        'sku_id': sku.sku_id,
                        'forecast_accuracy': sku.forecast_accuracy,
                        'forecast_error': sku.forecast_error,
                        'volume_forecast': sku.volume_forecast,
                        'actual_volume': sku.actual_volume,
                        'error_percentage': sku.error_percentage,
                        'bias': sku.bias,
                        'trend_direction': sku.trend_direction
                    }
                    for sku in sku_performance
                ],
                'time_period_days': time_period_days,
                'records_analyzed': len(merged_df),
                'unique_skus': len(merged_df['item_id'].unique()),
                'calculation_date': datetime.now().isoformat()
            }
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return ProcessingResult(
                status=DataProcessingStatus.SUCCESS,
                message=f"Successfully calculated forecast accuracy for {time_period_days} days",
                data=result_data,
                records_processed=len(merged_df),
                processing_time_seconds=processing_time
            )
            
        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            error_msg = f"Failed to process forecast accuracy: {str(e)}"
            self.logger.error(error_msg)
            
            return ProcessingResult(
                status=DataProcessingStatus.FAILED,
                message=error_msg,
                processing_time_seconds=processing_time,
                errors=[error_msg]
            )
    
    async def get_top_sku_errors(self, 
                               top_n: int = 10,
                               time_period_days: int = 30) -> ProcessingResult:
        """
        Get top N SKUs with highest forecast errors
        
        Args:
            top_n: Number of top SKUs to return
            time_period_days: Analysis period in days
            
        Returns:
            ProcessingResult with top SKU errors
        """
        try:
            # Get forecast accuracy data
            accuracy_result = await self.process_forecast_accuracy(time_period_days)
            
            if accuracy_result.status in [DataProcessingStatus.FAILED, DataProcessingStatus.NO_DATA]:
                return accuracy_result
            
            sku_performance = accuracy_result.data['sku_performance']
            
            # Sort by forecast error (highest first)
            sorted_skus = sorted(sku_performance, 
                               key=lambda x: x['forecast_error'], 
                               reverse=True)
            
            top_skus = sorted_skus[:top_n]
            
            result_data = {
                'top_sku_errors': top_skus,
                'analysis_period_days': time_period_days,
                'total_skus_analyzed': len(sku_performance),
                'calculation_date': datetime.now().isoformat()
            }
            
            return ProcessingResult(
                status=DataProcessingStatus.SUCCESS,
                message=f"Successfully identified top {len(top_skus)} SKUs with highest forecast errors",
                data=result_data,
                records_processed=len(top_skus)
            )
            
        except Exception as e:
            error_msg = f"Failed to get top SKU errors: {str(e)}"
            self.logger.error(error_msg)
            
            return ProcessingResult(
                status=DataProcessingStatus.FAILED,
                message=error_msg,
                errors=[error_msg]
            )
    
    async def process_truck_utilization_metrics(self) -> ProcessingResult:
        """
        Process truck utilization metrics from forecast and actual data
        
        Returns:
            ProcessingResult with utilization metrics
        """
        start_time = datetime.now()
        
        try:
            # Get utilization forecast data
            utilization_result = await self.get_forecast_output_data("utilization")
            if utilization_result.status in [DataProcessingStatus.FAILED, DataProcessingStatus.NO_DATA]:
                return utilization_result
            
            utilization_data = utilization_result.data
            
            # Convert to DataFrame
            utilization_df = pd.DataFrame(utilization_data)
            utilization_df['timestamp'] = pd.to_datetime(utilization_df['timestamp'])
            utilization_df = utilization_df.sort_values('timestamp')
            
            # Rename column for consistency
            utilization_df['utilization_percentage'] = utilization_df['target_value']
            
            # Calculate utilization metrics
            utilization_metrics = self.kpi_calculator.calculate_truck_utilization_metrics(
                utilization_df
            )
            
            # Add historical trend data
            if len(utilization_df) >= 30:
                daily_utilization = utilization_df.groupby(
                    utilization_df['timestamp'].dt.date
                )['utilization_percentage'].mean().reset_index()
                
                utilization_metrics['historical_trend'] = [
                    {
                        'date': str(row['timestamp']),
                        'utilization': row['utilization_percentage']
                    }
                    for _, row in daily_utilization.tail(30).iterrows()
                ]
            else:
                utilization_metrics['historical_trend'] = []
            
            utilization_metrics['calculation_date'] = datetime.now().isoformat()
            utilization_metrics['records_processed'] = len(utilization_df)
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return ProcessingResult(
                status=DataProcessingStatus.SUCCESS,
                message="Successfully processed truck utilization metrics",
                data=utilization_metrics,
                records_processed=len(utilization_df),
                processing_time_seconds=processing_time
            )
            
        except Exception as e:
            processing_time = (datetime.now() - start_time).total_seconds()
            error_msg = f"Failed to process truck utilization metrics: {str(e)}"
            self.logger.error(error_msg)
            
            return ProcessingResult(
                status=DataProcessingStatus.FAILED,
                message=error_msg,
                processing_time_seconds=processing_time,
                errors=[error_msg]
            )
    
    async def generate_alerts_summary(self, 
                                    accuracy_threshold: float = 80.0,
                                    utilization_threshold: float = 70.0) -> ProcessingResult:
        """
        Generate alerts summary based on KPI thresholds
        
        Args:
            accuracy_threshold: Minimum forecast accuracy percentage
            utilization_threshold: Minimum utilization percentage
            
        Returns:
            ProcessingResult with alerts summary
        """
        try:
            alerts = []
            
            # Check forecast accuracy
            accuracy_result = await self.process_forecast_accuracy(7)  # Last 7 days
            if accuracy_result.status == DataProcessingStatus.SUCCESS:
                accuracy_data = accuracy_result.data
                overall_accuracy = 100 - accuracy_data['overall_accuracy']['mape']
                
                if overall_accuracy < accuracy_threshold:
                    alerts.append({
                        'type': 'forecast_accuracy',
                        'severity': 'high' if overall_accuracy < accuracy_threshold - 10 else 'medium',
                        'title': 'Low Forecast Accuracy',
                        'description': f"Overall forecast accuracy is {overall_accuracy:.1f}%, below threshold of {accuracy_threshold}%",
                        'current_value': overall_accuracy,
                        'threshold': accuracy_threshold,
                        'recommendation': 'Review forecasting model parameters and data quality'
                    })
            
            # Check truck utilization
            utilization_result = await self.process_truck_utilization_metrics()
            if utilization_result.status == DataProcessingStatus.SUCCESS:
                utilization_data = utilization_result.data
                current_utilization = utilization_data['seven_day_average']
                
                if current_utilization < utilization_threshold:
                    alerts.append({
                        'type': 'truck_utilization',
                        'severity': 'medium' if current_utilization < utilization_threshold - 5 else 'low',
                        'title': 'Low Truck Utilization',
                        'description': f"7-day average utilization is {current_utilization:.1f}%, below threshold of {utilization_threshold}%",
                        'current_value': current_utilization,
                        'threshold': utilization_threshold,
                        'recommendation': 'Review route optimization and load consolidation opportunities'
                    })
            
            # Check for SKUs with high forecast errors
            top_errors_result = await self.get_top_sku_errors(5, 7)
            if top_errors_result.status == DataProcessingStatus.SUCCESS:
                top_errors = top_errors_result.data['top_sku_errors']
                high_error_skus = [sku for sku in top_errors if sku['forecast_error'] > 50]
                
                if high_error_skus:
                    alerts.append({
                        'type': 'sku_forecast_errors',
                        'severity': 'high',
                        'title': 'High SKU Forecast Errors',
                        'description': f"{len(high_error_skus)} SKUs have forecast errors above 50%",
                        'affected_skus': [sku['sku_id'] for sku in high_error_skus[:3]],
                        'recommendation': 'Review demand patterns and model parameters for affected SKUs'
                    })
            
            result_data = {
                'alerts': alerts,
                'total_alerts': len(alerts),
                'high_severity_count': len([a for a in alerts if a['severity'] == 'high']),
                'medium_severity_count': len([a for a in alerts if a['severity'] == 'medium']),
                'low_severity_count': len([a for a in alerts if a['severity'] == 'low']),
                'last_checked': datetime.now().isoformat(),
                'thresholds': {
                    'accuracy_threshold': accuracy_threshold,
                    'utilization_threshold': utilization_threshold
                }
            }
            
            return ProcessingResult(
                status=DataProcessingStatus.SUCCESS,
                message=f"Generated alerts summary with {len(alerts)} alerts",
                data=result_data,
                records_processed=len(alerts)
            )
            
        except Exception as e:
            error_msg = f"Failed to generate alerts summary: {str(e)}"
            self.logger.error(error_msg)
            
            return ProcessingResult(
                status=DataProcessingStatus.FAILED,
                message=error_msg,
                errors=[error_msg]
            )
    
    def _process_csv_forecast_file(self, file_body) -> List[Dict[str, Any]]:
        """Process CSV forecast file"""
        try:
            csv_content = file_body.read().decode('utf-8')
            df = pd.read_csv(io.StringIO(csv_content))
            
            # Standardize column names
            column_mapping = {
                'timestamp': 'timestamp',
                'date': 'timestamp',
                'target_value': 'target_value',
                'forecast_value': 'target_value',
                'value': 'target_value',
                'item_id': 'item_id',
                'sku_id': 'item_id',
                'sku': 'item_id'
            }
            
            # Rename columns to standard names
            for old_name, new_name in column_mapping.items():
                if old_name in df.columns:
                    df = df.rename(columns={old_name: new_name})
            
            # Ensure required columns exist
            if 'timestamp' not in df.columns or 'target_value' not in df.columns:
                self.logger.warning("Missing required columns in CSV file")
                return []
            
            # Add item_id if missing
            if 'item_id' not in df.columns:
                df['item_id'] = 'unknown'
            
            # Convert to list of dictionaries
            return df.to_dict('records')
            
        except Exception as e:
            self.logger.error(f"Error processing CSV file: {str(e)}")
            return []
    
    def _process_json_forecast_file(self, file_body) -> List[Dict[str, Any]]:
        """Process JSON forecast file"""
        try:
            json_content = file_body.read().decode('utf-8')
            data = json.loads(json_content)
            
            # Handle different JSON structures
            if isinstance(data, list):
                return data
            elif isinstance(data, dict):
                if 'forecasts' in data:
                    return data['forecasts']
                elif 'data' in data:
                    return data['data']
                else:
                    return [data]
            else:
                return []
                
        except Exception as e:
            self.logger.error(f"Error processing JSON file: {str(e)}")
            return []
    
    def _process_parquet_forecast_file(self, file_body) -> List[Dict[str, Any]]:
        """Process Parquet forecast file"""
        try:
            parquet_data = file_body.read()
            df = pd.read_parquet(io.BytesIO(parquet_data))
            return df.to_dict('records')
            
        except Exception as e:
            self.logger.error(f"Error processing Parquet file: {str(e)}")
            return []
    
    async def _get_actual_demand_data(self, days: int) -> ProcessingResult:
        """Get actual demand data for comparison with forecasts"""
        try:
            # Get processed inbound/outbound data that represents actual demand
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix=self.processed_data_prefix + "clean-outbound/"
            )
            
            if 'Contents' not in response:
                return ProcessingResult(
                    status=DataProcessingStatus.NO_DATA,
                    message="No actual demand data found"
                )
            
            # Get the most recent file
            latest_file = max(response['Contents'], key=lambda x: x['LastModified'])
            
            # Download and read the file
            file_response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=latest_file['Key']
            )
            
            if latest_file['Key'].endswith('.parquet'):
                parquet_data = file_response['Body'].read()
                df = pd.read_parquet(io.BytesIO(parquet_data))
            else:
                csv_content = file_response['Body'].read().decode('utf-8')
                df = pd.read_csv(io.StringIO(csv_content))
            
            # Filter by date range
            cutoff_date = datetime.now() - timedelta(days=days)
            if 'timestamp' in df.columns:
                df['timestamp'] = pd.to_datetime(df['timestamp'])
                df = df[df['timestamp'] >= cutoff_date]
            elif 'date' in df.columns:
                df['timestamp'] = pd.to_datetime(df['date'])
                df = df[df['timestamp'] >= cutoff_date]
            
            # Standardize columns
            if 'sku_id' in df.columns:
                df['item_id'] = df['sku_id']
            if 'quantity' in df.columns:
                df['target_value'] = df['quantity']
            elif 'volume' in df.columns:
                df['target_value'] = df['volume']
            
            actual_data = df.to_dict('records')
            
            return ProcessingResult(
                status=DataProcessingStatus.SUCCESS,
                message=f"Retrieved {len(actual_data)} actual demand records",
                data=actual_data,
                records_processed=len(actual_data)
            )
            
        except Exception as e:
            error_msg = f"Failed to get actual demand data: {str(e)}"
            self.logger.error(error_msg)
            
            return ProcessingResult(
                status=DataProcessingStatus.FAILED,
                message=error_msg,
                errors=[error_msg]
            )