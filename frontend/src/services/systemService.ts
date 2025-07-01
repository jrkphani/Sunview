import { api } from './api'

export interface SystemStatus {
  service_name: string
  status: 'operational' | 'degraded' | 'maintenance' | 'error'
  last_check: string
  uptime_percentage: number
  response_time_ms?: number
}

export interface BusinessImpactMetrics {
  monthly_cost_savings: number
  annual_projection: number
  roi_percentage: number
  payback_period_months: number
  delivery_time_improvement_days: number
  inventory_reduction_percentage: number
  capacity_optimization_percentage: number
  satisfaction_score: number
  on_time_delivery_improvement: number
  stockout_reduction_percentage: number
  service_level_improvement: number
}

export interface OperationalMetrics {
  truck_utilization_rate: number
  truck_utilization_improvement: number
  fill_rate: number
  capacity_utilization: number
  cost_per_shipment: number
  cost_savings_percentage: number
  efficiency_grade: string
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

export interface DataFreshness {
  last_update: string
  next_scheduled_update: string
  data_age_hours: number
  sources_status: Record<string, 'fresh' | 'stale' | 'error'>
}

export const systemService = {
  // System Status
  async getSystemStatus(): Promise<SystemStatus[]> {
    const response = await api.get('/api/v1/system/status')
    return response.data
  },

  async getServiceHealth(serviceName?: string): Promise<SystemStatus | SystemStatus[]> {
    const endpoint = serviceName 
      ? `/api/v1/system/health/${serviceName}`
      : '/api/v1/system/health'
    const response = await api.get(endpoint)
    return response.data
  },

  // Business Impact Metrics
  async getBusinessImpactMetrics(): Promise<BusinessImpactMetrics> {
    const response = await api.get('/api/v1/kpis/business-impact')
    return response.data
  },

  // Operational Metrics
  async getOperationalMetrics(): Promise<OperationalMetrics> {
    const response = await api.get('/api/v1/kpis/efficiency-metrics')
    return response.data
  },

  // Anomaly Detection
  async getAnomalyDetection(): Promise<AnomalyDetection> {
    const response = await api.get('/api/v1/kpis/anomaly-detection')
    return response.data
  },

  // Data Freshness
  async getDataFreshness(): Promise<DataFreshness> {
    const response = await api.get('/api/v1/system/data-freshness')
    return response.data
  },

  // System Operations
  async refreshAllData(): Promise<{
    message: string
    refresh_id: string
    estimated_completion: string
    status: string
  }> {
    const response = await api.post('/api/v1/system/refresh')
    return response.data
  },

  async triggerKPIRefresh(): Promise<{
    message: string
    refresh_id: string
    estimated_completion: string
    metrics_updated: number
    status: string
  }> {
    const response = await api.post('/api/v1/kpis/refresh')
    return response.data
  },

  // Monitoring and Alerts
  async getSystemAlerts(severity?: 'high' | 'medium' | 'low'): Promise<Array<{
    id: string
    title: string
    message: string
    severity: string
    timestamp: string
    source: string
    status: 'active' | 'resolved' | 'acknowledged'
  }>> {
    const response = await api.get('/api/v1/system/alerts', {
      params: { severity }
    })
    return response.data
  },

  // Configuration
  async getSystemConfiguration(): Promise<{
    refresh_intervals: Record<string, number>
    thresholds: Record<string, number>
    feature_flags: Record<string, boolean>
    data_retention_days: number
  }> {
    const response = await api.get('/api/v1/system/config')
    return response.data
  },

  async updateSystemConfiguration(config: Partial<{
    refresh_intervals: Record<string, number>
    thresholds: Record<string, number>
    feature_flags: Record<string, boolean>
  }>): Promise<{ message: string; updated_config: any }> {
    const response = await api.put('/api/v1/system/config', config)
    return response.data
  }
}