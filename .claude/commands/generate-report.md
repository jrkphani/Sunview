# Generate KPI Report Command

Generate comprehensive KPI report for GXO Signify Forecasting Solution.

## Report Generation:

### 1. Fetch Latest KPI Data
```python
import boto3
import pandas as pd
from datetime import datetime, timedelta

# Connect to services
s3 = boto3.client('s3')
forecast_client = boto3.client('forecast')
lookout_client = boto3.client('lookoutmetrics')

# Time range
end_date = datetime.now()
start_date = end_date - timedelta(days=30)
```

### 2. Forecast Accuracy Metrics
```python
# Load forecast vs actual data
forecast_data = load_from_s3('s3://gxo-signify-pilot/forecasts/latest/')
actual_data = load_from_s3('s3://gxo-signify-pilot/processed/actuals/')

# Calculate KPIs
accuracy_metrics = {
    'MAPE': calculate_mape(forecast_data, actual_data),
    'WAPE': calculate_wape(forecast_data, actual_data),
    'Bias': calculate_bias(forecast_data, actual_data),
    'CI_Coverage': calculate_ci_coverage(forecast_data, actual_data)
}
```

### 3. Anomaly Detection Summary
```python
# Get anomaly insights
anomalies = lookout_client.list_anomaly_group_summaries(
    AnomalyDetectorArn=detector_arn,
    SensitivityThreshold=70
)

anomaly_summary = {
    'total_anomalies': len(anomalies['AnomalyGroupSummaryList']),
    'high_severity': count_by_severity(anomalies, 'high'),
    'volume_spikes': count_by_type(anomalies, 'spike'),
    'demand_drops': count_by_type(anomalies, 'drop')
}
```

### 4. Logistics Efficiency Metrics
```python
# Calculate operational KPIs
efficiency_metrics = {
    'fill_rate': calculate_fill_rate(historical_data),
    'truck_utilization': calculate_truck_utilization(forecast_data, capacity_data),
    'capacity_utilization': calculate_capacity_utilization(forecast_data),
    'efficiency_grade': determine_efficiency_grade(fill_rate, truck_utilization)
}
```

### 5. Business Impact Analysis
```python
# Calculate business value metrics
business_impact = {
    'cost_savings': {
        'emergency_staffing_reduction': calculate_staffing_savings(),
        'truck_optimization_savings': calculate_truck_savings(),
        'total_monthly_savings': sum_total_savings()
    },
    'service_improvements': {
        'sla_adherence': calculate_sla_metrics(),
        'order_fulfillment': calculate_fulfillment_rate(),
        'customer_satisfaction': estimate_csat_improvement()
    }
}
```

## Report Format:

### 📊 Executive Summary
```markdown
# GXO Signify KPI Report
**Period**: [Start Date] - [End Date]
**Generated**: [Current DateTime]

## Key Achievements
- ✅ Forecast Accuracy: MAPE [X]% (Target: <15%)
- ✅ Truck Utilization: [Y]% improvement
- ✅ Cost Reduction: $[Z] monthly savings
- ⚠️ [Any areas needing attention]

## Strategic Insights
1. **Top Performing SKUs**: [List top 5]
2. **Capacity Optimization**: [Key finding]
3. **Risk Mitigation**: [Anomalies prevented]
```

### 📈 Detailed Metrics

#### Forecast Performance
| Metric | Current | Target | Status |
|--------|---------|--------|---------|
| MAPE | X% | <15% | 🟢/🟡/🔴 |
| WAPE | Y% | <10% | 🟢/🟡/🔴 |
| Bias | Z% | <5% | 🟢/🟡/🔴 |
| CI Coverage | A% | >80% | 🟢/🟡/🔴 |

#### Operational Efficiency
| Metric | Current | Previous | Change |
|--------|---------|----------|---------|
| Fill Rate | X% | Y% | +Z% |
| Truck Utilization | A% | B% | +C% |
| Emergency Orders | D | E | -F |

#### Anomaly Detection
| Type | Count | Impact | Actions Taken |
|------|--------|---------|---------------|
| Volume Spikes | X | $Y | Capacity adjusted |
| Demand Drops | A | $B | Resources reallocated |

### 📉 Trend Analysis
```python
# Generate trend charts
create_accuracy_trend_chart(weekly_accuracy_data)
create_volume_forecast_chart(forecast_vs_actual)
create_efficiency_dashboard(efficiency_metrics)
```

### 🎯 Recommendations

1. **Immediate Actions**
   - [Action 1 based on KPIs]
   - [Action 2 based on anomalies]

2. **Strategic Improvements**
   - [Long-term recommendation 1]
   - [Long-term recommendation 2]

3. **Risk Mitigation**
   - [Risk 1 and mitigation]
   - [Risk 2 and mitigation]

## Export Options:

### 1. PDF Report
```bash
# Generate PDF with charts
python scripts/generate_pdf_report.py \
  --data kpi_results.json \
  --template executive_report.html \
  --output GXO_Signify_KPI_Report_$(date +%Y%m%d).pdf
```

### 2. Excel Dashboard
```bash
# Create Excel with multiple sheets
python scripts/generate_excel_dashboard.py \
  --metrics all \
  --period last_30_days \
  --output KPI_Dashboard_$(date +%Y%m%d).xlsx
```

### 3. Email Distribution
```bash
# Send via AWS SES
aws ses send-email \
  --from reports@gxo.com \
  --to stakeholders@signify.com \
  --subject "GXO Signify KPI Report - $(date +%B %Y)" \
  --html-body file://report.html \
  --attachments file://report.pdf
```

## Automated Scheduling:

```yaml
# CloudWatch Event Rule for weekly reports
ScheduleExpression: "cron(0 8 ? * MON *)"  # Every Monday 8 AM
Targets:
  - Arn: !GetAtt GenerateReportLambda.Arn
    Input: |
      {
        "reportType": "weekly",
        "recipients": ["stakeholders@signify.com"],
        "includeCharts": true
      }
```

## Historical Comparison:

Compare current KPIs with historical performance:
- Week-over-week changes
- Month-over-month trends
- Pilot baseline comparison
- Best/worst performing periods

Usage: `/generate-report [weekly|monthly|custom --start-date --end-date]`