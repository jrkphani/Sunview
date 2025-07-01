import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job
from pyspark.sql import functions as F
from pyspark.sql.types import *
from awsglue.dynamicframe import DynamicFrame

# Get job parameters
args = getResolvedOptions(sys.argv, ['JOB_NAME', 'BUCKET_NAME', 'DATABASE_NAME'])

sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)
job.init(args['JOB_NAME'], args)

class SignifyDataCleaner:
    def __init__(self, glue_context, bucket_name):
        self.glue_context = glue_context
        self.bucket_name = bucket_name
        
    def clean_inbound_data(self):
        """
        Clean and standardize inbound logistics data
        Expected columns: project_id, WH_Code, SKU, Req_Qty, Alloc_Qty, Arrival_Date, Volume, etc.
        """
        print("Starting inbound data cleaning...")
        
        # Read raw inbound data
        input_path = f"s3://{self.bucket_name}/raw/inbound/"
        output_path = f"s3://{self.bucket_name}/processed/clean-inbound/"
        
        try:
            raw_df = self.glue_context.create_dynamic_frame.from_options(
                connection_type="s3",
                connection_options={"paths": [input_path], "recurse": True},
                format="csv",
                format_options={"withHeader": True}
            )
            
            if raw_df.count() == 0:
                print("No inbound data found")
                return
            
            # Convert to Spark DataFrame for processing
            df = raw_df.toDF()
            
            print(f"Raw inbound records: {df.count()}")
            
            # Data cleansing steps
            cleaned_df = df \
                .filter(F.col("SKU").isNotNull()) \
                .filter(F.col("Req_Qty").isNotNull()) \
                .filter(F.col("Req_Qty").cast(IntegerType()) > 0) \
                .withColumn("Arrival_Date_Clean", 
                           F.when(F.col("Arrival_Date").isNotNull() & (F.col("Arrival_Date") != ""), 
                                 F.regexp_replace("Arrival_Date", r"(\d+/\d+/\d+ \d+:\d+:\d+)[:.]\d+", "$1"))
                            .otherwise(F.regexp_replace("Complete_Date", r"(\d+/\d+/\d+ \d+:\d+:\d+)[:.]\d+", "$1"))) \
                .withColumn("Arrival_Date", F.to_timestamp("Arrival_Date_Clean", "M/d/yyyy H:mm:ss")) \
                .withColumn("Request_Date_Clean",
                           F.when(F.col("Request_Date").isNotNull() & (F.col("Request_Date") != ""), 
                                 F.regexp_replace("Request_Date", r"(\d+/\d+/\d+ \d+:\d+:\d+)[:.]\d+", "$1"))
                            .otherwise(F.col("Arrival_Date_Clean"))) \
                .withColumn("Request_Date", F.to_timestamp("Request_Date_Clean", "M/d/yyyy H:mm:ss")) \
                .withColumn("Complete_Date_Clean", F.regexp_replace("Complete_Date", r"(\d+/\d+/\d+ \d+:\d+:\d+)[:.]\d+", "$1")) \
                .withColumn("Complete_Date", F.to_timestamp("Complete_Date_Clean", "M/d/yyyy H:mm:ss")) \
                .drop("Arrival_Date_Clean", "Request_Date_Clean", "Complete_Date_Clean") \
                .withColumn("Volume", F.col("Volume").cast(DoubleType())) \
                .withColumn("Req_Qty", F.col("Req_Qty").cast(IntegerType())) \
                .withColumn("Alloc_Qty", F.col("Alloc_Qty").cast(IntegerType())) \
                .withColumn("Fill_Rate", 
                           F.when(F.col("Req_Qty") > 0, F.col("Alloc_Qty") / F.col("Req_Qty"))
                            .otherwise(0.0)) \
                .withColumn("Year", F.year("Arrival_Date")) \
                .withColumn("Month", F.month("Arrival_Date")) \
                .withColumn("Week", F.weekofyear("Arrival_Date")) \
                .withColumn("Day", F.dayofmonth("Arrival_Date"))
            
            # Add derived metrics for forecasting
            enriched_df = cleaned_df \
                .withColumn("Daily_Volume", F.col("Volume")) \
                .withColumn("SKU_Category", F.regexp_extract("description", r"^([A-Z]+)", 1)) \
                .withColumn("Lead_Time_Days", 
                           F.when((F.col("Complete_Date").isNotNull()) & (F.col("Request_Date").isNotNull()),
                                 F.datediff("Complete_Date", "Request_Date"))
                            .otherwise(0)) \
                .withColumn("processing_date", F.current_date())
            
            # Filter out records with invalid dates
            final_df = enriched_df.filter(F.col("Arrival_Date").isNotNull())
            
            print(f"Cleaned inbound records: {final_df.count()}")
            
            # Convert back to DynamicFrame and write
            output_df = DynamicFrame.fromDF(final_df, self.glue_context, "cleaned_inbound")
            
            self.glue_context.write_dynamic_frame.from_options(
                frame=output_df,
                connection_type="s3",
                connection_options={"path": output_path},
                format="parquet",
                format_options={"compression": "snappy"}
            )
            
            print(f"Inbound data cleaning completed. Output written to: {output_path}")
            
        except Exception as e:
            print(f"Error processing inbound data: {str(e)}")
            raise e
    
    def clean_outbound_data(self):
        """
        Clean and standardize outbound logistics data
        """
        print("Starting outbound data cleaning...")
        
        input_path = f"s3://{self.bucket_name}/raw/outbound/"
        output_path = f"s3://{self.bucket_name}/processed/clean-outbound/"
        
        try:
            raw_df = self.glue_context.create_dynamic_frame.from_options(
                connection_type="s3",
                connection_options={"paths": [input_path], "recurse": True},
                format="csv",
                format_options={"withHeader": True}
            )
            
            if raw_df.count() == 0:
                print("No outbound data found")
                return
            
            df = raw_df.toDF()
            print(f"Raw outbound records: {df.count()}")
            
            # Clean outbound data
            cleaned_df = df \
                .filter(F.col("SKU").isNotNull()) \
                .filter(F.col("Req_Qty").isNotNull()) \
                .withColumn("Ord_Date_Clean", F.regexp_replace("Ord_Date", r"(\d+/\d+/\d+ \d+:\d+:\d+)[:.]\d+", "$1")) \
                .withColumn("Ord_Date", F.to_timestamp("Ord_Date_Clean", "M/d/yyyy H:mm:ss")) \
                .withColumn("Complete_Date_Clean", F.regexp_replace("Complete_Date", r"(\d+/\d+/\d+ \d+:\d+:\d+)[:.]\d+", "$1")) \
                .withColumn("Complete_Date", F.to_timestamp("Complete_Date_Clean", "M/d/yyyy H:mm:ss")) \
                .drop("Ord_Date_Clean", "Complete_Date_Clean") \
                .withColumn("Total_Weight", F.col("Total_Weight").cast(DoubleType())) \
                .withColumn("Total_Volume", F.col("Total_Volume").cast(DoubleType())) \
                .withColumn("Req_Qty", F.col("Req_Qty").cast(IntegerType())) \
                .withColumn("Alloc_Qty", F.col("Alloc_Qty").cast(IntegerType())) \
                .withColumn("Fill_Rate", 
                           F.when(F.col("Req_Qty") > 0, F.col("Alloc_Qty") / F.col("Req_Qty"))
                            .otherwise(0.0)) \
                .withColumn("Year", F.year("Ord_Date")) \
                .withColumn("Month", F.month("Ord_Date")) \
                .withColumn("Week", F.weekofyear("Ord_Date")) \
                .withColumn("processing_date", F.current_date())
            
            final_df = cleaned_df.filter(F.col("Ord_Date").isNotNull())
            print(f"Cleaned outbound records: {final_df.count()}")
            
            output_df = DynamicFrame.fromDF(final_df, self.glue_context, "cleaned_outbound")
            
            self.glue_context.write_dynamic_frame.from_options(
                frame=output_df,
                connection_type="s3",
                connection_options={"path": output_path},
                format="parquet",
                format_options={"compression": "snappy"}
            )
            
            print(f"Outbound data cleaning completed. Output written to: {output_path}")
            
        except Exception as e:
            print(f"Error processing outbound data: {str(e)}")
            raise e
    
    def clean_mvt_data(self):
        """
        Clean and standardize MVT (material/vessel tracking) data
        """
        print("Starting MVT data cleaning...")
        
        input_path = f"s3://{self.bucket_name}/raw/mvt/"
        output_path = f"s3://{self.bucket_name}/processed/aggregated-mvt/"
        
        try:
            raw_df = self.glue_context.create_dynamic_frame.from_options(
                connection_type="s3",
                connection_options={"paths": [input_path], "recurse": True},
                format="csv",
                format_options={"withHeader": True}
            )
            
            if raw_df.count() == 0:
                print("No MVT data found")
                return
            
            df = raw_df.toDF()
            print(f"Raw MVT records: {df.count()}")
            
            # Clean MVT data - handle scientific notation in SKU
            cleaned_df = df \
                .filter(F.col("sku").isNotNull()) \
                .withColumn("sku_clean", 
                           F.when(F.col("sku").contains("E+"), 
                                 F.format_number(F.col("sku").cast(DoubleType()), 0))
                            .otherwise(F.col("sku"))) \
                .withColumn("order_date_clean", F.regexp_replace("order_date", r"(\d+/\d+/\d+ \d+:\d+:\d+)[:.]\d+", "$1")) \
                .withColumn("order_date", F.to_timestamp("order_date_clean", "M/d/yyyy H:mm:ss")) \
                .withColumn("complete_date_clean", F.regexp_replace("complete_date", r"(\d+/\d+/\d+ \d+:\d+:\d+)[:.]\d+", "$1")) \
                .withColumn("complete_date", F.to_timestamp("complete_date_clean", "M/d/yyyy H:mm:ss")) \
                .drop("order_date_clean", "complete_date_clean") \
                .withColumn("in_qty", F.col("in_qty").cast(IntegerType())) \
                .withColumn("out_qty", F.col("out_qty").cast(IntegerType())) \
                .withColumn("bal_qty", F.col("bal_qty").cast(IntegerType())) \
                .withColumn("Quantity", F.col("Quantity").cast(IntegerType())) \
                .withColumn("Year", F.year("order_date")) \
                .withColumn("Month", F.month("order_date")) \
                .withColumn("Week", F.weekofyear("order_date")) \
                .withColumn("processing_date", F.current_date())
            
            final_df = cleaned_df.filter(F.col("order_date").isNotNull())
            print(f"Cleaned MVT records: {final_df.count()}")
            
            output_df = DynamicFrame.fromDF(final_df, self.glue_context, "cleaned_mvt")
            
            self.glue_context.write_dynamic_frame.from_options(
                frame=output_df,
                connection_type="s3",
                connection_options={"path": output_path},
                format="parquet",
                format_options={"compression": "snappy"}
            )
            
            print(f"MVT data cleaning completed. Output written to: {output_path}")
            
        except Exception as e:
            print(f"Error processing MVT data: {str(e)}")
            raise e

# Execute the cleaning process
try:
    cleaner = SignifyDataCleaner(glueContext, args['BUCKET_NAME'])
    
    # Clean all data types
    cleaner.clean_inbound_data()
    cleaner.clean_outbound_data()
    cleaner.clean_mvt_data()
    
    print("All data cleaning completed successfully!")
    
except Exception as e:
    print(f"Job failed with error: {str(e)}")
    raise e

job.commit()