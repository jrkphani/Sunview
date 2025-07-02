import { apiRequest } from './api'
import type { 
  OperationalEfficiencyMetrics,
  OperationalEfficiencyFilters,
  ThroughputMetrics,
  ConsumptionRateData,
  LaborForecastData,
  DockToStockData,
  PickRateMetrics,
  ConsolidationOpportunity,
  ApiResponse,
  PaginatedResponse
} from '../types/api'

// ====== OPERATIONAL EFFICIENCY API ENDPOINTS ======

/**
 * Fetch comprehensive operational efficiency metrics
 */
export const getOperationalEfficiencyMetrics = async (
  filters?: OperationalEfficiencyFilters
): Promise<OperationalEfficiencyMetrics> => {
  const params = new URLSearchParams()
  
  if (filters?.sites?.length) {
    params.append('sites', filters.sites.join(','))
  }
  
  if (filters?.sku_groups?.length) {
    params.append('sku_groups', filters.sku_groups.join(','))
  }
  
  if (filters?.date_range) {
    params.append('start_date', filters.date_range.start_date)
    params.append('end_date', filters.date_range.end_date)
  }
  
  if (filters?.shifts?.length) {
    params.append('shifts', filters.shifts.join(','))
  }
  
  if (filters?.outliers_only !== undefined) {
    params.append('outliers_only', filters.outliers_only.toString())
  }
  
  if (filters?.performance_threshold !== undefined) {
    params.append('performance_threshold', filters.performance_threshold.toString())
  }

  const response: ApiResponse<OperationalEfficiencyMetrics> = await apiRequest.get(
    `/api/v1/operational/efficiency?${params.toString()}`
  )
  
  return response.data
}

/**
 * Fetch throughput comparison data (forecasted vs actual)
 */
export const getThroughputMetrics = async (
  filters?: Partial<OperationalEfficiencyFilters>
): Promise<ThroughputMetrics[]> => {
  const params = new URLSearchParams()
  
  if (filters?.sites?.length) {
    params.append('sites', filters.sites.join(','))
  }
  
  if (filters?.sku_groups?.length) {
    params.append('sku_groups', filters.sku_groups.join(','))
  }
  
  if (filters?.date_range) {
    params.append('start_date', filters.date_range.start_date)
    params.append('end_date', filters.date_range.end_date)
  }
  
  if (filters?.shifts?.length) {
    params.append('shifts', filters.shifts.join(','))
  }

  const response: ApiResponse<ThroughputMetrics[]> = await apiRequest.get(
    `/api/v1/operational/throughput?${params.toString()}`
  )
  
  return response.data
}

/**
 * Fetch consumption rate analysis data
 */
export const getConsumptionRateData = async (
  filters?: Partial<OperationalEfficiencyFilters> & {
    view_by?: 'sku' | 'segment' | 'warehouse'
    category?: string
  }
): Promise<ConsumptionRateData[]> => {
  const params = new URLSearchParams()
  
  if (filters?.sites?.length) {
    params.append('sites', filters.sites.join(','))
  }
  
  if (filters?.date_range) {
    params.append('start_date', filters.date_range.start_date)
    params.append('end_date', filters.date_range.end_date)
  }
  
  if (filters?.view_by) {
    params.append('view_by', filters.view_by)
  }
  
  if (filters?.category) {
    params.append('category', filters.category)
  }

  const response: ApiResponse<ConsumptionRateData[]> = await apiRequest.get(
    `/api/v1/operational/consumption-rates?${params.toString()}`
  )
  
  return response.data
}

/**
 * Fetch labor forecast vs actual data
 */
export const getLaborForecastData = async (
  filters?: Partial<OperationalEfficiencyFilters>
): Promise<LaborForecastData[]> => {
  const params = new URLSearchParams()
  
  if (filters?.sites?.length) {
    params.append('sites', filters.sites.join(','))
  }
  
  if (filters?.date_range) {
    params.append('start_date', filters.date_range.start_date)
    params.append('end_date', filters.date_range.end_date)
  }
  
  if (filters?.shifts?.length) {
    params.append('shifts', filters.shifts.join(','))
  }

  const response: ApiResponse<LaborForecastData[]> = await apiRequest.get(
    `/api/v1/operational/labor-forecast?${params.toString()}`
  )
  
  return response.data
}

/**
 * Fetch dock-to-stock processing time data
 */
export const getDockToStockData = async (
  filters?: Partial<OperationalEfficiencyFilters> & {
    group_by?: 'site' | 'sku_group' | 'delay_category'
  }
): Promise<DockToStockData[]> => {
  const params = new URLSearchParams()
  
  if (filters?.sites?.length) {
    params.append('sites', filters.sites.join(','))
  }
  
  if (filters?.sku_groups?.length) {
    params.append('sku_groups', filters.sku_groups.join(','))
  }
  
  if (filters?.date_range) {
    params.append('start_date', filters.date_range.start_date)
    params.append('end_date', filters.date_range.end_date)
  }
  
  if (filters?.outliers_only !== undefined) {
    params.append('outliers_only', filters.outliers_only.toString())
  }
  
  if (filters?.group_by) {
    params.append('group_by', filters.group_by)
  }

  const response: ApiResponse<DockToStockData[]> = await apiRequest.get(
    `/api/v1/operational/dock-to-stock?${params.toString()}`
  )
  
  return response.data
}

/**
 * Fetch pick rate performance data by shift
 */
export const getPickRateMetrics = async (
  filters?: Partial<OperationalEfficiencyFilters> & {
    performance_grade?: 'excellent' | 'good' | 'needs_improvement' | 'poor'
  }
): Promise<PickRateMetrics[]> => {
  const params = new URLSearchParams()
  
  if (filters?.sites?.length) {
    params.append('sites', filters.sites.join(','))
  }
  
  if (filters?.date_range) {
    params.append('start_date', filters.date_range.start_date)
    params.append('end_date', filters.date_range.end_date)
  }
  
  if (filters?.shifts?.length) {
    params.append('shifts', filters.shifts.join(','))
  }
  
  if (filters?.performance_grade) {
    params.append('performance_grade', filters.performance_grade)
  }
  
  if (filters?.performance_threshold !== undefined) {
    params.append('performance_threshold', filters.performance_threshold.toString())
  }

  const response: ApiResponse<PickRateMetrics[]> = await apiRequest.get(
    `/api/v1/operational/pick-rates?${params.toString()}`
  )
  
  return response.data
}

/**
 * Fetch truck consolidation opportunities
 */
export const getConsolidationOpportunities = async (
  filters?: {
    min_savings?: number
    action?: 'consolidate' | 'reschedule' | 'optimize_route'
    feasibility_threshold?: number
    timeline_threshold?: number
  }
): Promise<ConsolidationOpportunity[]> => {
  const params = new URLSearchParams()
  
  if (filters?.min_savings !== undefined) {
    params.append('min_savings', filters.min_savings.toString())
  }
  
  if (filters?.action) {
    params.append('action', filters.action)
  }
  
  if (filters?.feasibility_threshold !== undefined) {
    params.append('feasibility_threshold', filters.feasibility_threshold.toString())
  }
  
  if (filters?.timeline_threshold !== undefined) {
    params.append('timeline_threshold', filters.timeline_threshold.toString())
  }

  const response: ApiResponse<ConsolidationOpportunity[]> = await apiRequest.get(
    `/api/v1/operational/consolidation-opportunities?${params.toString()}`
  )
  
  return response.data
}

// ====== ACTION ENDPOINTS ======

/**
 * Execute consolidation for selected opportunities
 */
export const executeConsolidation = async (
  opportunities: ConsolidationOpportunity[]
): Promise<{
  consolidation_id: string
  estimated_savings: number
  scheduled_date: string
  affected_routes: string[]
}> => {
  const response = await apiRequest.post('/api/v1/operational/consolidation/execute', {
    opportunities: opportunities.map(op => ({
      route_id: op.route_id,
      destination: op.destination,
      action: op.recommended_action
    }))
  }) as {
    consolidation_id: string
    estimated_savings: number
    scheduled_date: string
    affected_routes: string[]
  }
  
  return response
}

/**
 * Generate rescheduling recommendations for underperforming shifts
 */
export const generateRescheduleRecommendations = async (
  shifts: LaborForecastData[]
): Promise<{
  recommendations: Array<{
    shift_id: string
    current_efficiency: number
    recommended_action: string
    estimated_improvement: string
    priority: 'high' | 'medium' | 'low'
  }>
  total_cost_impact: number
}> => {
  const response = await apiRequest.post('/api/v1/operational/labor/reschedule-recommendations', {
    shifts: shifts.map(shift => ({
      site_id: shift.site_id,
      shift_date: shift.shift_date,
      shift_type: shift.shift_type,
      efficiency_percentage: shift.efficiency_percentage,
      variance_percentage: shift.variance_percentage
    }))
  }) as {
    recommendations: Array<{
      shift_id: string
      current_efficiency: number
      recommended_action: string
      estimated_improvement: string
      priority: 'high' | 'medium' | 'low'
    }>
    total_cost_impact: number
  }
  
  return response
}

/**
 * Investigate processing delay outliers
 */
export const investigateProcessingDelays = async (
  outliers: DockToStockData[]
): Promise<{
  analysis: {
    common_delay_patterns: string[]
    root_cause_analysis: string[]
    recommended_actions: string[]
    potential_impact: number
  }
  detailed_breakdown: Array<{
    delay_category: string
    frequency: number
    avg_delay_hours: number
    cost_impact: number
  }>
}> => {
  const response = await apiRequest.post('/api/v1/operational/processing/investigate-delays', {
    outliers: outliers.map(outlier => ({
      site_id: outlier.site_id,
      sku_group: outlier.sku_group,
      processing_time_hours: outlier.processing_time_hours,
      delay_category: outlier.delay_category,
      delay_reason: outlier.delay_reason,
      impact_score: outlier.impact_score
    }))
  }) as {
    analysis: {
      common_delay_patterns: string[]
      root_cause_analysis: string[]
      recommended_actions: string[]
      potential_impact: number
    }
    detailed_breakdown: Array<{
      delay_category: string
      frequency: number
      avg_delay_hours: number
      cost_impact: number
    }>
  }
  
  return response
}

/**
 * Optimize shift performance
 */
export const optimizeShiftPerformance = async (
  shift: PickRateMetrics
): Promise<{
  optimization_plan: {
    current_metrics: {
      picks_per_hour: number
      efficiency_percentage: number
      equipment_utilization: number
    }
    target_metrics: {
      picks_per_hour: number
      efficiency_percentage: number
      equipment_utilization: number
    }
    recommended_actions: string[]
    estimated_timeline: string
    expected_improvement: string
  }
  implementation_steps: Array<{
    step: string
    description: string
    estimated_effort: string
    expected_impact: string
  }>
}> => {
  const response = await apiRequest.post('/api/v1/operational/pick-rates/optimize-shift', {
    site_id: shift.site_id,
    shift_type: shift.shift_type,
    current_performance: {
      picks_per_hour: shift.picks_per_hour,
      efficiency_percentage: shift.efficiency_percentage,
      equipment_utilization: shift.equipment_utilization,
      performance_grade: shift.performance_grade
    }
  }) as {
    optimization_plan: {
      current_metrics: {
        picks_per_hour: number
        efficiency_percentage: number
        equipment_utilization: number
      }
      target_metrics: {
        picks_per_hour: number
        efficiency_percentage: number
        equipment_utilization: number
      }
      recommended_actions: string[]
      estimated_timeline: string
      expected_improvement: string
    }
    implementation_steps: Array<{
      step: string
      description: string
      estimated_effort: string
      expected_impact: string
    }>
  }
  
  return response
}

// ====== EXPORT & REPORTING ======

/**
 * Export operational efficiency report
 */
export const exportOperationalReport = async (
  format: 'csv' | 'pdf',
  filters?: OperationalEfficiencyFilters
): Promise<{
  download_url: string
  file_size_bytes: number
  expires_at: string
}> => {
  const params = new URLSearchParams()
  params.append('format', format)
  
  if (filters?.sites?.length) {
    params.append('sites', filters.sites.join(','))
  }
  
  if (filters?.date_range) {
    params.append('start_date', filters.date_range.start_date)
    params.append('end_date', filters.date_range.end_date)
  }

  const response = await apiRequest.get(
    `/api/v1/operational/export?${params.toString()}`
  ) as {
    download_url: string
    file_size_bytes: number
    expires_at: string
  }
  
  return response
}

/**
 * Refresh operational data from source systems
 */
export const refreshOperationalData = async (): Promise<{
  refresh_id: string
  estimated_completion: string
  metrics_updated: number
  status: 'processing' | 'completed' | 'failed'
}> => {
  const response = await apiRequest.post('/api/v1/operational/refresh') as {
    refresh_id: string
    estimated_completion: string
    metrics_updated: number
    status: 'processing' | 'completed' | 'failed'
  }
  return response
}

// ====== UTILITY FUNCTIONS ======

/**
 * Get available sites for filtering
 */
export const getAvailableSites = async (): Promise<Array<{
  site_id: string
  site_name: string
  active: boolean
}>> => {
  const response: ApiResponse<Array<{
    site_id: string
    site_name: string
    active: boolean
  }>> = await apiRequest.get('/api/v1/operational/sites')
  
  return response.data
}

/**
 * Get available SKU groups for filtering
 */
export const getAvailableSkuGroups = async (): Promise<Array<{
  sku_group: string
  description: string
  item_count: number
}>> => {
  const response: ApiResponse<Array<{
    sku_group: string
    description: string
    item_count: number
  }>> = await apiRequest.get('/api/v1/operational/sku-groups')
  
  return response.data
}

/**
 * Get operational efficiency summary statistics
 */
export const getOperationalSummary = async (
  filters?: OperationalEfficiencyFilters
): Promise<{
  overview: {
    total_sites: number
    total_shifts_analyzed: number
    avg_throughput_accuracy: number
    avg_labor_efficiency: number
    total_consolidation_savings: number
  }
  trends: {
    throughput_trend: 'improving' | 'declining' | 'stable'
    labor_efficiency_trend: 'improving' | 'declining' | 'stable'
    processing_time_trend: 'improving' | 'declining' | 'stable'
  }
  alerts: Array<{
    type: 'throughput' | 'labor' | 'processing' | 'consolidation'
    severity: 'high' | 'medium' | 'low'
    message: string
    affected_sites: string[]
  }>
}> => {
  const params = new URLSearchParams()
  
  if (filters?.sites?.length) {
    params.append('sites', filters.sites.join(','))
  }
  
  if (filters?.date_range) {
    params.append('start_date', filters.date_range.start_date)
    params.append('end_date', filters.date_range.end_date)
  }

  const response = await apiRequest.get(
    `/api/v1/operational/summary?${params.toString()}`
  ) as {
    overview: {
      total_sites: number
      total_shifts_analyzed: number
      avg_throughput_accuracy: number
      avg_labor_efficiency: number
      total_consolidation_savings: number
    }
    trends: {
      throughput_trend: 'improving' | 'declining' | 'stable'
      labor_efficiency_trend: 'improving' | 'declining' | 'stable'
      processing_time_trend: 'improving' | 'declining' | 'stable'
    }
    alerts: Array<{
      type: 'throughput' | 'labor' | 'processing' | 'consolidation'
      severity: 'high' | 'medium' | 'low'
      message: string
      affected_sites: string[]
    }>
  }
  
  return response
}