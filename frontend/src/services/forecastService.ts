import { api } from './api'
import { 
  ForecastResponse, 
  ForecastRequest, 
  ForecastSummary, 
  AccuracyMetricsResponse,
  ForecastFilters,
  TrendData,
  PaginatedResponse,
  RefreshResponse,
  ExportResponse
} from '../types/api'

export const forecastService = {
  // Core Forecast Operations
  async getForecasts(filters?: ForecastFilters): Promise<PaginatedResponse<ForecastResponse>> {
    const response = await api.get('/api/v1/forecasts/', { params: filters })
    return response.data
  },

  async getForecastById(id: string): Promise<ForecastResponse> {
    const response = await api.get(`/api/v1/forecasts/${id}`)
    return response.data
  },

  async createForecast(request: ForecastRequest): Promise<ForecastResponse[]> {
    const response = await api.post('/api/v1/forecasts/generate', request)
    return response.data
  },

  // Forecast Summary and Analytics
  async getForecastSummary(): Promise<ForecastSummary> {
    const response = await api.get('/api/v1/forecasts/summary')
    return response.data
  },

  async getVolumeForecasts(timeHorizon: string): Promise<ForecastResponse[]> {
    const response = await api.get('/api/v1/forecasts/volume', {
      params: { time_horizon: timeHorizon }
    })
    return response.data
  },

  // Accuracy Metrics
  async getAccuracyMetrics(
    startDate?: string, 
    endDate?: string
  ): Promise<AccuracyMetricsResponse> {
    const response = await api.get('/api/v1/forecasts/accuracy', {
      params: { start_date: startDate, end_date: endDate }
    })
    return response.data
  },

  async getForecastAccuracyBySKU(
    skuId: string,
    timeRange: string = '30d'
  ): Promise<{
    sku_id: string
    accuracy_metrics: AccuracyMetricsResponse
    forecast_history: ForecastResponse[]
  }> {
    const response = await api.get(`/api/v1/forecasts/sku/${skuId}/accuracy`, {
      params: { time_range: timeRange }
    })
    return response.data
  },

  // Trend Analysis
  async getForecastTrends(
    skuId: string, 
    daysBack: number = 30
  ): Promise<TrendData[]> {
    const response = await api.get(`/api/v1/forecasts/trends/${skuId}`, {
      params: { days_back: daysBack }
    })
    return response.data
  },

  async getVolumeTimeSeries(
    filters?: {
      sku_ids?: string[]
      warehouse_codes?: string[]
      days_back?: number
      granularity?: 'daily' | 'weekly' | 'monthly'
    }
  ): Promise<Array<{
    date: string
    forecasted_volume: number
    actual_volume?: number
    sku_id: string
    warehouse_code: string
  }>> {
    const response = await api.get('/api/v1/forecasts/volume/timeseries', {
      params: filters
    })
    return response.data
  },

  // Confidence Analysis
  async getConfidenceAnalysis(
    timeHorizon: string = '7d'
  ): Promise<{
    overall_confidence: number
    confidence_distribution: Array<{
      confidence_range: string
      count: number
      percentage: number
    }>
    low_confidence_items: Array<{
      sku_id: string
      confidence_score: number
      predicted_demand: number
      reasons: string[]
    }>
  }> {
    const response = await api.get('/api/v1/forecasts/confidence-analysis', {
      params: { time_horizon: timeHorizon }
    })
    return response.data
  },

  // Comparison and Benchmarking
  async compareForecastModels(
    timeRange: string = '30d'
  ): Promise<{
    model_comparison: Array<{
      model_version: string
      accuracy_score: number
      mape: number
      bias: number
      coverage_count: number
    }>
    best_performing_model: string
    improvement_suggestions: string[]
  }> {
    const response = await api.get('/api/v1/forecasts/model-comparison', {
      params: { time_range: timeRange }
    })
    return response.data
  },

  // Forecast Operations
  async refreshForecasts(
    options?: {
      sku_ids?: string[]
      warehouse_codes?: string[]
      force_refresh?: boolean
    }
  ): Promise<RefreshResponse> {
    const response = await api.post('/api/v1/forecasts/refresh', options)
    return response.data
  },

  async batchUpdateForecasts(
    updates: Array<{
      forecast_id: string
      adjustments?: {
        predicted_demand?: number
        confidence_level?: number
        notes?: string
      }
    }>
  ): Promise<{
    updated_count: number
    failed_updates: Array<{
      forecast_id: string
      error: string
    }>
  }> {
    const response = await api.patch('/api/v1/forecasts/batch-update', { updates })
    return response.data
  },

  // Export and Reporting
  async exportForecasts(
    format: 'json' | 'csv' | 'excel' = 'json',
    filters?: ForecastFilters
  ): Promise<ExportResponse> {
    const response = await api.get('/api/v1/forecasts/export', {
      params: { format, ...filters },
      responseType: format === 'json' ? 'json' : 'blob'
    })
    return response.data
  },

  async generateForecastReport(
    reportType: 'summary' | 'detailed' | 'accuracy',
    timeRange: string = '30d',
    format: 'pdf' | 'html' = 'pdf'
  ): Promise<ExportResponse> {
    const response = await api.post('/api/v1/forecasts/reports/generate', {
      report_type: reportType,
      time_range: timeRange,
      format
    })
    return response.data
  },

  // Advanced Analytics
  async getForecastScenarios(
    baselineForecastId: string,
    scenarios: Array<{
      name: string
      adjustments: Record<string, number>
      description?: string
    }>
  ): Promise<Array<{
    scenario_name: string
    forecast_data: ForecastResponse[]
    impact_analysis: {
      volume_change: number
      confidence_impact: number
      business_metrics: Record<string, number>
    }
  }>> {
    const response = await api.post(`/api/v1/forecasts/${baselineForecastId}/scenarios`, {
      scenarios
    })
    return response.data
  },

  // Data Quality and Validation
  async getForecastQualityMetrics(): Promise<{
    data_completeness: number
    forecast_coverage: number
    outlier_detection_rate: number
    model_drift_score: number
    data_freshness_hours: number
    quality_score: number
    issues: Array<{
      type: string
      severity: 'high' | 'medium' | 'low'
      description: string
      affected_forecasts: number
    }>
  }> {
    const response = await api.get('/api/v1/forecasts/quality-metrics')
    return response.data
  }
}