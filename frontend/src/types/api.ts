// Comprehensive TypeScript interfaces matching backend response schemas
// Based on backend API endpoints in forecasts.py, kpis.py, and insights.py

// ====== COMMON TYPES ======
export type TimeHorizon = '1d' | '7d' | '14d' | '28d'
export type Priority = 'high' | 'medium' | 'low'
export type Status = 'operational' | 'degraded' | 'maintenance' | 'error'
export type TrendDirection = 'up' | 'down' | 'stable'
export type InsightCategory = 'operational_efficiency' | 'strategic_partnership' | 'commercial_opportunity' | 'risk_management'
export type InsightStatus = 'new' | 'reviewed' | 'implemented' | 'dismissed'

// ====== KPI INTERFACES ======
export interface KPIDashboard {
  forecast_accuracy: number
  truck_utilization_improvement: number
  cost_savings_percentage: number
  demand_prediction_accuracy: number
  report_date: string
  business_impact: {
    monthly_cost_savings: number
    improved_delivery_time: number
    reduced_inventory_holding: number
    customer_satisfaction_score: number
  }
}

export interface KPITrend {
  metric_name: string
  time_period: string
  values: Array<{
    date: string
    value: number
    target?: number
  }>
  trend_direction: TrendDirection
  improvement_percentage: number
}

export interface ForecastAccuracyKPIs {
  time_period: string
  breakdown: string
  overall_accuracy: number
  mape: number
  wape: number
  bias: number
  confidence_interval_coverage: number
  sku_level_breakdown: Array<{
    sku: string
    accuracy: number
    volume: number
  }>
  time_series: Array<{
    date: string
    accuracy: number
  }>
}

export interface EfficiencyMetrics {
  truck_utilization: {
    current_rate: number
    target_rate: number
    improvement_vs_baseline: number
    monthly_trend: Array<{
      month: string
      utilization: number
    }>
  }
  fill_rate: {
    current_rate: number
    target_rate: number
    sku_breakdown: Array<{
      sku: string
      fill_rate: number
    }>
  }
  capacity_planning: {
    peak_volume_prediction: number
    capacity_utilization: number
    optimization_opportunities: string[]
  }
  cost_efficiency: {
    cost_per_shipment: number
    savings_vs_baseline: number
    efficiency_grade: string
  }
}

export interface BusinessImpactMetrics {
  financial_impact: {
    monthly_cost_savings: number
    annual_projection: number
    roi_percentage: number
    payback_period_months: number
  }
  operational_impact: {
    delivery_time_improvement_days: number
    inventory_reduction_percentage: number
    capacity_optimization_percentage: number
    forecast_driven_decisions: number
  }
  customer_impact: {
    satisfaction_score: number
    on_time_delivery_improvement: number
    stockout_reduction_percentage: number
    service_level_improvement: number
  }
  strategic_insights: string[]
}

export interface AnomalyDetection {
  total_anomalies: number
  high_severity_anomalies: number
  medium_severity_anomalies: number
  low_severity_anomalies: number
  anomaly_categories: Array<{
    category: string
    count: number
  }>
  recent_alerts: Array<{
    id: string
    score: number
    metric: string
    detected_at: string
  }>
  impact_assessment: string
  status: string
}

// ====== FORECAST INTERFACES ======
export interface ForecastResponse {
  id: string
  sku_id: string
  warehouse_code: string
  forecast_date: string
  predicted_demand: number
  confidence_lower: number
  confidence_upper: number
  confidence_level: number
  model_version: string
  created_at: string
  metadata: Record<string, any>
}

export interface ForecastRequest {
  sku_ids?: string[]
  warehouse_codes?: string[]
  horizon_days: number
  confidence_level?: number
  include_metadata?: boolean
}

export interface ForecastSummary {
  total_items: number
  forecast_horizon: number
  confidence_intervals: string[]
  accuracy_metrics: Record<string, number>
  last_updated: string
}

export interface AccuracyMetricsResponse {
  start_date: string
  end_date: string
  overall_accuracy: number
  mape: number
  wape: number
  bias: number
  sku_level_metrics: Array<{
    sku_id: string
    accuracy: number
    mape: number
    wape: number
    bias: number
  }>
  time_series: Array<{
    date: string
    accuracy: number
  }>
}

// ====== INSIGHTS INTERFACES ======
export interface InsightResponse {
  id: string
  category: InsightCategory
  priority: Priority
  title: string
  description: string
  impact_score: number
  confidence_score: number
  created_at: string
  data_sources: string[]
  recommendations: string[]
  expected_benefit?: string
  status?: InsightStatus
  estimated_savings?: number
}

// Alias for compatibility
export type Insight = InsightResponse

export interface InsightDetail extends InsightResponse {
  detailed_analysis: {
    data_period: string
    samples_analyzed: number
    statistical_significance: number
    key_findings: string[]
  }
  explainability: {
    methodology: string
    confidence_factors: string[]
    limitations: string[]
  }
  implementation_roadmap: Array<{
    phase: string
    actions: string
    resources: string
  }>
}

export interface CategorySummary {
  [key: string]: {
    total_insights: number
    high_priority: number
    avg_impact_score: number
    key_themes: string[]
  }
}

export interface InsightStatistics {
  total_insights: number
  new_insights: number
  pending_review: number
  implemented: number
  dismissed: number
  avg_impact_score: number
  potential_monthly_savings: number
}

// ====== ANALYTICS INTERFACES ======
export interface AnalyticsData {
  id: string
  sku: string
  description: string
  forecast_accuracy: number
  volume_predicted: number
  volume_actual?: number
  demand_variance: number
  category: string
  priority: Priority
  last_updated: string
  confidence_score: number
}

export interface SKUPerformanceData {
  sku_id: string
  name: string
  category: string
  forecast_accuracy: number
  volume_trend: number
  confidence_score: number
  last_updated: string
}

export interface CategoryPerformance {
  category: string
  avg_accuracy: number
  sku_count: number
  total_volume: number
  trend_direction: TrendDirection
}

export interface ModelMetrics {
  overall_accuracy: number
  processing_time: number
  data_processing_rate: number
  confidence_score_avg: number
  r_squared: number
  mean_absolute_error: number
  root_mean_square_error: number
  data_completeness: number
  outlier_detection_rate: number
  feature_importance: Record<string, number>
}

export interface TrendData {
  date: string
  value: number
  metric: string
}

export interface AdvancedMetrics {
  model_diagnostics: {
    r_squared: number
    mean_absolute_error: number
    root_mean_square_error: number
  }
  data_quality: {
    data_completeness: number
    outlier_detection_rate: number
    feature_importance: Record<string, number>
  }
}

// ====== SYSTEM INTERFACES ======
export interface SystemStatus {
  service_name: string
  status: Status
  last_check: string
  uptime_percentage: number
  response_time_ms?: number
}

export interface DataFreshness {
  last_update: string
  next_scheduled_update: string
  data_age_hours: number
  sources_status: Record<string, 'fresh' | 'stale' | 'error'>
}

export interface SystemAlert {
  id: string
  title: string
  message: string
  severity: 'high' | 'medium' | 'low'
  timestamp: string
  source: string
  status: 'active' | 'resolved' | 'acknowledged'
}

export interface SystemConfiguration {
  refresh_intervals: Record<string, number>
  thresholds: Record<string, number>
  feature_flags: Record<string, boolean>
  data_retention_days: number
}

// ====== TABLE DATA INTERFACES (for UI components) ======
export interface KPIData {
  id: string
  metric: string
  current_value: number
  previous_value: number
  unit: string
  category: 'accuracy' | 'efficiency' | 'cost'
  trend: TrendDirection
  change_percentage: number
  target: number
  status: 'good' | 'warning' | 'error'
}

export interface InsightData {
  id: string
  title: string
  category: InsightCategory
  impact: number
  confidence: number
  description: string
  status: InsightStatus
  created_date: string
  priority: Priority
  estimated_savings?: number
}

// ====== API RESPONSE WRAPPERS ======
export interface ApiResponse<T> {
  data: T
  message?: string
  timestamp: string
  request_id?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
  has_next: boolean
  has_prev: boolean
}

export interface ErrorResponse {
  detail: string
  error_code?: string
  field_errors?: Record<string, string[]>
  timestamp: string
}

// ====== OPERATION RESPONSES ======
export interface RefreshResponse {
  message: string
  refresh_id: string
  estimated_completion: string
  status: 'processing' | 'completed' | 'failed'
  metrics_updated?: number
}

export interface ExportResponse {
  download_url?: string
  format: 'json' | 'csv' | 'pdf'
  file_size_bytes?: number
  expires_at?: string
}

// ====== FILTER INTERFACES ======
export interface AnalyticsFilters {
  timeRange?: string
  category?: string
  minAccuracy?: number
  showLowConfidence?: boolean
  limit?: number
  offset?: number
}

export interface InsightFilters {
  categories?: InsightCategory[]
  priority?: Priority
  status?: InsightStatus
  showOnlyNew?: boolean
  limit?: number
  offset?: number
}

export interface ForecastFilters {
  timeHorizon?: TimeHorizon
  skuFilter?: string[]
  warehouseFilter?: string[]
  confidenceThreshold?: number
  limit?: number
  offset?: number
}

// ====== CHART DATA INTERFACES ======
export interface ChartDataPoint {
  date: string
  value: number
  label?: string
  confidence_lower?: number
  confidence_upper?: number
}

export interface ForecastChartData extends ChartDataPoint {
  predicted_volume: number
  actual_volume?: number
  confidence_interval?: [number, number]
}

export interface ForecastDataPoint {
  date: string
  predicted_volume?: number
  confidence_lower?: number
  confidence_upper?: number
  day_of_week?: string
}

export interface TrendChartData extends ChartDataPoint {
  trend: TrendDirection
  change_percentage?: number
}

// ====== UTILITY TYPES ======
export type ApiError = {
  message: string
  status?: number
  code?: string
  timestamp: string
  isNetworkError?: boolean
  isServerError?: boolean
  isClientError?: boolean
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export type QueryOptions = {
  enabled?: boolean
  refetchInterval?: number | false
  retry?: number | boolean
  retryDelay?: number | ((attemptIndex: number) => number)
  staleTime?: number
  gcTime?: number
}