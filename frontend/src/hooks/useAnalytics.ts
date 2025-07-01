import { useQuery, useMutation } from '@tanstack/react-query'
import { analyticsService } from '../services/analyticsService'
import { queryKeys, REFETCH_INTERVALS } from '../lib/react-query'
import type { 
  AnalyticsFilters
} from '../types/api'

// SKU Analytics Hook
export const useSKUAnalytics = (
  filters?: AnalyticsFilters,
  options?: {
    enabled?: boolean
    refetchInterval?: number | false
  }
) => {
  return useQuery({
    queryKey: queryKeys.analytics.sku(filters || {}),
    queryFn: () => analyticsService.getSKUAnalytics(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: options?.refetchInterval ?? REFETCH_INTERVALS.ANALYTICS,
    enabled: options?.enabled ?? true,
  })
}

// SKU Performance Hook
export const useSKUPerformance = (
  params?: {
    category?: string
    sortBy?: string
    limit?: number
  },
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: ['analytics', 'sku-performance', params],
    queryFn: () => analyticsService.getSKUPerformance(params),
    staleTime: 5 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.ANALYTICS,
    enabled: options?.enabled ?? true,
  })
}

// Category Performance Hook
export const useCategoryPerformance = (options?: {
  enabled?: boolean
}) => {
  return useQuery({
    queryKey: queryKeys.analytics.categories,
    queryFn: () => analyticsService.getCategoryPerformance(),
    staleTime: 10 * 60 * 1000, // Categories change less frequently
    refetchInterval: REFETCH_INTERVALS.ANALYTICS,
    enabled: options?.enabled ?? true,
  })
}

// Model Metrics Hook
export const useModelMetrics = (
  timeRange?: string,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: queryKeys.analytics.modelMetrics(timeRange || '30d'),
    queryFn: () => analyticsService.getModelMetrics(timeRange),
    staleTime: 5 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.ANALYTICS,
    enabled: options?.enabled ?? true,
  })
}

// Accuracy Trend Hook
export const useAccuracyTrend = (
  params?: {
    timeRange?: string
    granularity?: 'daily' | 'weekly' | 'monthly'
  },
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: queryKeys.analytics.trends.accuracy(params || {}),
    queryFn: () => analyticsService.getAccuracyTrend(params),
    staleTime: 5 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.ANALYTICS,
    enabled: options?.enabled ?? true,
  })
}

// Processing Time Trend Hook
export const useProcessingTimeTrend = (
  params?: {
    timeRange?: string
    granularity?: 'daily' | 'weekly' | 'monthly'
  },
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: queryKeys.analytics.trends.processing(params || {}),
    queryFn: () => analyticsService.getProcessingTimeTrend(params),
    staleTime: 5 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.ANALYTICS,
    enabled: options?.enabled ?? true,
  })
}

// Volume Trend Hook
export const useVolumeTrend = (
  params?: {
    timeRange?: string
    granularity?: 'daily' | 'weekly' | 'monthly'
  },
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: queryKeys.analytics.trends.volume(params || {}),
    queryFn: () => analyticsService.getVolumeTrend(params),
    staleTime: 5 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.ANALYTICS,
    enabled: options?.enabled ?? true,
  })
}

// Advanced Metrics Hook
export const useAdvancedMetrics = (options?: {
  enabled?: boolean
}) => {
  return useQuery({
    queryKey: queryKeys.analytics.advanced,
    queryFn: () => analyticsService.getAdvancedMetrics(),
    staleTime: 10 * 60 * 1000, // Advanced metrics are more stable
    refetchInterval: REFETCH_INTERVALS.INSIGHTS,
    enabled: options?.enabled ?? true,
  })
}

// Analytics Export Hook
export const useAnalyticsExport = () => {
  return useMutation({
    mutationFn: (params: {
      format: 'json' | 'csv'
      timeRange?: string
      category?: string
    }) => analyticsService.exportAnalytics(params),
    onError: (error) => {
      console.error('Failed to export analytics:', error)
    },
  })
}

// Combined Analytics Dashboard Hook
export const useAnalyticsDashboard = (
  timeRange: string = '30d',
  options?: {
    includeAdvanced?: boolean
    category?: string
  }
) => {
  const modelMetrics = useModelMetrics(timeRange)
  const categoryPerformance = useCategoryPerformance()
  const accuracyTrend = useAccuracyTrend({ timeRange })
  const volumeTrend = useVolumeTrend({ timeRange })
  const advancedMetrics = useAdvancedMetrics({ 
    enabled: options?.includeAdvanced ?? false 
  })

  const skuAnalytics = useSKUAnalytics(
    {
      timeRange,
      category: options?.category,
      limit: 50 // Limit for dashboard view
    },
    {
      enabled: true
    }
  )

  return {
    modelMetrics,
    categoryPerformance,
    accuracyTrend,
    volumeTrend,
    skuAnalytics,
    advancedMetrics: options?.includeAdvanced ? advancedMetrics : undefined,
    isLoading: modelMetrics.isLoading || categoryPerformance.isLoading || accuracyTrend.isLoading,
    isError: modelMetrics.isError || categoryPerformance.isError || accuracyTrend.isError,
    error: modelMetrics.error || categoryPerformance.error || accuracyTrend.error,
  }
}

// Performance monitoring hook for real-time analytics
export const usePerformanceMonitoring = () => {
  const modelMetrics = useQuery({
    queryKey: ['analytics', 'performance', 'real-time'],
    queryFn: () => analyticsService.getModelMetrics('1d'),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: REFETCH_INTERVALS.FREQUENT,
    refetchOnWindowFocus: true,
  })

  const advancedMetrics = useQuery({
    queryKey: ['analytics', 'advanced', 'real-time'],
    queryFn: () => analyticsService.getAdvancedMetrics(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: REFETCH_INTERVALS.FREQUENT,
  })

  return {
    modelMetrics,
    advancedMetrics,
    isLoading: modelMetrics.isLoading || advancedMetrics.isLoading,
    isError: modelMetrics.isError || advancedMetrics.isError,
    // Derived performance indicators
    performanceScore: modelMetrics.data?.overall_accuracy ?? 0,
    dataQuality: advancedMetrics.data?.data_quality?.data_completeness ?? 0,
    processingEfficiency: modelMetrics.data?.data_processing_rate ?? 0,
  }
}

// SKU-specific analytics hook
export const useSKUAnalyticsDetail = (
  category?: string,
  options?: {
    minAccuracy?: number
    showLowConfidence?: boolean
    limit?: number
  }
) => {
  const filters: AnalyticsFilters = {
    category,
    minAccuracy: options?.minAccuracy,
    showLowConfidence: options?.showLowConfidence,
    limit: options?.limit ?? 100,
  }

  const analytics = useSKUAnalytics(filters)
  const performance = useSKUPerformance({ category })

  return {
    analytics,
    performance,
    isLoading: analytics.isLoading || performance.isLoading,
    isError: analytics.isError || performance.isError,
    // Computed metrics
    totalSKUs: analytics.data?.length ?? 0,
    avgAccuracy: analytics.data?.reduce((sum, item) => sum + item.forecast_accuracy, 0) / (analytics.data?.length ?? 1),
    lowPerformingSKUs: analytics.data?.filter(sku => sku.forecast_accuracy < (options?.minAccuracy ?? 0.8)) ?? [],
  }
}