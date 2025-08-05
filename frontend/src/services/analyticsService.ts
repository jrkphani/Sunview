import { api } from './api'

export interface AnalyticsData {
  id: string
  sku: string
  description: string
  forecast_accuracy: number
  volume_predicted: number
  volume_actual?: number
  demand_variance: number
  category: string
  priority: 'high' | 'medium' | 'low'
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
  trend_direction: 'up' | 'down' | 'stable'
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

export const analyticsService = {
  // SKU Performance Analytics
  async getSKUAnalytics(params?: {
    timeRange?: string
    category?: string
    minAccuracy?: number
    limit?: number
    offset?: number
  }): Promise<AnalyticsData[]> {
    const response = await api.get('/api/v1/analytics/sku-performance', { params })
    return response.data
  },

  async getSKUPerformance(params?: {
    category?: string
    sortBy?: string
    limit?: number
  }): Promise<SKUPerformanceData[]> {
    const response = await api.get('/api/v1/analytics/sku-performance/detailed', { params })
    return response.data
  },

  // Category Performance
  async getCategoryPerformance(): Promise<CategoryPerformance[]> {
    const response = await api.get('/api/v1/analytics/category-performance')
    return response.data
  },

  // Model Performance Metrics
  async getModelMetrics(timeRange?: string): Promise<ModelMetrics> {
    const response = await api.get('/api/v1/analytics/model-metrics', {
      params: { time_range: timeRange }
    })
    return response.data
  },

  // Trend Analysis
  async getAccuracyTrend(params?: {
    timeRange?: string
    granularity?: 'daily' | 'weekly' | 'monthly'
  }): Promise<TrendData[]> {
    const response = await api.get('/api/v1/analytics/trends/accuracy', { params })
    return response.data
  },

  async getProcessingTimeTrend(params?: {
    timeRange?: string
    granularity?: 'daily' | 'weekly' | 'monthly'
  }): Promise<TrendData[]> {
    const response = await api.get('/api/v1/analytics/trends/processing-time', { params })
    return response.data
  },

  async getVolumeTrend(params?: {
    timeRange?: string
    granularity?: 'daily' | 'weekly' | 'monthly'
  }): Promise<TrendData[]> {
    const response = await api.get('/api/v1/analytics/trends/volume', { params })
    return response.data
  },

  // Advanced Analytics
  async getAdvancedMetrics(): Promise<{
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
  }> {
    const response = await api.get('/api/v1/analytics/advanced-metrics')
    return response.data
  },

  // Seasonality Data
  async getSeasonalityData(params?: {
    year?: number
    metric?: 'accuracy' | 'volume'
  }): Promise<Array<{
    day: string
    value: number
  }>> {
    const response = await api.get('/api/v1/analytics/seasonality', { params })
    return response.data
  },

  // Top SKU Errors
  async getTopSKUErrors(params?: {
    limit?: number
    category?: string
    timeRange?: string
  }): Promise<{
    top_sku_errors: Array<{
      sku: string
      name: string
      category: string
      error_percentage: number
      volume: number
      historical_comparison: Array<{
        period: string
        error_percentage: number
      }>
    }>
    metadata: {
      generated_at: string
      calculation_method: string
      time_range: string
      threshold: number
    }
  }> {
    const response = await api.get('/api/v1/executive/top-sku-errors', { params })
    
    // Transform backend data structure to match frontend expectations
    if (response.data.sku_errors) {
      // Backend returns different structure, transform it
      const transformedData = {
        top_sku_errors: response.data.sku_errors.map((item: any) => ({
          sku: item.sku_id || item.sku,
          name: item.sku_name || item.name || `SKU ${item.sku_id || item.sku}`,
          category: item.category || 'Uncategorized',
          error_percentage: item.error_percentage || (item.forecast_error ? item.forecast_error * 100 : 0),
          volume: item.actual_volume || item.volume_forecast || item.volume || 0,
          historical_comparison: item.historical_data || []
        })),
        metadata: response.data.metadata || {
          generated_at: new Date().toISOString(),
          calculation_method: 'MAPE',
          time_range: params?.timeRange || '30d',
          threshold: 15
        }
      }
      return transformedData
    }
    
    // If data is already in expected format, return as is
    return response.data
  },

  // Export Functions
  async exportAnalytics(params: {
    format: 'json' | 'csv'
    timeRange?: string
    category?: string
  }): Promise<Blob | any> {
    const response = await api.get('/api/v1/analytics/export', {
      params,
      responseType: params.format === 'csv' ? 'blob' : 'json'
    })
    return response.data
  }
}