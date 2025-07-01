#!/bin/bash
# GXO Signify AWS-Native Infrastructure Deployment Script

set -e

ENVIRONMENT=${1:-pilot}
REGION=${2:-us-east-1}
AWS_PROFILE=${3:-default}

echo "🚀 Starting GXO Signify AWS-Native deployment..."
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "AWS Profile: $AWS_PROFILE"

# Set AWS profile and region
export AWS_PROFILE=$AWS_PROFILE
export AWS_DEFAULT_REGION=$REGION

# Verify AWS credentials
echo "🔐 Verifying AWS credentials..."
if ! aws sts get-caller-identity --profile $AWS_PROFILE >/dev/null 2>&1; then
  echo "❌ Failed to authenticate with AWS profile: $AWS_PROFILE"
  echo "💡 Run: aws configure --profile $AWS_PROFILE"
  exit 1
fi

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --profile $AWS_PROFILE --query Account --output text)
echo "✅ Authenticated as Account: $AWS_ACCOUNT_ID"

# Create unique bucket name
BUCKET_NAME="gxo-signify-${ENVIRONMENT}-${AWS_ACCOUNT_ID}"
echo "📦 S3 Bucket: $BUCKET_NAME"

# Check for existing NAT Gateways to optimize costs
echo "🔍 Checking for existing NAT Gateways..."
EXISTING_NAT_GATEWAYS=$(aws ec2 describe-nat-gateways \
  --filter "Name=state,Values=available" \
  --query 'length(NatGateways)' \
  --output text)

if [ "$EXISTING_NAT_GATEWAYS" -gt 0 ]; then
  echo "📋 Found $EXISTING_NAT_GATEWAYS existing NAT Gateway(s)"
  echo "💡 Monthly NAT Gateway cost: ~$$(($EXISTING_NAT_GATEWAYS * 45))"
fi

# Deploy S3 Data Lake
echo "1/4 Deploying S3 Data Lake infrastructure..."
aws cloudformation deploy \
  --template-file infrastructure/s3-data-lake.yaml \
  --stack-name gxo-signify-s3-$ENVIRONMENT \
  --parameter-overrides Environment=$ENVIRONMENT \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region $REGION

echo "✅ S3 Data Lake deployed successfully"

# Deploy AWS Glue ETL
echo "2/4 Deploying AWS Glue ETL infrastructure..."
aws cloudformation deploy \
  --template-file infrastructure/glue-etl.yaml \
  --stack-name gxo-signify-glue-$ENVIRONMENT \
  --parameter-overrides \
    Environment=$ENVIRONMENT \
    DataLakeBucket=$BUCKET_NAME \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region $REGION

echo "✅ AWS Glue ETL deployed successfully"

# Upload Glue scripts to S3
echo "3/4 Uploading Glue ETL scripts..."
aws s3 cp glue_jobs/data_cleansing.py s3://$BUCKET_NAME/glue-scripts/data_cleansing.py

echo "✅ Glue scripts uploaded successfully"

# Upload raw data to S3
echo "4/4 Uploading Signify raw data..."

# Create S3 folder structure
aws s3api put-object --bucket $BUCKET_NAME --key raw/inbound/
aws s3api put-object --bucket $BUCKET_NAME --key raw/outbound/
aws s3api put-object --bucket $BUCKET_NAME --key raw/mvt/
aws s3api put-object --bucket $BUCKET_NAME --key processed/
aws s3api put-object --bucket $BUCKET_NAME --key forecasts/
aws s3api put-object --bucket $BUCKET_NAME --key kpis/

# Upload CSV files
aws s3 cp "raw_data/Signify inbound report 2024 Jan to Dec.csv" s3://$BUCKET_NAME/raw/inbound/
aws s3 cp "raw_data/Signify inbound report 2025 Jan to May.csv" s3://$BUCKET_NAME/raw/inbound/
aws s3 cp "raw_data/Signify outbound report 2024 Jan to Dec.csv" s3://$BUCKET_NAME/raw/outbound/
aws s3 cp "raw_data/Signify outbound report 2025 Jan to May.csv" s3://$BUCKET_NAME/raw/outbound/
aws s3 cp "raw_data/Signify MVT 2024.csv" s3://$BUCKET_NAME/raw/mvt/
aws s3 cp "raw_data/Signify MVT 2025.csv" s3://$BUCKET_NAME/raw/mvt/

echo "✅ Raw data uploaded successfully"

# Test Glue ETL job
echo "🧪 Testing Glue ETL job..."
JOB_RUN_ID=$(aws glue start-job-run \
  --job-name signify-data-cleansing-$ENVIRONMENT \
  --arguments='--BUCKET_NAME='$BUCKET_NAME',--DATABASE_NAME=signify_logistics_'$ENVIRONMENT \
  --query 'JobRunId' \
  --output text)

echo "🔄 Glue job started with ID: $JOB_RUN_ID"
echo "📊 Monitor progress: aws glue get-job-run --job-name signify-data-cleansing-$ENVIRONMENT --run-id $JOB_RUN_ID"

# Output deployment summary
echo ""
echo "✅ Phase 1 Deployment Complete!"
echo "================================"
echo "📦 S3 Bucket: $BUCKET_NAME"
echo "🗄️ Glue Database: signify_logistics_$ENVIRONMENT"
echo "⚙️ Glue Job: signify-data-cleansing-$ENVIRONMENT"
echo "🔄 Job Run ID: $JOB_RUN_ID"
echo ""
echo "🔧 Next steps:"
echo "1. Monitor Glue job completion:"
echo "   aws glue get-job-run --job-name signify-data-cleansing-$ENVIRONMENT --run-id $JOB_RUN_ID"
echo ""
echo "2. Check processed data:"
echo "   aws s3 ls s3://$BUCKET_NAME/processed/ --recursive"
echo ""
echo "3. Start crawlers to update data catalog:"
echo "   aws glue start-crawler --name signify-raw-data-crawler-$ENVIRONMENT"
echo "   aws glue start-crawler --name signify-processed-data-crawler-$ENVIRONMENT"

# Wait for job completion (optional)
echo ""
read -p "🤔 Wait for Glue job to complete? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "⏳ Waiting for Glue job to complete..."
  while true; do
    JOB_STATE=$(aws glue get-job-run \
      --job-name signify-data-cleansing-$ENVIRONMENT \
      --run-id $JOB_RUN_ID \
      --query 'JobRun.JobRunState' \
      --output text)
    
    echo "📊 Job state: $JOB_STATE"
    
    if [ "$JOB_STATE" = "SUCCEEDED" ]; then
      echo "✅ Glue job completed successfully!"
      
      # Show processed data
      echo "📁 Processed data files:"
      aws s3 ls s3://$BUCKET_NAME/processed/ --recursive
      break
    elif [ "$JOB_STATE" = "FAILED" ] || [ "$JOB_STATE" = "ERROR" ] || [ "$JOB_STATE" = "STOPPED" ]; then
      echo "❌ Glue job failed with state: $JOB_STATE"
      echo "📋 Check job logs:"
      echo "   aws logs tail /aws-glue/jobs/logs-v2 --follow"
      exit 1
    fi
    
    sleep 30
  done
fi

echo ""
echo "🎉 Phase 1 Infrastructure & Data Pipeline deployment completed successfully!"
echo "💰 Estimated monthly cost: $75-160 (NAT Gateway: ~$$(($EXISTING_NAT_GATEWAYS * 45)))"