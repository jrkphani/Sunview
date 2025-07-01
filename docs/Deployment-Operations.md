# GXO Signify Forecasting Solution

## Deployment & Operations Guide

**Version:** 2.0  
**Date:** June 26, 2025  
**Document Type:** AWS-Native Deployment & Operations Specification  
**Target Audience:** DevOps engineers, site reliability engineers, operations teams  

---

## Deployment Overview

The GXO Signify solution uses an **AWS-native deployment strategy** leveraging managed services with Infrastructure-as-Code and automated ML pipelines. The deployment emphasizes cost optimization while reducing operational overhead through managed services.

### AWS-Native Deployment Architecture

```
GitHub Repository → GitHub Actions → AWS CloudFormation/CDK → Managed Services Pipeline
       ↓                    ↓                     ↓                        ↓
   Code Changes      Build & Test      Infrastructure Deployment    Amazon Forecast + Glue + Step Functions
                          ↓                     ↓                        ↓
                    Lambda Package    S3 + Aurora + API Gateway    Lookout for Metrics + Lambda APIs
                          ↓                     ↓                        ↓
                  Amplify Frontend      VPC + Security + IAM         CloudWatch + X-Ray Monitoring
```

### Key Architecture Changes

- **Amazon Forecast:** Replaces custom ML forecasting models
- **AWS Glue:** Automated ETL data processing pipeline  
- **AWS Lookout for Metrics:** ML-powered anomaly detection
- **Step Functions:** Orchestrates complete data pipeline workflow
- **AWS Amplify Gen 2:** Streamlined frontend deployment
- **Infrastructure as Code:** Terraform + CloudFormation for reproducible deployments

---

## Pre-Deployment Prerequisites

### AWS Account Setup & Service Quotas

```bash
# Required AWS CLI Configuration
aws configure set region us-east-1
aws configure set output json

# Verify account access and permissions
aws sts get-caller-identity

# Check AWS service quotas for managed services
echo "🔍 Checking AWS Service Quotas"
echo "==============================="

# Amazon Forecast limits
aws service-quotas get-service-quota \
  --service-code forecast \
  --quota-code L-4B8BBDF8 | jq '.Quota.Value' # Dataset groups limit

# AWS Glue concurrent job runs
aws service-quotas get-service-quota \
  --service-code glue \
  --quota-code L-03F86A72 | jq '.Quota.Value' # Concurrent job runs

# Step Functions executions
aws service-quotas get-service-quota \
  --service-code states \
  --quota-code L-1B49CC4E | jq '.Quota.Value' # Express workflow executions

# Lambda concurrent executions  
aws service-quotas get-service-quota \
  --service-code lambda \
  --quota-code L-B99A9384 | jq '.Quota.Value' # Concurrent executions
```

### AWS-Native Cost Analysis

```bash
#!/bin/bash
# scripts/aws-native-cost-check.sh

echo "💰 AWS-Native Services Cost Analysis"
echo "===================================="

# Check existing AWS managed services to estimate costs
echo "📊 Current AWS Service Usage:"

# Amazon Forecast datasets
FORECAST_DATASETS=$(aws forecast list-dataset-groups --query 'length(DatasetGroups)' --output text 2>/dev/null || echo "0")
echo "Amazon Forecast Dataset Groups: $FORECAST_DATASETS (~\$$(($FORECAST_DATASETS * 50))/month)"

# AWS Glue jobs
GLUE_JOBS=$(aws glue get-jobs --query 'length(Jobs)' --output text 2>/dev/null || echo "0")
echo "AWS Glue Jobs: $GLUE_JOBS (~\$$(($GLUE_JOBS * 25))/month when active)"

# Lookout for Metrics detectors
LOOKOUT_DETECTORS=$(aws lookoutmetrics list-anomaly-detectors --query 'length(AnomalyDetectorSummaryList)' --output text 2>/dev/null || echo "0")
echo "Lookout for Metrics Detectors: $LOOKOUT_DETECTORS (~\$$(($LOOKOUT_DETECTORS * 150))/month)"

# Step Functions state machines
STEP_FUNCTIONS=$(aws stepfunctions list-state-machines --query 'length(stateMachines)' --output text 2>/dev/null || echo "0")
echo "Step Functions State Machines: $STEP_FUNCTIONS (~\$$(($STEP_FUNCTIONS * 10))/month)"

# S3 bucket naming availability  
BUCKET_NAME="gxo-signify-pilot-$(aws sts get-caller-identity --query Account --output text)"
aws s3api head-bucket --bucket $BUCKET_NAME 2>/dev/null
if [ $? -eq 0 ]; then
  echo "❌ Bucket $BUCKET_NAME already exists"
  exit 1
else
  echo "✅ Bucket name $BUCKET_NAME available"
fi

echo ""
echo "💡 Estimated Monthly Cost for AWS-Native Architecture: \$530-1,180"
echo "   - Amazon Forecast: \$200-500"
echo "   - AWS Glue: \$100-200" 
echo "   - Lookout for Metrics: \$150-300"
echo "   - Step Functions: \$10-30"
echo "   - Lambda + API Gateway: \$20-50"
echo "   - S3 + VPC: \$50-100"
```

---

## Complete AWS-Native Deployment Script

### Infrastructure-as-Code Deployment with Terraform

```bash
#!/bin/bash
# scripts/deploy-aws-native.sh

set -e

ENVIRONMENT=${1:-pilot}
REGION=${2:-us-east-1}
AWS_PROFILE=${3:-default}

echo "🚀 GXO Signify AWS-Native Deployment"
echo "===================================="
echo "Environment: $ENVIRONMENT"
echo "Region: $REGION"
echo "AWS Profile: $AWS_PROFILE"
echo "Architecture: AWS Managed Services (Forecast, Glue, Lookout, Step Functions)"

# Export environment variables
export AWS_PROFILE=$AWS_PROFILE
export AWS_DEFAULT_REGION=$REGION
export TF_VAR_environment=$ENVIRONMENT
export TF_VAR_region=$REGION

# Pre-deployment validation for AWS services
echo "🔍 Running AWS-native pre-deployment checks..."
./scripts/aws-native-cost-check.sh

# Initialize Terraform with AWS-native modules
echo "🏗️  Initializing Terraform for AWS managed services..."
cd infrastructure/terraform
terraform init -backend-config="key=gxo-signify-$ENVIRONMENT.tfstate"

# Terraform plan for AWS services
echo "📋 Planning AWS infrastructure deployment..."
terraform plan \
  -var="environment=$ENVIRONMENT" \
  -var="region=$REGION" \
  -out="$ENVIRONMENT.tfplan"

# Deploy AWS infrastructure with managed services
echo "☁️  Deploying AWS managed services infrastructure..."
terraform apply "$ENVIRONMENT.tfplan"

# Get infrastructure outputs
S3_BUCKET=$(terraform output -raw s3_bucket_name)
VPC_ID=$(terraform output -raw vpc_id)
FORECAST_ROLE_ARN=$(terraform output -raw forecast_role_arn)
GLUE_ROLE_ARN=$(terraform output -raw glue_role_arn)
STEP_FUNCTION_ARN=$(terraform output -raw step_function_arn)

echo "📊 Infrastructure outputs:"
echo "S3 Bucket: $S3_BUCKET"
echo "VPC ID: $VPC_ID"
echo "Step Functions ARN: $STEP_FUNCTION_ARN"

cd ../../

# Build and deploy Lambda functions
echo "⚡ Building and deploying Lambda functions..."
npm run build:lambdas

# Deploy using CDK for Lambda and API Gateway
echo "🔗 Deploying API and Lambda stack with CDK..."
cd infrastructure/cdk
npm install
npx cdk bootstrap --profile $AWS_PROFILE
npx cdk deploy GxoSignifyApiStack \
  --parameters Environment=$ENVIRONMENT \
  --parameters S3BucketName=$S3_BUCKET \
  --parameters VpcId=$VPC_ID \
  --profile $AWS_PROFILE \
  --require-approval never

cd ../../

# Setup AWS Glue ETL jobs
echo "🔄 Deploying AWS Glue ETL jobs..."
./scripts/deploy-glue-jobs.sh $ENVIRONMENT $S3_BUCKET $GLUE_ROLE_ARN

# Setup Amazon Forecast datasets
echo "📈 Setting up Amazon Forecast datasets..."
./scripts/setup-forecast-datasets.sh $ENVIRONMENT $S3_BUCKET $FORECAST_ROLE_ARN

# Setup AWS Lookout for Metrics
echo "👁️  Configuring Lookout for Metrics anomaly detection..."
./scripts/setup-lookout-metrics.sh $ENVIRONMENT $S3_BUCKET

# Deploy frontend to AWS Amplify Gen 2
echo "🎨 Deploying frontend to AWS Amplify Gen 2..."
cd frontend
npm install
npx @aws-amplify/cli@latest init --amplify
npx @aws-amplify/cli@latest push --yes

cd ../

echo "✅ AWS-Native deployment complete!"

# Post-deployment validation with managed services
./scripts/post-deployment-aws-native-validation.sh $ENVIRONMENT $REGION
```

### AWS Glue ETL Jobs Deployment

```bash
#!/bin/bash
# scripts/deploy-glue-jobs.sh

ENVIRONMENT=$1
S3_BUCKET=$2
GLUE_ROLE_ARN=$3

echo "🔄 Deploying AWS Glue ETL Jobs"
echo "=============================="

# Upload Glue scripts to S3
aws s3 cp glue_jobs/data_cleansing.py s3://$S3_BUCKET/glue-scripts/
aws s3 cp glue_jobs/feature_engineering.py s3://$S3_BUCKET/glue-scripts/
aws s3 cp glue_jobs/data_aggregation.py s3://$S3_BUCKET/glue-scripts/

# Create Glue jobs
echo "Creating Glue job: signify-data-cleansing"
aws glue create-job \
  --name "signify-data-cleansing-$ENVIRONMENT" \
  --role $GLUE_ROLE_ARN \
  --command ScriptLocation=s3://$S3_BUCKET/glue-scripts/data_cleansing.py,Name=glueetl,PythonVersion=3 \
  --default-arguments '{
    "--TempDir": "s3://'$S3_BUCKET'/temp/",
    "--enable-metrics": "",
    "--enable-spark-ui": "",
    "--spark-event-logs-path": "s3://'$S3_BUCKET'/sparkHistoryLogs/"
  }' \
  --max-retries 1 \
  --timeout 60 \
  --max-capacity 2.0

echo "Creating Glue job: signify-feature-engineering"
aws glue create-job \
  --name "signify-feature-engineering-$ENVIRONMENT" \
  --role $GLUE_ROLE_ARN \
  --command ScriptLocation=s3://$S3_BUCKET/glue-scripts/feature_engineering.py,Name=glueetl,PythonVersion=3 \
  --default-arguments '{
    "--TempDir": "s3://'$S3_BUCKET'/temp/",
    "--enable-metrics": ""
  }' \
  --max-retries 1 \
  --timeout 30 \
  --max-capacity 2.0

echo "✅ Glue jobs deployed successfully"
```

### Amazon Forecast Setup

```bash
#!/bin/bash
# scripts/setup-forecast-datasets.sh

ENVIRONMENT=$1
S3_BUCKET=$2
FORECAST_ROLE_ARN=$3

echo "📈 Setting up Amazon Forecast"
echo "============================"

# Create dataset group
DATASET_GROUP_ARN=$(aws forecast create-dataset-group \
  --dataset-group-name "signify-logistics-$ENVIRONMENT" \
  --domain CUSTOM \
  --query 'DatasetGroupArn' \
  --output text)

echo "Dataset Group created: $DATASET_GROUP_ARN"

# Create target time series dataset
DATASET_ARN=$(aws forecast create-dataset \
  --dataset-name "signify-volume-forecast-$ENVIRONMENT" \
  --domain CUSTOM \
  --dataset-type TARGET_TIME_SERIES \
  --data-frequency D \
  --schema '{
    "Attributes": [
      {"AttributeName": "timestamp", "AttributeType": "timestamp"},
      {"AttributeName": "target_value", "AttributeType": "float"},
      {"AttributeName": "item_id", "AttributeType": "string"}
    ]
  }' \
  --query 'DatasetArn' \
  --output text)

echo "Dataset created: $DATASET_ARN"

# Create dataset import job template (to be used when data is available)
cat > forecast-import-template.json << EOF
{
  "DatasetImportJobName": "signify-import-$ENVIRONMENT-\$(date +%Y%m%d%H%M)",
  "DatasetArn": "$DATASET_ARN",
  "DataSource": {
    "S3Config": {
      "Path": "s3://$S3_BUCKET/processed/forecast-input/",
      "RoleArn": "$FORECAST_ROLE_ARN"
    }
  }
}
EOF

echo "✅ Amazon Forecast setup complete"
echo "Use forecast-import-template.json for data imports"
```

### Post-Deployment Validation

```bash
#!/bin/bash
# scripts/post-deployment-validation.sh

ENVIRONMENT=$1
REGION=$2

echo "🔧 Post-Deployment Validation"
echo "============================="

# Get deployment outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name gxo-signify-app-$ENVIRONMENT \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name gxo-signify-app-$ENVIRONMENT \
  --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
  --output text)

# Test API endpoints
echo "🌐 Testing API endpoints..."
curl -s -o /dev/null -w "%{http_code}" "$API_URL/forecast" | grep -q "200" && \
  echo "✅ Forecast API responding" || echo "❌ Forecast API not responding"

curl -s -o /dev/null -w "%{http_code}" "$API_URL/insights" | grep -q "200" && \
  echo "✅ Insights API responding" || echo "❌ Insights API not responding"

# Test S3 bucket access
echo "📦 Testing S3 bucket access..."
aws s3 ls s3://$BUCKET_NAME >/dev/null 2>&1 && \
  echo "✅ S3 bucket accessible" || echo "❌ S3 bucket access failed"

# Check Lambda function status
echo "⚡ Checking Lambda function status..."
aws lambda get-function --function-name gxo-signify-$ENVIRONMENT-KPIProcessor >/dev/null 2>&1 && \
  echo "✅ KPI Processor function deployed" || echo "❌ KPI Processor function not found"

# Calculate final cost estimate
TOTAL_NAT_GATEWAYS=$(aws ec2 describe-nat-gateways \
  --filter "Name=state,Values=available" \
  --query 'length(NatGateways)' \
  --output text)

MONTHLY_NAT_COST=$((TOTAL_NAT_GATEWAYS * 45))

echo ""
echo "📋 Deployment Summary"
echo "===================="
echo "API URL: $API_URL"
echo "S3 Bucket: $BUCKET_NAME"
echo "VPC CIDR: 10.0.1.0/24"
echo "NAT Gateways: $TOTAL_NAT_GATEWAYS (~\${MONTHLY_NAT_COST}/month)"
echo ""
echo "🔧 Next Steps:"
echo "1. Upload test data: aws s3 cp sample-data.csv s3://$BUCKET_NAME/raw-data/"
echo "2. Configure SageMaker Forecast dataset"
echo "3. Update frontend: VITE_API_BASE_URL=$API_URL"
echo "4. Set up monitoring alerts"
```

---

## AWS-Native Monitoring & Alerting

### CloudWatch Dashboard for Managed Services

```yaml
# monitoring/aws-native-dashboard.yaml
Resources:
  GXOSignifyAWSNativeDashboard:
    Type: AWS::CloudWatch::Dashboard
    Properties:
      DashboardName: !Sub "GXO-Signify-AWS-Native-${Environment}"
      DashboardBody: !Sub |
        {
          "widgets": [
            {
              "type": "metric",
              "x": 0,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/Forecast", "DatasetImportJobs", "DatasetGroupName", "signify-logistics-${Environment}"],
                  ["AWS/Forecast", "PredictorTrainingJobs", "DatasetGroupName", "signify-logistics-${Environment}"],
                  ["AWS/Forecast", "ForecastGenerationJobs", "DatasetGroupName", "signify-logistics-${Environment}"]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "Amazon Forecast Activity"
              }
            },
            {
              "type": "metric", 
              "x": 12,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/Glue", "glue.driver.aggregate.bytesRead", "JobName", "signify-data-cleansing-${Environment}", "JobRunId", "ALL"],
                  ["AWS/Glue", "glue.driver.aggregate.recordsRead", "JobName", "signify-data-cleansing-${Environment}", "JobRunId", "ALL"],
                  ["AWS/Glue", "glue.driver.aggregate.shuffleBytesWritten", "JobName", "signify-data-cleansing-${Environment}", "JobRunId", "ALL"]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "AWS Glue ETL Performance"
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 6,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/LookoutMetrics", "AnomalyDetectors", "AnomalyDetectorName", "signify-logistics-anomalies-${Environment}"],
                  ["AWS/LookoutMetrics", "AnomaliesDetected", "AnomalyDetectorName", "signify-logistics-anomalies-${Environment}"]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "Lookout for Metrics - Anomaly Detection"
              }
            },
            {
              "type": "metric",
              "x": 12,
              "y": 6,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/States", "ExecutionStarted", "StateMachineArn", "${StepFunctionArn}"],
                  ["AWS/States", "ExecutionSucceeded", "StateMachineArn", "${StepFunctionArn}"],
                  ["AWS/States", "ExecutionFailed", "StateMachineArn", "${StepFunctionArn}"],
                  ["AWS/States", "ExecutionTime", "StateMachineArn", "${StepFunctionArn}"]
                ],
                "period": 300,
                "stat": "Sum",
                "region": "${AWS::Region}",
                "title": "Step Functions Pipeline Execution"
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 12,
              "width": 24,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/Lambda", "Duration", "FunctionName", "gxo-signify-${Environment}-ForecastAPI"],
                  ["AWS/Lambda", "Duration", "FunctionName", "gxo-signify-${Environment}-InsightsAPI"],
                  ["AWS/Lambda", "Duration", "FunctionName", "gxo-signify-${Environment}-KPIProcessor"]
                ],
                "period": 300,
                "stat": "Average",
                "region": "${AWS::Region}",
                "title": "Lambda API Performance"
              }
            }
          ]
        }

  # Critical Alarms
  HighErrorRateAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "gxo-signify-${Environment}-high-error-rate"
      AlarmDescription: "High error rate in KPI processing"
      MetricName: Errors
      Namespace: AWS/Lambda
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 2
      Threshold: 5
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Sub "gxo-signify-${Environment}-KPIProcessor"
      AlarmActions:
        - !Ref AlertTopic

  LongProcessingTimeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub "gxo-signify-${Environment}-long-processing-time"
      AlarmDescription: "KPI processing taking too long"
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 3
      Threshold: 600000  # 10 minutes in milliseconds
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Sub "gxo-signify-${Environment}-KPIProcessor"
      AlarmActions:
        - !Ref AlertTopic

  # SNS Topic for Alerts
  AlertTopic:
    Type: AWS::SNS::Topic
    Properties:
      TopicName: !Sub "gxo-signify-${Environment}-alerts"
      DisplayName: "GXO Signify Alerts"
```

### Operational Scripts

```bash
#!/bin/bash
# scripts/operational-health-check.sh

ENVIRONMENT=${1:-pilot}

echo "🔍 GXO Signify Operational Health Check"
echo "======================================="

# Check API Gateway health
API_URL=$(aws cloudformation describe-stacks \
  --stack-name gxo-signify-app-$ENVIRONMENT \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text)

echo "🌐 API Health Check:"
curl -s -f "$API_URL/forecast" >/dev/null && \
  echo "✅ Forecast API: Healthy" || echo "❌ Forecast API: Unhealthy"

curl -s -f "$API_URL/insights" >/dev/null && \
  echo "✅ Insights API: Healthy" || echo "❌ Insights API: Unhealthy"

# Check Lambda function metrics
echo ""
echo "⚡ Lambda Function Status:"
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Errors \
  --dimensions Name=FunctionName,Value=gxo-signify-$ENVIRONMENT-KPIProcessor \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --query 'Datapoints[0].Sum' \
  --output text > /tmp/lambda_errors

LAMBDA_ERRORS=$(cat /tmp/lambda_errors)
if [ "$LAMBDA_ERRORS" == "None" ] || [ "$LAMBDA_ERRORS" == "0" ]; then
  echo "✅ KPI Processor: No errors in last hour"
else
  echo "❌ KPI Processor: $LAMBDA_ERRORS errors in last hour"
fi

# Check S3 bucket status
echo ""
echo "📦 S3 Storage Status:"
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name gxo-signify-app-$ENVIRONMENT \
  --query 'Stacks[0].Outputs[?OutputKey==`BucketName`].OutputValue' \
  --output text)

aws s3api head-bucket --bucket $BUCKET_NAME 2>/dev/null && \
  echo "✅ S3 Bucket: Accessible" || echo "❌ S3 Bucket: Inaccessible"

# Check recent data uploads
RECENT_UPLOADS=$(aws s3api list-objects-v2 \
  --bucket $BUCKET_NAME \
  --prefix raw-data/ \
  --query "length(Contents[?LastModified >= '$(date -u -d '24 hours ago' +%Y-%m-%dT%H:%M:%S)'])" \
  --output text)

echo "📈 Data Uploads (24h): $RECENT_UPLOADS files"

# Cost tracking
echo ""
echo "💰 Cost Tracking:"
TOTAL_NAT_GATEWAYS=$(aws ec2 describe-nat-gateways \
  --filter "Name=state,Values=available" \
  --query 'length(NatGateways)' \
  --output text)

echo "NAT Gateways: $TOTAL_NAT_GATEWAYS (~\$$(($TOTAL_NAT_GATEWAYS * 45))/month)"
```

---

## AWS-Native Cost Optimization

### Managed Services Cost Monitoring

```bash
#!/bin/bash
# scripts/aws-native-cost-optimization.sh

echo "💰 GXO Signify AWS-Native Cost Optimization Report"
echo "================================================="

ENVIRONMENT=${1:-pilot}

# Amazon Forecast cost tracking
echo "📈 Amazon Forecast Cost Analysis:"
FORECAST_DATASETS=$(aws forecast list-dataset-groups --query 'length(DatasetGroups)' --output text 2>/dev/null || echo "0")
FORECAST_PREDICTORS=$(aws forecast list-predictors --query 'length(Predictors)' --output text 2>/dev/null || echo "0")
echo "Dataset Groups: $FORECAST_DATASETS"
echo "Active Predictors: $FORECAST_PREDICTORS"
echo "Estimated Monthly Cost: \$$(($FORECAST_DATASETS * 50 + $FORECAST_PREDICTORS * 150))"

# AWS Glue cost tracking
echo ""
echo "🔄 AWS Glue Cost Analysis:"
GLUE_JOBS=$(aws glue get-jobs --query 'length(Jobs)' --output text 2>/dev/null || echo "0")
echo "Glue Jobs: $GLUE_JOBS"

# Get Glue job run statistics for the last 30 days
GLUE_JOB_RUNS=$(aws glue get-job-runs \
  --job-name "signify-data-cleansing-$ENVIRONMENT" \
  --query 'JobRuns[?StartedOn >= `'$(date -u -d '30 days ago' +%Y-%m-%d)'`] | length(@)' \
  --output text 2>/dev/null || echo "0")

echo "Job Runs (30d): $GLUE_JOB_RUNS"
echo "Estimated Monthly Cost: \$$(($GLUE_JOB_RUNS * 5))" # ~$5 per job run

# Lookout for Metrics cost tracking
echo ""
echo "👁️  Lookout for Metrics Cost Analysis:"
LOOKOUT_DETECTORS=$(aws lookoutmetrics list-anomaly-detectors --query 'length(AnomalyDetectorSummaryList)' --output text 2>/dev/null || echo "0")
echo "Anomaly Detectors: $LOOKOUT_DETECTORS"
echo "Estimated Monthly Cost: \$$(($LOOKOUT_DETECTORS * 150))"

# Step Functions cost tracking
echo ""
echo "⚡ Step Functions Cost Analysis:"
STEP_FUNCTIONS=$(aws stepfunctions list-state-machines --query 'length(stateMachines)' --output text 2>/dev/null || echo "0")
echo "State Machines: $STEP_FUNCTIONS"

# Get execution count for last 30 days
EXECUTIONS_COUNT=$(aws stepfunctions list-executions \
  --state-machine-arn "arn:aws:states:us-east-1:$(aws sts get-caller-identity --query Account --output text):stateMachine:SignifyForecastPipeline-$ENVIRONMENT" \
  --query 'length(executions)' \
  --output text 2>/dev/null || echo "0")

echo "Executions (30d): $EXECUTIONS_COUNT"
echo "Estimated Monthly Cost: \$$(($EXECUTIONS_COUNT * 0.025))" # $0.025 per 1000 transitions

# S3 storage optimization for data lake
echo ""
echo "📦 S3 Data Lake Cost Analysis:"
BUCKET_NAME="gxo-signify-$ENVIRONMENT-$(aws sts get-caller-identity --query Account --output text)"

# Check bucket size
BUCKET_SIZE=$(aws s3api list-objects-v2 --bucket $BUCKET_NAME --query 'sum(Contents[].Size)' --output text 2>/dev/null || echo "0")
BUCKET_SIZE_GB=$((BUCKET_SIZE / 1073741824))
echo "Total Bucket Size: ${BUCKET_SIZE_GB}GB"
echo "Estimated Monthly Storage Cost: \$$(($BUCKET_SIZE_GB * 0.023))" # $0.023 per GB

# Lambda cost analysis for API functions
echo ""
echo "⚡ Lambda API Cost Analysis:"
LAMBDA_FUNCTIONS=("gxo-signify-$ENVIRONMENT-ForecastAPI" "gxo-signify-$ENVIRONMENT-InsightsAPI" "gxo-signify-$ENVIRONMENT-KPIProcessor")

TOTAL_INVOCATIONS=0
for func in "${LAMBDA_FUNCTIONS[@]}"; do
  INVOCATIONS=$(aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --dimensions Name=FunctionName,Value=$func \
    --start-time $(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 2592000 \
    --statistics Sum \
    --query 'Datapoints[0].Sum' \
    --output text 2>/dev/null || echo "0")
  
  if [ "$INVOCATIONS" != "None" ] && [ "$INVOCATIONS" != "null" ]; then
    TOTAL_INVOCATIONS=$((TOTAL_INVOCATIONS + ${INVOCATIONS%.*}))
  fi
done

echo "Total Lambda Invocations (30d): $TOTAL_INVOCATIONS"
echo "Estimated Monthly Cost: \$$(($TOTAL_INVOCATIONS / 1000000 * 0.20))" # $0.20 per 1M requests

# Cost optimization recommendations for AWS-native architecture
echo ""
echo "💡 AWS-Native Cost Optimization Recommendations:"
echo "1. Use Amazon Forecast AutoML to optimize model training costs"
echo "2. Schedule Glue jobs during off-peak hours for development DPU discounts"
echo "3. Configure S3 Intelligent Tiering for automatic cost optimization"
echo "4. Use Lookout for Metrics with optimized metric windows"
echo "5. Implement Step Functions Express Workflows for high-frequency executions"
echo "6. Right-size Lambda memory allocation based on performance metrics"
echo "7. Use S3 lifecycle policies to archive old training data to Glacier"
echo "8. Consider Reserved Capacity for Amazon Forecast in production"

# Total estimated monthly cost
TOTAL_FORECAST_COST=$((FORECAST_DATASETS * 50 + FORECAST_PREDICTORS * 150))
TOTAL_GLUE_COST=$((GLUE_JOB_RUNS * 5))
TOTAL_LOOKOUT_COST=$((LOOKOUT_DETECTORS * 150))
TOTAL_STEP_FUNCTIONS_COST=$((EXECUTIONS_COUNT * 25 / 1000))
TOTAL_S3_COST=$((BUCKET_SIZE_GB * 23 / 1000))
TOTAL_LAMBDA_COST=$((TOTAL_INVOCATIONS / 1000000 * 20 / 100))

TOTAL_COST=$((TOTAL_FORECAST_COST + TOTAL_GLUE_COST + TOTAL_LOOKOUT_COST + TOTAL_STEP_FUNCTIONS_COST + TOTAL_S3_COST + TOTAL_LAMBDA_COST))

echo ""
echo "📊 Total Estimated Monthly Cost: \$$TOTAL_COST"
echo "   - Amazon Forecast: \$$TOTAL_FORECAST_COST"
echo "   - AWS Glue: \$$TOTAL_GLUE_COST"
echo "   - Lookout for Metrics: \$$TOTAL_LOOKOUT_COST"
echo "   - Step Functions: \$$TOTAL_STEP_FUNCTIONS_COST"
echo "   - S3 Storage: \$$TOTAL_S3_COST"
echo "   - Lambda: \$$TOTAL_LAMBDA_COST"
```

### Resource Cleanup Scripts

```bash
#!/bin/bash
# scripts/cleanup-old-data.sh

ENVIRONMENT=${1:-pilot}
RETENTION_DAYS=${2:-90}

echo "🧹 Cleaning up data older than $RETENTION_DAYS days"

BUCKET_NAME="gxo-signify-$ENVIRONMENT-$(aws sts get-caller-identity --query Account --output text)"

# Clean up old forecast data
aws s3 ls s3://$BUCKET_NAME/sagemaker-forecast/ --recursive | \
  awk -v date="$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)" '$1 < date {print $4}' | \
  while read file; do
    echo "Deleting old forecast file: $file"
    aws s3 rm "s3://$BUCKET_NAME/$file"
  done

# Clean up old processed results
aws s3 ls s3://$BUCKET_NAME/processed/ --recursive | \
  awk -v date="$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)" '$1 < date {print $4}' | \
  while read file; do
    echo "Deleting old processed file: $file"
    aws s3 rm "s3://$BUCKET_NAME/$file"
  done

echo "✅ Cleanup complete"
```

---

## Backup & Disaster Recovery

### Automated Backup Strategy

```bash
#!/bin/bash
# scripts/backup-critical-data.sh

ENVIRONMENT=${1:-pilot}
BACKUP_BUCKET="gxo-signify-backups-$(aws sts get-caller-identity --query Account --output text)"

echo "💾 Creating backup of critical data"

SOURCE_BUCKET="gxo-signify-$ENVIRONMENT-$(aws sts get-caller-identity --query Account --output text)"

# Create backup bucket if it doesn't exist
aws s3api head-bucket --bucket $BACKUP_BUCKET 2>/dev/null || \
  aws s3 mb s3://$BACKUP_BUCKET --region us-east-1

# Backup configuration data
aws s3 sync s3://$SOURCE_BUCKET/processed/ s3://$BACKUP_BUCKET/processed/$(date +%Y-%m-%d)/

# Backup CloudFormation templates
aws s3 cp infrastructure/ s3://$BACKUP_BUCKET/infrastructure/$(date +%Y-%m-%d)/ --recursive

echo "✅ Backup complete to s3://$BACKUP_BUCKET"
```

### Disaster Recovery Procedures

```yaml
# Disaster Recovery Checklist
Recovery_Time_Objective: "4 hours"
Recovery_Point_Objective: "1 hour"

Recovery_Steps:
  1. Assess_Impact:
     - Identify affected components
     - Determine data loss scope
     - Estimate recovery time
  
  2. Emergency_Response:
     - Notify stakeholders
     - Activate incident response team
     - Begin recovery procedures
  
  3. Data_Recovery:
     - Restore from S3 backups
     - Validate data integrity
     - Check forecast model versions
  
  4. Infrastructure_Recovery:
     - Redeploy CloudFormation stacks
     - Verify VPC and networking
     - Test API endpoints
  
  5. Service_Validation:
     - Run health checks
     - Validate KPI calculations
     - Test end-to-end workflows
  
  6. Post_Recovery:
     - Document lessons learned
     - Update recovery procedures
     - Schedule post-mortem review
```

---

## Performance Optimization

### Lambda Optimization

```bash
#!/bin/bash
# scripts/optimize-lambda-performance.sh

ENVIRONMENT=${1:-pilot}

echo "⚡ Lambda Performance Optimization"
echo "================================="

# Analyze Lambda memory usage
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Duration \
  --dimensions Name=FunctionName,Value=gxo-signify-$ENVIRONMENT-KPIProcessor \
  --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Average,Maximum \
  --query 'Datapoints[?Average != null] | sort_by(@, &Timestamp) | [-1]' \
  --output table

# Check for cold starts
aws logs filter-log-events \
  --log-group-name "/aws/lambda/gxo-signify-$ENVIRONMENT-KPIProcessor" \
  --start-time $(date -d '24 hours ago' +%s)000 \
  --filter-pattern "INIT_START" \
  --query 'events | length(@)' \
  --output text > /tmp/cold_starts

COLD_STARTS=$(cat /tmp/cold_starts)
echo "Cold starts (24h): $COLD_STARTS"

if [ $COLD_STARTS -gt 10 ]; then
  echo "💡 Consider provisioned concurrency to reduce cold starts"
fi
```

---

## Troubleshooting Guide

### Common Issues & Solutions

```bash
#!/bin/bash
# scripts/troubleshoot-common-issues.sh

ENVIRONMENT=${1:-pilot}

echo "🔧 GXO Signify Troubleshooting Guide"
echo "===================================="

# Check 1: API Gateway 5xx errors
echo "1. Checking for API Gateway errors..."
aws logs filter-log-events \
  --log-group-name "API-Gateway-Execution-Logs_$(aws apigateway get-rest-apis --query 'items[0].id' --output text)/$ENVIRONMENT" \
  --start-time $(date -d '1 hour ago' +%s)000 \
  --filter-pattern "ERROR" \
  --query 'events | length(@)' \
  --output text > /tmp/api_errors

API_ERRORS=$(cat /tmp/api_errors)
if [ $API_ERRORS -gt 0 ]; then
  echo "❌ Found $API_ERRORS API errors in last hour"
  echo "💡 Check Lambda function logs for detailed error messages"
else
  echo "✅ No API errors found"
fi

# Check 2: Lambda timeout issues
echo ""
echo "2. Checking for Lambda timeout issues..."
aws logs filter-log-events \
  --log-group-name "/aws/lambda/gxo-signify-$ENVIRONMENT-KPIProcessor" \
  --start-time $(date -d '6 hours ago' +%s)000 \
  --filter-pattern "Task timed out" \
  --query 'events | length(@)' \
  --output text > /tmp/timeouts

TIMEOUTS=$(cat /tmp/timeouts)
if [ $TIMEOUTS -gt 0 ]; then
  echo "❌ Found $TIMEOUTS timeout issues"
  echo "💡 Consider increasing Lambda timeout or optimizing processing logic"
else
  echo "✅ No timeout issues found"
fi

# Check 3: S3 access issues
echo ""
echo "3. Checking S3 access permissions..."
BUCKET_NAME="gxo-signify-$ENVIRONMENT-$(aws sts get-caller-identity --query Account --output text)"
aws s3 ls s3://$BUCKET_NAME/processed/ >/dev/null 2>&1 && \
  echo "✅ S3 access working" || echo "❌ S3 access issues detected"

# Check 4: VPC connectivity
echo ""
echo "4. Checking VPC endpoint connectivity..."
aws ec2 describe-vpc-endpoints \
  --filters "Name=state,Values=available" \
  --query 'VpcEndpoints | length(@)' \
  --output text > /tmp/vpc_endpoints

VPC_ENDPOINTS=$(cat /tmp/vpc_endpoints)
if [ $VPC_ENDPOINTS -eq 0 ]; then
  echo "❌ No VPC endpoints found - this may cause NAT Gateway charges"
else
  echo "✅ $VPC_ENDPOINTS VPC endpoints active"
fi

echo ""
echo "📋 Troubleshooting complete. Check above for any issues."
```

---

## Conclusion

This AWS-native deployment and operations guide provides **comprehensive procedures** for managing the GXO Signify forecasting solution using managed AWS services with emphasis on cost optimization, reliability, and operational excellence.

**Key AWS-Native Operational Features:**
✅ **Infrastructure-as-Code Deployment** (Terraform + CDK)  
✅ **Managed Services Cost Optimization** (Forecast, Glue, Lookout, Step Functions)  
✅ **AWS-Native Monitoring** (CloudWatch, X-Ray for managed services)  
✅ **Automated ML Pipeline** (Step Functions orchestration)  
✅ **Serverless Architecture** (Lambda + API Gateway)  
✅ **Comprehensive Alerting** (CloudWatch Alarms for all AWS services)  

**AWS-Native Architecture Benefits:**

- **Reduced Operational Overhead:** Managed services eliminate infrastructure management
- **Cost Optimization:** Pay-per-use model with predictable costs ($530-1,180/month)
- **Auto-Scaling:** AWS services automatically handle capacity planning
- **Enterprise Security:** AWS security best practices built-in
- **Business Value Focus:** More time on insights, less on infrastructure

**Next Steps:**

1. Execute AWS-native deployment: `./scripts/deploy-aws-native.sh pilot us-east-1`
2. Configure Amazon Forecast datasets with Signify CSV data
3. Set up Lookout for Metrics anomaly detection thresholds
4. Deploy AWS-native monitoring dashboards
5. Schedule automated cost optimization reviews for managed services

**Success Metrics:**
- **Time-to-Value:** 8 weeks from start to pilot deployment
- **Cost Efficiency:** 60% reduction in infrastructure management overhead
- **Forecast Accuracy:** MAPE <15% using Amazon Forecast AutoML
- **Operational Excellence:** 99.9% uptime through AWS managed services
