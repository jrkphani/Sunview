# Run Data Pipeline Command

Execute the GXO Signify data processing pipeline for: $ARGUMENTS

## Pipeline Execution:

### 1. Pre-flight Checks
```bash
# Verify S3 bucket has new data
aws s3 ls s3://gxo-signify-pilot/raw/ --recursive | grep $(date +%Y-%m-%d)

# Check pipeline status
aws stepfunctions list-executions \
  --state-machine-arn arn:aws:states:${AWS_REGION}:${ACCOUNT_ID}:stateMachine:SignifyForecastPipeline \
  --status-filter RUNNING

# Verify Glue job readiness
aws glue get-job --job-name signify-data-cleansing
```

### 2. Manual Pipeline Trigger
```bash
# Start Step Functions execution
EXECUTION_NAME="manual-run-$(date +%Y%m%d-%H%M%S)"

aws stepfunctions start-execution \
  --state-machine-arn arn:aws:states:${AWS_REGION}:${ACCOUNT_ID}:stateMachine:SignifyForecastPipeline \
  --name $EXECUTION_NAME \
  --input '{
    "inputPath": "s3://gxo-signify-pilot/raw/latest/",
    "outputPath": "s3://gxo-signify-pilot/processed/",
    "runType": "manual",
    "skipValidation": false
  }'
```

### 3. Monitor Pipeline Progress
```bash
# Watch execution status
watch -n 10 "aws stepfunctions describe-execution \
  --execution-arn arn:aws:states:${AWS_REGION}:${ACCOUNT_ID}:execution:SignifyForecastPipeline:$EXECUTION_NAME \
  --query 'status' --output text"

# Check Glue job progress
aws glue get-job-run \
  --job-name signify-data-cleansing \
  --run-id $(aws glue get-job-runs --job-name signify-data-cleansing --max-results 1 --query 'JobRuns[0].Id' --output text)
```

### 4. Pipeline Stages Status

#### Stage 1: Data Validation
```bash
# Check data quality report
aws s3 cp s3://gxo-signify-pilot/processed/data-quality-report.json - | jq '.'
```

#### Stage 2: ETL Processing
```bash
# Monitor Glue job metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Glue \
  --metric-name glue.driver.aggregate.recordsRead \
  --dimensions Name=JobName,Value=signify-data-cleansing \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300 \
  --statistics Sum
```

#### Stage 3: Forecast Generation
```bash
# Check Amazon Forecast status
PREDICTOR_ARN=$(aws forecast list-predictors --query 'Predictors[0].PredictorArn' --output text)
aws forecast describe-predictor --predictor-arn $PREDICTOR_ARN
```

#### Stage 4: Anomaly Detection
```bash
# Check Lookout for Metrics
DETECTOR_ARN=$(aws lookoutmetrics list-anomaly-detectors --query 'AnomalyDetectorSummaryList[0].AnomalyDetectorArn' --output text)
aws lookoutmetrics describe-anomaly-detector --anomaly-detector-arn $DETECTOR_ARN
```

#### Stage 5: KPI Calculation
```bash
# Verify KPI results
aws s3 ls s3://gxo-signify-pilot/kpis/latest/
aws s3 cp s3://gxo-signify-pilot/kpis/latest/summary.json - | jq '.'
```

### 5. Troubleshooting

#### Common Issues:
1. **Data Format Error**
   ```bash
   # Check raw data format
   aws s3 cp s3://gxo-signify-pilot/raw/latest/sample.csv - | head -n 10
   ```

2. **Glue Job Failure**
   ```bash
   # Get error logs
   aws logs tail /aws-glue/jobs/signify-data-cleansing --follow
   ```

3. **Forecast Model Error**
   ```bash
   # Check forecast dataset
   aws forecast describe-dataset --dataset-arn $DATASET_ARN
   ```

4. **Pipeline Timeout**
   ```bash
   # Check Step Functions timeout settings
   aws stepfunctions describe-state-machine --state-machine-arn $STATE_MACHINE_ARN
   ```

### 6. Pipeline Results

```bash
# Generate summary report
echo "=== Pipeline Execution Summary ==="
echo "Execution ID: $EXECUTION_NAME"
echo "Start Time: $(date)"
echo "Status: $(aws stepfunctions describe-execution --execution-arn $EXECUTION_ARN --query 'status' --output text)"
echo ""
echo "Records Processed:"
aws s3 cp s3://gxo-signify-pilot/processed/metrics.json - | jq '.recordCounts'
echo ""
echo "Forecasts Generated:"
aws s3 ls s3://gxo-signify-pilot/forecasts/latest/ | wc -l
echo ""
echo "Anomalies Detected:"
aws s3 cp s3://gxo-signify-pilot/anomalies/latest/summary.json - | jq '.totalAnomalies'
echo ""
echo "KPIs Calculated:"
aws s3 cp s3://gxo-signify-pilot/kpis/latest/summary.json - | jq '.metrics | keys'
```

### 7. Post-Pipeline Actions

1. **Notify Stakeholders**
   ```bash
   aws sns publish \
     --topic-arn arn:aws:sns:${AWS_REGION}:${ACCOUNT_ID}:gxo-signify-pipeline-complete \
     --subject "Data Pipeline Complete - $(date +%Y-%m-%d)" \
     --message "Pipeline execution completed successfully. KPIs are ready for review."
   ```

2. **Update Dashboard Cache**
   ```bash
   aws lambda invoke \
     --function-name gxo-signify-invalidate-cache \
     --payload '{"action": "invalidate_all"}' \
     response.json
   ```

3. **Schedule Next Run**
   ```bash
   # Verify next scheduled execution
   aws events list-rules --name-prefix signify-pipeline
   ```

Usage: `/run-pipeline [--manual|--scheduled] [--skip-validation]`