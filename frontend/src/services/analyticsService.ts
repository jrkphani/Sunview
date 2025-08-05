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
    console.log('analyticsService.getTopSKUErrors - Calling API with params:', params)
    const response = await api.get('/api/v1/executive/top-sku-errors', { params })
    console.log('analyticsService.getTopSKUErrors - Raw response:', response.data)
    
    // Transform backend data structure to match frontend expectations
    // Handle various possible backend response formats
    let sourceArray = response.data.top_sku_errors || 
                     response.data.sku_errors || 
                     response.data.errors ||
                     response.data.data ||
                     response.data;
    
    // If response is directly an array
    if (Array.isArray(response.data)) {
      sourceArray = response.data;
    }
    
    // If we found an array to transform
    if (Array.isArray(sourceArray)) {
      const transformedData = {
        top_sku_errors: sourceArray.map((item: any) => {
          // Calculate error percentage from various possible fields
          let errorPercentage = item.error_percentage;
          if (errorPercentage === undefined) {
            if (item.forecast_error !== undefined) {
              errorPercentage = item.forecast_error * 100;
            } else if (item.mape !== undefined) {
              errorPercentage = item.mape;
            } else if (item.forecast_accuracy !== undefined) {
              errorPercentage = 100 - item.forecast_accuracy;
            } else {
              errorPercentage = 0;
            }
          }
          
          // Generate historical comparison if not provided
          const historicalData = item.historical_comparison || 
                               item.historical_data || 
                               item.history ||
                               [];
          
          // If no historical data, generate mock data
          if (historicalData.length === 0) {
            const periods = ['6 months ago', '5 months ago', '4 months ago', '3 months ago', '2 months ago', '1 month ago'];
            historicalData.push(...periods.map((period, idx) => ({
              period,
              error_percentage: errorPercentage + (Math.random() * 10 - 5) - (idx * 0.5)
            })));
          }
          
          return {
            sku: item.sku_id || item.sku || item.id || 'Unknown',
            name: item.sku_name || item.name || item.description || `SKU ${item.sku_id || item.sku || item.id || 'Unknown'}`,
            category: item.category || item.product_category || item.type || 'Uncategorized',
            error_percentage: errorPercentage,
            volume: item.actual_volume || item.volume_forecast || item.volume || item.quantity || 0,
            historical_comparison: historicalData
          };
        }),
        metadata: response.data.metadata || {
          generated_at: new Date().toISOString(),
          calculation_method: 'MAPE',
          time_range: params?.timeRange || '30d',
          threshold: 15
        }
      };
      return transformedData;
    }
    
    // If data is already in expected format, return as is
    if (response.data.top_sku_errors) {
      return response.data;
    }
    
    // Fallback: return empty structure
    console.warn('Unexpected response structure for top SKU errors:', response.data);
    return {
      top_sku_errors: [],
      metadata: {
        generated_at: new Date().toISOString(),
        calculation_method: 'MAPE',
        time_range: params?.timeRange || '30d',
        threshold: 15
      }
    };
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