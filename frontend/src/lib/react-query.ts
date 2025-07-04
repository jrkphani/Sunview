import { QueryClient, DefaultOptions } from '@tanstack/react-query'

// Background refetch intervals for different data types (in milliseconds)
export const REFETCH_INTERVALS = {
  // Real-time data (30 seconds)
  REAL_TIME: 30 * 1000,
  
  // Frequently changing data (1 minute)
  FREQUENT: 60 * 1000,
  
  // Dashboard KPIs (2 minutes)
  DASHBOARD: 2 * 60 * 1000,
  
  // Analytics data (5 minutes)
  ANALYTICS: 5 * 60 * 1000,
  
  // System status (30 seconds)
  SYSTEM_STATUS: 30 * 1000,
  
  // Insights (rarely change, 10 minutes)
  INSIGHTS: 10 * 60 * 1000,
  
  // Forecasts (5 minutes)
  FORECASTS: 5 * 60 * 1000,
  
  // Configuration/static data (disabled)
  STATIC: false,
} as const

// Default query options with comprehensive error handling and retry logic
const defaultQueryOptions: DefaultOptions = {
  queries: {
    // Retry configuration
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false
      }
      
      // Retry up to 3 times for 5xx errors and network errors
      return failureCount < 3
    },
    
    // Exponential backoff with jitter
    retryDelay: (attemptIndex) => {
      const baseDelay = 1000 // 1 second
      const maxDelay = 30000 // 30 seconds
      const exponentialDelay = Math.min(baseDelay * (2 ** attemptIndex), maxDelay)
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * exponentialDelay
      return exponentialDelay + jitter
    },
    
    // Stale time - how long data is considered fresh
    staleTime: 5 * 60 * 1000, // 5 minutes
    
    // Cache time - how long data stays in cache after component unmounts
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    
    // Refetch behavior
    refetchOnWindowFocus: false, // Don't refetch on window focus by default
    refetchOnReconnect: true, // Refetch when reconnecting to internet
    refetchOnMount: true, // Refetch when component mounts
    
    // Background refetching - different intervals for different data types
    // This will be overridden by individual queries based on data type
    refetchInterval: false, // Disabled by default, set per query type
    
    // Network detection
    networkMode: 'online', // Only run queries when online
  },
  
  mutations: {
    // Retry mutations once on network errors
    retry: (failureCount, error: any) => {
      if (error?.code === 'NETWORK_ERROR' && failureCount < 1) {
        return true
      }
      return false
    },
    
    retryDelay: 2000, // 2 seconds
    networkMode: 'online',
  },
}

// Query client with error handling
export const queryClient = new QueryClient({
  defaultOptions: defaultQueryOptions,
  
  // Global error handler
  // Note: This is deprecated in newer versions, use individual query error handling instead
})

// Query keys factory for consistent query key management
export const queryKeys = {
  // Dashboard
  dashboard: {
    kpis: ['dashboard', 'kpis'] as const,
    businessImpact: ['dashboard', 'business-impact'] as const,
    systemStatus: ['dashboard', 'system-status'] as const,
  },
  
  // KPIs
  kpis: {
    all: ['kpis'] as const,
    dashboard: ['kpis', 'dashboard'] as const,
    trends: (metric: string, timePeriod: string) => ['kpis', 'trends', metric, timePeriod] as const,
    accuracy: (timePeriod: string, breakdown: string) => ['kpis', 'accuracy', timePeriod, breakdown] as const,
    efficiency: ['kpis', 'efficiency'] as const,
    businessImpact: ['kpis', 'business-impact'] as const,
    anomalies: ['kpis', 'anomalies'] as const,
  },
  
  // Forecasts
  forecasts: {
    all: ['forecasts'] as const,
    list: (filters: Record<string, any>) => ['forecasts', 'list', filters] as const,
    volume: (timeHorizon: string) => ['forecasts', 'volume', timeHorizon] as const,
    summary: ['forecasts', 'summary'] as const,
    accuracy: (startDate?: string, endDate?: string) => ['forecasts', 'accuracy', startDate, endDate] as const,
    trends: (skuId: string, daysBack: number) => ['forecasts', 'trends', skuId, daysBack] as const,
  },
  
  // Insights
  insights: {
    all: ['insights'] as const,
    list: (filters: Record<string, any>) => ['insights', 'list', filters] as const,
    detail: (id: string) => ['insights', 'detail', id] as const,
    categories: ['insights', 'categories'] as const,
    statistics: ['insights', 'statistics'] as const,
  },
  
  // Analytics
  analytics: {
    all: ['analytics'] as const,
    sku: (filters: Record<string, any>) => ['analytics', 'sku', filters] as const,
    categories: ['analytics', 'categories'] as const,
    modelMetrics: (timeRange: string) => ['analytics', 'model-metrics', timeRange] as const,
    trends: {
      accuracy: (params: Record<string, any>) => ['analytics', 'trends', 'accuracy', params] as const,
      processing: (params: Record<string, any>) => ['analytics', 'trends', 'processing', params] as const,
      volume: (params: Record<string, any>) => ['analytics', 'trends', 'volume', params] as const,
    },
    advanced: ['analytics', 'advanced'] as const,
  },
  
  // System
  system: {
    all: ['system'] as const,
    status: ['system', 'status'] as const,
    health: (service?: string) => service ? ['system', 'health', service] as const : ['system', 'health'] as const,
    dataFreshness: ['system', 'data-freshness'] as const,
    alerts: (severity?: string) => ['system', 'alerts', severity] as const,
    config: ['system', 'config'] as const,
  },
}

// Utility functions for error handling
export const isNetworkError = (error: any): boolean => {
  return error?.code === 'NETWORK_ERROR' || 
         error?.name === 'NetworkError' ||
         !navigator.onLine
}

export const isServerError = (error: any): boolean => {
  const status = error?.response?.status
  return status >= 500 && status < 600
}

export const isClientError = (error: any): boolean => {
  const status = error?.response?.status
  return status >= 400 && status < 500
}

export const getErrorMessage = (error: any): string => {
  // API error with detail
  if (error?.response?.data?.detail) {
    return error.response.data.detail
  }
  
  // API error with message
  if (error?.response?.data?.message) {
    return error.response.data.message
  }
  
  // Network error
  if (isNetworkError(error)) {
    return 'Network connection error. Please check your internet connection.'
  }
  
  // Server error
  if (isServerError(error)) {
    return 'Server error. Please try again later.'
  }
  
  // Client error
  if (isClientError(error)) {
    return 'Request error. Please check your input and try again.'
  }
  
  // Generic error
  return error?.message || 'An unexpected error occurred'
}

// Custom hook for mutation error handling
export const useMutationErrorHandler = () => {
  return (error: any) => {
    const message = getErrorMessage(error)
    
    // You can integrate with toast notifications here
    console.error('Mutation error:', message, error)
    
    // Could also trigger global error state or notifications
  }
}

export default queryClient