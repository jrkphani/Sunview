"""
S3 Data Service
Comprehensive service for accessing all processed data in S3 bucket
"""

import boto3
import pandas as pd
import json
from typing import List, Dict, Any, Optional
from datetime import datetime, date, timedelta
import asyncio
from functools import lru_cache
import io

from app.core.config import settings

class S3DataService:
    """Service for accessing processed data from S3 bucket"""
    
    def __init__(self):
        self.s3_client = boto3.client('s3', region_name=settings.AWS_REGION)
        self.bucket_name = "gxo-signify-pilot-272858488437"
        
    async def get_demand_forecast_data(self, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Fetch all demand forecast data from S3
        """
        try:
            # List all demand forecast files
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix="forecasts/forecast-input/demand-forecast/"
            )
            
            if 'Contents' not in response:
                return []
            
            all_data = []
            
            # Read all demand forecast files
            for obj in response['Contents']:
                if obj['Key'].endswith('part-r-00000') or obj['Key'].endswith('part-r-00001') or obj['Key'].endswith('part-r-00002') or obj['Key'].endswith('part-r-00003'):
                    file_response = self.s3_client.get_object(
                        Bucket=self.bucket_name,
                        Key=obj['Key']
                    )
                    
                    csv_content = file_response['Body'].read().decode('utf-8')
                    df = pd.read_csv(io.StringIO(csv_content))
                    
                    # Convert to list of dictionaries
                    for _, row in df.iterrows():
                        all_data.append({
                            'timestamp': row['timestamp'],
                            'target_value': float(row['target_value']),
                            'item_id': str(row['item_id']),
                            'source_file': obj['Key']
                        })
            
            # Apply limit
            return all_data[:limit] if limit else all_data
            
        except Exception as e:
            print(f"Error fetching demand forecast data: {str(e)}")
            return []
    
    async def get_volume_forecast_data(self) -> List[Dict[str, Any]]:
        """
        Fetch volume forecast data from consolidated CSV
        """
        try:
            # Get the consolidated volume forecast file
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key="forecasts/forecast-input/volume-forecast-consolidated.csv"
            )
            
            csv_content = response['Body'].read().decode('utf-8')
            df = pd.read_csv(io.StringIO(csv_content))
            
            volume_data = []
            for _, row in df.iterrows():
                volume_data.append({
                    'timestamp': row['timestamp'],
                    'target_value': float(row['target_value']),
                    'item_id': str(row['item_id']) if 'item_id' in row else 'aggregate'
                })
            
            return volume_data
            
        except Exception as e:
            print(f"Error fetching volume forecast data: {str(e)}")
            return []
    
    async def get_utilization_forecast_data(self) -> List[Dict[str, Any]]:
        """
        Fetch truck utilization forecast data
        """
        try:
            # List utilization forecast files
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix="forecasts/forecast-input/utilization-forecast/"
            )
            
            if 'Contents' not in response:
                return []
            
            all_data = []
            
            # Read all utilization files
            for obj in response['Contents']:
                if 'part-r-' in obj['Key']:
                    file_response = self.s3_client.get_object(
                        Bucket=self.bucket_name,
                        Key=obj['Key']
                    )
                    
                    csv_content = file_response['Body'].read().decode('utf-8')
                    df = pd.read_csv(io.StringIO(csv_content))
                    
                    for _, row in df.iterrows():
                        all_data.append({
                            'timestamp': row['timestamp'],
                            'target_value': float(row['target_value']),
                            'item_id': str(row['item_id']) if 'item_id' in row else 'utilization'
                        })
            
            return all_data
            
        except Exception as e:
            print(f"Error fetching utilization forecast data: {str(e)}")
            return []
    
    async def get_processed_inbound_data(self) -> pd.DataFrame:
        """
        Fetch processed inbound data from Parquet files
        """
        try:
            # List processed inbound files
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix="processed/clean-inbound/"
            )
            
            if 'Contents' not in response:
                return pd.DataFrame()
            
            # Get the most recent file
            latest_file = max(response['Contents'], key=lambda x: x['LastModified'])
            
            # Download and read Parquet file
            file_response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=latest_file['Key']
            )
            
            # Read Parquet data
            parquet_data = file_response['Body'].read()
            df = pd.read_parquet(io.BytesIO(parquet_data))
            
            return df
            
        except Exception as e:
            print(f"Error fetching processed inbound data: {str(e)}")
            return pd.DataFrame()
    
    async def get_processed_outbound_data(self) -> pd.DataFrame:
        """
        Fetch processed outbound data from Parquet files
        """
        try:
            # List processed outbound files
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix="processed/clean-outbound/"
            )
            
            if 'Contents' not in response:
                return pd.DataFrame()
            
            # Get the most recent file
            latest_file = max(response['Contents'], key=lambda x: x['LastModified'])
            
            # Download and read Parquet file
            file_response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=latest_file['Key']
            )
            
            # Read Parquet data
            parquet_data = file_response['Body'].read()
            df = pd.read_parquet(io.BytesIO(parquet_data))
            
            return df
            
        except Exception as e:
            print(f"Error fetching processed outbound data: {str(e)}")
            return pd.DataFrame()
    
    async def get_aggregated_mvt_data(self) -> pd.DataFrame:
        """
        Fetch aggregated MVT (Movement) data from Parquet files
        """
        try:
            # List aggregated MVT files
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix="processed/aggregated-mvt/"
            )
            
            if 'Contents' not in response:
                return pd.DataFrame()
            
            all_dataframes = []
            
            # Read all MVT files and combine
            for obj in response['Contents']:
                if obj['Key'].endswith('.parquet'):
                    file_response = self.s3_client.get_object(
                        Bucket=self.bucket_name,
                        Key=obj['Key']
                    )
                    
                    parquet_data = file_response['Body'].read()
                    df = pd.read_parquet(io.BytesIO(parquet_data))
                    all_dataframes.append(df)
            
            # Combine all dataframes
            if all_dataframes:
                return pd.concat(all_dataframes, ignore_index=True)
            else:
                return pd.DataFrame()
            
        except Exception as e:
            print(f"Error fetching aggregated MVT data: {str(e)}")
            return pd.DataFrame()
    
    async def get_data_metadata(self) -> Dict[str, Any]:
        """
        Fetch metadata about processed datasets
        """
        try:
            # List metadata files
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix="forecasts/metadata/"
            )
            
            metadata = {}
            
            if 'Contents' in response:
                for obj in response['Contents']:
                    if obj['Size'] > 0:  # Skip empty files
                        file_response = self.s3_client.get_object(
                            Bucket=self.bucket_name,
                            Key=obj['Key']
                        )
                        
                        content = file_response['Body'].read().decode('utf-8')
                        try:
                            meta_data = json.loads(content)
                            metadata[meta_data.get('dataset_type', 'unknown')] = meta_data
                        except json.JSONDecodeError:
                            continue
            
            return metadata
            
        except Exception as e:
            print(f"Error fetching metadata: {str(e)}")
            return {}
    
    async def get_kpi_reports(self) -> Dict[str, Any]:
        """
        Fetch existing KPI reports from S3
        """
        try:
            # List KPI files
            response = self.s3_client.list_objects_v2(
                Bucket=self.bucket_name,
                Prefix="kpis/"
            )
            
            kpi_data = {}
            
            if 'Contents' in response:
                for obj in response['Contents']:
                    if obj['Key'].endswith('.json'):
                        file_response = self.s3_client.get_object(
                            Bucket=self.bucket_name,
                            Key=obj['Key']
                        )
                        
                        content = file_response['Body'].read().decode('utf-8')
                        try:
                            kpi_report = json.loads(content)
                            report_name = obj['Key'].split('/')[-1].replace('.json', '')
                            kpi_data[report_name] = kpi_report
                        except json.JSONDecodeError:
                            continue
            
            return kpi_data
            
        except Exception as e:
            print(f"Error fetching KPI reports: {str(e)}")
            return {}
    
    @lru_cache(maxsize=32)
    async def get_unique_skus(self) -> List[str]:
        """
        Get list of unique SKUs from demand forecast data (cached)
        """
        try:
            demand_data = await self.get_demand_forecast_data(limit=None)
            unique_skus = list(set([item['item_id'] for item in demand_data]))
            return sorted(unique_skus)
            
        except Exception as e:
            print(f"Error getting unique SKUs: {str(e)}")
            return []
    
    async def get_data_summary(self) -> Dict[str, Any]:
        """
        Get comprehensive summary of all available data
        """
        try:
            # Get counts from different data sources
            demand_data = await self.get_demand_forecast_data(limit=1000)
            volume_data = await self.get_volume_forecast_data()
            utilization_data = await self.get_utilization_forecast_data()
            metadata = await self.get_data_metadata()
            
            # Calculate basic statistics
            unique_skus = len(set([item['item_id'] for item in demand_data]))
            
            return {
                "data_summary": {
                    "demand_records": len(demand_data),
                    "volume_records": len(volume_data),
                    "utilization_records": len(utilization_data),
                    "unique_skus": unique_skus,
                    "data_sources": list(metadata.keys()),
                    "last_updated": datetime.now().isoformat()
                },
                "metadata": metadata,
                "bucket_info": {
                    "bucket_name": self.bucket_name,
                    "region": settings.AWS_REGION
                }
            }
            
        except Exception as e:
            print(f"Error getting data summary: {str(e)}")
            return {
                "error": str(e),
                "data_summary": {
                    "demand_records": 0,
                    "volume_records": 0,
                    "utilization_records": 0,
                    "unique_skus": 0
                }
            }