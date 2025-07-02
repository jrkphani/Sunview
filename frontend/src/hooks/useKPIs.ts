import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kpiService } from '../services/kpiService'
import { queryKeys, REFETCH_INTERVALS } from '../lib/react-query'

// Dashboard KPIs Hook
export const useDashboardKPIs = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.kpis,
    queryFn: () => kpiService.getDashboardKPIs(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: REFETCH_INTERVALS.DASHBOARD,
    refetchOnWindowFocus: true, // Dashboard should refresh on focus
  })
}

// KPI Trends Hook
export const useKPITrends = (
  metric: string, 
  timePeriod: string = '90d',
  options?: {
    enabled?: boolean
    refetchInterval?: number | false
  }
) => {
  return useQuery({
    queryKey: queryKeys.kpis.trends(metric, timePeriod),
    queryFn: () => kpiService.getKPITrends(metric, timePeriod),
    staleTime: 5 * 60 * 1000,
    refetchInterval: options?.refetchInterval ?? REFETCH_INTERVALS.ANALYTICS,
    enabled: options?.enabled ?? true,
  })
}

// Forecast Accuracy KPIs Hook
export const useForecastAccuracyKPIs = (
  timePeriod: string = '30d',
  breakdown: string = 'daily',
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: queryKeys.kpis.accuracy(timePeriod, breakdown),
    queryFn: () => kpiService.getForecastAccuracyKPIs(timePeriod, breakdown),
    staleTime: 3 * 60 * 1000, // 3 minutes
    refetchInterval: REFETCH_INTERVALS.ANALYTICS,
    enabled: options?.enabled ?? true,
  })
}

// Efficiency Metrics Hook
export const useEfficiencyMetrics = (options?: {
  enabled?: boolean
  refetchInterval?: number | false
}) => {
  return useQuery({
    queryKey: queryKeys.kpis.efficiency,
    queryFn: () => kpiService.getEfficiencyMetrics(),
    staleTime: 5 * 60 * 1000,
    refetchInterval: options?.refetchInterval ?? REFETCH_INTERVALS.ANALYTICS,
    enabled: options?.enabled ?? true,
  })
}

// Business Impact Metrics Hook
export const useBusinessImpactMetrics = (options?: {
  enabled?: boolean
}) => {
  return useQuery({
    queryKey: queryKeys.kpis.businessImpact,
    queryFn: () => kpiService.getBusinessImpactMetrics(),
    staleTime: 10 * 60 * 1000, // Business impact changes less frequently
    refetchInterval: REFETCH_INTERVALS.INSIGHTS,
    enabled: options?.enabled ?? true,
  })
}

// Anomaly Detection Hook
export const useAnomalyDetection = (options?: {
  enabled?: boolean
}) => {
  return useQuery({
    queryKey: queryKeys.kpis.anomalies,
    queryFn: () => kpiService.getAnomalyDetectionKPIs(),
    staleTime: 2 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.FREQUENT, // Anomalies need frequent checking
    enabled: options?.enabled ?? true,
  })
}

// KPI Refresh Mutation Hook
export const useKPIRefresh = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => kpiService.refreshKPIs(),
    onSuccess: () => {
      // Invalidate all KPI-related queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.kpis.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.kpis })
    },
    onError: (error) => {
      console.error('Failed to refresh KPIs:', error)
    },
  })
}

// KPI Export Hook
export const useKPIExport = () => {
  return useMutation({
    mutationFn: (params: {
      format: 'json' | 'csv' | 'pdf'
      timePeriod: string
    }) => kpiService.exportKPIReport(params.format, params.timePeriod),
    onError: (error) => {
      console.error('Failed to export KPI report:', error)
    },
  })
}

// Combined Dashboard Data Hook - for dashboard pages that need multiple KPIs
export const useDashboardData = (options?: {
  includeAnomalies?: boolean
  includeBusinessImpact?: boolean
}) => {
  const kpis = useDashboardKPIs()
  const efficiency = useEfficiencyMetrics({ 
    enabled: kpis.isSuccess 
  })
  const anomalies = useAnomalyDetection({ 
    enabled: options?.includeAnomalies ?? true 
  })
  const businessImpact = useBusinessImpactMetrics({ 
    enabled: options?.includeBusinessImpact ?? true 
  })

  return {
    kpis,
    efficiency,
    anomalies: options?.includeAnomalies ? anomalies : undefined,
    businessImpact: options?.includeBusinessImpact ? businessImpact : undefined,
    isLoading: kpis.isLoading || efficiency.isLoading,
    isError: kpis.isError || efficiency.isError,
    error: kpis.error || efficiency.error,
  }
}

// Real-time KPI monitoring hook for critical metrics
export const useRealTimeKPIs = (criticalMetrics: string[] = []) => {
  const dashboardKPIs = useQuery({
    queryKey: ['kpis', 'real-time', 'dashboard'],
    queryFn: () => kpiService.getDashboardKPIs(),
    staleTime: 30 * 1000, // 30 seconds for real-time data
    refetchInterval: REFETCH_INTERVALS.REAL_TIME,
    refetchOnWindowFocus: true,
  })

  const anomalies = useQuery({
    queryKey: ['kpis', 'real-time', 'anomalies'],
    queryFn: () => kpiService.getAnomalyDetectionKPIs(),
    staleTime: 30 * 1000,
    refetchInterval: REFETCH_INTERVALS.REAL_TIME,
    refetchOnWindowFocus: true,
  })

  return {
    dashboardKPIs,
    anomalies,
    isLoading: dashboardKPIs.isLoading || anomalies.isLoading,
    isError: dashboardKPIs.isError || anomalies.isError,
    hasHighSeverityAnomalies: anomalies.data?.high_severity_anomalies > 0,
    totalAnomalies: anomalies.data?.total_anomalies ?? 0,
  }
}