import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { forecastService } from '../services/forecastService'
import { queryKeys, REFETCH_INTERVALS } from '../lib/react-query'
import type { 
  ForecastResponse, 
  ForecastRequest, 
  ForecastSummary, 
  AccuracyMetricsResponse,
  ForecastFilters,
  TrendData,
  PaginatedResponse
} from '../types/api'

// Main Forecasts Hook
export const useForecasts = (
  filters?: ForecastFilters,
  options?: {
    enabled?: boolean
    refetchInterval?: number | false
  }
) => {
  return useQuery({
    queryKey: queryKeys.forecasts.list(filters || {}),
    queryFn: () => forecastService.getForecasts(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: options?.refetchInterval ?? REFETCH_INTERVALS.FORECASTS,
    enabled: options?.enabled ?? true,
  })
}

// Forecast by ID Hook
export const useForecastById = (
  id: string,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: ['forecasts', 'detail', id],
    queryFn: () => forecastService.getForecastById(id),
    staleTime: 10 * 60 * 1000, // Individual forecasts are more stable
    refetchInterval: false, // Don't auto-refresh detail views
    enabled: options?.enabled ?? !!id,
  })
}

// Forecast Summary Hook
export const useForecastSummary = (options?: {
  enabled?: boolean
}) => {
  return useQuery({
    queryKey: queryKeys.forecasts.summary,
    queryFn: () => forecastService.getForecastSummary(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.FORECASTS,
    enabled: options?.enabled ?? true,
  })
}

// Volume Forecasts Hook
export const useVolumeForecasts = (
  timeHorizon: string,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: queryKeys.forecasts.volume(timeHorizon),
    queryFn: () => forecastService.getVolumeForecasts(timeHorizon),
    staleTime: 5 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.FORECASTS,
    enabled: options?.enabled ?? true,
  })
}

// Accuracy Metrics Hook
export const useAccuracyMetrics = (
  startDate?: string,
  endDate?: string,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: queryKeys.forecasts.accuracy(startDate, endDate),
    queryFn: () => forecastService.getAccuracyMetrics(startDate, endDate),
    staleTime: 5 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.ANALYTICS,
    enabled: options?.enabled ?? true,
  })
}

// Forecast Trends Hook
export const useForecastTrends = (
  skuId: string,
  daysBack: number = 30,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: queryKeys.forecasts.trends(skuId, daysBack),
    queryFn: () => forecastService.getForecastTrends(skuId, daysBack),
    staleTime: 5 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.FORECASTS,
    enabled: options?.enabled ?? !!skuId,
  })
}

// Volume Time Series Hook
export const useVolumeTimeSeries = (
  filters?: {
    sku_ids?: string[]
    warehouse_codes?: string[]
    days_back?: number
    granularity?: 'daily' | 'weekly' | 'monthly'
  },
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: ['forecasts', 'volume-timeseries', filters],
    queryFn: () => forecastService.getVolumeTimeSeries(filters),
    staleTime: 5 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.FORECASTS,
    enabled: options?.enabled ?? true,
  })
}

// Confidence Analysis Hook
export const useConfidenceAnalysis = (
  timeHorizon: string = '7d',
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: ['forecasts', 'confidence-analysis', timeHorizon],
    queryFn: () => forecastService.getConfidenceAnalysis(timeHorizon),
    staleTime: 10 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.ANALYTICS,
    enabled: options?.enabled ?? true,
  })
}

// Forecast Model Comparison Hook
export const useForecastModelComparison = (
  timeRange: string = '30d',
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: ['forecasts', 'model-comparison', timeRange],
    queryFn: () => forecastService.compareForecastModels(timeRange),
    staleTime: 15 * 60 * 1000, // Model comparison data is more stable
    refetchInterval: REFETCH_INTERVALS.INSIGHTS,
    enabled: options?.enabled ?? true,
  })
}

// Forecast Quality Metrics Hook
export const useForecastQualityMetrics = (options?: {
  enabled?: boolean
}) => {
  return useQuery({
    queryKey: ['forecasts', 'quality-metrics'],
    queryFn: () => forecastService.getForecastQualityMetrics(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.ANALYTICS,
    enabled: options?.enabled ?? true,
  })
}

// SKU Forecast Accuracy Hook
export const useSKUForecastAccuracy = (
  skuId: string,
  timeRange: string = '30d',
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: ['forecasts', 'sku-accuracy', skuId, timeRange],
    queryFn: () => forecastService.getForecastAccuracyBySKU(skuId, timeRange),
    staleTime: 10 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.ANALYTICS,
    enabled: options?.enabled ?? !!skuId,
  })
}

// Create Forecast Mutation
export const useCreateForecast = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (request: ForecastRequest) => forecastService.createForecast(request),
    onSuccess: () => {
      // Invalidate forecasts to refetch with new data
      queryClient.invalidateQueries({ queryKey: queryKeys.forecasts.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.forecasts.summary })
    },
    onError: (error) => {
      console.error('Failed to create forecast:', error)
    },
  })
}

// Refresh Forecasts Mutation
export const useRefreshForecasts = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (options?: {
      sku_ids?: string[]
      warehouse_codes?: string[]
      force_refresh?: boolean
    }) => forecastService.refreshForecasts(options),
    onSuccess: () => {
      // Invalidate all forecast-related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.forecasts.all })
    },
    onError: (error) => {
      console.error('Failed to refresh forecasts:', error)
    },
  })
}

// Batch Update Forecasts Mutation
export const useBatchUpdateForecasts = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updates: Array<{
      forecast_id: string
      adjustments?: {
        predicted_demand?: number
        confidence_level?: number
        notes?: string
      }
    }>) => forecastService.batchUpdateForecasts(updates),
    onSuccess: () => {
      // Invalidate forecasts to refetch updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.forecasts.all })
    },
    onError: (error) => {
      console.error('Failed to batch update forecasts:', error)
    },
  })
}

// Export Forecasts Hook
export const useExportForecasts = () => {
  return useMutation({
    mutationFn: (params: {
      format: 'json' | 'csv' | 'excel'
      filters?: ForecastFilters
    }) => forecastService.exportForecasts(params.format, params.filters),
    onError: (error) => {
      console.error('Failed to export forecasts:', error)
    },
  })
}

// Generate Forecast Report Hook
export const useGenerateForecastReport = () => {
  return useMutation({
    mutationFn: (params: {
      reportType: 'summary' | 'detailed' | 'accuracy'
      timeRange?: string
      format?: 'pdf' | 'html'
    }) => forecastService.generateForecastReport(
      params.reportType, 
      params.timeRange, 
      params.format
    ),
    onError: (error) => {
      console.error('Failed to generate forecast report:', error)
    },
  })
}

// Combined Forecast Dashboard Hook
export const useForecastDashboard = (
  timeHorizon: string = '7d',
  options?: {
    includeTrends?: boolean
    includeQuality?: boolean
    includeComparison?: boolean
  }
) => {
  const summary = useForecastSummary()
  const volumeForecasts = useVolumeForecasts(timeHorizon)
  const accuracyMetrics = useAccuracyMetrics()
  const confidenceAnalysis = useConfidenceAnalysis(timeHorizon)
  
  const qualityMetrics = useForecastQualityMetrics({
    enabled: options?.includeQuality ?? true
  })
  
  const modelComparison = useForecastModelComparison('30d', {
    enabled: options?.includeComparison ?? false
  })

  return {
    summary,
    volumeForecasts,
    accuracyMetrics,
    confidenceAnalysis,
    qualityMetrics: options?.includeQuality ? qualityMetrics : undefined,
    modelComparison: options?.includeComparison ? modelComparison : undefined,
    isLoading: summary.isLoading || volumeForecasts.isLoading || accuracyMetrics.isLoading,
    isError: summary.isError || volumeForecasts.isError || accuracyMetrics.isError,
    // Computed metrics
    totalForecasts: summary.data?.total_items ?? 0,
    overallAccuracy: accuracyMetrics.data?.overall_accuracy ?? 0,
    confidenceScore: confidenceAnalysis.data?.overall_confidence ?? 0,
    qualityScore: qualityMetrics.data?.quality_score ?? 0,
  }
}

// Forecast Scenarios Hook
export const useForecastScenarios = (
  baselineForecastId: string,
  scenarios: Array<{
    name: string
    adjustments: Record<string, number>
    description?: string
  }>,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: ['forecasts', 'scenarios', baselineForecastId, scenarios],
    queryFn: () => forecastService.getForecastScenarios(baselineForecastId, scenarios),
    staleTime: 15 * 60 * 1000, // Scenarios are computationally expensive
    refetchInterval: false, // Don't auto-refresh scenarios
    enabled: options?.enabled ?? !!baselineForecastId && scenarios.length > 0,
  })
}

// Real-time Forecast Monitoring Hook
export const useForecastMonitoring = () => {
  const qualityMetrics = useQuery({
    queryKey: ['forecasts', 'monitoring', 'quality'],
    queryFn: () => forecastService.getForecastQualityMetrics(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: REFETCH_INTERVALS.FREQUENT,
    refetchOnWindowFocus: true,
  })

  const recentAccuracy = useQuery({
    queryKey: ['forecasts', 'monitoring', 'accuracy'],
    queryFn: () => forecastService.getAccuracyMetrics(),
    staleTime: 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.FREQUENT,
  })

  return {
    qualityMetrics,
    recentAccuracy,
    isLoading: qualityMetrics.isLoading || recentAccuracy.isLoading,
    isError: qualityMetrics.isError || recentAccuracy.isError,
    // Health indicators
    hasQualityIssues: (qualityMetrics.data?.issues?.length ?? 0) > 0,
    criticalIssues: qualityMetrics.data?.issues?.filter(issue => issue.severity === 'high') ?? [],
    dataFreshness: qualityMetrics.data?.data_freshness_hours ?? 0,
    isDataStale: (qualityMetrics.data?.data_freshness_hours ?? 0) > 4,
  }
}