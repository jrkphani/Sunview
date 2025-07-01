# Cost Analysis Command

Analyze and optimize AWS costs for GXO Signify Forecasting Solution.

## Cost Analysis Report:

### 1. Current Month Costs
```bash
# Get current month-to-date costs
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics "UnblendedCost" \
  --group-by Type=DIMENSION,Key=SERVICE \
  --query 'ResultsByTime[0].Groups[?Metrics.UnblendedCost.Amount > `0`].[Keys[0],Metrics.UnblendedCost.Amount]' \
  --output table
```

### 2. Service-Specific Breakdown

#### Amazon Forecast
```bash
# Forecast costs
echo "=== Amazon Forecast Costs ==="
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics "UnblendedCost" \
  --filter '{
    "Dimensions": {
      "Key": "SERVICE",
      "Values": ["Amazon Forecast"]
    }
  }' \
  --query 'ResultsByTime[*].[TimePeriod.Start,Total.UnblendedCost.Amount]' \
  --output table

# Count active resources
echo "Active Predictors: $(aws forecast list-predictors --query 'length(Predictors)' --output text)"
echo "Active Datasets: $(aws forecast list-datasets --query 'length(Datasets)' --output text)"
```

#### AWS Lambda
```bash
# Lambda costs and invocations
echo "=== Lambda Function Costs ==="
for func in $(aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'gxo-signify')].FunctionName" --output text); do
  echo "Function: $func"
  aws cloudwatch get-metric-statistics \
    --namespace AWS/Lambda \
    --metric-name Invocations \
    --dimensions Name=FunctionName,Value=$func \
    --start-time $(date -u -d '30 days ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 2592000 \
    --statistics Sum \
    --query 'Datapoints[0].Sum' \
    --output text
done
```

#### S3 Storage
```bash
# S3 bucket sizes and costs
echo "=== S3 Storage Analysis ==="
for bucket in $(aws s3api list-buckets --query "Buckets[?contains(Name, 'gxo-signify')].Name" --output text); do
  echo "Bucket: $bucket"
  aws s3api list-objects-v2 --bucket $bucket --query 'sum(Contents[].Size)' --output text | \
    awk '{print "Size: " $1/1024/1024/1024 " GB"}'
  
  # Get storage class distribution
  aws s3api list-objects-v2 --bucket $bucket \
    --query 'Contents[].StorageClass' \
    --output text | sort | uniq -c
done
```

### 3. Cost Trends Analysis
```python
# Generate cost trend visualization
import boto3
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

ce = boto3.client('ce')

# Get 90-day cost trend
end_date = datetime.now()
start_date = end_date - timedelta(days=90)

response = ce.get_cost_and_usage(
    TimePeriod={
        'Start': start_date.strftime('%Y-%m-%d'),
        'End': end_date.strftime('%Y-%m-%d')
    },
    Granularity='DAILY',
    Metrics=['UnblendedCost'],
    GroupBy=[{'Type': 'DIMENSION', 'Key': 'SERVICE'}]
)

# Create trend chart
plot_cost_trends(response['ResultsByTime'])
```

### 4. Cost Optimization Recommendations

#### Immediate Actions (Quick Wins)
1. **S3 Lifecycle Policies**
   ```bash
   # Apply intelligent tiering
   aws s3api put-bucket-lifecycle-configuration \
     --bucket gxo-signify-pilot \
     --lifecycle-configuration file://s3-lifecycle.json
   ```

2. **Lambda Memory Optimization**
   ```bash
   # Analyze Lambda performance vs memory
   for func in $(aws lambda list-functions --query "Functions[?starts_with(FunctionName, 'gxo-signify')].FunctionName" --output text); do
     echo "Optimizing $func"
     # Get average duration
     AVG_DURATION=$(aws cloudwatch get-metric-statistics \
       --namespace AWS/Lambda \
       --metric-name Duration \
       --dimensions Name=FunctionName,Value=$func \
       --start-time $(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%S) \
       --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
       --period 604800 \
       --statistics Average \
       --query 'Datapoints[0].Average' \
       --output text)
     
     echo "Average Duration: $AVG_DURATION ms"
     # Recommend memory adjustment based on duration
   done
   ```

3. **Remove Unused Resources**
   ```bash
   # Find unused Forecast resources
   aws forecast list-predictors --query 'Predictors[?Status==`ACTIVE`]' | \
     jq -r '.[] | select(.LastModificationTime < "'$(date -d '30 days ago' --iso-8601)'")'
   ```

#### Long-term Optimizations
1. **Reserved Capacity Analysis**
   ```bash
   # Analyze for Reserved Instance opportunities
   aws ce get-reservation-purchase-recommendation \
     --service "AmazonEC2" \
     --account-scope PAYER \
     --lookback-period-in-days SIXTY_DAYS \
     --term-in-years ONE_YEAR \
     --payment-option NO_UPFRONT
   ```

2. **Compute Optimization**
   - Consider Spot instances for Glue development
   - Use Graviton2 for Lambda functions
   - Implement auto-scaling for variable workloads

### 5. Cost Allocation Tags
```bash
# Verify cost allocation tags
echo "=== Cost Allocation Tag Coverage ==="
aws ce get-tags \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --tag-key Project \
  --tag-key Environment \
  --tag-key Owner
```

### 6. Budget Alerts Setup
```bash
# Create/Update budget alerts
aws budgets create-budget \
  --account-id $(aws sts get-caller-identity --query Account --output text) \
  --budget file://budget-config.json \
  --notifications-with-subscribers file://budget-notifications.json
```

## Cost Optimization Report:

### 💰 Current Monthly Estimate: $XXX
- **On Track**: Services within budget
- **Over Budget**: Services exceeding allocation
- **Optimization Potential**: $YYY (Z%)

### 📊 Top Cost Drivers:
1. Service A: $XXX (YY%)
2. Service B: $XXX (YY%)
3. Service C: $XXX (YY%)

### 🎯 Recommended Actions:
1. **Immediate**: [Specific action with estimated savings]
2. **This Week**: [Specific action with estimated savings]
3. **This Month**: [Specific action with estimated savings]

### 📈 Projected Savings:
- This Month: $XXX
- Next Month: $YYY
- Annual: $ZZZ

Usage: `/cost-analysis [--detailed] [--recommendations] [--export-csv]`