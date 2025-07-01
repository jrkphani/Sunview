import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { systemService } from '../services/systemService'
import { queryKeys, REFETCH_INTERVALS } from '../lib/react-query'
import type { 
  SystemStatus, 
  DataFreshness, 
  SystemAlert,
  SystemConfiguration
} from '../types/api'

// System Status Hook
export const useSystemStatus = (options?: {
  enabled?: boolean
}) => {
  return useQuery({
    queryKey: queryKeys.system.status,
    queryFn: () => systemService.getSystemStatus(),
    staleTime: 30 * 1000, // System status needs frequent updates
    refetchInterval: REFETCH_INTERVALS.SYSTEM_STATUS,
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
  })
}

// Service Health Hook
export const useServiceHealth = (
  serviceName?: string,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: queryKeys.system.health(serviceName),
    queryFn: () => systemService.getServiceHealth(serviceName),
    staleTime: 30 * 1000,
    refetchInterval: REFETCH_INTERVALS.SYSTEM_STATUS,
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
  })
}

// Data Freshness Hook
export const useDataFreshness = (options?: {
  enabled?: boolean
}) => {
  return useQuery({
    queryKey: queryKeys.system.dataFreshness,
    queryFn: () => systemService.getDataFreshness(),
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: REFETCH_INTERVALS.FREQUENT,
    enabled: options?.enabled ?? true,
  })
}

// System Alerts Hook
export const useSystemAlerts = (
  severity?: 'high' | 'medium' | 'low',
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: queryKeys.system.alerts(severity),
    queryFn: () => systemService.getSystemAlerts(severity),
    staleTime: 30 * 1000,
    refetchInterval: REFETCH_INTERVALS.REAL_TIME, // Alerts need real-time updates
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true,
  })
}

// System Configuration Hook
export const useSystemConfiguration = (options?: {
  enabled?: boolean
}) => {
  return useQuery({
    queryKey: queryKeys.system.config,
    queryFn: () => systemService.getSystemConfiguration(),
    staleTime: 10 * 60 * 1000, // Config changes less frequently
    refetchInterval: REFETCH_INTERVALS.STATIC,
    enabled: options?.enabled ?? true,
  })
}

// Refresh All Data Mutation
export const useRefreshAllData = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => systemService.refreshAllData(),
    onSuccess: () => {
      // Invalidate all queries to force refetch
      queryClient.invalidateQueries()
    },
    onError: (error) => {
      console.error('Failed to refresh all data:', error)
    },
  })
}

// Update System Configuration Mutation
export const useUpdateSystemConfiguration = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (config: Partial<SystemConfiguration>) =>
      systemService.updateSystemConfiguration(config),
    onSuccess: () => {
      // Invalidate system config to refetch updated values
      queryClient.invalidateQueries({ queryKey: queryKeys.system.config })
    },
    onError: (error) => {
      console.error('Failed to update system configuration:', error)
    },
  })
}

// Combined System Overview Hook
export const useSystemOverview = () => {
  const systemStatus = useSystemStatus()
  const dataFreshness = useDataFreshness()
  const criticalAlerts = useSystemAlerts('high')
  const allAlerts = useSystemAlerts()

  return {
    systemStatus,
    dataFreshness,
    criticalAlerts,
    allAlerts,
    isLoading: systemStatus.isLoading || dataFreshness.isLoading,
    isError: systemStatus.isError || dataFreshness.isError,
    // Computed system health indicators
    overallHealth: systemStatus.data?.every(service => service.status === 'operational') ?? false,
    criticalIssues: criticalAlerts.data?.filter(alert => alert.status === 'active').length ?? 0,
    dataAgeHours: dataFreshness.data?.data_age_hours ?? 0,
    isDataStale: (dataFreshness.data?.data_age_hours ?? 0) > 2, // Consider stale if older than 2 hours
  }
}

// Real-time System Monitoring Hook
export const useSystemMonitoring = () => {
  const systemStatus = useQuery({
    queryKey: ['system', 'monitoring', 'status'],
    queryFn: () => systemService.getSystemStatus(),
    staleTime: 15 * 1000, // 15 seconds for monitoring
    refetchInterval: REFETCH_INTERVALS.REAL_TIME,
    refetchOnWindowFocus: true,
  })

  const criticalAlerts = useQuery({
    queryKey: ['system', 'monitoring', 'alerts'],
    queryFn: () => systemService.getSystemAlerts('high'),
    staleTime: 15 * 1000,
    refetchInterval: REFETCH_INTERVALS.REAL_TIME,
    refetchOnWindowFocus: true,
  })

  const dataFreshness = useQuery({
    queryKey: ['system', 'monitoring', 'freshness'],
    queryFn: () => systemService.getDataFreshness(),
    staleTime: 30 * 1000,
    refetchInterval: REFETCH_INTERVALS.FREQUENT,
  })

  // Calculate system health score (0-100)
  const calculateHealthScore = (): number => {
    if (!systemStatus.data || !criticalAlerts.data || !dataFreshness.data) return 0

    let score = 100

    // Deduct points for degraded services
    const degradedServices = systemStatus.data.filter(service => service.status !== 'operational')
    score -= degradedServices.length * 15

    // Deduct points for critical alerts
    score -= criticalAlerts.data.length * 10

    // Deduct points for stale data
    const dataAge = dataFreshness.data.data_age_hours
    if (dataAge > 4) score -= 20
    else if (dataAge > 2) score -= 10

    return Math.max(0, score)
  }

  return {
    systemStatus,
    criticalAlerts,
    dataFreshness,
    isLoading: systemStatus.isLoading || criticalAlerts.isLoading || dataFreshness.isLoading,
    isError: systemStatus.isError || criticalAlerts.isError || dataFreshness.isError,
    // Health indicators
    healthScore: calculateHealthScore(),
    hasActiveCriticalAlerts: (criticalAlerts.data?.length ?? 0) > 0,
    systemStatusSummary: {
      total: systemStatus.data?.length ?? 0,
      operational: systemStatus.data?.filter(s => s.status === 'operational').length ?? 0,
      degraded: systemStatus.data?.filter(s => s.status === 'degraded').length ?? 0,
      error: systemStatus.data?.filter(s => s.status === 'error').length ?? 0,
      maintenance: systemStatus.data?.filter(s => s.status === 'maintenance').length ?? 0,
    },
  }
}

// Critical System Alerts Hook - for urgent notifications
export const useCriticalSystemAlerts = () => {
  return useQuery({
    queryKey: ['system', 'critical-alerts', 'monitoring'],
    queryFn: () => systemService.getSystemAlerts('high'),
    staleTime: 10 * 1000, // 10 seconds for critical alerts
    refetchInterval: REFETCH_INTERVALS.REAL_TIME,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true, // Keep checking even when tab is not active
  })
}

// Specific Service Health Hook
export const useSpecificServiceHealth = (serviceName: string) => {
  return useQuery({
    queryKey: ['system', 'service-health', serviceName],
    queryFn: () => systemService.getServiceHealth(serviceName),
    staleTime: 30 * 1000,
    refetchInterval: REFETCH_INTERVALS.SYSTEM_STATUS,
    enabled: !!serviceName,
  })
}

// System Performance Summary Hook
export const useSystemPerformanceSummary = () => {
  const systemStatus = useSystemStatus()
  const dataFreshness = useDataFreshness()

  return useQuery({
    queryKey: ['system', 'performance-summary'],
    queryFn: async () => {
      // This could be a dedicated endpoint, but for now we'll compute from existing data
      const status = await systemService.getSystemStatus()
      const freshness = await systemService.getDataFreshness()

      return {
        avgResponseTime: status.reduce((sum, service) => sum + (service.response_time_ms || 0), 0) / status.length,
        avgUptime: status.reduce((sum, service) => sum + service.uptime_percentage, 0) / status.length,
        dataFreshnessScore: Math.max(0, 100 - freshness.data_age_hours * 5), // Decreases as data gets older
        operationalServices: status.filter(s => s.status === 'operational').length,
        totalServices: status.length,
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: REFETCH_INTERVALS.DASHBOARD,
    enabled: systemStatus.isSuccess && dataFreshness.isSuccess,
  })
}