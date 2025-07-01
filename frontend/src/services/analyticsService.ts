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