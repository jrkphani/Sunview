import * as React from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { insightService } from '../services/insightService'
import { queryKeys, REFETCH_INTERVALS } from '../lib/react-query'
import type { 
  InsightCategory,
  Priority,
  InsightStatus,
  InsightFilters
} from '../types/api'

// Main Insights Hook
export const useInsights = (
  filters?: InsightFilters,
  options?: {
    enabled?: boolean
    refetchInterval?: number | false
  }
) => {
  return useQuery({
    queryKey: queryKeys.insights.list(filters || {}),
    queryFn: () => insightService.getInsights(filters),
    staleTime: 10 * 60 * 1000, // Insights don't change frequently
    refetchInterval: options?.refetchInterval ?? REFETCH_INTERVALS.INSIGHTS,
    enabled: options?.enabled ?? true,
  })
}

// Insight Detail Hook
export const useInsightDetail = (
  id: string,
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: queryKeys.insights.detail(id),
    queryFn: () => insightService.getInsightDetails(id),
    staleTime: 15 * 60 * 1000, // Details are even more stable
    refetchInterval: false, // Don't auto-refresh detail views
    enabled: options?.enabled ?? !!id,
  })
}

// Category Summary Hook
export const useCategorySummary = (options?: {
  enabled?: boolean
}) => {
  return useQuery({
    queryKey: queryKeys.insights.categories,
    queryFn: () => insightService.getCategorySummary(),
    staleTime: 15 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.INSIGHTS,
    enabled: options?.enabled ?? true,
  })
}

// Insight Statistics Hook
export const useInsightStatistics = (options?: {
  enabled?: boolean
}) => {
  return useQuery({
    queryKey: queryKeys.insights.statistics,
    queryFn: () => insightService.getInsightStatistics(),
    staleTime: 10 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.INSIGHTS,
    enabled: options?.enabled ?? true,
  })
}

// Filtered Insights Hook - for specific filters
export const useFilteredInsights = (
  filters: {
    category?: InsightCategory | 'all'
    status?: InsightStatus | 'all'
    priority?: Priority | 'all'
    showOnlyNew?: boolean
  },
  options?: {
    enabled?: boolean
  }
) => {
  return useQuery({
    queryKey: ['insights', 'filtered', filters],
    queryFn: () => insightService.getFilteredInsights(filters),
    staleTime: 10 * 60 * 1000,
    refetchInterval: REFETCH_INTERVALS.INSIGHTS,
    enabled: options?.enabled ?? true,
  })
}

// Update Insight Status Mutation
export const useUpdateInsightStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InsightStatus }) =>
      insightService.updateInsightStatus(id, status),
    onSuccess: (updatedInsight) => {
      // Update the insight in all relevant queries
      queryClient.setQueryData(
        queryKeys.insights.detail(updatedInsight.id),
        updatedInsight
      )
      
      // Invalidate list queries to refetch with updated data
      queryClient.invalidateQueries({ queryKey: queryKeys.insights.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.insights.statistics })
    },
    onError: (error) => {
      console.error('Failed to update insight status:', error)
    },
  })
}

// Mark as Reviewed Mutation
export const useMarkAsReviewed = () => {
  const updateStatus = useUpdateInsightStatus()
  
  return {
    ...updateStatus,
    mutate: (id: string) => updateStatus.mutate({ id, status: 'reviewed' }),
    mutateAsync: (id: string) => updateStatus.mutateAsync({ id, status: 'reviewed' }),
  }
}

// Mark as Implemented Mutation
export const useMarkAsImplemented = () => {
  const updateStatus = useUpdateInsightStatus()
  
  return {
    ...updateStatus,
    mutate: (id: string) => updateStatus.mutate({ id, status: 'implemented' }),
    mutateAsync: (id: string) => updateStatus.mutateAsync({ id, status: 'implemented' }),
  }
}

// Dismiss Insight Mutation
export const useDismissInsight = () => {
  const updateStatus = useUpdateInsightStatus()
  
  return {
    ...updateStatus,
    mutate: (id: string) => updateStatus.mutate({ id, status: 'dismissed' }),
    mutateAsync: (id: string) => updateStatus.mutateAsync({ id, status: 'dismissed' }),
  }
}

// Combined Insights Dashboard Hook
export const useInsightsDashboard = (
  options?: {
    includeStatistics?: boolean
    includeCategories?: boolean
    priorityFilter?: Priority
  }
) => {
  const insights = useInsights({
    priority: options?.priorityFilter,
    limit: 20, // Dashboard view limit
  })

  const statistics = useInsightStatistics({
    enabled: options?.includeStatistics ?? true
  })

  const categories = useCategorySummary({
    enabled: options?.includeCategories ?? true
  })

  const newInsights = useFilteredInsights({
    showOnlyNew: true
  })

  const highPriorityInsights = useFilteredInsights({
    priority: 'high'
  })

  return {
    insights,
    statistics: options?.includeStatistics ? statistics : undefined,
    categories: options?.includeCategories ? categories : undefined,
    newInsights,
    highPriorityInsights,
    isLoading: insights.isLoading || 
                (options?.includeStatistics && statistics.isLoading) ||
                (options?.includeCategories && categories.isLoading),
    isError: insights.isError || 
             (options?.includeStatistics && statistics.isError) ||
             (options?.includeCategories && categories.isError),
    // Computed metrics
    totalInsights: statistics?.data?.total_insights ?? 0,
    newInsightsCount: statistics?.data?.new_insights ?? 0,
    potentialSavings: statistics?.data?.potential_monthly_savings ?? 0,
  }
}

// High Priority Insights Hook - for alerting/notifications
export const useHighPriorityInsights = () => {
  return useQuery({
    queryKey: ['insights', 'high-priority', 'monitoring'],
    queryFn: () => insightService.getFilteredInsights({ priority: 'high', status: 'new' }),
    staleTime: 2 * 60 * 1000, // Check more frequently for high priority
    refetchInterval: REFETCH_INTERVALS.FREQUENT,
    refetchOnWindowFocus: true,
  })
}

// Category-specific Insights Hook
export const useCategoryInsights = (
  category: InsightCategory,
  options?: {
    enabled?: boolean
    includeImplemented?: boolean
  }
) => {
  const insights = useFilteredInsights({
    category,
    status: options?.includeImplemented ? undefined : 'new'
  }, {
    enabled: options?.enabled ?? true
  })

  return {
    ...insights,
    // Category-specific computed metrics
    totalInsights: insights.data?.length ?? 0,
    avgImpactScore: insights.data?.reduce((sum, insight) => sum + insight.impact_score, 0) / (insights.data?.length ?? 1),
    avgConfidenceScore: insights.data?.reduce((sum, insight) => sum + insight.confidence_score, 0) / (insights.data?.length ?? 1),
    highImpactInsights: insights.data?.filter(insight => insight.impact_score > 8) ?? [],
  }
}

// Insight Management Hook - for bulk operations
export const useInsightManagement = () => {
  const queryClient = useQueryClient()
  const updateStatus = useUpdateInsightStatus()

  const bulkUpdateStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: InsightStatus }) => {
      const results = await Promise.allSettled(
        ids.map(id => insightService.updateInsightStatus(id, status))
      )
      return results
    },
    onSuccess: () => {
      // Invalidate all insights queries
      queryClient.invalidateQueries({ queryKey: queryKeys.insights.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.insights.statistics })
    },
    onError: (error) => {
      console.error('Failed to bulk update insights:', error)
    },
  })

  return {
    updateStatus,
    bulkUpdateStatus,
    // Helper functions
    bulkReview: (ids: string[]) => bulkUpdateStatus.mutate({ ids, status: 'reviewed' }),
    bulkImplement: (ids: string[]) => bulkUpdateStatus.mutate({ ids, status: 'implemented' }),
    bulkDismiss: (ids: string[]) => bulkUpdateStatus.mutate({ ids, status: 'dismissed' }),
  }
}

// Real-time New Insights Hook - for notifications
export const useNewInsightsMonitoring = () => {
  const prevCountRef = React.useRef<number>(0)
  
  const newInsights = useQuery({
    queryKey: ['insights', 'new', 'monitoring'],
    queryFn: () => insightService.getFilteredInsights({ showOnlyNew: true }),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: REFETCH_INTERVALS.FREQUENT,
    refetchOnWindowFocus: true,
  })

  const currentCount = newInsights.data?.length ?? 0
  const hasNewInsights = currentCount > prevCountRef.current
  
  React.useEffect(() => {
    if (newInsights.isSuccess) {
      prevCountRef.current = currentCount
    }
  }, [currentCount, newInsights.isSuccess])

  return {
    ...newInsights,
    hasNewInsights,
    newInsightsCount: currentCount,
    previousCount: prevCountRef.current,
  }
}