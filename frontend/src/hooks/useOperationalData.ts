import { useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getOperationalEfficiencyMetrics,
  getThroughputMetrics,
  getConsumptionRateData,
  getLaborForecastData,
  getDockToStockData,
  getPickRateMetrics,
  getConsolidationOpportunities,
  executeConsolidation,
  generateRescheduleRecommendations,
  investigateProcessingDelays,
  optimizeShiftPerformance,
  exportOperationalReport,
  refreshOperationalData,
  getAvailableSites,
  getAvailableSkuGroups,
  getOperationalSummary
} from '../services/operationalService'
import type {
  OperationalEfficiencyFilters,
  QueryOptions,
  LoadingState
} from '../types/api'

// ====== MAIN OPERATIONAL DATA HOOK ======

interface UseOperationalDataOptions extends QueryOptions {
  initialFilters?: OperationalEfficiencyFilters
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useOperationalData(options: UseOperationalDataOptions = {}) {
  const {
    initialFilters = {
      date_range: {
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      },
      performance_threshold: 85
    },
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    ...queryOptions
  } = options

  const [filters, setFilters] = useState<OperationalEfficiencyFilters>(initialFilters)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const queryClient = useQueryClient()

  // Main operational efficiency data query
  const {
    data: operationalData,
    isLoading,
    error,
    refetch: refetchOperational
  } = useQuery({
    queryKey: ['operational-efficiency', filters],
    queryFn: () => getOperationalEfficiencyMetrics(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: autoRefresh ? refreshInterval : false,
    ...queryOptions
  })

  // Update filters with callback
  const updateFilters = useCallback((newFilters: Partial<OperationalEfficiencyFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Reset filters to initial state
  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters])

  // Manual refresh with loading state
  const [isRefreshing, setIsRefreshing] = useState(false)
  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await refetchOperational()
      setLastRefresh(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }, [refetchOperational])

  // Calculate loading state
  const loadingState: LoadingState = useMemo(() => {
    if (isRefreshing) return 'loading'
    if (isLoading) return 'loading'
    if (error) return 'error'
    if (operationalData) return 'success'
    return 'idle'
  }, [isLoading, isRefreshing, error, operationalData])

  return {
    // Data
    data: operationalData,
    filters,
    lastRefresh,
    
    // State
    loadingState,
    isLoading: isLoading || isRefreshing,
    error: error?.message || null,
    
    // Actions
    updateFilters,
    resetFilters,
    refresh
  }
}

// ====== THROUGHPUT METRICS HOOK ======

export function useThroughputMetrics(filters?: Partial<OperationalEfficiencyFilters>) {
  return useQuery({
    queryKey: ['throughput-metrics', filters],
    queryFn: () => getThroughputMetrics(filters),
    staleTime: 2 * 60 * 1000,
    enabled: !!filters
  })
}

// ====== CONSUMPTION RATE HOOK ======

interface UseConsumptionRateOptions {
  filters?: Partial<OperationalEfficiencyFilters>
  viewBy?: 'sku' | 'segment' | 'warehouse'
  category?: string
}

export function useConsumptionRate(options: UseConsumptionRateOptions = {}) {
  const { filters, viewBy = 'sku', category } = options
  
  return useQuery({
    queryKey: ['consumption-rate', filters, viewBy, category],
    queryFn: () => getConsumptionRateData({ ...filters, view_by: viewBy, category }),
    staleTime: 2 * 60 * 1000
  })
}

// ====== LABOR FORECAST HOOK ======

export function useLaborForecast(filters?: Partial<OperationalEfficiencyFilters>) {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: ['labor-forecast', filters],
    queryFn: () => getLaborForecastData(filters),
    staleTime: 2 * 60 * 1000
  })

  // Reschedule recommendations mutation
  const rescheduleMutation = useMutation({
    mutationFn: generateRescheduleRecommendations,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labor-forecast'] })
    }
  })

  return {
    ...query,
    generateRecommendations: rescheduleMutation.mutate,
    isGeneratingRecommendations: rescheduleMutation.isPending,
    recommendationError: rescheduleMutation.error?.message
  }
}

// ====== DOCK-TO-STOCK HOOK ======

interface UseDockToStockOptions {
  filters?: Partial<OperationalEfficiencyFilters>
  groupBy?: 'site' | 'sku_group' | 'delay_category'
}

export function useDockToStock(options: UseDockToStockOptions = {}) {
  const { filters, groupBy = 'site' } = options
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: ['dock-to-stock', filters, groupBy],
    queryFn: () => getDockToStockData({ ...filters, group_by: groupBy }),
    staleTime: 2 * 60 * 1000
  })

  // Delay investigation mutation
  const investigationMutation = useMutation({
    mutationFn: investigateProcessingDelays,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dock-to-stock'] })
    }
  })

  return {
    ...query,
    investigateDelays: investigationMutation.mutate,
    isInvestigating: investigationMutation.isPending,
    investigationError: investigationMutation.error?.message
  }
}

// ====== PICK RATE HOOK ======

interface UsePickRateOptions {
  filters?: Partial<OperationalEfficiencyFilters>
  performanceGrade?: 'excellent' | 'good' | 'needs_improvement' | 'poor'
}

export function usePickRate(options: UsePickRateOptions = {}) {
  const { filters, performanceGrade } = options
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: ['pick-rate', filters, performanceGrade],
    queryFn: () => getPickRateMetrics({ ...filters, performance_grade: performanceGrade }),
    staleTime: 2 * 60 * 1000
  })

  // Shift optimization mutation
  const optimizationMutation = useMutation({
    mutationFn: optimizeShiftPerformance,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pick-rate'] })
    }
  })

  return {
    ...query,
    optimizeShift: optimizationMutation.mutate,
    isOptimizing: optimizationMutation.isPending,
    optimizationError: optimizationMutation.error?.message
  }
}

// ====== CONSOLIDATION OPPORTUNITIES HOOK ======

interface UseConsolidationOptions {
  minSavings?: number
  action?: 'consolidate' | 'reschedule' | 'optimize_route'
  feasibilityThreshold?: number
  timelineThreshold?: number
}

export function useConsolidationOpportunities(options: UseConsolidationOptions = {}) {
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: ['consolidation-opportunities', options],
    queryFn: () => getConsolidationOpportunities({
      min_savings: options.minSavings,
      action: options.action,
      feasibility_threshold: options.feasibilityThreshold,
      timeline_threshold: options.timelineThreshold
    }),
    staleTime: 5 * 60 * 1000 // 5 minutes for consolidation data
  })

  // Execute consolidation mutation
  const consolidationMutation = useMutation({
    mutationFn: executeConsolidation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consolidation-opportunities'] })
      // Also refresh operational data to reflect changes
      queryClient.invalidateQueries({ queryKey: ['operational-efficiency'] })
    }
  })

  return {
    ...query,
    executeConsolidation: consolidationMutation.mutate,
    isExecuting: consolidationMutation.isPending,
    executionError: consolidationMutation.error?.message,
    executionResult: consolidationMutation.data
  }
}

// ====== UTILITY HOOKS ======

/**
 * Hook for available sites and SKU groups for filtering
 */
export function useOperationalFilters() {
  const sitesQuery = useQuery({
    queryKey: ['operational-sites'],
    queryFn: getAvailableSites,
    staleTime: 30 * 60 * 1000 // 30 minutes
  })

  const skuGroupsQuery = useQuery({
    queryKey: ['operational-sku-groups'],
    queryFn: getAvailableSkuGroups,
    staleTime: 30 * 60 * 1000 // 30 minutes
  })

  return {
    sites: sitesQuery.data || [],
    skuGroups: skuGroupsQuery.data || [],
    isLoadingSites: sitesQuery.isLoading,
    isLoadingSkuGroups: skuGroupsQuery.isLoading,
    sitesError: sitesQuery.error?.message,
    skuGroupsError: skuGroupsQuery.error?.message
  }
}

/**
 * Hook for operational summary and alerts
 */
export function useOperationalSummary(filters?: OperationalEfficiencyFilters) {
  return useQuery({
    queryKey: ['operational-summary', filters],
    queryFn: () => getOperationalSummary(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 10 * 60 * 1000 // 10 minutes for alerts
  })
}

/**
 * Hook for data export functionality
 */
export function useOperationalExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const exportData = useCallback(async (
    format: 'csv' | 'pdf',
    filters?: OperationalEfficiencyFilters
  ) => {
    setIsExporting(true)
    setExportError(null)
    
    try {
      const result = await exportOperationalReport(format, filters)
      // Trigger download
      const link = document.createElement('a')
      link.href = result.download_url
      link.download = `operational-efficiency-${format}-${new Date().toISOString().split('T')[0]}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Export failed'
      setExportError(errorMessage)
      throw error
    } finally {
      setIsExporting(false)
    }
  }, [])

  return {
    exportData,
    isExporting,
    exportError
  }
}

/**
 * Hook for manual data refresh from source systems
 */
export function useOperationalRefresh() {
  const queryClient = useQueryClient()
  
  const refreshMutation = useMutation({
    mutationFn: refreshOperationalData,
    onSuccess: (data) => {
      // Invalidate all operational queries to trigger refetch
      queryClient.invalidateQueries({ queryKey: ['operational-efficiency'] })
      queryClient.invalidateQueries({ queryKey: ['throughput-metrics'] })
      queryClient.invalidateQueries({ queryKey: ['consumption-rate'] })
      queryClient.invalidateQueries({ queryKey: ['labor-forecast'] })
      queryClient.invalidateQueries({ queryKey: ['dock-to-stock'] })
      queryClient.invalidateQueries({ queryKey: ['pick-rate'] })
      queryClient.invalidateQueries({ queryKey: ['consolidation-opportunities'] })
      
      // Optional: Set up polling for refresh status if needed
      if ((data as any)?.status === 'processing') {
        // Could implement status polling here
      }
    }
  })

  return {
    refreshData: refreshMutation.mutate,
    isRefreshing: refreshMutation.isPending,
    refreshError: refreshMutation.error?.message,
    refreshStatus: refreshMutation.data
  }
}

// ====== COMBINED OPERATIONAL DASHBOARD HOOK ======

/**
 * Comprehensive hook that combines all operational data needs for the dashboard
 */
export function useOperationalDashboard(options: UseOperationalDataOptions = {}) {
  const operationalData = useOperationalData(options)
  const summary = useOperationalSummary(operationalData.filters)
  const filters = useOperationalFilters()
  const exportHook = useOperationalExport()
  const refreshHook = useOperationalRefresh()

  // Combined loading state
  const isLoading = operationalData.isLoading || summary.isLoading
  const hasError = operationalData.error || summary.error

  // Quick actions
  const quickActions = useMemo(() => ({
    refresh: () => {
      operationalData.refresh()
      refreshHook.refreshData()
    },
    export: exportHook.exportData,
    updateFilters: operationalData.updateFilters,
    resetFilters: operationalData.resetFilters
  }), [operationalData, exportHook, refreshHook])

  return {
    // Main data
    operationalData: operationalData.data,
    summary: summary.data,
    filters: operationalData.filters,
    
    // Filter options
    availableSites: filters.sites,
    availableSkuGroups: filters.skuGroups,
    
    // State
    isLoading,
    error: hasError,
    lastRefresh: operationalData.lastRefresh,
    
    // Actions
    ...quickActions,
    
    // Export state
    isExporting: exportHook.isExporting,
    exportError: exportHook.exportError,
    
    // Refresh state
    isRefreshing: refreshHook.isRefreshing,
    refreshError: refreshHook.refreshError
  }
}