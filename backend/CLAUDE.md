# Backend Engineering Context - GXO Signify API & KPI Engines

## 🐍 PYTHON/FASTAPI ARCHITECTURE

### Framework & Technology Stack

- **Framework**: FastAPI 0.104+ with Python 3.11
- **API Style**: RESTful with OpenAPI 3.0 documentation
- **Database**: Aurora PostgreSQL 15 + S3 Data Lake
- **ORM**: SQLAlchemy 2.0 with Alembic migrations
- **ML Services**: Amazon Forecast, AWS Lookout for Metrics
- **Task Queue**: AWS Step Functions for orchestration
- **Deployment**: AWS Lambda + API Gateway

### Project Structure

```
backend/
├── app/
│   ├── api/                    # API endpoints
│   │   ├── v1/
│   │   │   ├── forecasts.py   # Forecast endpoints
│   │   │   ├── insights.py    # Insight endpoints
│   │   │   ├── kpis.py        # KPI endpoints
│   │   │   └── export.py      # Export endpoints
│   │   └── dependencies.py    # Shared dependencies
│   ├── core/                   # Core configurations
│   │   ├── config.py          # Settings management
│   │   ├── security.py        # Security utilities
│   │   └── database.py        # Database connection
│   ├── models/                 # SQLAlchemy models
│   │   ├── forecast.py
│   │   ├── insight.py
│   │   └── kpi.py
│   ├── schemas/                # Pydantic schemas
│   │   ├── forecast.py
│   │   ├── insight.py
│   │   └── kpi.py
│   ├── services/               # Business logic
│   │   ├── forecast_service.py
│   │   ├── insight_service.py
│   │   └── aws_integration.py
│   └── aws_services/           # AWS service wrappers
│       ├── forecast.py         # Amazon Forecast
│       ├── lookout.py          # Lookout for Metrics
│       └── s3.py              # S3 operations
├── lambdas/                    # Lambda functions
│   ├── data_processor.py       # S3 event processing
│   ├── forecast_trigger.py     # Scheduled forecasting
│   └── kpi_calculator.py       # KPI calculations
├── kpi_engine/                 # Business logic engines
│   ├── forecast_accuracy.py    # Accuracy KPIs
│   ├── anomaly_detection.py    # Anomaly KPIs
│   └── logistics_efficiency.py # Efficiency KPIs
├── glue_jobs/                  # ETL scripts
│   ├── data_cleansing.py
│   └── feature_engineering.py
├── alembic/                    # Database migrations
├── tests/                      # Test suite
└── requirements.txt            # Dependencies
```

## 🚀 DEVELOPMENT COMMANDS

```bash
# Start development server
uvicorn app.main:app --reload --port 8000

# Run tests
pytest -v

# Run with coverage
pytest --cov=app --cov-report=html

# Type checking
mypy app/

# Code formatting
black .
isort .

# Linting
flake8 app/
pylint app/

# Database migrations
alembic init alembic
alembic revision --autogenerate -m "Description"
alembic upgrade head

# Generate API documentation
python -m app.generate_openapi
```

## 🎯 KPI ENGINE ARCHITECTURE

### 1. Forecast Accuracy Engine

```python
class ForecastAccuracyEngine:
    """Calculate MAPE, WAPE, Bias, and CI Coverage"""
    
    def calculate_forecast_kpis(self, 
                               forecast_data: pd.DataFrame,
                               actual_data: pd.DataFrame) -> Dict:
        - MAPE (Mean Absolute Percentage Error)
        - WAPE (Weighted Absolute Percentage Error)
        - Forecast Bias
        - Confidence Interval Coverage
        - SKU-level breakdown
        - Weekly accuracy trends
```

### 2. Anomaly Detection Engine

```python
class AnomalyDetectionEngine:
    """Process AWS Lookout for Metrics results"""
    
    def process_anomaly_results(self,
                               anomaly_detector_arn: str,
                               days_back: int = 7) -> Dict:
        - Total anomalies by severity
        - Volume spikes/drops categorization
        - Business impact calculation
        - Actionable alerts generation
```

### 3. Logistics Efficiency Engine

```python
class LogisticsEfficiencyEngine:
    """Calculate operational efficiency metrics"""
    
    def calculate_logistics_kpis(self,
                                historical_data: pd.DataFrame,
                                forecast_data: pd.DataFrame,
                                capacity_data: pd.DataFrame) -> Dict:
        - Fill rate calculation
        - Truck utilization optimization
        - Capacity planning insights
        - Efficiency scoring (A-F grade)
```

## 🔌 API ENDPOINTS

### Forecast Endpoints

```python
@router.get("/forecasts/")
async def get_forecasts(
    time_horizon: TimeHorizon = Query(...),
    sku_filter: Optional[List[str]] = Query(None),
    date_range: Optional[DateRange] = Depends(parse_date_range),
    db: Session = Depends(get_db)
) -> List[ForecastResponse]

@router.post("/forecasts/generate")
async def trigger_forecast_generation(
    request: ForecastRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
) -> ForecastJobResponse

@router.get("/forecasts/{forecast_id}/accuracy")
async def get_forecast_accuracy(
    forecast_id: str,
    db: Session = Depends(get_db)
) -> AccuracyMetricsResponse
```

### Insight Endpoints

```python
@router.get("/insights/")
async def get_insights(
    categories: Optional[List[InsightCategory]] = Query(None),
    priority: Optional[Priority] = Query(None),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    db: Session = Depends(get_db)
) -> InsightListResponse

@router.get("/insights/{insight_id}/explainability")
async def get_insight_explainability(
    insight_id: str,
    db: Session = Depends(get_db)
) -> ExplainabilityResponse
```

## 🗄️ DATABASE MODELS

### Core Tables

```sql
-- Forecasts table
CREATE TABLE forecasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku_id VARCHAR(50) NOT NULL,
    forecast_date DATE NOT NULL,
    horizon_days INTEGER NOT NULL,
    predicted_value DECIMAL(12,2) NOT NULL,
    confidence_lower DECIMAL(12,2),
    confidence_upper DECIMAL(12,2),
    predictor_arn VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_sku_date (sku_id, forecast_date)
);

-- Insights table
CREATE TABLE insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category insight_category_enum NOT NULL,
    priority priority_level_enum NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    impact_score DECIMAL(5,2),
    confidence_score DECIMAL(5,2),
    data_sources JSONB NOT NULL,
    methodology JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_category_priority (category, priority)
);

-- KPI metrics table
CREATE TABLE kpi_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name VARCHAR(100) NOT NULL,
    metric_value DECIMAL(12,4) NOT NULL,
    metric_unit VARCHAR(50),
    calculation_date DATE NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    INDEX idx_metric_date (metric_name, calculation_date)
);
```

## 🌐 AWS INTEGRATION

### Amazon Forecast Integration

```python
class AmazonForecastService:
    def __init__(self):
        self.forecast_client = boto3.client('forecast')
        self.forecastquery_client = boto3.client('forecastquery')
    
    async def create_predictor(self, dataset_group_arn: str) -> str:
        """Create AutoML predictor for 28-day forecast"""
        
    async def generate_forecast(self, predictor_arn: str) -> str:
        """Generate forecasts using trained model"""
        
    async def export_forecast_results(self, forecast_arn: str) -> str:
        """Export results to S3 for processing"""
```

### AWS Lookout for Metrics

```python
class LookoutMetricsService:
    def __init__(self):
        self.lookout_client = boto3.client('lookoutmetrics')
    
    async def create_anomaly_detector(self) -> str:
        """Setup anomaly detection for logistics metrics"""
        
    async def get_anomaly_insights(self, detector_arn: str) -> List[Dict]:
        """Retrieve and process anomaly results"""
```

## 🔐 SECURITY IMPLEMENTATION

### API Security

```python
# Rate limiting
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@app.get("/api/v1/forecasts")
@limiter.limit("100/minute")
async def get_forecasts():
    pass

# Request validation
from pydantic import BaseModel, validator

class ForecastRequest(BaseModel):
    sku_ids: List[str]
    time_horizon: TimeHorizon
    
    @validator('sku_ids')
    def validate_sku_ids(cls, v):
        if len(v) > 100:
            raise ValueError('Maximum 100 SKUs per request')
        return v
```

### AWS IAM Roles

```python
# Lambda execution role permissions
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
        }
    ]
}
```

## 🧪 TESTING STRATEGY

### Unit Tests

```python
# Test KPI calculations
def test_mape_calculation():
    engine = ForecastAccuracyEngine()
    forecast_data = pd.DataFrame({
        'sku': ['A', 'B'],
        'predicted_value': [100, 200],
        'actual_value': [110, 190]
    })
    result = engine.calculate_mape(forecast_data)
    assert result == pytest.approx(7.5, 0.1)
```

### Integration Tests

```python
# Test API endpoints
async def test_get_forecasts(client: TestClient):
    response = await client.get(
        "/api/v1/forecasts",
        params={"time_horizon": "7d"}
    )
    assert response.status_code == 200
    assert len(response.json()["forecasts"]) > 0
```

## 📊 PERFORMANCE OPTIMIZATION

### Database Optimization

- Connection pooling with `asyncpg`
- Prepared statements for repeated queries
- Materialized views for KPI aggregations
- Partitioning for time-series data

### Caching Strategy

```python
from functools import lru_cache
from redis import Redis

redis_client = Redis(host='localhost', port=6379)

@lru_cache(maxsize=128)
def get_forecast_from_cache(sku_id: str, horizon: str):
    key = f"forecast:{sku_id}:{horizon}"
    return redis_client.get(key)
```

### Async Processing

```python
# Background tasks for heavy computations
@router.post("/kpis/calculate")
async def trigger_kpi_calculation(
    background_tasks: BackgroundTasks
):
    background_tasks.add_task(
        calculate_all_kpis,
        start_date=date.today() - timedelta(days=30)
    )
    return {"status": "KPI calculation started"}
```

## 🚨 ERROR HANDLING

### Global Exception Handler

```python
@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

@app.exception_handler(AWSServiceError)
async def aws_exception_handler(request, exc):
    logger.error(f"AWS service error: {exc}")
    return JSONResponse(
        status_code=503,
        content={"detail": "Service temporarily unavailable"}
    )
```

## 📈 MONITORING & LOGGING

### Structured Logging

```python
import structlog

logger = structlog.get_logger()

logger.info(
    "forecast_generated",
    sku_id=sku_id,
    horizon=horizon,
    accuracy=accuracy,
    duration_ms=duration
)
```

### Metrics Collection

```python
from prometheus_client import Counter, Histogram

forecast_requests = Counter(
    'forecast_requests_total',
    'Total forecast requests'
)

request_duration = Histogram(
    'request_duration_seconds',
    'Request duration'
)
```

## 🐛 COMMON ISSUES & SOLUTIONS

### Database Connection Issues

```bash
# Check connection pool
SELECT count(*) FROM pg_stat_activity;

# Reset connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'gxo_forecasting';
```

### AWS Service Throttling

```python
# Implement exponential backoff
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
async def call_aws_service():
    pass
```

## 📚 BACKEND RESOURCES

- **FastAPI Docs**: <https://fastapi.tiangolo.com/>
- **SQLAlchemy 2.0**: <https://docs.sqlalchemy.org/>
- **AWS SDK (Boto3)**: <https://boto3.amazonaws.com/v1/documentation/>
- **Pandas**: <https://pandas.pydata.org/docs/>

---
*Backend Context - Last Updated: June 26, 2025*
*Optimized for: Python 3.11, FastAPI, AWS Services*
