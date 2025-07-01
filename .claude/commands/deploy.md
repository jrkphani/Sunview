# Deploy to AWS Command

Deploy GXO Signify Forecasting Solution to AWS environment: $ARGUMENTS

## Pre-Deployment Checklist:

1. ✓ All tests passing
2. ✓ Security scan completed
3. ✓ Cost analysis reviewed
4. ✓ Documentation updated
5. ✓ Environment variables configured

## Deployment Steps:

### 1. Validate AWS Credentials
```bash
aws sts get-caller-identity --profile gxo-signify
export AWS_PROFILE=gxo-signify
export AWS_REGION=us-east-1
```

### 2. Infrastructure Deployment
```bash
cd infrastructure/terraform

# Initialize backend
terraform init -backend-config="key=gxo-signify-$ENVIRONMENT.tfstate"

# Plan deployment
terraform plan -var-file="environments/$ENVIRONMENT/terraform.tfvars" -out=tfplan

# Apply infrastructure
terraform apply tfplan

# Capture outputs
terraform output -json > outputs.json
```

### 3. Database Setup
```bash
# Run migrations on Aurora
export DATABASE_URL=$(terraform output -raw aurora_connection_string)
cd backend
alembic upgrade head
```

### 4. Deploy Backend Services
```bash
# Package Lambda functions
cd backend
./scripts/package-lambdas.sh

# Deploy via SAM
cd infrastructure/cloudformation
sam build
sam deploy --parameter-overrides Environment=$ENVIRONMENT
```

### 5. Setup AWS Services
```bash
# Create Amazon Forecast dataset group
./scripts/setup-forecast-datasets.sh $ENVIRONMENT

# Configure Lookout for Metrics
./scripts/setup-lookout-metrics.sh $ENVIRONMENT

# Deploy Glue ETL jobs
./scripts/deploy-glue-jobs.sh $ENVIRONMENT
```

### 6. Deploy Frontend
```bash
cd frontend

# Build production bundle
npm run build

# Deploy to Amplify
npx @aws-amplify/cli@latest init --amplify
npx @aws-amplify/cli@latest push --yes

# Get Amplify URL
AMPLIFY_URL=$(aws amplify get-app --app-id $APP_ID --query 'app.defaultDomain' --output text)
```

### 7. Configure Monitoring
```bash
# Create CloudWatch dashboard
aws cloudformation deploy \
  --template-file monitoring/dashboard.yaml \
  --stack-name gxo-signify-monitoring-$ENVIRONMENT

# Set up alarms
aws cloudformation deploy \
  --template-file monitoring/alarms.yaml \
  --stack-name gxo-signify-alarms-$ENVIRONMENT
```

### 8. Post-Deployment Validation
```bash
# Run smoke tests
cd tests
pytest smoke_tests/ -v

# Check endpoints
curl -f $API_URL/health
curl -f $AMPLIFY_URL

# Verify data pipeline
aws stepfunctions start-execution \
  --state-machine-arn $STATE_MACHINE_ARN \
  --input '{"test": true}'
```

## Deployment Summary:

### 📋 Resources Created:
- VPC: 10.0.1.0/24
- Lambda Functions: X deployed
- S3 Buckets: gxo-signify-pilot-*
- Aurora Database: Provisioned
- API Gateway: $API_URL
- Frontend URL: $AMPLIFY_URL

### 💰 Estimated Costs:
- Lambda: ~$20/month
- S3: ~$50/month
- Aurora: ~$100/month
- Forecast: ~$200-500/month
- Total: ~$530-1,180/month

### 🔐 Security Status:
- VPC: Private subnets configured
- IAM: Least privilege roles created
- Encryption: Enabled for all services
- Monitoring: CloudWatch configured

### 📊 Next Steps:
1. Upload sample data to S3
2. Configure user access
3. Schedule ETL jobs
4. Set up cost alerts
5. Document API endpoints

## Rollback Procedure:
```bash
# If deployment fails:
terraform destroy -var-file="environments/$ENVIRONMENT/terraform.tfvars"
aws cloudformation delete-stack --stack-name gxo-signify-$ENVIRONMENT
```

Usage: `/deploy pilot|production`