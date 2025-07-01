import { api } from './api'

export interface DashboardKPIs {
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
  trend_direction: 'up' | 'down' | 'stable'
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

export const kpiService = {
  // Dashboard KPIs
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const response = await api.get('/api/v1/kpis/dashboard')
    return response.data
  },

  // KPI Trends
  async getKPITrends(
    metric: string, 
    timePeriod: string = '90d',
    granularity: string = 'daily'
  ): Promise<KPITrend> {
    const response = await api.get(`/api/v1/kpis/trends/${metric}`, {
      params: { time_period: timePeriod, granularity }
    })
    return response.data
  },

  // Forecast Accuracy KPIs
  async getForecastAccuracyKPIs(
    timePeriod: string = '30d',
    breakdown: string = 'daily'
  ): Promise<ForecastAccuracyKPIs> {
    const response = await api.get('/api/v1/kpis/forecast-accuracy', {
      params: { time_period: timePeriod, breakdown }
    })
    return response.data
  },

  // Efficiency Metrics
  async getEfficiencyMetrics(): Promise<EfficiencyMetrics> {
    const response = await api.get('/api/v1/kpis/efficiency-metrics')
    return response.data
  },

  // Business Impact Metrics
  async getBusinessImpactMetrics(): Promise<BusinessImpactMetrics> {
    const response = await api.get('/api/v1/kpis/business-impact')
    return response.data
  },

  // Anomaly Detection
  async getAnomalyDetectionKPIs(): Promise<{
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
  }> {
    const response = await api.get('/api/v1/kpis/anomaly-detection')
    return response.data
  },

  // KPI Operations
  async refreshKPIs(): Promise<{
    message: string
    refresh_id: string
    estimated_completion: string
    metrics_updated: number
    status: string
  }> {
    const response = await api.post('/api/v1/kpis/refresh')
    return response.data
  },

  // KPI Export
  async exportKPIReport(
    format: 'json' | 'csv' | 'pdf' = 'json',
    timePeriod: string = '30d'
  ): Promise<any> {
    const response = await api.get('/api/v1/kpis/export', {
      params: { format, time_period: timePeriod },
      responseType: format === 'json' ? 'json' : 'blob'
    })
    return response.data
  }
}