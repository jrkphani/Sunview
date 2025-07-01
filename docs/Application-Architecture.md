# GXO Signify Forecasting Solution

## Application Architecture Document

**Version:** 1.0  
**Date:** June 26, 2025  
**Document Type:** Application Architecture Specification  
**Target Audience:** Software developers, application architects, business analysts  

---

## Application Overview

The GXO Signify Forecasting Solution implements a **AWS-native architecture** that transforms raw logistics data into actionable business insights through managed AWS services and focused KPI engines with a responsive dashboard interface.

### Core Architecture Pattern

```
Raw CSV Data → AWS Glue ETL → Amazon Forecast → Lookout for Metrics → KPI Processing → API → React Dashboard
     ↓             ↓             ↓                    ↓                      ↓         ↓        ↓
   S3 Raw      S3 Processed  S3 Forecasts       S3 Anomalies         S3 KPI Results  Lambda  Recharts
```

### Data Flow with AWS Managed Services

```
1. Raw Signify Data (Inbound/Outbound/MVT) → S3 Landing Zone
2. AWS Glue Crawler → Data Catalog → Glue ETL Jobs → Clean & Transform
3. Amazon Forecast → Time Series Forecasting → Confidence Intervals
4. Lookout for Metrics → Anomaly Detection → Business Alerts  
5. Lambda Functions → KPI Calculation → Business Intelligence
6. API Gateway → RESTful APIs → React Dashboard
```

---

## AWS Data Processing Pipeline

### S3 Data Lake Architecture

**Landing Zone Structure:**

```
s3://gxo-signify-pilot/
├── raw/
│   ├── inbound/
│   │   ├── signify-inbound-2024/
│   │   └── signify-inbound-2025/
│   ├── outbound/  
│   │   ├── signify-outbound-2024/
│   │   └── signify-outbound-2025/
│   └── mvt/
│       ├── signify-mvt-2024/
│       └── signify-mvt-2025/
├── processed/
│   ├── clean-inbound/
│   ├── clean-outbound/
│   └── aggregated-mvt/
├── forecasts/
│   ├── amazon-forecast-output/
│   └── forecast-accuracy/
└── kpis/
    ├── daily-metrics/
    └── dashboard-data/
```

### AWS Glue ETL Pipeline

**Glue Job 1: Data Cleansing and Standardization**

```python
# glue_jobs/data_cleansing.py
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from pyspark.sql import functions as F
from pyspark.sql.types import *

class SignifyDataCleaner:
    def __init__(self, glue_context):
        self.glue_context = glue_context
        
    def clean_inbound_data(self, input_path, output_path):
        """
        Clean and standardize inbound logistics data
        Expected columns: project_id, WH_Code, SKU, Req_Qty, Alloc_Qty, Arrival_Date, Volume, etc.
        """
        # Read raw inbound data
        raw_df = self.glue_context.create_dynamic_frame.from_options(
            connection_type="s3",
            connection_options={"paths": [input_path]},
            format="csv",
            format_options={"withHeader": True}
        )
        
        # Convert to Spark DataFrame for processing
        df = raw_df.toDF()
        
        # Data cleansing steps
        cleaned_df = df \
            .filter(F.col("SKU").isNotNull()) \
            .filter(F.col("Req_Qty") > 0) \
            .withColumn("Arrival_Date", F.to_timestamp("Arrival_Date", "M/d/yyyy H:mm:ss.SSS")) \
            .withColumn("Request_Date", F.to_timestamp("Request_Date", "M/d/yyyy H:mm:ss.SSS")) \
            .withColumn("Complete_Date", F.to_timestamp("Complete_Date", "M/d/yyyy H:mm:ss.SSS")) \
            .withColumn("Volume", F.col("Volume").cast(DoubleType())) \
            .withColumn("Req_Qty", F.col("Req_Qty").cast(IntegerType())) \
            .withColumn("Alloc_Qty", F.col("Alloc_Qty").cast(IntegerType())) \
            .withColumn("Fill_Rate", F.col("Alloc_Qty") / F.col("Req_Qty")) \
            .withColumn("Year", F.year("Arrival_Date")) \
            .withColumn("Month", F.month("Arrival_Date")) \
            .withColumn("Week", F.weekofyear("Arrival_Date"))
        
        # Add derived metrics for forecasting
        enriched_df = cleaned_df \
            .withColumn("Daily_Volume", F.col("Volume")) \
            .withColumn("SKU_Category", F.regexp_extract("description", r"^([A-Z]+)", 1)) \
            .withColumn("Lead_Time_Days", 
                       F.datediff("Complete_Date", "Request_Date"))
        
        # Convert back to DynamicFrame and write
        output_df = DynamicFrame.fromDF(enriched_df, self.glue_context, "cleaned_inbound")
        
        self.glue_context.write_dynamic_frame.from_options(
            frame=output_df,
            connection_type="s3",
            connection_options={"path": output_path},
            format="parquet"
        )
        
        return output_df
    
    def aggregate_for_forecasting(self, inbound_path, outbound_path, mvt_path, output_path):
        """
        Create time series aggregations optimized for Amazon Forecast
        """
        # Read processed data
        inbound_df = self.glue_context.create_dynamic_frame.from_options(
            connection_type="s3",
            connection_options={"paths": [inbound_path]},
            format="parquet"
        ).toDF()
        
        # Create daily SKU aggregations
        daily_sku_metrics = inbound_df \
            .groupBy("SKU", "Arrival_Date") \
            .agg(
                F.sum("Volume").alias("total_volume"),
                F.sum("Req_Qty").alias("total_requested"),
                F.sum("Alloc_Qty").alias("total_allocated"),
                F.avg("Fill_Rate").alias("avg_fill_rate"),
                F.count("*").alias("order_count")
            ) \
            .withColumn("date", F.date_format("Arrival_Date", "yyyy-MM-dd"))
        
        # Format for Amazon Forecast (required columns: item_id, timestamp, target_value)
        forecast_input = daily_sku_metrics \
            .select(
                F.col("SKU").alias("item_id"),
                F.col("date").alias("timestamp"), 
                F.col("total_volume").alias("target_value")
            ) \
            .filter(F.col("target_value") > 0)
        
        # Write forecast input data
        forecast_df = DynamicFrame.fromDF(forecast_input, self.glue_context, "forecast_input")
        
        self.glue_context.write_dynamic_frame.from_options(
            frame=forecast_df,
            connection_type="s3",
            connection_options={"path": f"{output_path}/forecast-input/"},
            format="csv",
            format_options={"writeHeader": True}
        )

# Glue Job execution
if __name__ == "__main__":
    args = getResolvedOptions(sys.argv, ['JOB_NAME', 'INPUT_PATH', 'OUTPUT_PATH'])
    
    sc = SparkContext()
    glue_context = GlueContext(sc)
    job = Job(glue_context)
    job.init(args['JOB_NAME'], args)
    
    cleaner = SignifyDataCleaner(glue_context)
    cleaner.clean_inbound_data(args['INPUT_PATH'], args['OUTPUT_PATH'])
    
    job.commit()
```

### Amazon Forecast Integration

**Forecast Dataset Configuration:**

```python
# aws_services/forecast_service.py
import boto3
import json
from datetime import datetime, timedelta

class AmazonForecastService:
    def __init__(self):
        self.forecast_client = boto3.client('forecast')
        self.dataset_group_name = "signify-logistics-forecast"
        
    def create_dataset_group(self):
        """Create dataset group for Signify logistics forecasting"""
        try:
            response = self.forecast_client.create_dataset_group(
                DatasetGroupName=self.dataset_group_name,
                Domain="CUSTOM"
            )
            return response['DatasetGroupArn']
        except self.forecast_client.exceptions.ResourceAlreadyExistsException:
            # Return existing dataset group ARN
            return self._get_dataset_group_arn()
    
    def create_volume_forecast_dataset(self):
        """Create dataset for volume forecasting"""
        schema = {
            "Attributes": [
                {"AttributeName": "timestamp", "AttributeType": "timestamp"},
                {"AttributeName": "target_value", "AttributeType": "float"},
                {"AttributeName": "item_id", "AttributeType": "string"}
            ]
        }
        
        response = self.forecast_client.create_dataset(
            DatasetName="signify-volume-forecast",
            Domain="CUSTOM",
            DatasetType="TARGET_TIME_SERIES",
            DataFrequency="D",  # Daily forecasting
            Schema=schema
        )
        
        return response['DatasetArn']
    
    def import_data_from_s3(self, dataset_arn, s3_path, iam_role_arn):
        """Import processed data from S3 into Forecast"""
        response = self.forecast_client.create_dataset_import_job(
            DatasetImportJobName=f"signify-import-{datetime.now().strftime('%Y%m%d%H%M')}",
            DatasetArn=dataset_arn,
            DataSource={
                'S3Config': {
                    'Path': s3_path,
                    'RoleArn': iam_role_arn
                }
            }
        )
        
        return response['DatasetImportJobArn']
    
    def create_predictor(self, dataset_group_arn):
        """Create predictor for automated ML forecasting"""
        response = self.forecast_client.create_auto_predictor(
            PredictorName=f"signify-predictor-{datetime.now().strftime('%Y%m%d')}",
            ForecastHorizon=28,  # 4 weeks forecast
            ForecastTypes=["0.1", "0.5", "0.9"],  # Confidence intervals
            ForecastFrequency="D",
            DataConfig={
                'DatasetGroupArn': dataset_group_arn
            },
            OptimizationMetric="WAPE"  # Weighted Absolute Percentage Error
        )
        
        return response['PredictorArn']
    
    def generate_forecast(self, predictor_arn):
        """Generate forecasts using trained predictor"""
        response = self.forecast_client.create_forecast(
            ForecastName=f"signify-forecast-{datetime.now().strftime('%Y%m%d')}",
            PredictorArn=predictor_arn
        )
        
        return response['ForecastArn']
    
    def export_forecast_to_s3(self, forecast_arn, s3_destination, iam_role_arn):
        """Export forecast results back to S3"""
        response = self.forecast_client.create_forecast_export_job(
            ForecastExportJobName=f"signify-export-{datetime.now().strftime('%Y%m%d%H%M')}",
            ForecastArn=forecast_arn,
            Destination={
                'S3Config': {
                    'Path': s3_destination,
                    'RoleArn': iam_role_arn
                }
            }
        )
        
        return response['ForecastExportJobArn']
```

---

## Tier 1 KPI Engines - Core Business Logic

### 1. Forecast Accuracy KPI Engine (AWS Forecast Integration)

**Business Purpose:** Validate Amazon Forecast model reliability to enable confident operational planning decisions.

**Key Metrics:**

- MAPE (Mean Absolute Percentage Error)
- WAPE (Weighted Absolute Percentage Error)
- Forecast Bias  
- Confidence Interval Coverage
- Amazon Forecast Accuracy Metrics

```python
# kpi_engine/aws_forecast_accuracy.py
import pandas as pd
import numpy as np
from typing import Dict, List
import boto3
import json

class AWSForecastAccuracyEngine:
    def __init__(self, s3_bucket: str):
        self.s3_bucket = s3_bucket
        self.s3_client = boto3.client('s3')
        self.forecast_client = boto3.client('forecast')
        
    def calculate_forecast_kpis_from_s3(self, forecast_export_path: str, actual_data_path: str) -> Dict:
        """
        Calculate forecast accuracy KPIs using Amazon Forecast output and actual data
        
        Args:
            forecast_export_path: S3 path to Amazon Forecast export (CSV format)
            actual_data_path: S3 path to actual volume data for comparison
        """
        # Load Amazon Forecast results
        forecast_data = self._load_forecast_from_s3(forecast_export_path)
        
        # Load actual data for comparison
        actual_data = self._load_actual_data_from_s3(actual_data_path)
        
        # Merge forecast and actual data
        comparison_data = self._merge_forecast_actual(forecast_data, actual_data)
        
        return self._calculate_accuracy_metrics(comparison_data)
    
    def _load_forecast_from_s3(self, s3_path: str) -> pd.DataFrame:
        """Load Amazon Forecast export from S3"""
        try:
            obj = self.s3_client.get_object(Bucket=self.s3_bucket, Key=s3_path)
            forecast_df = pd.read_csv(obj['Body'])
            
            # Amazon Forecast export format: item_id, date, p10, p50, p90
            forecast_df['date'] = pd.to_datetime(forecast_df['date'])
            
            return forecast_df.rename(columns={
                'item_id': 'sku',
                'p50': 'predicted_value',  # Median forecast
                'p10': 'confidence_lower',
                'p90': 'confidence_upper'
            })
            
        except Exception as e:
            print(f"Error loading forecast data from S3: {e}")
            return pd.DataFrame()
    
    def _load_actual_data_from_s3(self, s3_path: str) -> pd.DataFrame:
        """Load actual volume data from processed S3 data"""
        try:
            obj = self.s3_client.get_object(Bucket=self.s3_bucket, Key=s3_path)
            actual_df = pd.read_csv(obj['Body'])
            
            actual_df['date'] = pd.to_datetime(actual_df['date'])
            
            return actual_df[['sku', 'date', 'total_volume']].rename(columns={
                'total_volume': 'actual_value'
            })
            
        except Exception as e:
            print(f"Error loading actual data from S3: {e}")
            return pd.DataFrame()
    
    def _merge_forecast_actual(self, forecast_df: pd.DataFrame, actual_df: pd.DataFrame) -> pd.DataFrame:
        """Merge forecast and actual data for comparison"""
        merged = pd.merge(
            forecast_df, 
            actual_df, 
            on=['sku', 'date'], 
            how='inner'
        )
        
        # Filter out zero actual values for MAPE calculation
        merged = merged[merged['actual_value'] > 0]
        
        return merged
    
    def _calculate_accuracy_metrics(self, comparison_data: pd.DataFrame) -> Dict:
        """Calculate comprehensive forecast accuracy metrics"""
        if comparison_data.empty:
            return {
                'error': 'No overlapping forecast and actual data found',
                'mape': None,
                'wape': None,
                'bias': None,
                'ci_coverage': None
            }
        
        # MAPE (Mean Absolute Percentage Error)
        mape = np.mean(np.abs((comparison_data['actual_value'] - comparison_data['predicted_value']) / 
                             comparison_data['actual_value'])) * 100
        
        # WAPE (Weighted Absolute Percentage Error)
        total_actual = comparison_data['actual_value'].sum()
        total_error = np.abs(comparison_data['actual_value'] - comparison_data['predicted_value']).sum()
        wape = (total_error / total_actual) * 100 if total_actual != 0 else 0
        
        # Forecast Bias
        bias = ((comparison_data['predicted_value'].sum() - comparison_data['actual_value'].sum()) / 
                comparison_data['actual_value'].sum()) * 100
        
        # Confidence Interval Coverage
        within_ci = ((comparison_data['actual_value'] >= comparison_data['confidence_lower']) & 
                     (comparison_data['actual_value'] <= comparison_data['confidence_upper'])).mean() * 100
        
        # Additional metrics
        rmse = np.sqrt(np.mean((comparison_data['actual_value'] - comparison_data['predicted_value']) ** 2))
        mae = np.mean(np.abs(comparison_data['actual_value'] - comparison_data['predicted_value']))
        
        results = {
            'mape': round(mape, 2),
            'wape': round(wape, 2),
            'bias': round(bias, 2),
            'ci_coverage': round(within_ci, 2),
            'rmse': round(rmse, 2),
            'mae': round(mae, 2),
            'total_forecasts': len(comparison_data),
            'unique_skus': comparison_data['sku'].nunique(),
            'date_range': {
                'start': comparison_data['date'].min().isoformat(),
                'end': comparison_data['date'].max().isoformat()
            },
            'calculation_date': pd.Timestamp.now().isoformat()
        }
        
        # SKU-level breakdown for drill-down
        sku_level_kpis = self._calculate_sku_level_kpis(comparison_data)
        results['sku_breakdown'] = sku_level_kpis
        
        # Time-based accuracy trends
        results['weekly_accuracy'] = self._calculate_weekly_accuracy_trends(comparison_data)
        
        return results
    
    def _calculate_sku_level_kpis(self, data: pd.DataFrame) -> List[Dict]:
        """Calculate KPIs for each SKU for drill-down capability"""
        sku_kpis = []
        
        for sku in data['sku'].unique():
            sku_data = data[data['sku'] == sku]
            if len(sku_data) < 3:  # Skip SKUs with insufficient data
                continue
                
            sku_mape = np.mean(np.abs((sku_data['actual_value'] - sku_data['predicted_value']) / 
                                     sku_data['actual_value'])) * 100
            
            sku_rmse = np.sqrt(np.mean((sku_data['actual_value'] - sku_data['predicted_value']) ** 2))
            
            sku_kpis.append({
                'sku': sku,
                'mape': round(sku_mape, 2),
                'rmse': round(sku_rmse, 2),
                'forecast_count': len(sku_data),
                'avg_volume': round(sku_data['actual_value'].mean(), 2),
                'total_volume': round(sku_data['actual_value'].sum(), 2)
            })
        
        return sorted(sku_kpis, key=lambda x: x['total_volume'], reverse=True)[:20]  # Top 20 by volume
    
    def _calculate_weekly_accuracy_trends(self, data: pd.DataFrame) -> List[Dict]:
        """Calculate weekly accuracy trends for performance monitoring"""
        data['week'] = data['date'].dt.to_period('W')
        
        weekly_metrics = []
        for week in data['week'].unique():
            week_data = data[data['week'] == week]
            
            week_mape = np.mean(np.abs((week_data['actual_value'] - week_data['predicted_value']) / 
                                      week_data['actual_value'])) * 100
            
            weekly_metrics.append({
                'week': str(week),
                'mape': round(week_mape, 2),
                'forecast_count': len(week_data),
                'avg_volume': round(week_data['actual_value'].mean(), 2)
            })
        
        return sorted(weekly_metrics, key=lambda x: x['week'])[-12:]  # Last 12 weeks
    
    def get_predictor_accuracy_metrics(self, predictor_arn: str) -> Dict:
        """Get accuracy metrics directly from Amazon Forecast predictor"""
        try:
            response = self.forecast_client.get_accuracy_metrics(PredictorArn=predictor_arn)
            
            predictor_metrics = response.get('PredictorEvaluationResults', [])
            
            if predictor_metrics:
                # Extract the best performing algorithm metrics
                best_algorithm = predictor_metrics[0]  # Sorted by performance
                
                return {
                    'algorithm_arn': best_algorithm.get('AlgorithmArn'),
                    'rmse': best_algorithm.get('TestWindows', [{}])[0].get('Metrics', {}).get('RMSE'),
                    'wape': best_algorithm.get('TestWindows', [{}])[0].get('Metrics', {}).get('WeightedQuantileLoss', {}).get('0.5'),
                    'mape': best_algorithm.get('TestWindows', [{}])[0].get('Metrics', {}).get('MAPE'),
                    'evaluation_type': 'BACKTESTING'
                }
            
        except Exception as e:
            print(f"Error retrieving predictor metrics: {e}")
            
        return {}
```

**Business Value Indicators:**

- MAPE < 15% = Reliable for operational planning
- WAPE < 10% = Suitable for aggregate capacity planning
- |Bias| < 5% = No systematic over/under-forecasting
- CI Coverage > 80% = Confidence intervals properly calibrated

---

### 2. Anomaly Detection KPI Engine (AWS Lookout for Metrics)

**Business Purpose:** Proactive identification of demand spikes and drops using AWS Lookout for Metrics to enable preventive capacity planning and risk mitigation.

**Integration:** AWS Lookout for Metrics → SNS Alerts → Business Logic → Actionable Insights

```python
# kpi_engine/aws_anomaly_detection.py
import boto3
from typing import Dict, List
import pandas as pd
from datetime import datetime, timedelta
import json

class AWSAnomalyDetectionEngine:
    def __init__(self, s3_bucket: str):
        self.s3_bucket = s3_bucket
        self.lookout_client = boto3.client('lookoutmetrics')
        self.s3_client = boto3.client('s3')
        self.sns_client = boto3.client('sns')
    
    def setup_lookout_detector(self) -> str:
        """
        Setup Lookout for Metrics detector for Signify logistics data
        """
        detector_config = {
            'AnomalyDetectorName': 'signify-logistics-anomaly-detector',
            'AnomalyDetectorDescription': 'Detect anomalies in Signify logistics volume and fill rates',
            'MetricSetList': [
                {
                    'MetricSetName': 'signify-volume-metrics',
                    'MetricSetDescription': 'Daily volume metrics by SKU',
                    'MetricList': [
                        {
                            'MetricName': 'daily_volume',
                            'AggregationFunction': 'SUM'
                        },
                        {
                            'MetricName': 'fill_rate', 
                            'AggregationFunction': 'AVG'
                        },
                        {
                            'MetricName': 'order_count',
                            'AggregationFunction': 'COUNT'
                        }
                    ],
                    'DimensionList': ['sku', 'warehouse', 'supplier'],
                    'TimestampColumn': {
                        'ColumnName': 'timestamp',
                        'ColumnFormat': 'yyyy-MM-dd'
                    },
                    'MetricSource': {
                        'S3SourceConfig': {
                            'RoleArn': 'arn:aws:iam::ACCOUNT:role/LookoutMetricsRole',
                            'TemplatedPathList': [
                                f's3://{self.s3_bucket}/processed/daily-metrics/year=*/month=*/'
                            ],
                            'HistoricalDataPathList': [
                                f's3://{self.s3_bucket}/processed/daily-metrics/'
                            ]
                        }
                    },
                    'Frequency': 'P1D',  # Daily detection
                    'Offset': 0
                }
            ]
        }
        
        try:
            response = self.lookout_client.create_anomaly_detector(**detector_config)
            return response['AnomalyDetectorArn']
        except self.lookout_client.exceptions.ConflictException:
            # Detector already exists, return ARN
            return self._get_existing_detector_arn()
    
    def process_anomaly_results(self, anomaly_detector_arn: str, days_back: int = 7) -> Dict:
        """
        Process Lookout for Metrics results into business KPIs
        """
        end_time = datetime.now()
        start_time = end_time - timedelta(days=days_back)
        
        # Get anomaly results from Lookout for Metrics
        response = self.lookout_client.list_anomaly_group_summaries(
            AnomalyDetectorArn=anomaly_detector_arn,
            SensitivityThreshold=70,  # Medium sensitivity
            MaxResults=100
        )
        
        anomalies = response.get('AnomalyGroupSummaryList', [])
        
        # Process and categorize anomalies
        processed_anomalies = self._categorize_anomalies(anomalies)
        
        # Calculate business impact metrics
        business_impact = self._calculate_business_impact(processed_anomalies)
        
        return {
            'summary': {
                'total_anomalies': len(anomalies),
                'high_severity_anomalies': len([a for a in anomalies if a.get('Score', 0) > 0.7]),
                'medium_severity_anomalies': len([a for a in anomalies if 0.4 <= a.get('Score', 0) <= 0.7]),
                'low_severity_anomalies': len([a for a in anomalies if a.get('Score', 0) < 0.4])
            },
            'categorized_anomalies': processed_anomalies,
            'business_impact': business_impact,
            'severity_distribution': self._calculate_severity_distribution(anomalies),
            'top_anomalies': sorted(anomalies, key=lambda x: x.get('Score', 0), reverse=True)[:5],
            'generated_at': datetime.now().isoformat()
        }
    
    def _categorize_anomalies(self, anomalies: List[Dict]) -> Dict:
        """Categorize anomalies by business impact type"""
        volume_spikes = []
        volume_drops = []
        fill_rate_issues = []
        order_count_anomalies = []
        
        for anomaly in anomalies:
            anomaly_details = self._get_anomaly_details(anomaly.get('AnomalyGroupArn'))
            
            for metric_name, metric_data in anomaly_details.items():
                if 'volume' in metric_name.lower():
                    if metric_data.get('direction') == 'UP':
                        volume_spikes.append({
                            'sku': metric_data.get('sku'),
                            'date': anomaly.get('StartTime'),
                            'score': anomaly.get('Score'),
                            'impact_value': metric_data.get('value'),
                            'expected_value': metric_data.get('expected'),
                            'warehouse': metric_data.get('warehouse')
                        })
                    else:
                        volume_drops.append({
                            'sku': metric_data.get('sku'),
                            'date': anomaly.get('StartTime'),
                            'score': anomaly.get('Score'),
                            'impact_value': metric_data.get('value'),
                            'expected_value': metric_data.get('expected'),
                            'warehouse': metric_data.get('warehouse')
                        })
                elif 'fill_rate' in metric_name.lower():
                    fill_rate_issues.append({
                        'sku': metric_data.get('sku'),
                        'date': anomaly.get('StartTime'),
                        'score': anomaly.get('Score'),
                        'actual_fill_rate': metric_data.get('value'),
                        'expected_fill_rate': metric_data.get('expected'),
                        'warehouse': metric_data.get('warehouse')
                    })
        
        return {
            'volume_spikes': volume_spikes[:10],  # Top 10
            'volume_drops': volume_drops[:10],
            'fill_rate_issues': fill_rate_issues[:10],
            'order_count_anomalies': order_count_anomalies[:10]
        }
    
    def _calculate_business_impact(self, categorized_anomalies: Dict) -> Dict:
        """Calculate potential business impact of detected anomalies"""
        
        # Volume spike impact - potential revenue opportunity
        volume_spike_impact = sum([
            spike.get('impact_value', 0) - spike.get('expected_value', 0) 
            for spike in categorized_anomalies.get('volume_spikes', [])
        ])
        
        # Volume drop impact - potential revenue loss
        volume_drop_impact = sum([
            drop.get('expected_value', 0) - drop.get('impact_value', 0)
            for drop in categorized_anomalies.get('volume_drops', [])
        ])
        
        # Fill rate impact - customer satisfaction risk
        critical_fill_rate_issues = len([
            issue for issue in categorized_anomalies.get('fill_rate_issues', [])
            if issue.get('actual_fill_rate', 100) < 85  # Below 85% is critical
        ])
        
        return {
            'revenue_opportunity': round(volume_spike_impact, 2),
            'potential_revenue_loss': round(volume_drop_impact, 2),
            'critical_fill_rate_issues': critical_fill_rate_issues,
            'capacity_planning_alerts': len(categorized_anomalies.get('volume_spikes', [])),
            'inventory_shortage_alerts': len(categorized_anomalies.get('volume_drops', [])) + 
                                      len(categorized_anomalies.get('fill_rate_issues', []))
        }
    
    def _get_anomaly_details(self, anomaly_group_arn: str) -> Dict:
        """Get detailed information about specific anomaly group"""
        try:
            response = self.lookout_client.get_anomaly_group(
                AnomalyGroupArn=anomaly_group_arn
            )
            
            # Process anomaly group details into structured format
            details = {}
            for related_metric in response.get('RelatedMetrics', []):
                metric_name = related_metric.get('MetricName')
                details[metric_name] = {
                    'value': related_metric.get('Value'),
                    'expected': related_metric.get('ExpectedValue'),
                    'direction': 'UP' if related_metric.get('Value', 0) > related_metric.get('ExpectedValue', 0) else 'DOWN'
                }
                
                # Extract dimension information (SKU, warehouse, etc.)
                for dimension in related_metric.get('DimensionContribution', []):
                    details[metric_name][dimension.get('DimensionName')] = dimension.get('DimensionValue')
            
            return details
            
        except Exception as e:
            print(f"Error getting anomaly details: {e}")
            return {}
    
    def _calculate_severity_distribution(self, anomalies: List[Dict]) -> Dict:
        """Categorize anomalies by severity for dashboard display"""
        low = len([a for a in anomalies if a.get('Score', 0) < 0.4])
        medium = len([a for a in anomalies if 0.4 <= a.get('Score', 0) < 0.7])
        high = len([a for a in anomalies if a.get('Score', 0) >= 0.7])
        
        return {'low': low, 'medium': medium, 'high': high}
    
    def setup_anomaly_alerts(self, sns_topic_arn: str, anomaly_detector_arn: str):
        """Setup SNS alerts for high-severity anomalies"""
        alert_config = {
            'AlertName': 'signify-high-severity-anomalies',
            'AlertDescription': 'Alert for high-severity logistics anomalies',
            'AnomalyDetectorArn': anomaly_detector_arn,
            'AlertSensitivityThreshold': 80,  # High sensitivity for critical alerts
            'Action': {
                'SNSConfiguration': {
                    'RoleArn': 'arn:aws:iam::ACCOUNT:role/LookoutMetricsSNSRole',
                    'SnsTopicArn': sns_topic_arn
                }
            }
        }
        
        try:
            response = self.lookout_client.create_alert(**alert_config)
            return response['AlertArn']
        except Exception as e:
            print(f"Error creating alert: {e}")
            return None
    
    def _get_existing_detector_arn(self) -> str:
        """Get ARN of existing anomaly detector"""
        try:
            response = self.lookout_client.list_anomaly_detectors()
            for detector in response.get('AnomalyDetectorSummaryList', []):
                if detector.get('AnomalyDetectorName') == 'signify-logistics-anomaly-detector':
                    return detector.get('AnomalyDetectorArn')
        except Exception as e:
            print(f"Error finding existing detector: {e}")
        return ""
```

**Business Value Indicators:**

- High Severity Anomalies = Immediate capacity planning required
- Volume Spikes = Opportunity for premium service offerings
- Demand Drops = Risk mitigation and resource reallocation needed

---

### 3. Logistics Efficiency KPI Engine

**Business Purpose:** Directly support the pilot's core objectives of truck utilization improvement and cost reduction.

**Key Capabilities:**

- Fill Rate Analysis
- Truck Utilization Optimization
- Capacity Planning Insights
- Efficiency Scoring

```python
# kpi_engine/logistics_efficiency.py
import pandas as pd
import numpy as np
from typing import Dict

class LogisticsKPIEngine:
    def __init__(self):
        pass
    
    def calculate_logistics_kpis(self, 
                                historical_data: pd.DataFrame,
                                forecast_data: pd.DataFrame,
                                capacity_data: pd.DataFrame) -> Dict:
        """
        Calculate logistics efficiency KPIs
        
        historical_data: actual shipment/delivery data
        forecast_data: predicted volumes
        capacity_data: warehouse/truck capacity info
        """
        
        # Fill Rate Calculation
        fill_rate = self._calculate_fill_rate(historical_data)
        
        # Projected Truck Utilization based on forecasts
        truck_utilization = self._calculate_truck_utilization(forecast_data, capacity_data)
        
        # Capacity Planning Insights
        capacity_insights = self._analyze_capacity_requirements(forecast_data, capacity_data)
        
        return {
            'fill_rate': fill_rate,
            'truck_utilization': truck_utilization,
            'capacity_insights': capacity_insights,
            'efficiency_score': self._calculate_efficiency_score(fill_rate, truck_utilization)
        }
    
    def _calculate_fill_rate(self, historical_data: pd.DataFrame) -> Dict:
        """Calculate order fill rate metrics"""
        total_orders = len(historical_data)
        completed_orders = len(historical_data[historical_data['status'] == 'completed'])
        
        fill_rate = (completed_orders / total_orders) * 100 if total_orders > 0 else 0
        
        # SKU-level fill rate for drill-down
        sku_fill_rates = historical_data.groupby('sku').apply(
            lambda x: (len(x[x['status'] == 'completed']) / len(x)) * 100
        ).to_dict()
        
        return {
            'overall_fill_rate': round(fill_rate, 2),
            'total_orders': total_orders,
            'completed_orders': completed_orders,
            'sku_breakdown': dict(list(sku_fill_rates.items())[:10])  # Top 10 SKUs
        }
    
    def _calculate_truck_utilization(self, forecast_data: pd.DataFrame, capacity_data: pd.DataFrame) -> Dict:
        """Calculate projected truck utilization based on forecasts"""
        # Group forecasts by date and calculate total volume
        daily_volumes = forecast_data.groupby('date')['predicted_value'].sum()
        
        # Assume standard truck capacity (this would come from capacity_data in reality)
        truck_capacity = capacity_data.get('truck_capacity', 1000)  # Default value
        
        utilization_rates = []
        for date, volume in daily_volumes.items():
            trucks_needed = np.ceil(volume / truck_capacity)
            utilization = (volume / (trucks_needed * truck_capacity)) * 100
            utilization_rates.append({
                'date': date,
                'volume': volume,
                'trucks_needed': int(trucks_needed),
                'utilization_rate': round(utilization, 2)
            })
        
        avg_utilization = np.mean([ur['utilization_rate'] for ur in utilization_rates])
        
        return {
            'average_utilization': round(avg_utilization, 2),
            'daily_utilization': utilization_rates[-7:],  # Last 7 days
            'optimization_opportunity': round(100 - avg_utilization, 2)
        }
    
    def _analyze_capacity_requirements(self, forecast_data: pd.DataFrame, capacity_data: pd.DataFrame) -> Dict:
        """Analyze capacity requirements and identify bottlenecks"""
        peak_volume = forecast_data.groupby('date')['predicted_value'].sum().max()
        current_capacity = capacity_data.get('warehouse_capacity', 5000)  # Default
        
        capacity_utilization = (peak_volume / current_capacity) * 100
        
        return {
            'peak_volume_forecast': round(peak_volume, 2),
            'current_capacity': current_capacity,
            'peak_utilization': round(capacity_utilization, 2),
            'capacity_sufficient': capacity_utilization < 85,
            'recommended_action': self._get_capacity_recommendation(capacity_utilization)
        }
    
    def _get_capacity_recommendation(self, utilization: float) -> str:
        """Provide capacity planning recommendations"""
        if utilization > 95:
            return "URGENT: Capacity expansion needed immediately"
        elif utilization > 85:
            return "WARNING: Consider capacity expansion planning"
        elif utilization < 60:
            return "OPPORTUNITY: Capacity available for additional clients"
        else:
            return "OPTIMAL: Capacity utilization within target range"
    
    def _calculate_efficiency_score(self, fill_rate: Dict, truck_utilization: Dict) -> Dict:
        """Calculate overall efficiency score for dashboard"""
        fill_rate_score = fill_rate['overall_fill_rate']
        utilization_score = truck_utilization['average_utilization']
        
        # Weighted efficiency score (fill rate 60%, utilization 40%)
        efficiency_score = (fill_rate_score * 0.6) + (utilization_score * 0.4)
        
        return {
            'overall_score': round(efficiency_score, 2),
            'grade': self._get_efficiency_grade(efficiency_score),
            'improvement_areas': self._identify_improvement_areas(fill_rate_score, utilization_score)
        }
    
    def _get_efficiency_grade(self, score: float) -> str:
        """Convert efficiency score to letter grade"""
        if score >= 90:
            return "A"
        elif score >= 80:
            return "B"
        elif score >= 70:
            return "C"
        elif score >= 60:
            return "D"
        else:
            return "F"
    
    def _identify_improvement_areas(self, fill_rate: float, utilization: float) -> List[str]:
        """Identify specific areas for improvement"""
        areas = []
        
        if fill_rate < 95:
            areas.append("Improve order fulfillment processes")
        if utilization < 80:
            areas.append("Optimize truck loading and routing")
        if fill_rate < 90 and utilization < 75:
            areas.append("Implement integrated planning system")
            
        return areas
```

**Business Value Indicators:**

- Fill Rate > 95% = Excellent customer service
- Truck Utilization > 80% = Cost-effective operations
- Efficiency Grade A/B = World-class logistics performance

---

## AWS-Native Lambda Function Architecture

### Data Pipeline Orchestrator Lambda

**Purpose:** Orchestrate the complete data pipeline using AWS managed services when new data arrives.

```typescript
// src/lambdas/pipeline-orchestrator.ts
import { 
  S3Client, 
  GetObjectCommand, 
  PutObjectCommand,
  ListObjectsV2Command 
} from "@aws-sdk/client-s3";
import { 
  GlueClient, 
  StartJobRunCommand, 
  GetJobRunCommand 
} from "@aws-sdk/client-glue";
import { 
  ForecastClient, 
  CreateDatasetImportJobCommand,
  CreatePredictorCommand,
  CreateForecastCommand
} from "@aws-sdk/client-forecast";
import { StepFunctionsClient, StartExecutionCommand } from "@aws-sdk/client-stepfunctions";

export const handler = async (event: any) => {
  const s3 = new S3Client({});
  const glue = new GlueClient({});
  const stepFunctions = new StepFunctionsClient({});
  
  try {
    // Extract S3 event information
    const records = event.Records || [];
    const newDataFiles = records.map(record => ({
      bucket: record.s3.bucket.name,
      key: record.s3.object.key
    }));
    
    console.log(`Processing ${newDataFiles.length} new files`);
    
    // Start Step Functions state machine for complete pipeline
    const execution = await stepFunctions.send(new StartExecutionCommand({
      stateMachineArn: process.env.PIPELINE_STATE_MACHINE_ARN,
      input: JSON.stringify({
        inputFiles: newDataFiles,
        executionId: `execution-${Date.now()}`,
        pipelineConfig: {
          glueJobName: "signify-data-cleansing",
          forecastDatasetGroup: "signify-logistics-forecast",
          outputBucket: "gxo-signify-pilot"
        }
      })
    }));
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Pipeline started successfully",
        executionArn: execution.executionArn
      })
    };
    
  } catch (error) {
    console.error("Pipeline orchestration failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Pipeline orchestration failed" })
    };
  }
};
```

### Forecast Results Processor Lambda

**Purpose:** Process Amazon Forecast results and calculate KPIs when forecasting completes.

```typescript
// src/lambdas/forecast-results-processor.ts
import { S3Client, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

export const handler = async (event: any) => {
  const s3 = new S3Client({});
  const lambda = new LambdaClient({});
  
  try {
    // Extract forecast completion information from Step Functions
    const { forecastExportPath, actualDataPath, executionId } = event;
    
    // Invoke KPI calculation Lambda with Python runtime
    const kpiCalculation = await lambda.send(new InvokeCommand({
      FunctionName: "signify-kpi-calculator",
      Payload: JSON.stringify({
        forecastExportPath,
        actualDataPath,
        calculationType: "forecast_accuracy"
      })
    }));
    
    const kpiResults = JSON.parse(Buffer.from(kpiCalculation.Payload!).toString());
    
    // Invoke anomaly processing Lambda
    const anomalyProcessing = await lambda.send(new InvokeCommand({
      FunctionName: "signify-anomaly-processor", 
      Payload: JSON.stringify({
        anomalyDetectorArn: process.env.ANOMALY_DETECTOR_ARN,
        daysBack: 7
      })
    }));
    
    const anomalyResults = JSON.parse(Buffer.from(anomalyProcessing.Payload!).toString());
    
    // Combine results for dashboard
    const dashboardData = {
      forecast_accuracy: kpiResults,
      anomalies: anomalyResults,
      last_updated: new Date().toISOString(),
      execution_id: executionId
    };
    
    // Save dashboard data to S3
    await s3.send(new PutObjectCommand({
      Bucket: "gxo-signify-pilot",
      Key: "kpis/dashboard-data.json",
      Body: JSON.stringify(dashboardData),
      ContentType: "application/json"
    }));
    
    // Trigger dashboard cache invalidation
    await lambda.send(new InvokeCommand({
      FunctionName: "signify-dashboard-cache-invalidator",
      Payload: JSON.stringify({ action: "invalidate_all" })
    }));
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: "Forecast results processed successfully",
        kpis_calculated: Object.keys(dashboardData).length
      })
    };
    
  } catch (error) {
    console.error("Forecast results processing failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Forecast results processing failed" })
    };
  }
};
```

### Step Functions State Machine Definition

**Purpose:** Coordinate the complete AWS-native data pipeline.

```json
{
  "Comment": "Signify Logistics Data Pipeline using AWS Managed Services",
  "StartAt": "DataValidation",
  "States": {
    "DataValidation": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "signify-data-validator",
        "Payload.$": "$"
      },
      "Next": "GlueETLJob"
    },
    "GlueETLJob": {
      "Type": "Task", 
      "Resource": "arn:aws:states:::glue:startJobRun.sync",
      "Parameters": {
        "JobName": "signify-data-cleansing",
        "Arguments": {
          "--INPUT_PATH.$": "$.inputFiles[0].key",
          "--OUTPUT_PATH": "s3://gxo-signify-pilot/processed/",
          "--EXECUTION_ID.$": "$.executionId"
        }
      },
      "Next": "CheckDataQuality"
    },
    "CheckDataQuality": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "signify-data-quality-checker",
        "Payload.$": "$"
      },
      "Next": "QualityCheck"
    },
    "QualityCheck": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.qualityScore",
          "NumericGreaterThanEquals": 85,
          "Next": "AmazonForecastImport"
        }
      ],
      "Default": "DataQualityFailure"
    },
    "AmazonForecastImport": {
      "Type": "Task",
      "Resource": "arn:aws:states:::aws-sdk:forecast:createDatasetImportJob",
      "Parameters": {
        "DatasetImportJobName.$": "$.executionId",
        "DatasetArn": "arn:aws:forecast:REGION:ACCOUNT:dataset/signify-volume-forecast",
        "DataSource": {
          "S3Config": {
            "Path.$": "$.processedDataPath",
            "RoleArn": "arn:aws:iam::ACCOUNT:role/ForecastRole"
          }
        }
      },
      "Next": "WaitForImport"
    },
    "WaitForImport": {
      "Type": "Wait",
      "Seconds": 300,
      "Next": "CheckImportStatus"
    },
    "CheckImportStatus": {
      "Type": "Task",
      "Resource": "arn:aws:states:::aws-sdk:forecast:describeDatasetImportJob",
      "Parameters": {
        "DatasetImportJobArn.$": "$.DatasetImportJobArn"
      },
      "Next": "ImportComplete"
    },
    "ImportComplete": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.Status",
          "StringEquals": "ACTIVE",
          "Next": "CreatePredictor"
        }
      ],
      "Default": "WaitForImport"
    },
    "CreatePredictor": {
      "Type": "Task",
      "Resource": "arn:aws:states:::aws-sdk:forecast:createAutoPredictor",
      "Parameters": {
        "PredictorName.$": "$.executionId",
        "ForecastHorizon": 28,
        "ForecastTypes": ["0.1", "0.5", "0.9"],
        "DataConfig": {
          "DatasetGroupArn": "arn:aws:forecast:REGION:ACCOUNT:dataset-group/signify-logistics-forecast"
        }
      },
      "Next": "WaitForPredictor"
    },
    "WaitForPredictor": {
      "Type": "Wait",
      "Seconds": 1800,
      "Next": "GenerateForecast"
    },
    "GenerateForecast": {
      "Type": "Task",
      "Resource": "arn:aws:states:::aws-sdk:forecast:createForecast",
      "Parameters": {
        "ForecastName.$": "$.executionId",
        "PredictorArn.$": "$.PredictorArn"
      },
      "Next": "ExportForecast"
    },
    "ExportForecast": {
      "Type": "Task",
      "Resource": "arn:aws:states:::aws-sdk:forecast:createForecastExportJob",
      "Parameters": {
        "ForecastExportJobName.$": "$.executionId",
        "ForecastArn.$": "$.ForecastArn",
        "Destination": {
          "S3Config": {
            "Path": "s3://gxo-signify-pilot/forecasts/",
            "RoleArn": "arn:aws:iam::ACCOUNT:role/ForecastRole"
          }
        }
      },
      "Next": "ProcessKPIs"
    },
    "ProcessKPIs": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "signify-forecast-results-processor",
        "Payload.$": "$"
      },
      "Next": "Success"
    },
    "DataQualityFailure": {
      "Type": "Fail",
      "Cause": "Data quality below threshold"
    },
    "Success": {
      "Type": "Succeed"
    }
  }
}
```

### API Lambda Functions

**Forecast API:**

```typescript
// src/lambdas/forecast-api.ts
export const handler = async (event: any) => {
  const { time_horizon, sku_filter, date_range } = event.queryStringParameters || {};
  
  // Fetch processed KPI results from S3
  const kpiData = await fetchFromS3('processed/kpi-results.json');
  
  // Filter and format based on request parameters
  const response = {
    forecast_accuracy: kpiData.forecast_accuracy,
    forecasts: filterForecasts(kpiData.forecasts, { time_horizon, sku_filter, date_range })
  };
  
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(response)
  };
};
```

**Insights API:**

```typescript
// src/lambdas/insights-api.ts
export const handler = async (event: any) => {
  const { categories, priority } = event.queryStringParameters || {};
  
  const kpiData = await fetchFromS3('processed/kpi-results.json');
  
  const response = {
    anomalies: kpiData.anomalies,
    logistics: kpiData.logistics,
    insights: generateInsights(kpiData, { categories, priority })
  };
  
  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(response)
  };
};
```

---

## Frontend Dashboard Components

### Main KPI Dashboard Component

```typescript
// src/components/KPIDashboard.tsx
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface KPIData {
  forecast_accuracy: {
    mape: number;
    wape: number;
    bias: number;
    ci_coverage: number;
  };
  anomalies: {
    total_anomalies: number;
    high_severity_anomalies: number;
    volume_spikes: number;
  };
  logistics: {
    fill_rate: { overall_fill_rate: number };
    truck_utilization: { average_utilization: number };
    efficiency_score: { overall_score: number; grade: string };
  };
}

export default function KPIDashboard() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIData();
  }, []);

  const fetchKPIData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/kpis`);
      const data = await response.json();
      setKpiData(data);
    } catch (error) {
      console.error('Failed to fetch KPI data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading KPIs...</div>;
  if (!kpiData) return <div>No KPI data available</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Forecast Accuracy Card */}
      <Card>
        <CardHeader>
          <CardTitle>Forecast Accuracy</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>MAPE:</span>
              <Badge variant={kpiData.forecast_accuracy.mape < 15 ? "default" : "destructive"}>
                {kpiData.forecast_accuracy.mape}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>WAPE:</span>
              <Badge variant={kpiData.forecast_accuracy.wape < 10 ? "default" : "destructive"}>
                {kpiData.forecast_accuracy.wape}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Bias:</span>
              <Badge variant={Math.abs(kpiData.forecast_accuracy.bias) < 5 ? "default" : "destructive"}>
                {kpiData.forecast_accuracy.bias}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Anomaly Detection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Demand Anomalies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{kpiData.anomalies.total_anomalies}</div>
              <div className="text-sm text-muted-foreground">Total Anomalies</div>
            </div>
            <div className="flex justify-between">
              <span>High Severity:</span>
              <Badge variant="destructive">
                {kpiData.anomalies.high_severity_anomalies}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Volume Spikes:</span>
              <Badge variant="secondary">
                {kpiData.anomalies.volume_spikes}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logistics Efficiency Card */}
      <Card>
        <CardHeader>
          <CardTitle>Logistics Efficiency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{kpiData.logistics.efficiency_score.grade}</div>
              <div className="text-sm text-muted-foreground">
                {kpiData.logistics.efficiency_score.overall_score}% Efficiency
              </div>
            </div>
            <div className="flex justify-between">
              <span>Fill Rate:</span>
              <Badge variant="default">
                {kpiData.logistics.fill_rate.overall_fill_rate}%
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Truck Utilization:</span>
              <Badge variant="default">
                {kpiData.logistics.truck_utilization.average_utilization}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Drill-Down Components

```typescript
// src/components/DrillDownModal.tsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  columns: { key: string; label: string }[];
}

export default function DrillDownModal({ isOpen, onClose, title, data, columns }: DrillDownModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map(col => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                {columns.map(col => (
                  <TableCell key={col.key}>{row[col.key]}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
```

---

## Data Processing Pipeline

### Data Flow Architecture

```
1. Raw Signify Data (S3) → 2. ETL Processing (Lambda) → 3. SageMaker Forecast → 4. KPI Processing (Lambda) → 5. Dashboard (React)
```

### Data Schema Standards

**Forecast Data Schema:**

```typescript
interface ForecastData {
  sku: string;
  date: string; // ISO format
  predicted_value: number;
  actual_value?: number; // For accuracy calculation
  confidence_lower: number;
  confidence_upper: number;
  horizon_days: 1 | 7 | 14 | 28;
  model_version: string;
  created_at: string;
}
```

**KPI Results Schema:**

```typescript
interface KPIResults {
  forecast_accuracy: {
    mape: number;
    wape: number;
    bias: number;
    ci_coverage: number;
    sku_breakdown: SKUAccuracy[];
  };
  anomalies: {
    total_anomalies: number;
    high_severity_anomalies: number;
    volume_spikes: number;
    demand_drops: number;
    top_anomalies: Anomaly[];
  };
  logistics: {
    fill_rate: FillRateMetrics;
    truck_utilization: TruckUtilizationMetrics;
    efficiency_score: EfficiencyScore;
  };
  calculation_timestamp: string;
}
```

---

## Performance Optimization Strategies

### KPI Calculation Optimization

- **Incremental Processing:** Only recalculate KPIs for new/changed data
- **Caching Strategy:** Cache frequently accessed KPI results in S3
- **Parallel Processing:** Use Lambda concurrency for independent KPI calculations
- **Data Partitioning:** Partition large datasets by date/SKU for faster processing

### Frontend Performance

- **Lazy Loading:** Load dashboard components on demand
- **Data Pagination:** Implement virtual scrolling for large datasets
- **Chart Optimization:** Use memo and useMemo for expensive chart calculations
- **API Response Caching:** Cache KPI responses with appropriate TTL

---

## Success Metrics

### Technical Performance Targets

- **KPI Processing Time:** < 2 minutes for complete dataset
- **API Response Time:** < 500ms for KPI endpoints
- **Dashboard Load Time:** < 3 seconds for initial render
- **Data Freshness:** KPIs updated within 30 minutes of new data

### Business Value Targets

- **Forecast Accuracy:** MAPE < 15% for top 80% SKUs
- **Anomaly Detection:** 90%+ precision on high-severity alerts
- **Truck Utilization:** 15% improvement demonstrated via KPIs
- **User Adoption:** 100% of pilot users actively using dashboard

---

## AWS Service Integration & Deployment

### Core AWS Services Architecture

- **Amazon S3:** Data lake for raw, processed, and results storage with event-driven triggers
- **AWS Glue:** Managed ETL service for data cleaning and transformation
- **Amazon Forecast:** Fully managed time series forecasting with AutoML capabilities
- **AWS Lookout for Metrics:** ML-powered anomaly detection with automated alerting
- **AWS Step Functions:** Orchestration of the complete data pipeline workflow
- **AWS Lambda:** Serverless compute for data processing and API endpoints
- **Amazon API Gateway:** RESTful APIs with caching and authentication
- **Amazon SNS:** Real-time alerts for high-severity anomalies

### Infrastructure as Code (IaC) Setup

```yaml
# terraform/main.tf key resources
resource "aws_s3_bucket" "signify_data_lake" {
  bucket = "gxo-signify-pilot"
  
  notification {
    lambda_function {
      lambda_function_arn = aws_lambda_function.pipeline_orchestrator.arn
      events             = ["s3:ObjectCreated:*"]
      filter_prefix      = "raw/"
    }
  }
}

resource "aws_glue_job" "data_cleansing" {
  name     = "signify-data-cleansing"
  role_arn = aws_iam_role.glue_role.arn
  
  command {
    script_location = "s3://${aws_s3_bucket.signify_data_lake.bucket}/scripts/data_cleansing.py"
    python_version  = "3"
  }
  
  default_arguments = {
    "--enable-metrics"                = ""
    "--enable-spark-ui"              = ""
    "--spark-event-logs-path"        = "s3://${aws_s3_bucket.signify_data_lake.bucket}/sparkHistoryLogs/"
  }
}

resource "aws_sfn_state_machine" "signify_pipeline" {
  name     = "signify-data-pipeline"
  role_arn = aws_iam_role.step_functions_role.arn
  
  definition = file("${path.module}/step_functions/pipeline.json")
}
```

### Cost Optimization Strategy

**Estimated Monthly Costs (Pilot Environment):**

- **S3 Storage:** $50-100 (depending on data retention)
- **AWS Glue:** $100-200 (daily ETL jobs)
- **Amazon Forecast:** $200-500 (monthly model training + inference)
- **Lookout for Metrics:** $150-300 (continuous anomaly detection)
- **Lambda:** $20-50 (event-driven execution)
- **Step Functions:** $10-30 (workflow orchestration)

**Total Estimated: $530-1,180/month**

### External System Integration

- **Signify EDI Systems:** Automated CSV file drops to S3 landing zone
- **GXO WMS:** Historical logistics data export integration
- **Business Intelligence:** 
  - Direct S3 access for existing BI tools
  - API endpoints for real-time dashboard integration
  - Scheduled data exports to data warehouse
- **Alert Systems:** 
  - SNS integration for email/SMS notifications
  - Webhook support for Slack/Teams integration
  - PagerDuty integration for critical anomalies

### Security & Compliance

- **Data Encryption:** S3 server-side encryption with KMS
- **Access Control:** IAM roles with least privilege principle
- **VPC Configuration:** Private subnets for sensitive processing
- **Audit Logging:** CloudTrail for all API calls and data access
- **Data Classification:** Automated PII detection and masking

---

## Deployment Strategy & Timeline

### Phase 1: Foundation (Weeks 1-2)
1. **AWS Infrastructure Setup**
   - S3 data lake configuration
   - IAM roles and policies
   - VPC and security groups
   
2. **Data Pipeline Development**
   - Glue ETL jobs for data cleansing
   - Step Functions workflow definition
   - Lambda function deployment

### Phase 2: Forecasting (Weeks 3-4)
1. **Amazon Forecast Integration**
   - Dataset group and schema setup
   - Historical data import and validation
   - Initial predictor training
   
2. **KPI Engine Implementation**
   - Forecast accuracy calculation engine
   - Dashboard data preparation
   - API endpoint development

### Phase 3: Anomaly Detection (Weeks 5-6)
1. **Lookout for Metrics Configuration**
   - Anomaly detector setup
   - Metric definitions and thresholds
   - Alert configuration and testing
   
2. **Business Logic Integration**
   - Anomaly categorization engine
   - Business impact calculation
   - Alert routing and escalation

### Phase 4: Dashboard & Testing (Weeks 7-8)
1. **React Dashboard Development**
   - KPI visualization components
   - Real-time data integration
   - Responsive design implementation
   
2. **End-to-End Testing**
   - Data pipeline validation
   - Forecast accuracy testing
   - User acceptance testing

## Success Metrics & Monitoring

### Technical Performance Targets

- **Data Pipeline SLA:** 99.5% uptime with <2-hour processing time
- **Forecast Accuracy:** MAPE <15% for top 80% SKUs by volume
- **Anomaly Detection:** <5% false positive rate on high-severity alerts
- **API Performance:** <500ms response time for dashboard endpoints
- **Cost Efficiency:** <$1,200/month for pilot environment

### Business Value Targets

- **Operational Efficiency:** 15% improvement in truck utilization
- **Forecast Reliability:** 90%+ confidence in weekly capacity planning
- **Proactive Response:** 80% reduction in reactive capacity adjustments
- **User Adoption:** 100% of pilot users actively using dashboard weekly
- **Decision Speed:** 50% faster response to demand anomalies

---

## Conclusion

This **AWS-native architecture** leverages managed services to deliver rapid time-to-value while minimizing operational overhead. The architecture emphasizes:

**✅ Business Value First:** Every component directly supports GXO's truck utilization and cost reduction objectives

**✅ Managed Services:** Reduces custom code by 70% compared to traditional approaches

**✅ Scalability:** Auto-scaling capabilities support growth from pilot to full deployment

**✅ Cost Efficiency:** Pay-per-use model with predictable costs for pilot budget

**✅ Operational Excellence:** Built-in monitoring, alerting, and automated workflows

**Next Steps for Implementation:**

1. **Week 1:** Deploy AWS infrastructure using Terraform IaC
2. **Week 2:** Implement and test AWS Glue ETL pipeline with sample data
3. **Week 3:** Configure Amazon Forecast with historical Signify data
4. **Week 4:** Set up Lookout for Metrics for anomaly detection
5. **Week 5:** Develop and deploy KPI calculation engines
6. **Week 6:** Build React dashboard with real-time data integration
7. **Week 7:** Conduct end-to-end testing with GXO stakeholders
8. **Week 8:** Go-live with pilot users and establish monitoring baselines

The architecture positions GXO to demonstrate measurable business value within 8 weeks while establishing a foundation for enterprise-wide deployment.
