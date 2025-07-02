"""
GXO Signify Forecasting API
Main FastAPI application with ML-powered logistics forecasting
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import time
import uuid
import os
from typing import Dict, Any

from app.api.v1 import forecasts, insights, kpis, export, strategic_planning, commercial_insights
from app.core.config import settings

# Initialize FastAPI app
app = FastAPI(
    title="GXO Signify Forecasting API",
    description="Advanced logistics forecasting with strategic planning and commercial intelligence",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Add middleware with debug CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Temporarily allow all origins for debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)

# Request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())
    request.state.request_id = request_id
    
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

# Health check endpoints
@app.get("/health")
async def health_check():
    """System health check"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "environment": settings.ENVIRONMENT,
        "version": "1.0.0"
    }

@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check with service dependencies"""
    try:
        # Check AWS services connectivity
        import boto3
        
        health_status = {
            "api": "healthy",
            "aws_credentials": "checking",
            "s3_access": "checking",
            "forecast_service": "checking"
        }
        
        # Test AWS credentials
        try:
            sts = boto3.client('sts')
            sts.get_caller_identity()
            health_status["aws_credentials"] = "healthy"
        except Exception as e:
            health_status["aws_credentials"] = f"error: {str(e)[:100]}"
        
        # Test S3 access
        try:
            s3 = boto3.client('s3')
            s3.head_bucket(Bucket=settings.S3_BUCKET_NAME)
            health_status["s3_access"] = "healthy"
        except Exception as e:
            health_status["s3_access"] = f"error: {str(e)[:100]}"
        
        # Test Forecast service
        try:
            forecast = boto3.client('forecast')
            forecast.list_dataset_groups(MaxResults=1)
            health_status["forecast_service"] = "healthy"
        except Exception as e:
            health_status["forecast_service"] = f"error: {str(e)[:100]}"
        
        overall_status = "healthy" if all(
            status == "healthy" for status in health_status.values()
        ) else "degraded"
        
        return {
            "status": overall_status,
            "services": health_status,
            "timestamp": time.time(),
            "environment": settings.ENVIRONMENT
        }
        
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": time.time()
            }
        )

# Include API routers
app.include_router(
    forecasts.router,
    prefix="/api/v1/forecasts",
    tags=["forecasts"]
)

app.include_router(
    insights.router,
    prefix="/api/v1/insights", 
    tags=["insights"]
)

app.include_router(
    kpis.router,
    prefix="/api/v1/kpis",
    tags=["kpis"]
)

app.include_router(
    export.router,
    prefix="/api/v1/export",
    tags=["export"]
)

app.include_router(
    strategic_planning.router,
    prefix="/api/v1/strategic",
    tags=["strategic-planning"]
)

app.include_router(
    commercial_insights.router,
    prefix="/api/v1/commercial",
    tags=["commercial-insights"]
)

# Root endpoint
@app.get("/")
async def root():
    """API information and links"""
    return {
        "name": "GXO Signify Forecasting API",
        "version": "1.0.0",
        "description": "ML-powered logistics forecasting and insights",
        "environment": settings.ENVIRONMENT,
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "redoc": "/redoc",
            "openapi": "/openapi.json"
        },
        "api_routes": {
            "forecasts": "/api/v1/forecasts",
            "insights": "/api/v1/insights",
            "kpis": "/api/v1/kpis",
            "export": "/api/v1/export",
            "strategic_planning": "/api/v1/strategic",
            "commercial_insights": "/api/v1/commercial"
        }
    }

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled errors"""
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "request_id": request_id,
            "detail": str(exc) if settings.DEBUG else "An unexpected error occurred"
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )