import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from pyspark.sql import functions as F
from pyspark.sql.types import *
from awsglue.dynamicframe import DynamicFrame
from datetime import datetime, timedelta

# Get job parameters
args = getResolvedOptions(sys.argv, ['JOB_NAME', 'BUCKET_NAME', 'DATABASE_NAME'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

class ForecastDataPreparator:
    def __init__(self, glue_context, bucket_name, database_name):
        self.glue_context = glue_context
        self.bucket_name = bucket_name
        self.database_name = database_name
        
    def prepare_volume_forecast_data(self):
        """
        Prepare Amazon Forecast-compatible data for volume forecasting
        Format: timestamp, target_value, item_id
        """
        print("Starting volume forecast data preparation...")
        
        try:
            # Read cleaned inbound data from Glue catalog
            inbound_df = self.glue_context.create_dynamic_frame.from_catalog(
                database=self.database_name,
                table_name="clean_inbound"
            ).toDF()
            
            print(f"Loaded {inbound_df.count()} inbound records")
            
            # Aggregate daily volumes by SKU and warehouse
            daily_volumes = inbound_df \
                .filter(F.col("arrival_date").isNotNull()) \
                .filter(F.col("volume").isNotNull()) \
                .filter(F.col("volume") > 0) \
                .withColumn("date", F.date_format("arrival_date", "yyyy-MM-dd")) \
                .groupBy("date", "sku", "wh_code") \
                .agg(
                    F.sum("volume").alias("daily_volume"),
                    F.sum("req_qty").alias("daily_quantity"),
                    F.count("*").alias("transaction_count")
                ) \
                .withColumn("item_id", F.concat_ws("_", "sku", "wh_code")) \
                .select(
                    F.col("date").alias("timestamp"),
                    F.col("daily_volume").alias("target_value"),
                    F.col("item_id")
                ) \
                .filter(F.col("target_value") > 0) \
                .orderBy("timestamp", "item_id")
            
            print(f"Generated {daily_volumes.count()} daily volume records")
            
            # Convert to DynamicFrame and write to S3
            volume_forecast_df = DynamicFrame.fromDF(daily_volumes, self.glue_context, "volume_forecast")
            
            output_path = f"s3://{self.bucket_name}/forecasts/forecast-input/volume-forecast/"
            
            self.glue_context.write_dynamic_frame.from_options(
                frame=volume_forecast_df,
                connection_type="s3",
                connection_options={"path": output_path},
                format="csv",
                format_options={
                    "writeHeader": True,
                    "separator": ","
                }
            )
            
            print(f"Volume forecast data written to: {output_path}")
            
        except Exception as e:
            print(f"Error preparing volume forecast data: {str(e)}")
            raise e
            
    def prepare_demand_forecast_data(self):
        """
        Prepare demand forecasting data based on order quantities
        """
        print("Starting demand forecast data preparation...")
        
        try:
            # Read cleaned inbound data
            inbound_df = self.glue_context.create_dynamic_frame.from_catalog(
                database=self.database_name,
                table_name="clean_inbound"
            ).toDF()
            
            # Aggregate daily demand by SKU
            daily_demand = inbound_df \
                .filter(F.col("arrival_date").isNotNull()) \
                .filter(F.col("req_qty").isNotNull()) \
                .filter(F.col("req_qty") > 0) \
                .withColumn("date", F.date_format("arrival_date", "yyyy-MM-dd")) \
                .groupBy("date", "sku") \
                .agg(
                    F.sum("req_qty").alias("daily_demand"),
                    F.avg("req_qty").alias("avg_order_size"),
                    F.count("*").alias("order_count")
                ) \
                .select(
                    F.col("date").alias("timestamp"),
                    F.col("daily_demand").alias("target_value"),
                    F.col("sku").alias("item_id")
                ) \
                .filter(F.col("target_value") > 0) \
                .orderBy("timestamp", "item_id")
            
            print(f"Generated {daily_demand.count()} daily demand records")
            
            # Convert to DynamicFrame and write to S3
            demand_forecast_df = DynamicFrame.fromDF(daily_demand, self.glue_context, "demand_forecast")
            
            output_path = f"s3://{self.bucket_name}/forecasts/forecast-input/demand-forecast/"
            
            self.glue_context.write_dynamic_frame.from_options(
                frame=demand_forecast_df,
                connection_type="s3",
                connection_options={"path": output_path},
                format="csv",
                format_options={
                    "writeHeader": True,
                    "separator": ","
                }
            )
            
            print(f"Demand forecast data written to: {output_path}")
            
        except Exception as e:
            print(f"Error preparing demand forecast data: {str(e)}")
            raise e
            
    def prepare_truck_utilization_data(self):
        """
        Prepare truck utilization forecasting data from MVT and outbound data
        """
        print("Starting truck utilization forecast data preparation...")
        
        try:
            # Read cleaned outbound data
            outbound_df = self.glue_context.create_dynamic_frame.from_catalog(
                database=self.database_name,
                table_name="clean_outbound"
            ).toDF()
            
            # Calculate daily truck utilization metrics
            daily_utilization = outbound_df \
                .filter(F.col("ord_date").isNotNull()) \
                .filter(F.col("total_volume").isNotNull()) \
                .filter(F.col("total_weight").isNotNull()) \
                .withColumn("date", F.date_format("ord_date", "yyyy-MM-dd")) \
                .groupBy("date") \
                .agg(
                    F.sum("total_volume").alias("total_daily_volume"),
                    F.sum("total_weight").alias("total_daily_weight"),
                    F.count("*").alias("shipment_count"),
                    F.avg("total_volume").alias("avg_shipment_volume")
                ) \
                .withColumn("utilization_score", 
                           F.when(F.col("total_daily_volume") > 0, 
                                 F.col("total_daily_volume") / 100.0)  # Normalize utilization
                            .otherwise(0.0)) \
                .select(
                    F.col("date").alias("timestamp"),
                    F.col("utilization_score").alias("target_value"),
                    F.lit("truck_utilization").alias("item_id")
                ) \
                .filter(F.col("target_value") > 0) \
                .orderBy("timestamp")
            
            print(f"Generated {daily_utilization.count()} truck utilization records")
            
            # Convert to DynamicFrame and write to S3
            utilization_forecast_df = DynamicFrame.fromDF(daily_utilization, self.glue_context, "utilization_forecast")
            
            output_path = f"s3://{self.bucket_name}/forecasts/forecast-input/utilization-forecast/"
            
            self.glue_context.write_dynamic_frame.from_options(
                frame=utilization_forecast_df,
                connection_type="s3",
                connection_options={"path": output_path},
                format="csv",
                format_options={
                    "writeHeader": True,
                    "separator": ","
                }
            )
            
            print(f"Truck utilization forecast data written to: {output_path}")
            
        except Exception as e:
            print(f"Error preparing truck utilization forecast data: {str(e)}")
            raise e
            
    def create_forecast_summary(self):
        """
        Create a summary of prepared forecast datasets
        """
        print("Creating forecast data summary...")
        
        try:
            # Create summary statistics
            summary_data = [
                {
                    "dataset_type": "volume_forecast",
                    "preparation_date": datetime.now().isoformat(),
                    "s3_path": f"s3://{self.bucket_name}/forecasts/forecast-input/volume-forecast/",
                    "description": "Daily volume aggregated by SKU and warehouse"
                },
                {
                    "dataset_type": "demand_forecast", 
                    "preparation_date": datetime.now().isoformat(),
                    "s3_path": f"s3://{self.bucket_name}/forecasts/forecast-input/demand-forecast/",
                    "description": "Daily demand quantities by SKU"
                },
                {
                    "dataset_type": "utilization_forecast",
                    "preparation_date": datetime.now().isoformat(),
                    "s3_path": f"s3://{self.bucket_name}/forecasts/forecast-input/utilization-forecast/",
                    "description": "Daily truck utilization scores"
                }
            ]
            
            summary_df = spark.createDataFrame(summary_data)
            summary_dynamic_df = DynamicFrame.fromDF(summary_df, self.glue_context, "forecast_summary")
            
            summary_path = f"s3://{self.bucket_name}/forecasts/metadata/"
            
            self.glue_context.write_dynamic_frame.from_options(
                frame=summary_dynamic_df,
                connection_type="s3",
                connection_options={"path": summary_path},
                format="json"
            )
            
            print(f"Forecast summary written to: {summary_path}")
            
        except Exception as e:
            print(f"Error creating forecast summary: {str(e)}")
            raise e

# Execute the forecast data preparation
try:
    preparator = ForecastDataPreparator(glueContext, args['BUCKET_NAME'], args['DATABASE_NAME'])
    
    # Prepare all forecast datasets
    preparator.prepare_volume_forecast_data()
    preparator.prepare_demand_forecast_data()
    preparator.prepare_truck_utilization_data()
    preparator.create_forecast_summary()
    
    print("All forecast data preparation completed successfully!")
    
except Exception as e:
    print(f"Job failed with error: {str(e)}")
    raise e

job.commit()