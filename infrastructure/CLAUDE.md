# Infrastructure & DevOps Context - GXO Signify AWS Deployment

## ☁️ AWS ARCHITECTURE OVERVIEW

### Cloud Infrastructure

- **Compute**: AWS Lambda (API), ECS Fargate (optional)
- **Storage**: S3 Data Lake + Aurora PostgreSQL
- **ML/AI**: Amazon Forecast + AWS Lookout for Metrics
- **ETL**: AWS Glue with Apache Spark
- **Orchestration**: Step Functions
- **Frontend**: AWS Amplify Gen 2
- **Networking**: VPC with private subnets (/24 CIDR)
- **Monitoring**: CloudWatch + X-Ray

### Cost-Optimized Architecture

- **Monthly Estimate**: $530-1,180
- **NAT Gateway**: Reuse existing ($45/month saved)
- **VPC Endpoints**: Private connectivity (reduced data transfer)
- **S3 Intelligent Tiering**: Automatic cost optimization
- **Lambda Right-sizing**: Performance-based allocation

## 🏗️ INFRASTRUCTURE AS CODE

### Directory Structure

```
infrastructure/
├── terraform/                  # Terraform modules
│   ├── environments/
│   │   ├── pilot/             # Pilot environment
│   │   └── production/        # Production environment
│   ├── modules/
│   │   ├── vpc/              # Network infrastructure
│   │   ├── compute/          # Lambda, ECS
│   │   ├── storage/          # S3, Aurora
│   │   ├── ml-services/      # Forecast, Lookout
│   │   └── monitoring/       # CloudWatch, Alarms
│   └── main.tf
├── cloudformation/            # AWS SAM templates
│   ├── network.yaml          # VPC resources
│   ├── security-groups.yaml  # Security configuration
│   ├── iam.yaml             # Roles and policies
│   └── template.yaml        # Main SAM template
├── cdk/                      # AWS CDK (if preferred)
│   ├── lib/
│   └── bin/
└── scripts/                  # Deployment scripts
    ├── deploy-aws-native.sh
    ├── setup-forecast.sh
    └── cost-optimization.sh
```

## 🚀 DEPLOYMENT COMMANDS

### Initial Setup

```bash
# Configure AWS credentials
aws configure --profile gxo-signify
export AWS_PROFILE=gxo-signify

# Initialize Terraform
cd infrastructure/terraform
terraform init -backend-config="key=gxo-signify-pilot.tfstate"

# Deploy infrastructure
./scripts/deploy-aws-native.sh pilot us-east-1

# Validate deployment
./scripts/post-deployment-validation.sh pilot
```

### Infrastructure Management

```bash
# Plan changes
terraform plan -var-file="environments/pilot/terraform.tfvars"

# Apply changes
terraform apply -var-file="environments/pilot/terraform.tfvars"

# Destroy resources (careful!)
terraform destroy -var-file="environments/pilot/terraform.tfvars"

# Cost analysis
./scripts/aws-native-cost-optimization.sh pilot
```

## 🔒 NETWORK ARCHITECTURE

### VPC Configuration (/24 CIDR)

```yaml
VPC:
  CIDR: 10.0.1.0/24
  
Public_Subnets:
  - Name: public-a
    CIDR: 10.0.1.0/26    # 64 IPs
    AZ: us-east-1a
  - Name: public-b
    CIDR: 10.0.1.64/26   # 64 IPs
    AZ: us-east-1b

Private_Subnets:
  - Name: private-a
    CIDR: 10.0.1.128/26  # 64 IPs
    AZ: us-east-1a
  - Name: private-b
    CIDR: 10.0.1.192/26  # 64 IPs
    AZ: us-east-1b

NAT_Gateway:
  Strategy: "Reuse existing or create single NAT"
  Cost: "$45/month if new"

VPC_Endpoints:
  - S3 (Gateway endpoint - free)
  - SageMaker API
  - SageMaker Runtime
  - Forecast
  - Lookout for Metrics
```

### Security Groups

```yaml
Lambda_Security_Group:
  Ingress: []  # No inbound
  Egress:
    - Protocol: tcp
      Port: 443
      Destination: 0.0.0.0/0
      Description: "HTTPS for AWS APIs"

SageMaker_Security_Group:
  Ingress: []  # No inbound
  Egress:
    - Protocol: tcp
      Port: 443
      Destination: VPCEndpointSecurityGroup
      Description: "Private AWS service access"

VPCEndpoint_Security_Group:
  Ingress:
    - Protocol: tcp
      Port: 443
      Source: LambdaSecurityGroup
    - Protocol: tcp
      Port: 443
      Source: SageMakerSecurityGroup
  Egress: []  # No outbound needed
```

## 🔐 IAM ROLES & POLICIES

### Service-Specific Roles

```json
// Lambda Execution Role
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::gxo-signify-pilot/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "forecast:QueryForecast",
        "lookoutmetrics:ListAnomalyGroupSummaries"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}

// Amazon Forecast Service Role
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::gxo-signify-pilot",
        "arn:aws:s3:::gxo-signify-pilot/*"
      ]
    }
  ]
}
```

## 📦 S3 DATA LAKE STRUCTURE

### Bucket Organization

```
s3://gxo-signify-pilot-{ACCOUNT_ID}/
├── raw/                       # Landing zone
│   ├── inbound/              # Raw inbound CSV
│   ├── outbound/             # Raw outbound CSV
│   └── mvt/                  # Raw MVT data
├── processed/                # Glue ETL output
│   ├── clean-inbound/        # Parquet format
│   ├── clean-outbound/       # Parquet format
│   └── forecast-input/       # Amazon Forecast ready
├── forecasts/                # Model outputs
│   ├── predictions/          # Forecast results
│   └── accuracy-metrics/     # Model performance
├── anomalies/                # Lookout results
│   └── detected-anomalies/   # Anomaly reports
├── kpis/                     # Calculated metrics
│   └── dashboard-data/       # API-ready JSON
└── glue-scripts/             # ETL job scripts
```

### S3 Lifecycle Policies

```yaml
Lifecycle_Rules:
  - Rule: "Archive old raw data"
    Transitions:
      - Days: 90
        StorageClass: STANDARD_IA
      - Days: 180
        StorageClass: GLACIER
    
  - Rule: "Delete old processed data"
    Expiration:
      Days: 365
    
  - Rule: "Intelligent tiering for forecasts"
    Transitions:
      - Days: 0
        StorageClass: INTELLIGENT_TIERING
```

## 🔄 AWS GLUE ETL PIPELINE

### Glue Job Configuration

```python
# Data Cleansing Job
glue_job_config = {
    "Name": "signify-data-cleansing",
    "Role": glue_role_arn,
    "Command": {
        "Name": "glueetl",
        "ScriptLocation": f"s3://{bucket}/glue-scripts/data_cleansing.py",
        "PythonVersion": "3"
    },
    "DefaultArguments": {
        "--TempDir": f"s3://{bucket}/temp/",
        "--enable-metrics": "",
        "--enable-spark-ui": "true",
        "--spark-event-logs-path": f"s3://{bucket}/sparkHistoryLogs/"
    },
    "MaxRetries": 1,
    "Timeout": 60,
    "MaxCapacity": 2.0  # DPUs
}
```

### Glue Crawlers

```yaml
Crawlers:
  - Name: signify-raw-data-crawler
    DatabaseName: signify_logistics_db
    Targets:
      S3Targets:
        - Path: s3://gxo-signify-pilot/raw/
    Schedule: "cron(0 2 * * ? *)"  # 2 AM daily
    
  - Name: signify-processed-data-crawler
    DatabaseName: signify_logistics_db
    Targets:
      S3Targets:
        - Path: s3://gxo-signify-pilot/processed/
    Schedule: "cron(0 4 * * ? *)"  # 4 AM daily
```

## 📊 STEP FUNCTIONS ORCHESTRATION

### Forecast Pipeline State Machine

```json
{
  "Comment": "Signify Daily Forecast Pipeline",
  "StartAt": "CheckNewData",
  "States": {
    "CheckNewData": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:check-new-data",
      "Next": "DataAvailable?"
    },
    "DataAvailable?": {
      "Type": "Choice",
      "Choices": [{
        "Variable": "$.hasNewData",
        "BooleanEquals": true,
        "Next": "TriggerGlueETL"
      }],
      "Default": "NoNewData"
    },
    "TriggerGlueETL": {
      "Type": "Task",
      "Resource": "arn:aws:states:::glue:startJobRun.sync",
      "Parameters": {
        "JobName": "signify-data-cleansing"
      },
      "Next": "CreateForecastDataset"
    },
    "CreateForecastDataset": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:create-forecast-dataset",
      "Next": "TrainForecastModel"
    },
    "TrainForecastModel": {
      "Type": "Task",
      "Resource": "arn:aws:states:::forecast:createPredictor",
      "Parameters": {
        "PredictorName.$": "$.predictorName",
        "ForecastHorizon": 28,
        "PerformAutoML": true
      },
      "Next": "GenerateForecasts"
    },
    "GenerateForecasts": {
      "Type": "Task",
      "Resource": "arn:aws:states:::forecast:createForecast",
      "Next": "CalculateKPIs"
    },
    "CalculateKPIs": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:calculate-kpis",
      "End": true
    },
    "NoNewData": {
      "Type": "Pass",
      "End": true
    }
  }
}
```

## 📈 MONITORING & ALERTING

### CloudWatch Dashboard

```yaml
Dashboard_Widgets:
  - Widget: "Lambda Performance"
    Metrics:
      - FunctionName: gxo-signify-*
        Metric: Duration
      - FunctionName: gxo-signify-*
        Metric: Errors
      - FunctionName: gxo-signify-*
        Metric: ConcurrentExecutions
  
  - Widget: "Forecast Pipeline"
    Metrics:
      - StateMachine: SignifyForecastPipeline
        Metric: ExecutionSucceeded
      - StateMachine: SignifyForecastPipeline
        Metric: ExecutionFailed
      - StateMachine: SignifyForecastPipeline
        Metric: ExecutionTime
  
  - Widget: "Data Pipeline"
    Metrics:
      - GlueJob: signify-data-cleansing
        Metric: glue.driver.aggregate.recordsRead
      - GlueJob: signify-data-cleansing
        Metric: glue.driver.aggregate.executionTime
  
  - Widget: "Cost Tracking"
    Metrics:
      - Service: Lambda
        Metric: EstimatedCharges
      - Service: Forecast
        Metric: EstimatedCharges
      - Service: S3
        Metric: EstimatedCharges
```

### Critical Alarms

```yaml
Alarms:
  - Name: "Pipeline-Failure"
    Metric: ExecutionFailed
    Threshold: 1
    Action: SNS notification
    
  - Name: "High-Error-Rate"
    Metric: Lambda Errors
    Threshold: 5 in 5 minutes
    Action: PagerDuty alert
    
  - Name: "Cost-Threshold"
    Metric: EstimatedCharges
    Threshold: $50/day
    Action: Email notification
```

## 🚨 OPERATIONAL PROCEDURES

### Daily Health Check

```bash
#!/bin/bash
# Daily operational health check

echo "🔍 GXO Signify Infrastructure Health Check"
echo "========================================"

# Check Lambda functions
aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'gxo-signify')].FunctionName" --output table

# Check Step Functions
aws stepfunctions list-executions \
  --state-machine-arn arn:aws:states:REGION:ACCOUNT:stateMachine:SignifyForecastPipeline \
  --status-filter FAILED \
  --max-items 10

# Check Glue jobs
aws glue get-job-runs \
  --job-name signify-data-cleansing \
  --max-results 10

# Check S3 bucket size
aws s3 ls s3://gxo-signify-pilot --recursive --summarize | grep "Total Size"

# Check costs
aws ce get-cost-and-usage \
  --time-period Start=$(date -d "7 days ago" +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE
```

### Disaster Recovery

```yaml
DR_Strategy:
  RTO: "4 hours"  # Recovery Time Objective
  RPO: "1 hour"   # Recovery Point Objective
  
  Backup_Schedule:
    - Aurora: Automated snapshots every hour
    - S3: Cross-region replication enabled
    - Lambda: Code in GitHub + automated deployment
    
  Recovery_Steps:
    1. Assess impact and activate DR plan
    2. Restore from latest Aurora snapshot
    3. Verify S3 data integrity
    4. Redeploy Lambda functions if needed
    5. Validate end-to-end functionality
    6. Update DNS/routing if region change
```

## 💰 COST OPTIMIZATION

### Cost Monitoring Script

```bash
#!/bin/bash
# AWS service cost breakdown

echo "💰 GXO Signify Cost Analysis"
echo "==========================="

# Get current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE \
  --query 'ResultsByTime[0].Groups[*].[Keys[0],Metrics.UnblendedCost.Amount]' \
  --output table

# Forecast month-end costs
aws ce get-cost-forecast \
  --time-period Start=$(date +%Y-%m-%d),End=$(date -d "$(date +%Y-%m-01) +1 month -1 day" +%Y-%m-%d) \
  --metric UNBLENDED_COST \
  --granularity MONTHLY
```

### Optimization Recommendations

1. **Use Spot Instances** for Glue development endpoints
2. **Enable S3 Intelligent Tiering** for automatic cost optimization
3. **Right-size Lambda memory** based on profiling data
4. **Schedule non-critical jobs** during off-peak hours
5. **Use VPC Endpoints** to reduce NAT Gateway costs
6. **Implement lifecycle policies** for log retention
7. **Monitor unused resources** with AWS Trusted Advisor

## 🔧 TROUBLESHOOTING

### Common Issues

```bash
# Lambda timeout issues
aws logs tail /aws/lambda/gxo-signify-kpi-processor --follow

# Glue job failures
aws glue get-job-run --job-name signify-data-cleansing --run-id <RUN_ID>

# Step Functions debugging
aws stepfunctions describe-execution --execution-arn <EXECUTION_ARN>

# VPC connectivity issues
aws ec2 describe-vpc-endpoints --filters "Name=vpc-id,Values=<VPC_ID>"

# S3 access issues
aws s3api get-bucket-policy --bucket gxo-signify-pilot
```

## 📚 INFRASTRUCTURE RESOURCES

- **Terraform AWS Provider**: <https://registry.terraform.io/providers/hashicorp/aws/>
- **AWS SAM**: <https://docs.aws.amazon.com/serverless-application-model/>
- **AWS Well-Architected**: <https://aws.amazon.com/architecture/well-architected/>
- **AWS Pricing Calculator**: <https://calculator.aws/>

---
*Infrastructure Context - Last Updated: June 26, 2025*
*Optimized for: AWS Native Services, Cost Efficiency, Security*
