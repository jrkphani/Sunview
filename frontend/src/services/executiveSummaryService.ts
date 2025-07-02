import { api } from './api'
import type {
  ExecutiveSummaryData,
  ForecastAccuracyData,
  TopSKUErrorData,
  TruckUtilizationData,
  DOHData,
  OTIFData,
  AlertData,
  DrillDownFilters,
  ExportResponse
} from '@/types/api'

export const executiveSummaryService = {
  // Get complete executive summary data
  async getExecutiveSummaryData(filters?: DrillDownFilters): Promise<ExecutiveSummaryData> {
    const response = await api.get('/api/v1/executive-summary', {
      params: filters
    })
    return response.data
  },

  // Forecast Accuracy KPIs
  async getForecastAccuracyData(filters?: DrillDownFilters): Promise<ForecastAccuracyData> {
    const response = await api.get('/api/v1/executive-summary/forecast-accuracy', {
      params: filters
    })
    return response.data
  },

  async getForecastAccuracyDrillDown(
    type: 'sku' | 'site' | 'date',
    itemId?: string,
    filters?: DrillDownFilters
  ): Promise<any> {
    const response = await api.get(`/api/v1/executive-summary/forecast-accuracy/drill-down/${type}`, {
      params: { item_id: itemId, ...filters }
    })
    return response.data
  },

  // Top SKU Errors
  async getTopSKUErrors(limit: number = 10, filters?: DrillDownFilters): Promise<TopSKUErrorData[]> {
    const response = await api.get('/api/v1/executive-summary/top-sku-errors', {
      params: { limit, ...filters }
    })
    return response.data
  },

  async getSKUHistoricalComparison(sku: string, periods: number = 6): Promise<any> {
    const response = await api.get(`/api/v1/executive-summary/sku-historical/${sku}`, {
      params: { periods }
    })
    return response.data
  },

  // Truck Utilization
  async getTruckUtilizationData(filters?: DrillDownFilters): Promise<TruckUtilizationData> {
    const response = await api.get('/api/v1/executive-summary/truck-utilization', {
      params: filters
    })
    return response.data
  },

  async getConsolidationOpportunities(filters?: DrillDownFilters): Promise<any> {
    const response = await api.get('/api/v1/executive-summary/consolidation-opportunities', {
      params: filters
    })
    return response.data
  },

  // Days of Inventory on Hand (DOH)
  async getDOHData(filters?: DrillDownFilters): Promise<DOHData> {
    const response = await api.get('/api/v1/executive-summary/doh', {
      params: filters
    })
    return response.data
  },

  async getSKUAgingDetails(skuGroup: string, filters?: DrillDownFilters): Promise<any> {
    const response = await api.get(`/api/v1/executive-summary/sku-aging/${skuGroup}`, {
      params: filters
    })
    return response.data
  },

  // On-Time In-Full (OTIF)
  async getOTIFData(filters?: DrillDownFilters): Promise<OTIFData> {
    const response = await api.get('/api/v1/executive-summary/otif', {
      params: filters
    })
    return response.data
  },

  async getSLAComplianceDetails(site?: string, filters?: DrillDownFilters): Promise<any> {
    const response = await api.get('/api/v1/executive-summary/sla-compliance', {
      params: { site, ...filters }
    })
    return response.data
  },

  // Key Alerts
  async getKeyAlerts(limit: number = 5, severity?: string): Promise<AlertData[]> {
    const response = await api.get('/api/v1/executive-summary/alerts', {
      params: { limit, severity }
    })
    return response.data
  },

  async acknowledgeAlert(alertId: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/api/v1/executive-summary/alerts/${alertId}/acknowledge`)
    return response.data
  },

  async resolveAlert(alertId: string, resolution: string): Promise<{ success: boolean; message: string }> {
    const response = await api.patch(`/api/v1/executive-summary/alerts/${alertId}/resolve`, {
      resolution
    })
    return response.data
  },

  // Export functionality
  async exportExecutiveSummary(
    format: 'json' | 'csv' | 'pdf' = 'pdf',
    filters?: DrillDownFilters
  ): Promise<ExportResponse> {
    const response = await api.get('/api/v1/executive-summary/export', {
      params: { format, ...filters },
      responseType: format === 'json' ? 'json' : 'blob'
    })
    return response.data
  },

  async exportSectionData(
    section: 'forecast-accuracy' | 'top-sku-errors' | 'truck-utilization' | 'doh' | 'otif' | 'alerts',
    format: 'json' | 'csv' = 'csv',
    filters?: DrillDownFilters
  ): Promise<ExportResponse> {
    const response = await api.get(`/api/v1/executive-summary/${section}/export`, {
      params: { format, ...filters },
      responseType: format === 'json' ? 'json' : 'blob'
    })
    return response.data
  },

  // Real-time updates
  async refreshData(): Promise<{ success: boolean; last_updated: string }> {
    const response = await api.post('/api/v1/executive-summary/refresh')
    return response.data
  }
}