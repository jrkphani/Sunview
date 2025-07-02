import { api } from './api'

export type InsightCategory = 'operational_efficiency' | 'strategic_partnership' | 'commercial_opportunity' | 'risk_management'
export type Priority = 'high' | 'medium' | 'low'
export type InsightStatus = 'new' | 'reviewed' | 'implemented' | 'dismissed'

export interface Insight {
  id: string
  category: InsightCategory
  priority: Priority
  title: string
  description: string
  impact_score: number
  confidence_score: number
  created_at: string
  data_sources: string[]
  recommendations: string[]
  expected_benefit?: string
  status?: InsightStatus
  estimated_savings?: number
}

export interface InsightDetail extends Insight {
  detailed_analysis: {
    data_period: string
    samples_analyzed: number
    statistical_significance: number
    key_findings: string[]
  }
  explainability: {
    methodology: string
    confidence_factors: string[]
    limitations: string[]
  }
  implementation_roadmap: Array<{
    phase: string
    actions: string
    resources: string
  }>
}

export interface CategorySummary {
  [key: string]: {
    total_insights: number
    high_priority: number
    avg_impact_score: number
    key_themes: string[]
  }
}

export const insightService = {
  // Get Insights
  async getInsights(params?: {
    categories?: InsightCategory[]
    priority?: Priority
    status?: InsightStatus
    limit?: number
    offset?: number
  }): Promise<Insight[]> {
    const response = await api.get('/api/v1/insights/', { params })
    return response.data
  },

  // Get Insight Details
  async getInsightDetails(id: string): Promise<InsightDetail> {
    const response = await api.get(`/api/v1/insights/${id}`)
    return response.data
  },

  // Get Insight Explainability (deprecated - now included in details)
  async getInsightExplainability(id: string): Promise<any> {
    const response = await api.get(`/api/v1/insights/${id}/explainability`)
    return response.data
  },

  // Get Category Summary
  async getCategorySummary(): Promise<CategorySummary> {
    const response = await api.get('/api/v1/insights/categories/summary')
    return response.data
  },

  // Filter Insights
  async getFilteredInsights(filters: {
    category?: InsightCategory | 'all'
    status?: InsightStatus | 'all'
    priority?: Priority | 'all'
    showOnlyNew?: boolean
  }): Promise<Insight[]> {
    const params: any = {}
    
    if (filters.category && filters.category !== 'all') {
      params.categories = [filters.category as InsightCategory]
    }
    if (filters.status && filters.status !== 'all') {
      params.status = filters.status as InsightStatus
    }
    if (filters.priority && filters.priority !== 'all') {
      params.priority = filters.priority as Priority
    }
    if (filters.showOnlyNew) {
      params.status = 'new'
    }

    const response = await api.get('/api/v1/insights/', { params })
    return response.data
  },

  // Update Insight Status
  async updateInsightStatus(id: string, status: InsightStatus): Promise<Insight> {
    const response = await api.patch(`/api/v1/insights/${id}`, { status })
    return response.data
  },

  // Mark Insight as Reviewed
  async markAsReviewed(id: string): Promise<Insight> {
    return this.updateInsightStatus(id, 'reviewed')
  },

  // Mark Insight as Implemented
  async markAsImplemented(id: string): Promise<Insight> {
    return this.updateInsightStatus(id, 'implemented')
  },

  // Dismiss Insight
  async dismissInsight(id: string): Promise<Insight> {
    return this.updateInsightStatus(id, 'dismissed')
  },

  // Get Insight Statistics
  async getInsightStatistics(): Promise<{
    total_insights: number
    new_insights: number
    pending_review: number
    implemented: number
    dismissed: number
    avg_impact_score: number
    potential_monthly_savings: number
  }> {
    const response = await api.get('/api/v1/insights/statistics')
    return response.data
  }
}