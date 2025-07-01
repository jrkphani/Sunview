# GXO Signify Forecasting Solution

## Software Requirements Specification (SRS)

**Version:** 1.0  
**Date:** June 26, 2025  
**Prepared by:** 1CloudHub  
**Project:** GXO Forecasting Enablement - Technical Architecture  

---

## Technical Architecture Overview

### Technology Stack

- **Frontend:** TypeScript/React with Vite on AWS Amplify Gen 2
- **UI Framework:** shadcn/ui with tokenized design system
- **State Management:** Zustand for global state
- **Backend:** Python with FastAPI + AWS managed services integration
- **Data Lake:** Amazon S3 with structured data partitioning
- **Database:** PostgreSQL on AWS Aurora (metadata and processing results)
- **ETL Pipeline:** AWS Glue with Apache Spark for data transformation
- **ML/Forecasting:** Amazon Forecast for time series predictions
- **Anomaly Detection:** AWS Lookout for Metrics
- **Orchestration:** AWS Step Functions for workflow coordination
- **Analytics:** Pandas, NumPy for custom processing + AWS managed ML
- **Version Control:** GitHub repository
- **Deployment:** AWS Amplify Gen 2 for frontend, Lambda + managed services backend

### Architecture Principles

1. **Component Reusability:** Modular, reusable UI components for maintainable code
2. **Explainability First:** Every insight must trace back to source data
3. **Functionality Focus:** Prioritize feature completeness and business impact over performance optimization
4. **Rapid Iteration:** Quick deployment and feedback cycles for pilot validation

---

## System Architecture

### High-Level System Design

```
┌─────────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Frontend          │    │   Backend API    │    │   AWS Data Layer │
│   (React/TS)        │◄───┤   (FastAPI)      │◄───┤   S3 Data Lake   │
│   AWS Amplify Gen2  │    │   + AWS Services │    │   Aurora (Meta)  │
│   - Dashboard       │    │   - Lambda       │    │   - Raw Data     │
│   - Insights        │    │   - Orchestration│    │   - Processed    │
│   - Drill-down      │    │   GitHub Repo    │    │   - Forecasts    │
└─────────────────────┘    └──────────────────┘    └──────────────────┘
                                     │
                           ┌──────────────────┐
                           │   AWS ML Stack   │
                           │   - Glue ETL     │
                           │   - Forecast     │
                           │   - Lookout      │
                           │   - Step Func.   │
                           └──────────────────┘
```

### Data Flow Architecture

```
Raw CSV → S3 Landing → AWS Glue ETL → Amazon Forecast → Step Functions → Lambda API → Frontend
    ↓         ↓             ↓              ↓             ↓            ↓         ↓
Data Lake  Validation  Feature Eng.   ML Models    Orchestration   KPIs   Dashboard
                ↓             ↓              ↓             ↓
           S3 Processed  S3 Features   S3 Forecasts   S3 Insights
```

---

## Frontend Architecture (React/TypeScript)

### Project Structure

```
src/
├── components/
│   ├── ui/                 # shadcn/ui base components
│   ├── charts/             # Reusable chart components
│   ├── insights/           # Insight display components
│   ├── explainability/     # Drill-down components
│   └── layout/             # Layout and navigation
├── pages/
│   ├── Dashboard.tsx       # Executive dashboard
│   ├── Forecasts.tsx       # Forecast management
│   ├── Insights.tsx        # Insight exploration
│   └── Analytics.tsx       # Deep-dive analysis
├── hooks/                  # Custom React hooks
├── stores/                 # Zustand state stores
│   ├── forecastStore.ts    # Forecast data state
│   ├── insightStore.ts     # Insights state
│   └── userStore.ts        # User preferences
├── services/               # API service layer
├── types/                  # TypeScript type definitions
└── utils/                  # Utility functions
```

### Component Design System

#### Core Reusable Components

**1. InsightCard Component**

```typescript
interface InsightCardProps {
  insight: Insight;
  priority: 'high' | 'medium' | 'low';
  category: InsightCategory;
  onDrillDown: (insight: Insight) => void;
  explainable?: boolean;
}
```

**2. ForecastChart Component**

```typescript
interface ForecastChartProps {
  data: ForecastData[];
  timeHorizon: '1d' | '7d' | '14d' | '28d';
  showConfidence?: boolean;
  interactive?: boolean;
  onDataPointClick?: (point: DataPoint) => void;
}
```

**3. ExplainabilityPanel Component**

```typescript
interface ExplainabilityPanelProps {
  insight: Insight;
  dataLineage: DataLineage;
  methodology: AnalysisMethod;
  confidence: ConfidenceScore;
  onViewRawData: () => void;
}
```

**4. MetricCard Component**

```typescript
interface MetricCardProps {
  title: string;
  value: number | string;
  trend?: TrendDirection;
  comparison?: ComparisonData;
  unit?: string;
  drillDownAvailable?: boolean;
}
```

### State Management (Zustand)

**Forecast Store**

```typescript
interface ForecastStore {
  forecasts: Forecast[];
  selectedTimeHorizon: TimeHorizon;
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchForecasts: (params: ForecastParams) => Promise<void>;
  updateTimeHorizon: (horizon: TimeHorizon) => void;
  refreshForecasts: () => Promise<void>;
}
```

**Insight Store**

```typescript
interface InsightStore {
  insights: Insight[];
  selectedCategories: InsightCategory[];
  priorityFilter: PriorityLevel[];
  
  // Actions
  fetchInsights: () => Promise<void>;
  filterByCategory: (categories: InsightCategory[]) => void;
  drillDownInsight: (insightId: string) => Promise<InsightDetail>;
}
```

### Frontend Requirements

#### FR-F001: Dashboard Interface

- **FR-F001.1:** Executive summary with top 3 priority insights
- **FR-F001.2:** Real-time forecast accuracy metrics
- **FR-F001.3:** Interactive charts with drill-down capability
- **FR-F001.4:** Responsive design for tablet/mobile access
- **FR-F001.5:** No authentication required for pilot access

#### FR-F002: Insight Visualization

- **FR-F002.1:** Insight cards with priority indicators and confidence scores
- **FR-F002.2:** Category-based filtering and sorting
- **FR-F002.3:** One-click explainability access
- **FR-F002.4:** Export capabilities for insights and supporting data

#### FR-F003: Explainability Interface

- **FR-F003.1:** Data source citation with clickable links
- **FR-F003.2:** Methodology explanation with statistical details
- **FR-F003.3:** Interactive data lineage visualization
- **FR-F003.4:** Raw data viewer with filtering capabilities

---

## Backend Architecture (Python/FastAPI + AWS Services)

### Project Structure (MacBook Development)

```
gxo-forecasting/
├── frontend/                   # React TypeScript app
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/            # Zustand stores
│   │   ├── services/          # API calls
│   │   └── types/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env.local
├── backend/                    # FastAPI Python app
│   ├── app/
│   │   ├── api/               # REST API endpoints
│   │   ├── models/            # Data models
│   │   ├── services/          # Business logic + AWS integrations
│   │   ├── aws_services/      # AWS service wrappers
│   │   └── ml/                # Custom ML utilities
│   ├── lambdas/               # AWS Lambda functions
│   │   ├── data_processor.py  # S3 event triggers
│   │   ├── forecast_trigger.py # Schedule-based forecasting
│   │   └── insight_generator.py # KPI calculations
│   ├── glue_jobs/             # AWS Glue ETL scripts
│   │   ├── data_cleansing.py  # Data validation & cleaning
│   │   ├── feature_engineering.py # Feature preparation
│   │   └── data_aggregation.py # MVT and summary tables
│   ├── step_functions/        # Workflow definitions
│   │   └── forecast_pipeline.json # End-to-end orchestration
│   ├── requirements.txt
│   ├── main.py
│   └── .env
├── database/
│   ├── migrations/            # Alembic migrations (Aurora)
│   └── seeds/                 # Sample data for development
├── infrastructure/            # AWS CloudFormation/CDK
│   ├── s3_buckets.yaml        # Data lake structure
│   ├── glue_resources.yaml    # ETL jobs and crawlers
│   └── forecast_resources.yaml # Amazon Forecast setup
├── scripts/
│   ├── setup_local.sh         # Local environment setup
│   ├── deploy_aws.sh          # AWS deployment script
│   ├── sync_data.py           # Data synchronization utilities
│   └── create_forecast_dataset.py # Amazon Forecast dataset setup
├── docs/                      # Documentation
├── .github/
│   └── workflows/             # GitHub Actions for AWS deployment
├── docker-compose.dev.yml     # Optional: Docker for local development
├── amplify.yml                # AWS Amplify configuration
└── README.md
```

### Core API Endpoints

#### Forecast Endpoints

```python
@router.get("/forecasts/")
async def get_forecasts(
    time_horizon: TimeHorizon,
    sku_filter: Optional[List[str]] = None,
    date_range: Optional[DateRange] = None
) -> List[ForecastResponse]

@router.post("/forecasts/generate")
async def generate_forecast(
    request: ForecastRequest
) -> ForecastGenerationResponse

@router.get("/forecasts/{forecast_id}/accuracy")
async def get_forecast_accuracy(
    forecast_id: str
) -> AccuracyMetrics
```

#### Insight Endpoints

```python
@router.get("/insights/")
async def get_insights(
    categories: Optional[List[InsightCategory]] = None,
    priority: Optional[PriorityLevel] = None
) -> List[InsightResponse]

@router.get("/insights/{insight_id}/explainability")
async def get_insight_explainability(
    insight_id: str
) -> ExplainabilityResponse

@router.post("/insights/custom")
async def generate_custom_insight(
    request: CustomInsightRequest
) -> InsightResponse
```

### Machine Learning Pipeline

#### AWS-Native Data Processing Pipeline

```python
class AWSDataProcessor:
    def __init__(self):
        self.glue_client = boto3.client('glue')
        self.s3_client = boto3.client('s3')
        
    def trigger_glue_etl(self, job_name: str, input_path: str) -> str:
        """Trigger AWS Glue job for data processing"""
        response = self.glue_client.start_job_run(
            JobName=job_name,
            Arguments={'--input_path': input_path}
        )
        return response['JobRunId']
    
    def validate_data_quality(self, s3_path: str) -> DataQualityReport:
        """AWS Glue Data Quality integration"""
        pass
    
    def track_data_lineage(self, transformations: List[Transform]) -> DataLineage:
        """AWS Glue DataBrew lineage tracking"""
        pass
```

#### Amazon Forecast Integration

```python
class AmazonForecastService:
    def __init__(self):
        self.forecast_client = boto3.client('forecast')
        self.forecastquery_client = boto3.client('forecastquery')
    
    def create_dataset_group(self, name: str) -> str:
        """Create forecast dataset group for Signify data"""
        response = self.forecast_client.create_dataset_group(
            DatasetGroupName=name,
            Domain='CUSTOM'
        )
        return response['DatasetGroupArn']
    
    def create_forecast_dataset(self, dataset_group_arn: str, s3_path: str) -> str:
        """Create Amazon Forecast dataset from S3 data"""
        response = self.forecast_client.create_dataset(
            DatasetName='signify-logistics-data',
            Domain='CUSTOM',
            DatasetType='TARGET_TIME_SERIES',
            DataFrequency='D',  # Daily frequency
            Schema={
                'Attributes': [
                    {'AttributeName': 'timestamp', 'AttributeType': 'timestamp'},
                    {'AttributeName': 'target_value', 'AttributeType': 'float'},
                    {'AttributeName': 'item_id', 'AttributeType': 'string'}
                ]
            }
        )
        return response['DatasetArn']
    
    def train_forecasting_model(self, dataset_group_arn: str) -> str:
        """Train Amazon Forecast model with AutoML"""
        response = self.forecast_client.create_predictor(
            PredictorName='signify-logistics-predictor',
            ForecastHorizon=28,  # 4 weeks
            PerformAutoML=True,
            InputDataConfig={'DatasetGroupArn': dataset_group_arn}
        )
        return response['PredictorArn']
    
    def generate_forecasts(self, predictor_arn: str) -> str:
        """Generate forecasts using trained model"""
        response = self.forecast_client.create_forecast(
            ForecastName='signify-logistics-forecast',
            PredictorArn=predictor_arn
        )
        return response['ForecastArn']
    
    def query_forecast(self, forecast_arn: str, item_id: str) -> Dict:
        """Query specific forecast results"""
        response = self.forecastquery_client.query_forecast(
            ForecastArn=forecast_arn,
            Filters={'item_id': item_id}
        )
        return response['Forecast']
```

#### AWS Lookout for Metrics Integration

```python
class LookoutMetricsService:
    def __init__(self):
        self.lookout_client = boto3.client('lookoutmetrics')
    
    def create_anomaly_detector(self, s3_data_path: str) -> str:
        """Create anomaly detector for logistics metrics"""
        response = self.lookout_client.create_anomaly_detector(
            AnomalyDetectorName='signify-logistics-anomalies',
            AnomalyDetectorDescription='Detect anomalies in Signify logistics data',
            MetricSetList=[{
                'MetricSetName': 'logistics-metrics',
                'MetricList': [
                    {'MetricName': 'inbound_volume', 'AggregationFunction': 'SUM'},
                    {'MetricName': 'outbound_volume', 'AggregationFunction': 'SUM'},
                    {'MetricName': 'mvt_count', 'AggregationFunction': 'COUNT'}
                ],
                'MetricSource': {
                    'S3SourceConfig': {
                        'RoleArn': 'arn:aws:iam::account:role/LookoutMetricsRole',
                        'TemplatedPathList': [s3_data_path],
                        'HistoricalDataPathList': [s3_data_path]
                    }
                }
            }]
        )
        return response['AnomalyDetectorArn']
    
    def get_anomaly_insights(self, detector_arn: str) -> List[Dict]:
        """Retrieve anomaly detection results"""
        response = self.lookout_client.list_anomaly_group_summaries(
            AnomalyDetectorArn=detector_arn,
            MaxResults=50
        )
        return response['AnomalyGroupSummaryList']
```

#### Enhanced Insight Generation Engine

```python
class AWSInsightGenerator:
    def __init__(self):
        self.forecast_service = AmazonForecastService()
        self.lookout_service = LookoutMetricsService()
        self.s3_client = boto3.client('s3')
    
    def generate_operational_insights(self, forecast_data: Dict, anomaly_data: List[Dict]) -> List[OperationalInsight]:
        """Combine forecast and anomaly data for operational insights"""
        insights = []
        
        # Forecast-based insights
        for item_forecast in forecast_data['Predictions']:
            if item_forecast['MeanValue'] > threshold:
                insights.append(OperationalInsight(
                    category='capacity_planning',
                    priority='high',
                    description=f"Predicted volume spike for {item_forecast['Timestamp']}",
                    data_source='amazon_forecast',
                    confidence=item_forecast['ConfidenceScore']
                ))
        
        # Anomaly-based insights
        for anomaly in anomaly_data:
            insights.append(OperationalInsight(
                category='anomaly_detection',
                priority=self._calculate_priority(anomaly['Score']),
                description=f"Anomaly detected: {anomaly['Description']}",
                data_source='lookout_metrics',
                confidence=anomaly['Score']
            ))
        
        return self.prioritize_insights(insights)
    
    def generate_strategic_insights(self, data: pd.DataFrame) -> List[StrategicInsight]:
        """Generate strategic insights using forecast trends"""
        pass
    
    def generate_commercial_insights(self, data: pd.DataFrame) -> List[CommercialInsight]:
        """Generate commercial insights from forecast accuracy metrics"""
        pass
    
    def generate_risk_insights(self, anomaly_data: List[Dict]) -> List[RiskInsight]:
        """Generate risk insights from anomaly patterns"""
        pass
    
    def prioritize_insights(self, insights: List[Insight]) -> List[PrioritizedInsight]:
        """AI-enhanced insight prioritization"""
        # Combine business impact, urgency, and confidence scores
        pass
```

### Backend Requirements

#### FR-B001: AWS Data Processing Pipeline

- **FR-B001.1:** S3 data lake for CSV ingestion with automatic partitioning
- **FR-B001.2:** AWS Glue ETL jobs for data validation and transformation
- **FR-B001.3:** Data lineage tracking via AWS Glue DataCatalog
- **FR-B001.4:** Step Functions orchestration for batch processing workflows
- **FR-B001.5:** Lambda triggers for real-time S3 event processing

#### FR-B002: Amazon Forecast Integration

- **FR-B002.1:** Automated dataset creation and model training via Amazon Forecast
- **FR-B002.2:** Multi-horizon forecasting (7d, 14d, 28d) with AutoML model selection
- **FR-B002.3:** Confidence intervals and quantile forecasts from Amazon Forecast
- **FR-B002.4:** Forecast accuracy monitoring and automatic retraining schedules
- **FR-B002.5:** Integration with existing FastAPI endpoints for forecast retrieval

#### FR-B003: AWS Lookout for Metrics Integration

- **FR-B003.1:** Anomaly detection setup for inbound/outbound/MVT metrics
- **FR-B003.2:** Real-time anomaly alerts with severity scoring
- **FR-B003.3:** Integration with insight generation for proactive notifications
- **FR-B003.4:** Custom metric definitions for business-specific anomaly detection

#### FR-B004: Enhanced Insight Generation

- **FR-B004.1:** Combined forecast + anomaly data for comprehensive insights
- **FR-B004.2:** AI-enhanced priority scoring using AWS services confidence scores
- **FR-B004.3:** AWS service lineage metadata for full explainability
- **FR-B004.4:** Custom insight queries leveraging S3 analytics and Athena

---

## Data Architecture Design

### S3 Data Lake Structure

#### Bucket Organization

```
s3://gxo-signify-pilot/
├── raw/                              # Landing zone for CSV files
│   ├── inbound/
│   │   ├── year=2024/month=01/       # Partitioned by date
│   │   ├── year=2024/month=02/
│   │   └── year=2025/month=01/
│   ├── outbound/
│   │   ├── year=2024/month=01/
│   │   └── year=2025/month=01/
│   └── mvt/
│       ├── year=2024/
│       └── year=2025/
├── processed/                        # Glue ETL output
│   ├── clean-inbound/               # Validated and cleaned data
│   ├── clean-outbound/
│   ├── aggregated-mvt/
│   └── feature-engineered/          # ML-ready datasets
├── forecasts/                       # Amazon Forecast outputs
│   ├── predictions/
│   ├── accuracy-metrics/
│   └── model-artifacts/
├── anomalies/                       # Lookout for Metrics results
│   ├── detected-anomalies/
│   └── anomaly-scores/
└── insights/                        # Generated business insights
    ├── operational/
    ├── strategic/
    ├── commercial/
    └── risk/
```

### Aurora PostgreSQL Schema (Metadata & Processing Results)

#### AWS Service Integration Tables

```sql
-- Amazon Forecast metadata
CREATE TABLE forecast_datasets (
    id UUID PRIMARY KEY,
    dataset_group_arn VARCHAR(500) NOT NULL,
    dataset_arn VARCHAR(500) NOT NULL,
    s3_input_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE forecast_predictors (
    id UUID PRIMARY KEY,
    predictor_arn VARCHAR(500) NOT NULL,
    dataset_group_id UUID REFERENCES forecast_datasets(id),
    forecast_horizon INTEGER NOT NULL,
    algorithm_arn VARCHAR(500),
    training_status VARCHAR(50) NOT NULL,
    accuracy_metrics JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Processed forecast results for quick API access
CREATE TABLE forecasts (
    id UUID PRIMARY KEY,
    item_id VARCHAR(100) NOT NULL,
    forecast_date DATE NOT NULL,
    horizon_days INTEGER NOT NULL,
    predicted_value DECIMAL(12,2) NOT NULL,
    confidence_lower DECIMAL(12,2),
    confidence_upper DECIMAL(12,2),
    predictor_id UUID REFERENCES forecast_predictors(id),
    s3_result_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Lookout for Metrics Integration

```sql
CREATE TABLE anomaly_detectors (
    id UUID PRIMARY KEY,
    detector_arn VARCHAR(500) NOT NULL,
    detector_name VARCHAR(200) NOT NULL,
    s3_data_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE detected_anomalies (
    id UUID PRIMARY KEY,
    detector_id UUID REFERENCES anomaly_detectors(id),
    anomaly_group_id VARCHAR(100) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    anomaly_score DECIMAL(5,3) NOT NULL,
    anomaly_timestamp TIMESTAMP NOT NULL,
    description TEXT,
    s3_details_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Enhanced Insights Tables

```sql
CREATE TABLE insights (
    id UUID PRIMARY KEY,
    category insight_category_enum NOT NULL,
    priority priority_level_enum NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    impact_score DECIMAL(5,2),
    confidence_score DECIMAL(5,2),
    actionable BOOLEAN DEFAULT true,
    -- AWS service integration
    data_sources JSONB NOT NULL,           -- S3 paths, Forecast ARNs, etc.
    aws_service_metadata JSONB,           -- Service-specific metadata
    methodology JSONB,                    -- How insight was generated
    s3_supporting_data VARCHAR(500),      -- Link to detailed analysis in S3
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### AWS Glue Data Catalog Integration

```sql
-- Track Glue job executions and data lineage
CREATE TABLE glue_job_runs (
    id UUID PRIMARY KEY,
    job_name VARCHAR(200) NOT NULL,
    job_run_id VARCHAR(200) NOT NULL,
    input_s3_paths JSONB NOT NULL,
    output_s3_paths JSONB NOT NULL,
    status VARCHAR(50) NOT NULL,
    execution_time_seconds INTEGER,
    rows_processed INTEGER,
    data_quality_metrics JSONB,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);

CREATE TABLE data_lineage (
    id UUID PRIMARY KEY,
    source_s3_paths JSONB NOT NULL,
    transformation_job_id UUID REFERENCES glue_job_runs(id),
    output_s3_paths JSONB NOT NULL,
    aws_service_lineage JSONB,            -- Track Amazon Forecast, Lookout lineage
    quality_metrics JSONB,
    processing_timestamp TIMESTAMP DEFAULT NOW()
);
```

### Performance Optimization Strategy

#### S3 Performance
- **Partitioning:** Date-based partitioning for time-series data
- **Compression:** GZIP compression for CSV files, Parquet for processed data
- **Lifecycle Policies:** Automatic archival to IA/Glacier after 90 days
- **Query Performance:** Amazon Athena for S3 analytics queries

#### Aurora Performance
- **Indexes:** Time-series optimized indexes on forecast_date, item_id
- **Partitioning:** Table partitioning by date ranges for large datasets
- **Read Replicas:** Read replicas for dashboard queries
- **Connection Pooling:** RDS Proxy for Lambda connection management

#### Caching Strategy
- **ElastiCache:** Redis for frequently accessed forecasts and insights
- **Application-Level:** In-memory caching for static reference data
- **CloudFront:** CDN caching for frontend assets and API responses

---

## AWS Services Integration

### Core AWS Services Architecture

#### Data Pipeline Services

```python
# AWS Service Configuration
class AWSServiceConfig:
    REGION = 'us-east-1'
    S3_BUCKET = 'gxo-signify-pilot'
    
    # AWS Glue Configuration
    GLUE_DATABASE = 'signify_logistics_db'
    GLUE_JOBS = {
        'data_cleansing': 'signify-data-cleansing-job',
        'feature_engineering': 'signify-feature-engineering-job',
        'data_aggregation': 'signify-data-aggregation-job'
    }
    
    # Amazon Forecast Configuration
    FORECAST_DATASET_GROUP = 'signify-logistics-dataset-group'
    FORECAST_DOMAIN = 'CUSTOM'
    FORECAST_FREQUENCY = 'D'  # Daily
    
    # Lookout for Metrics Configuration
    ANOMALY_DETECTOR_NAME = 'signify-logistics-anomalies'
    
    # Step Functions Configuration
    STATE_MACHINE_ARN = 'arn:aws:states:us-east-1:account:stateMachine:SignifyForecastPipeline'
```

#### Orchestration Workflow (Step Functions)

```json
{
  "Comment": "Signify Forecasting Pipeline",
  "StartAt": "TriggerGlueETL",
  "States": {
    "TriggerGlueETL": {
      "Type": "Task",
      "Resource": "arn:aws:states:::glue:startJobRun.sync",
      "Parameters": {
        "JobName": "signify-data-cleansing-job",
        "Arguments": {
          "--input_path.$": "$.s3_input_path"
        }
      },
      "Next": "CheckDataQuality"
    },
    "CheckDataQuality": {
      "Type": "Choice",
      "Choices": [{
        "Variable": "$.JobRunState",
        "StringEquals": "SUCCEEDED",
        "Next": "CreateForecastDataset"
      }],
      "Default": "HandleETLFailure"
    },
    "CreateForecastDataset": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "create-forecast-dataset",
        "Payload.$": "$"
      },
      "Next": "TrainForecastModel"
    },
    "TrainForecastModel": {
      "Type": "Task",
      "Resource": "arn:aws:states:::forecast:createPredictor",
      "Parameters": {
        "PredictorName.$": "$.predictor_name",
        "ForecastHorizon": 28,
        "PerformAutoML": true
      },
      "Next": "GenerateForecasts"
    },
    "GenerateForecasts": {
      "Type": "Task",
      "Resource": "arn:aws:states:::forecast:createForecast",
      "Next": "TriggerInsightGeneration"
    },
    "TriggerInsightGeneration": {
      "Type": "Task",
      "Resource": "arn:aws:states:::lambda:invoke",
      "Parameters": {
        "FunctionName": "generate-insights"
      },
      "End": true
    },
    "HandleETLFailure": {
      "Type": "Fail",
      "Cause": "ETL job failed"
    }
  }
}
```

### AWS Lambda Functions

#### Data Processing Lambda

```python
# lambdas/data_processor.py
import json
import boto3
from typing import Dict

def lambda_handler(event: Dict, context) -> Dict:
    """
    Process S3 upload events and trigger Glue ETL
    """
    s3_client = boto3.client('s3')
    glue_client = boto3.client('glue')
    stepfunctions_client = boto3.client('stepfunctions')
    
    # Parse S3 event
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']
    
    # Trigger Step Functions workflow
    response = stepfunctions_client.start_execution(
        stateMachineArn=AWSServiceConfig.STATE_MACHINE_ARN,
        input=json.dumps({
            's3_input_path': f's3://{bucket}/{key}',
            'execution_timestamp': context.aws_request_id
        })
    )
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'execution_arn': response['executionArn'],
            'message': 'Forecast pipeline triggered successfully'
        })
    }
```

#### Forecast Results Processor

```python
# lambdas/forecast_processor.py
import boto3
import pandas as pd
from app.models.database import get_db_connection

def lambda_handler(event: Dict, context) -> Dict:
    """
    Process Amazon Forecast results and store in Aurora
    """
    forecast_query_client = boto3.client('forecastquery')
    
    # Query forecast results
    forecast_arn = event['forecast_arn']
    
    # Store results in Aurora for quick API access
    db = get_db_connection()
    
    # Implementation details...
    
    return {'statusCode': 200, 'message': 'Forecast results processed'}
```

### Local Development with AWS Services

#### Development Environment Setup

```bash
# Install AWS CLI and SAM CLI for local testing
brew install awscli aws-sam-cli

# Configure AWS profile
aws configure --profile gxo-signify-dev
# AWS Access Key ID: [your-dev-access-key]
# AWS Secret Access Key: [your-dev-secret-key]  
# Default region name: us-east-1
# Default output format: json

# Install LocalStack for local AWS service emulation
pip install localstack
docker run -d -p 4566:4566 localstack/localstack

# Configure local environment variables
# .env.local
AWS_PROFILE=gxo-signify-dev
AWS_REGION=us-east-1
LOCALSTACK_ENDPOINT=http://localhost:4566  # For local development
S3_BUCKET=gxo-signify-pilot-dev
USE_LOCALSTACK=true  # Toggle for local vs AWS development
```

#### Local AWS Service Testing

```python
# Development utilities for local AWS testing
class LocalAWSServices:
    def __init__(self, use_localstack: bool = False):
        if use_localstack:
            self.endpoint_url = 'http://localhost:4566'
        else:
            self.endpoint_url = None
            
        self.s3_client = boto3.client('s3', endpoint_url=self.endpoint_url)
        self.glue_client = boto3.client('glue', endpoint_url=self.endpoint_url)
    
    def setup_local_s3_bucket(self):
        """Create local S3 bucket for development"""
        try:
            self.s3_client.create_bucket(Bucket='gxo-signify-pilot-dev')
            print("Local S3 bucket created successfully")
        except Exception as e:
            print(f"Bucket already exists or error: {e}")
    
    def upload_sample_data(self):
        """Upload sample CSV data for local testing"""
        # Implementation for uploading sample data
        pass
```

---

## Integration Requirements

### AWS Data Integration

- **IR-001:** S3 secure upload interface for CSV data with event-driven processing
- **IR-002:** Real-time data ingestion via S3 events triggering Lambda functions
- **IR-003:** AWS Glue Data Quality for automated validation and error reporting
- **IR-004:** EventBridge schedules for automated data refresh workflows
- **IR-005:** Step Functions orchestration for complex data pipeline workflows

### AWS Security & Access Management

- **IR-006:** IAM roles and policies for AWS service access control
- **IR-007:** S3 bucket policies for secure data access
- **IR-008:** CloudTrail logging for AWS service access audit trails
- **IR-009:** Basic web access for pilot phase (no authentication for dashboard)
- **IR-010:** AWS service integration logging via CloudWatch

### External System Integration

- **IR-011:** S3 export capabilities to Excel, PDF, CSV formats
- **IR-012:** REST API Gateway for third-party system integration
- **IR-013:** SNS notifications for critical insights and anomaly alerts
- **IR-014:** SES email alerts for high-priority insights
- **IR-015:** Lambda function integration points for custom business logic

---

## Pilot-Focused Requirements

### Response Time Targets

- **Dashboard loading:** Functional performance (no specific targets)
- **Forecast generation:** Reasonable processing time for dataset size
- **Insight drill-down:** Interactive response times
- **Data export:** Standard export functionality

### Functionality Targets

- **User Experience:** Intuitive interface requiring minimal training
- **Data Processing:** Handle Signify dataset volumes effectively
- **Insight Quality:** Demonstrate clear business value through insights
- **Explainability:** Complete traceability from insights to source data

### Reliability Requirements

- **Basic Uptime:** Standard AWS Amplify and Aurora availability
- **Error Handling:** Graceful error messages and recovery
- **Data Integrity:** Accurate data processing and calculations
- **GitHub Integration:** Version-controlled codebase with clear commit history

---

## Security Requirements

### Data Protection

- **Basic Encryption:** Standard AWS encryption for data at rest and in transit
- **Access Control:** Public access for pilot with basic logging
- **Data Handling:** Secure data processing and storage practices
- **Version Control:** Secure GitHub repository with proper access controls

### Compliance

- **Audit Trails:** Basic logging for pilot validation and feedback
- **Data Retention:** Standard Aurora backup and retention
- **Development Security:** Secure coding practices and dependency management
- **AWS Security:** Leverage AWS security best practices and services

---

## Development Workflow

### Local Development on MacBook

#### Initial Setup

```bash
# Clone repository
git clone https://github.com/1cloudhub/gxo-forecasting.git
cd gxo-forecasting

# Setup backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Setup database
brew install postgresql
brew services start postgresql
createdb gxo_forecasting_dev
alembic upgrade head

# Setup frontend
cd ../frontend
npm install
npm run dev

# Start development servers
# Terminal 1: Backend
cd backend && uvicorn main:app --reload

# Terminal 2: Frontend  
cd frontend && npm run dev
```

#### Daily Development Cycle

1. **Pull latest changes:** `git pull origin main`
2. **Create feature branch:** `git checkout -b feature/insight-cards`
3. **Develop with hot reload:** Both frontend and backend auto-refresh
4. **Test locally:** Verify functionality works end-to-end
5. **Commit and push:** `git push origin feature/insight-cards`
6. **Create PR:** Submit for review before merging

### AWS Production Deployment

#### Amplify Gen 2 Setup

```yaml
# amplify.yml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - cd frontend
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: frontend/dist
    files:
      - '**/*'
  cache:
    paths:
      - frontend/node_modules/**/*
```

#### Backend Deployment Options

**Option 1: AWS Lambda + API Gateway**

```yaml
# .github/workflows/deploy-backend.yml
name: Deploy Backend to AWS Lambda
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Lambda
        run: |
          cd backend
          pip install -r requirements.txt -t .
          zip -r deployment.zip .
          aws lambda update-function-code --function-name gxo-forecasting-api
```

**Option 2: AWS ECS Fargate**

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment-Specific Configurations

#### Local Development Features

- **Hot Reload:** Instant code changes reflection
- **Debug Mode:** Verbose logging and error traces
- **Sample Data:** Lightweight test datasets
- **Local File Upload:** Direct file system access for data ingestion
- **Development UI:** Additional debug panels and tools

#### Production Features

- **Performance Optimization:** Minified builds and caching
- **Error Handling:** User-friendly error messages
- **Monitoring:** CloudWatch logs and metrics
- **Security:** Environment variable injection, HTTPS only
- **Scalability:** Auto-scaling backend services

### Cross-Environment Data Management

#### Database Schema Management

```bash
# Create new migration (local)
cd backend
alembic revision --autogenerate -m "Add insights table"

# Apply to local database
alembic upgrade head

# Deploy to production (via GitHub Actions)
git push origin main  # Triggers production migration
```

#### Data Synchronization

```python
# scripts/sync_data.py - Sanitize production data for local development
def sync_production_to_local():
    """Download sanitized production data for local development"""
    # Remove sensitive information
    # Apply data masking
    # Import to local PostgreSQL
```

### Testing Across Environments

#### Local Testing

- **Unit Tests:** `pytest backend/tests/`
- **Frontend Tests:** `npm test` in frontend directory
- **Integration Tests:** Full stack testing with local database
- **Manual Testing:** Browser testing on localhost

#### Production Validation

- **Staging Environment:** Optional AWS staging environment
- **Production Smoke Tests:** Automated tests after deployment
- **Monitoring Alerts:** CloudWatch alarms for production issues
- **Rollback Procedures:** Automatic rollback on deployment failures

---

## Deployment Architecture

### Local Development Environment (MacBook)

- **Frontend:** Vite dev server running locally with hot reload
- **Backend:** FastAPI with uvicorn development server
- **Database:** PostgreSQL via Homebrew or Docker Desktop
- **Development Tools:**
  - Node.js and npm/yarn for frontend dependencies
  - Python virtual environment (venv/conda) for backend
  - VS Code or preferred IDE with TypeScript/Python extensions
  - Postman/Thunder Client for API testing

### Local Environment Setup

```bash
# Frontend setup
npm create vite@latest gxo-forecasting --template react-ts
cd gxo-forecasting
npm install

# Backend setup
python -m venv venv
source venv/bin/activate  # On macOS
pip install fastapi uvicorn pandas numpy scikit-learn

# Database setup (via Homebrew)
brew install postgresql
brew services start postgresql
createdb gxo_forecasting_dev
```

### Production Environment (AWS)

- **Frontend Hosting:** AWS Amplify Gen 2 for React application
- **Backend Deployment:** AWS Lambda + API Gateway or ECS Fargate
- **Database:** AWS Aurora PostgreSQL managed service
- **Static Assets:** Amplify hosting with CloudFront CDN
- **Environment Variables:** AWS Systems Manager Parameter Store

### Environment Configuration Management

#### Local Development (macOS)

```bash
# .env.local (frontend)
VITE_API_BASE_URL=http://localhost:8000
VITE_ENVIRONMENT=development

# .env (backend)
DATABASE_URL=postgresql://localhost:5432/gxo_forecasting_dev
ENVIRONMENT=development
DEBUG=true
```

#### Production (AWS)

```bash
# Amplify Environment Variables
VITE_API_BASE_URL=https://api.gxo-forecasting.com
VITE_ENVIRONMENT=production

# Backend Environment (Lambda/ECS)
DATABASE_URL=postgresql://aurora-endpoint/gxo_forecasting
ENVIRONMENT=production
DEBUG=false
AWS_REGION=us-east-1
```

### Deployment Pipeline

#### Development Workflow (MacBook)

```bash
# Daily development cycle
git checkout -b feature/new-insight-component
# Develop locally with hot reload
npm run dev          # Frontend (localhost:3000)
uvicorn main:app --reload  # Backend (localhost:8000)
# Test locally
git add . && git commit -m "Add new insight component"
git push origin feature/new-insight-component
# Create PR on GitHub
```

#### Production Deployment (AWS)

```bash
# Automated deployment via GitHub Actions
git checkout main
git merge feature/new-insight-component
git push origin main
# Triggers:
# 1. Amplify Gen 2 auto-deploys frontend
# 2. GitHub Actions deploys backend to AWS
# 3. Database migrations run automatically
```

### Cross-Environment Considerations

#### Database Management

- **Local:** PostgreSQL with sample/test data for development
- **Production:** Aurora PostgreSQL with production data
- **Migrations:** Alembic for schema versioning across environments
- **Data Sync:** Scripts to sanitize and sync production data to local (if needed)

#### API Configuration

- **Local Development:** Direct database connections, verbose logging
- **Production:** Connection pooling, structured logging, monitoring
- **CORS Configuration:** Localhost for dev, Amplify domain for production
- **Error Handling:** Development errors show full stack, production shows user-friendly messages

---

## Success Metrics & KPIs

### Technical Performance KPIs

- **System Functionality:** All core features working as designed
- **Data Processing:** Successful processing of Signify datasets
- **Insight Generation:** All four insight categories producing valuable outputs
- **Explainability:** Complete drill-down capability from insights to source data

### User Adoption KPIs

- **Pilot User Engagement:** Regular usage by GXO and Signify pilot teams
- **Feature Utilization:** Active use of forecasting and insight features
- **User Feedback:** Positive feedback on usability and business value
- **Training Effectiveness:** Users able to navigate and use system independently

### Business Impact KPIs

- **Insight Quality:** Actionable insights leading to operational improvements
- **Forecast Accuracy:** Reliable predictions for operational planning
- **Decision Support:** Evidence of insights influencing business decisions
- **Strategic Value:** Clear demonstration of enhanced GXO-Signify partnership value

---

## Risk Management

### Technical Risks

- **Data Quality Issues:** Comprehensive validation and cleansing procedures
- **Performance Bottlenecks:** Load testing and optimization protocols
- **Integration Complexity:** Phased integration with fallback options
- **Security Vulnerabilities:** Regular security audits and updates

### Business Risks

- **User Adoption Resistance:** Extensive training and change management
- **Accuracy Expectations:** Conservative targets with continuous improvement
- **Stakeholder Alignment:** Regular communication and feedback loops
- **Scope Creep:** Defined change management process

---

## Risk Management

### Technical Risks

- **Data Quality Issues:** Comprehensive validation and cleansing procedures
- **Integration Complexity:** Phased development with regular testing
- **AWS Service Dependencies:** Leverage managed services for reliability
- **GitHub Code Management:** Proper branching and code review processes

### Business Risks

- **User Adoption Resistance:** Focus on intuitive design and clear value demonstration
- **Accuracy Expectations:** Set realistic expectations with continuous improvement
- **Stakeholder Alignment:** Regular demos and feedback collection
- **Pilot Scope Management:** Clear feature prioritization and deliverable focus

---

## Development Approach

### Core Focus Areas

1. **AWS-Native First:** Leverage managed services to reduce development and maintenance overhead
2. **Business Impact:** Focus on demonstrable value to GXO-Signify partnership through rapid insights
3. **Hybrid Development:** Local development with AWS service integration for rapid iteration
4. **Infrastructure as Code:** CloudFormation/CDK for reproducible AWS environments
5. **Code Quality:** Maintainable, well-documented code with AWS best practices

### AWS-Enhanced Development Workflow

#### Local Development Environment

- **Frontend:** React/TypeScript with Vite hot reload
- **Backend:** FastAPI with local PostgreSQL + AWS SDK integration
- **AWS Services:** LocalStack for local AWS service emulation during development
- **Data Pipeline:** Local CSV processing with AWS CLI for S3 integration testing

#### GitHub Development Workflow

- **Repository Structure:** Monorepo with frontend/, backend/, infrastructure/, and aws-services/ directories
- **Branch Strategy:** Feature branches with automated AWS deployment previews
- **CI/CD Pipeline:** GitHub Actions for automated testing and AWS deployment
- **Documentation:** Comprehensive README with AWS service setup instructions
- **Issue Tracking:** GitHub Issues integrated with AWS service monitoring alerts

#### AWS Development Lifecycle

```bash
# 1. Local Feature Development
git checkout -b feature/aws-forecast-integration
# Develop locally with LocalStack
# Test AWS integrations with dev AWS account

# 2. AWS Service Configuration
aws cloudformation deploy --template-file infrastructure/forecast-resources.yaml
# Deploy AWS resources for feature

# 3. Integration Testing
# Upload test data to S3 dev bucket
# Trigger Step Functions workflow
# Validate end-to-end functionality

# 4. Deployment
git push origin feature/aws-forecast-integration
# GitHub Actions deploys to AWS staging
# Manual promotion to production after validation
```

---

## Conclusion

This updated SRS provides a comprehensive, AWS-native technical specification for building the GXO Signify Forecasting Solution. The integration of managed AWS services (Glue, Forecast, Lookout for Metrics) with the existing React/FastAPI architecture creates a powerful, scalable solution that reduces development complexity while delivering superior forecasting capabilities and business insights.

**Key AWS Integration Benefits:**

- **Reduced Development Time:** Amazon Forecast eliminates custom ML model development
- **Superior Accuracy:** AWS AutoML capabilities provide best-in-class forecasting models
- **Automated Operations:** Step Functions orchestrate complex data pipelines
- **Built-in Monitoring:** CloudWatch and X-Ray provide comprehensive observability
- **Scalable Architecture:** AWS managed services handle scale automatically

**Next Steps:**

1. AWS environment setup with S3, Glue, Forecast, and Step Functions
2. GitHub repository configuration with AWS integration structure
3. LocalStack development environment for local AWS service testing
4. Infrastructure as Code deployment via CloudFormation
5. Data pipeline implementation starting with Glue ETL jobs
6. Amazon Forecast dataset creation using existing Signify CSV data
