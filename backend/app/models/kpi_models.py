"""
KPI Database Models
SQLAlchemy models for storing KPI calculations and historical tracking
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, JSON, Index, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

Base = declarative_base()

class ForecastAccuracyKPI(Base):
    """Store forecast accuracy KPI calculations"""
    __tablename__ = "forecast_accuracy_kpis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calculation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    time_period_days = Column(Integer, nullable=False)
    
    # Accuracy Metrics
    mape = Column(Float, nullable=False)
    wape = Column(Float, nullable=False)
    bias = Column(Float, nullable=False)
    rmse = Column(Float, nullable=False)
    
    # Additional Metrics
    sample_size = Column(Integer, nullable=False)
    accuracy_grade = Column(String(2), nullable=False)
    improvement_vs_previous = Column(Float, nullable=True)
    
    # Analysis Details
    records_analyzed = Column(Integer, nullable=False)
    unique_skus = Column(Integer, nullable=False)
    
    # Confidence Intervals (JSON)
    confidence_intervals = Column(JSON, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes for efficient querying
    __table_args__ = (
        Index('idx_forecast_accuracy_date', 'calculation_date'),
        Index('idx_forecast_accuracy_period', 'time_period_days'),
        Index('idx_forecast_accuracy_grade', 'accuracy_grade'),
    )

class SKUPerformanceKPI(Base):
    """Store SKU-level performance metrics"""
    __tablename__ = "sku_performance_kpis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calculation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    time_period_days = Column(Integer, nullable=False)
    
    # SKU Information
    sku_id = Column(String(100), nullable=False)
    sku_category = Column(String(100), nullable=True)
    
    # Performance Metrics
    forecast_accuracy = Column(Float, nullable=False)
    forecast_error = Column(Float, nullable=False)
    volume_forecast = Column(Float, nullable=False)
    actual_volume = Column(Float, nullable=False)
    error_percentage = Column(Float, nullable=False)
    bias = Column(Float, nullable=False)
    
    # Trend Analysis
    trend_direction = Column(String(20), nullable=False)
    velocity_change = Column(Float, nullable=True)
    
    # Historical Performance (JSON)
    historical_metrics = Column(JSON, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_sku_performance_date_sku', 'calculation_date', 'sku_id'),
        Index('idx_sku_performance_error', 'forecast_error'),
        Index('idx_sku_performance_category', 'sku_category'),
    )

class TruckUtilizationKPI(Base):
    """Store truck utilization metrics"""
    __tablename__ = "truck_utilization_kpis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calculation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Utilization Metrics
    current_utilization = Column(Float, nullable=False)
    seven_day_average = Column(Float, nullable=False)
    improvement_vs_baseline = Column(Float, nullable=False)
    peak_utilization = Column(Float, nullable=False)
    utilization_variance = Column(Float, nullable=False)
    
    # Targets and Baselines
    baseline_utilization = Column(Float, nullable=False, default=75.0)
    target_utilization = Column(Float, nullable=False, default=85.0)
    
    # Trend Analysis
    trend_direction = Column(String(20), nullable=False)
    monthly_trend = Column(JSON, nullable=True)
    
    # Historical Data (JSON)
    historical_trend = Column(JSON, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_truck_util_date', 'calculation_date'),
        Index('idx_truck_util_current', 'current_utilization'),
    )

class InventoryDOHKPI(Base):
    """Store Days of Inventory on Hand metrics"""
    __tablename__ = "inventory_doh_kpis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calculation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # SKU Information
    sku_id = Column(String(100), nullable=False)
    sku_group = Column(String(100), nullable=True)
    
    # Inventory Metrics
    current_inventory = Column(Float, nullable=False)
    avg_daily_demand = Column(Float, nullable=False)
    days_of_inventory = Column(Float, nullable=False)
    
    # Status and Classification
    status = Column(String(20), nullable=False)  # low, normal, high, excess, stockout
    recommended_action = Column(String(200), nullable=True)
    
    # Risk Assessment
    stockout_risk = Column(Float, nullable=True)
    excess_risk = Column(Float, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_inventory_doh_date_sku', 'calculation_date', 'sku_id'),
        Index('idx_inventory_doh_status', 'status'),
        Index('idx_inventory_doh_days', 'days_of_inventory'),
    )

class InventoryHealthSummary(Base):
    """Store overall inventory health summaries"""
    __tablename__ = "inventory_health_summaries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calculation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Summary Metrics
    average_doh = Column(Float, nullable=False)
    median_doh = Column(Float, nullable=False)
    skus_analyzed = Column(Integer, nullable=False)
    inventory_health_score = Column(Float, nullable=False)
    
    # Status Counts
    low_inventory_count = Column(Integer, nullable=False, default=0)
    excess_inventory_count = Column(Integer, nullable=False, default=0)
    stockout_count = Column(Integer, nullable=False, default=0)
    optimal_range_count = Column(Integer, nullable=False, default=0)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_inventory_health_date', 'calculation_date'),
        Index('idx_inventory_health_score', 'inventory_health_score'),
    )

class OTIFPerformanceKPI(Base):
    """Store On-Time In-Full performance metrics"""
    __tablename__ = "otif_performance_kpis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calculation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    time_period_days = Column(Integer, nullable=False)
    
    # OTIF Metrics
    overall_otif_percentage = Column(Float, nullable=False)
    on_time_percentage = Column(Float, nullable=False)
    in_full_percentage = Column(Float, nullable=False)
    total_deliveries = Column(Integer, nullable=False)
    
    # Performance Analysis
    target_otif = Column(Float, nullable=False, default=95.0)
    performance_vs_target = Column(Float, nullable=False)
    trend_direction = Column(String(20), nullable=False)
    
    # Root Cause Analysis (JSON)
    root_cause_analysis = Column(JSON, nullable=True)
    monthly_trend = Column(JSON, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_otif_date', 'calculation_date'),
        Index('idx_otif_percentage', 'overall_otif_percentage'),
    )

class AlertKPI(Base):
    """Store KPI alerts and notifications"""
    __tablename__ = "kpi_alerts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    alert_id = Column(String(100), nullable=False, unique=True)
    
    # Alert Information
    alert_type = Column(String(50), nullable=False)
    severity = Column(String(20), nullable=False)  # low, medium, high, critical
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    
    # Metric Information
    current_value = Column(Float, nullable=True)
    threshold = Column(Float, nullable=True)
    metric_name = Column(String(100), nullable=True)
    
    # Recommendations and Actions
    recommendation = Column(Text, nullable=False)
    estimated_impact = Column(String(200), nullable=True)
    affected_skus = Column(JSON, nullable=True)
    
    # Status and Resolution
    status = Column(String(20), nullable=False, default='active')  # active, acknowledged, resolved
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_alerts_type_severity', 'alert_type', 'severity'),
        Index('idx_alerts_status', 'status'),
        Index('idx_alerts_created', 'created_at'),
    )

class ThroughputComparisonKPI(Base):
    """Store throughput comparison metrics"""
    __tablename__ = "throughput_comparison_kpis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calculation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    analysis_date = Column(DateTime, nullable=False)
    time_period_days = Column(Integer, nullable=False)
    
    # Site Information
    site_id = Column(String(100), nullable=False)
    sku_group = Column(String(100), nullable=True)
    
    # Throughput Metrics
    forecasted_throughput = Column(Float, nullable=False)
    actual_throughput = Column(Float, nullable=False)
    variance_percentage = Column(Float, nullable=False)
    accuracy_percentage = Column(Float, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_throughput_date_site', 'calculation_date', 'site_id'),
        Index('idx_throughput_accuracy', 'accuracy_percentage'),
        Index('idx_throughput_variance', 'variance_percentage'),
    )

class LaborForecastKPI(Base):
    """Store labor forecast vs actual metrics"""
    __tablename__ = "labor_forecast_kpis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calculation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    analysis_date = Column(DateTime, nullable=False)
    
    # Location Information
    site_id = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    
    # Labor Metrics
    forecasted_hours = Column(Float, nullable=False)
    actual_hours = Column(Float, nullable=False)
    forecasted_headcount = Column(Integer, nullable=False)
    actual_headcount = Column(Integer, nullable=False)
    
    # Performance Metrics
    productivity_rate = Column(Float, nullable=False)
    efficiency_percentage = Column(Float, nullable=False)
    overtime_hours = Column(Float, nullable=False, default=0.0)
    variance_hours = Column(Float, nullable=False)
    cost_variance = Column(Float, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_labor_date_site_dept', 'calculation_date', 'site_id', 'department'),
        Index('idx_labor_efficiency', 'efficiency_percentage'),
        Index('idx_labor_variance', 'variance_hours'),
    )

class DockToStockKPI(Base):
    """Store dock-to-stock processing time metrics"""
    __tablename__ = "dock_to_stock_kpis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calculation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Location Information
    site_id = Column(String(100), nullable=False)
    sku_group = Column(String(100), nullable=False)
    
    # Processing Metrics
    average_dock_to_stock_hours = Column(Float, nullable=False)
    median_dock_to_stock_hours = Column(Float, nullable=False)
    target_dock_to_stock_hours = Column(Float, nullable=False)
    performance_vs_target = Column(Float, nullable=False)
    on_time_percentage = Column(Float, nullable=False)
    volume_processed = Column(Integer, nullable=False)
    improvement_opportunity = Column(Float, nullable=False)
    
    # Bottleneck Analysis (JSON)
    bottleneck_stages = Column(JSON, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_dock_to_stock_date_site', 'calculation_date', 'site_id'),
        Index('idx_dock_to_stock_performance', 'performance_vs_target'),
        Index('idx_dock_to_stock_hours', 'average_dock_to_stock_hours'),
    )

class PickRateKPI(Base):
    """Store pick rate performance metrics"""
    __tablename__ = "pick_rate_kpis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calculation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    shift_date = Column(DateTime, nullable=False)
    
    # Location and Shift Information
    site_id = Column(String(100), nullable=False)
    shift_type = Column(String(20), nullable=False)  # day, evening, night, weekend
    
    # Pick Metrics
    total_picks = Column(Integer, nullable=False)
    total_hours = Column(Float, nullable=False)
    picks_per_hour = Column(Float, nullable=False)
    target_pick_rate = Column(Float, nullable=False)
    performance_vs_target = Column(Float, nullable=False)
    accuracy_percentage = Column(Float, nullable=False)
    error_count = Column(Integer, nullable=False)
    team_size = Column(Integer, nullable=False)
    productivity_score = Column(Float, nullable=False)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_pick_rate_date_site_shift', 'calculation_date', 'site_id', 'shift_type'),
        Index('idx_pick_rate_performance', 'performance_vs_target'),
        Index('idx_pick_rate_productivity', 'productivity_score'),
    )

class ConsolidationOpportunityKPI(Base):
    """Store truck consolidation opportunity metrics"""
    __tablename__ = "consolidation_opportunity_kpis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    calculation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Route Information
    route_id = Column(String(100), nullable=False)
    origin_site = Column(String(100), nullable=False)
    destination_site = Column(String(100), nullable=False)
    
    # Consolidation Metrics
    current_trucks = Column(Integer, nullable=False)
    recommended_trucks = Column(Integer, nullable=False)
    consolidation_potential = Column(Integer, nullable=False)
    volume_utilization = Column(Float, nullable=False)
    weight_utilization = Column(Float, nullable=False)
    
    # Financial Impact
    cost_savings_potential = Column(Float, nullable=False)
    implementation_cost = Column(Float, nullable=True)
    roi_percentage = Column(Float, nullable=True)
    
    # Environmental Impact (JSON)
    environmental_impact = Column(JSON, nullable=True)
    
    # Implementation Details
    implementation_difficulty = Column(String(20), nullable=False)  # easy, medium, hard
    priority_score = Column(Float, nullable=False)
    estimated_implementation_weeks = Column(Integer, nullable=True)
    
    # Status Tracking
    status = Column(String(20), nullable=False, default='identified')  # identified, planned, in_progress, completed
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_consolidation_date_route', 'calculation_date', 'route_id'),
        Index('idx_consolidation_savings', 'cost_savings_potential'),
        Index('idx_consolidation_priority', 'priority_score'),
        Index('idx_consolidation_status', 'status'),
    )

class KPICalculationLog(Base):
    """Log all KPI calculation runs for auditing and debugging"""
    __tablename__ = "kpi_calculation_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Calculation Information
    calculation_type = Column(String(100), nullable=False)  # forecast_accuracy, truck_utilization, etc.
    calculation_start = Column(DateTime, nullable=False)
    calculation_end = Column(DateTime, nullable=True)
    calculation_duration_seconds = Column(Float, nullable=True)
    
    # Parameters (JSON)
    calculation_parameters = Column(JSON, nullable=True)
    
    # Results Summary
    records_processed = Column(Integer, nullable=False, default=0)
    records_created = Column(Integer, nullable=False, default=0)
    records_updated = Column(Integer, nullable=False, default=0)
    
    # Status and Errors
    status = Column(String(20), nullable=False)  # running, completed, failed
    error_message = Column(Text, nullable=True)
    warnings = Column(JSON, nullable=True)
    
    # Data Quality Metrics
    data_completeness_score = Column(Float, nullable=True)
    data_freshness_hours = Column(Float, nullable=True)
    
    # Metadata
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    # Indexes
    __table_args__ = (
        Index('idx_calc_log_type_start', 'calculation_type', 'calculation_start'),
        Index('idx_calc_log_status', 'status'),
        Index('idx_calc_log_created', 'created_at'),
    )

# Relationship definitions for foreign keys (if needed in the future)
# For now, keeping models independent for flexibility

# Helper function to create all tables
def create_tables(engine):
    """Create all KPI tables in the database"""
    Base.metadata.create_all(engine)

# Helper function to get table names
def get_table_names():
    """Get list of all KPI table names"""
    return [
        'forecast_accuracy_kpis',
        'sku_performance_kpis', 
        'truck_utilization_kpis',
        'inventory_doh_kpis',
        'inventory_health_summaries',
        'otif_performance_kpis',
        'kpi_alerts',
        'throughput_comparison_kpis',
        'labor_forecast_kpis',
        'dock_to_stock_kpis',
        'pick_rate_kpis',
        'consolidation_opportunity_kpis',
        'kpi_calculation_logs'
    ]