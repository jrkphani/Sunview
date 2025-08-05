import { http, HttpResponse, delay } from 'msw'
import executiveSummaryData from '../mockData/executiveSummary.json'
import forecastsData from '../mockData/forecasts.json'
import insightsData from '../mockData/insights.json'
import kpiData from '../mockData/kpiData.json'
import skuData from '../mockData/skuData.json'
import analyticsData from '../mockData/analytics.json'
import topSkuErrorsData from '../mockData/topSkuErrors.json'
import operationalEfficiencyData from '../mockData/operationalEfficiency.json'
import operationalRealtimeData from '../mockData/operationalRealtime.json'
import warehousePerformanceData from '../mockData/warehousePerformance.json'

// Helper to add realistic delay
const addDelay = () => delay(randomBetween(200, 800))
const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min

export const handlers = [
  // Executive Summary endpoints
  http.get('*/api/v1/executive-summary', async () => {
    await addDelay()
    return HttpResponse.json(executiveSummaryData)
  }),

  http.get('*/api/v1/executive-summary/forecast-accuracy', async () => {
    await addDelay()
    return HttpResponse.json({
      accuracy_metrics: {
        overall_mape: 12.5,
        overall_wape: 8.9,
        by_category: [
          { category: 'Electronics', mape: 10.2, wape: 7.8 },
          { category: 'Furniture', mape: 15.3, wape: 11.2 },
          { category: 'Office Supplies', mape: 11.8, wape: 8.5 }
        ]
      }
    })
  }),

  // KPI endpoints
  http.get('*/api/v1/kpis/dashboard', async () => {
    await addDelay()
    return HttpResponse.json({
      forecast_accuracy: 94.2,
      truck_utilization_improvement: 15.3,
      cost_savings_percentage: 12.8,
      demand_prediction_accuracy: 91.5,
      report_date: new Date().toISOString(),
      business_impact: {
        monthly_cost_savings: 125000,
        improved_delivery_time: 2.5,
        reduced_inventory_holding: 18.2,
        customer_satisfaction_score: 4.6
      }
    })
  }),

  http.get('*/api/v1/kpis/efficiency-metrics', async () => {
    await addDelay()
    return HttpResponse.json({
      truck_utilization: {
        current_rate: 82.3,
        target_rate: 85.0,
        improvement_vs_baseline: 15.2,
        monthly_trend: []
      },
      fill_rate: {
        current_rate: 97.8,
        target_rate: 98.5,
        sku_breakdown: []
      },
      capacity_planning: {
        peak_volume_prediction: 45000,
        capacity_utilization: 78.5,
        optimization_opportunities: ['Shift scheduling', 'Cross-docking']
      },
      cost_efficiency: {
        cost_per_shipment: 42.50,
        savings_vs_baseline: 125000,
        efficiency_grade: 'A'
      }
    })
  }),

  // Forecasts endpoints
  http.get('*/api/v1/forecasts/', async ({ request }) => {
    await addDelay()
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    
    return HttpResponse.json({
      results: forecastsData.forecasts.slice(0, limit),
      count: forecastsData.forecasts.length,
      next: null,
      previous: null
    })
  }),

  http.get('*/api/v1/forecasts/summary', async () => {
    await addDelay()
    return HttpResponse.json({
      total_forecasts: forecastsData.forecasts.length,
      horizons_available: ['1d', '7d', '14d', '28d'],
      last_updated: new Date().toISOString(),
      accuracy_summary: {
        mape_1d: 4.2,
        mape_7d: 8.7,
        mape_14d: 12.3,
        mape_28d: 18.6
      }
    })
  }),

  http.get('*/api/v1/forecasts/:id', async ({ params }) => {
    await addDelay()
    const { id } = params
    const forecast = forecastsData.forecasts.find(f => f.id === id) || forecastsData.forecasts[0]
    
    return HttpResponse.json(forecast)
  }),

  // Insights endpoints
  http.get('*/api/v1/insights/', async ({ request }) => {
    await addDelay()
    const url = new URL(request.url)
    const category = url.searchParams.get('category')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    
    let filteredInsights = insightsData.insights
    if (category) {
      filteredInsights = filteredInsights.filter(i => i.category === category)
    }
    
    return HttpResponse.json({
      results: filteredInsights.slice(0, limit),
      count: filteredInsights.length,
      next: null,
      previous: null
    })
  }),

  http.get('*/api/v1/insights/:id', async ({ params }) => {
    await addDelay()
    const { id } = params
    const insight = insightsData.insights.find(i => i.id === id) || insightsData.insights[0]
    
    return HttpResponse.json(insight)
  }),

  http.get('*/api/v1/insights/:id/explainability', async ({ params }) => {
    await addDelay()
    const { id } = params
    const insight = insightsData.insights.find(i => i.id === id) || insightsData.insights[0]
    
    return HttpResponse.json({
      insight_id: id,
      methodology: insight.methodology,
      data_lineage: insight.data_lineage,
      confidence_factors: insight.confidence_factors,
      assumptions: [
        'Historical patterns remain consistent',
        'No major market disruptions',
        'Current operational constraints continue'
      ]
    })
  }),

  // Analytics endpoints
  http.get('*/api/v1/analytics/sku-performance', async () => {
    await addDelay()
    return HttpResponse.json({
      performance_metrics: skuData.skus.map(sku => ({
        sku_id: sku.sku_id,
        name: sku.name,
        volume: sku.volume_metrics.total_volume,
        growth_rate: sku.trend === 'increasing' ? 0.15 : -0.05,
        forecast_accuracy: 92 + Math.random() * 6
      }))
    })
  }),

  http.get('*/api/v1/analytics/category-performance', async () => {
    await addDelay()
    return HttpResponse.json(analyticsData.portfolio_overview.categories)
  }),

  http.get('*/api/v1/analytics/top-sku-errors', async () => {
    await addDelay()
    return HttpResponse.json(topSkuErrorsData)
  }),

  http.get('*/api/v1/analytics/seasonality', async ({ request }) => {
    await addDelay()
    const url = new URL(request.url)
    const year = parseInt(url.searchParams.get('year') || new Date().getFullYear().toString())
    const metric = url.searchParams.get('metric') || 'accuracy'
    
    // Generate seasonality data dynamically
    const data = []
    const startDate = new Date(year, 0, 1)
    const endDate = new Date(year, 11, 31)
    
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const month = d.getMonth()
      const dayOfWeek = d.getDay()
      
      let value
      if (metric === 'accuracy') {
        // Base accuracy with seasonal variations
        value = 85 + Math.random() * 10
        
        // Holiday season impact (Nov-Dec)
        if (month === 10 || month === 11) {
          value -= 5 + Math.random() * 5
        }
        
        // Summer impact (Jun-Aug)
        if (month >= 5 && month <= 7) {
          value += 3 + Math.random() * 3
        }
        
        // Weekend impact
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          value -= 2 + Math.random() * 3
        }
      } else {
        // Volume metric
        value = 1000 + Math.random() * 500
        
        // Holiday surge
        if (month === 10 || month === 11) {
          value += 500 + Math.random() * 300
        }
        
        // Weekend reduction
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          value *= 0.7
        }
      }
      
      data.push({
        day: d.toISOString().split('T')[0],
        value: Math.max(metric === 'accuracy' ? 70 : 500, Math.min(metric === 'accuracy' ? 100 : 2500, value))
      })
    }
    
    return HttpResponse.json(data)
  }),

  // Operational endpoints
  http.get('*/api/v1/operational/efficiency', async () => {
    await addDelay()
    return HttpResponse.json({
      overall_efficiency: 87.5,
      metrics: {
        pick_rate: { value: 125, unit: 'picks/hour', trend: 'up' },
        dock_to_stock: { value: 2.5, unit: 'hours', trend: 'stable' },
        truck_utilization: { value: 82.3, unit: '%', trend: 'up' }
      }
    })
  }),

  http.get('*/api/v1/operational/warehouse-operations', async () => {
    await addDelay()
    return HttpResponse.json(operationalEfficiencyData.warehouse_operations)
  }),

  http.get('*/api/v1/operational/fulfillment-metrics', async () => {
    await addDelay()
    return HttpResponse.json(operationalEfficiencyData.fulfillment_metrics)
  }),

  http.get('*/api/v1/operational/resource-utilization', async () => {
    await addDelay()
    return HttpResponse.json(operationalEfficiencyData.resource_utilization)
  }),

  http.get('*/api/v1/operational/efficiency-insights', async () => {
    await addDelay()
    return HttpResponse.json({
      insights: operationalEfficiencyData.efficiency_insights,
      total_potential_savings: operationalEfficiencyData.efficiency_insights.reduce(
        (sum, insight) => sum + insight.potential_savings, 0
      )
    })
  }),

  http.get('*/api/v1/operational/cost-analysis', async () => {
    await addDelay()
    return HttpResponse.json(operationalEfficiencyData.cost_analysis)
  }),

  http.get('*/api/v1/operational/benchmarks', async () => {
    await addDelay()
    return HttpResponse.json(operationalEfficiencyData.benchmarks)
  }),

  http.get('*/api/v1/operational/warehouse/:id', async ({ params }) => {
    await addDelay()
    const { id } = params
    const warehouse = operationalEfficiencyData.warehouse_operations.warehouses.find(
      w => w.id === id
    )
    
    if (!warehouse) {
      return new HttpResponse(null, { status: 404 })
    }
    
    return HttpResponse.json(warehouse)
  }),

  http.get('*/api/v1/operational/realtime/current', async () => {
    await addDelay()
    // Update timestamp to current time
    const data = {
      ...operationalRealtimeData.current_operations,
      timestamp: new Date().toISOString()
    }
    return HttpResponse.json(data)
  }),

  http.get('*/api/v1/operational/realtime/metrics', async () => {
    await addDelay()
    return HttpResponse.json(operationalRealtimeData.live_metrics)
  }),

  http.get('*/api/v1/operational/realtime/alerts', async () => {
    await addDelay()
    return HttpResponse.json({
      alerts: operationalRealtimeData.alerts,
      total: operationalRealtimeData.alerts.length,
      critical: operationalRealtimeData.alerts.filter(a => a.severity === 'critical').length,
      warning: operationalRealtimeData.alerts.filter(a => a.severity === 'warning').length
    })
  }),

  http.get('*/api/v1/operational/realtime/productivity', async () => {
    await addDelay()
    return HttpResponse.json(operationalRealtimeData.productivity_tracking)
  }),

  http.get('*/api/v1/operational/realtime/bottlenecks', async () => {
    await addDelay()
    return HttpResponse.json({
      bottlenecks: operationalRealtimeData.bottlenecks,
      total_impact: operationalRealtimeData.bottlenecks.reduce((sum, b) => {
        const impact = parseFloat(b.impact.match(/\d+/)?.[0] || '0')
        return sum + impact
      }, 0)
    })
  }),

  http.get('*/api/v1/operational/realtime/predictions', async () => {
    await addDelay()
    return HttpResponse.json(operationalRealtimeData.predictive_insights)
  }),

  http.get('*/api/v1/operational/warehouse/:id/performance', async ({ params }) => {
    await addDelay()
    const { id } = params
    
    // Return performance data for the requested warehouse
    const performanceData = {
      warehouse_id: id,
      ...warehousePerformanceData.daily_performance['WH-001'], // Use WH-001 as template
      date: new Date().toISOString().split('T')[0]
    }
    
    return HttpResponse.json(performanceData)
  }),

  http.get('*/api/v1/operational/zones/performance', async () => {
    await addDelay()
    return HttpResponse.json(warehousePerformanceData.zone_performance)
  }),

  http.get('*/api/v1/operational/equipment/performance', async () => {
    await addDelay()
    return HttpResponse.json(warehousePerformanceData.equipment_performance)
  }),

  http.get('*/api/v1/operational/quality/metrics', async () => {
    await addDelay()
    return HttpResponse.json(warehousePerformanceData.quality_metrics)
  }),

  http.get('*/api/v1/operational/cost/metrics', async () => {
    await addDelay()
    return HttpResponse.json(warehousePerformanceData.cost_metrics)
  }),

  // System endpoints
  http.get('*/api/v1/system/health', async () => {
    await addDelay()
    return HttpResponse.json({
      status: 'healthy',
      services: {
        api: { status: 'healthy', latency: 45 },
        database: { status: 'healthy', latency: 12 },
        cache: { status: 'healthy', latency: 3 }
      },
      timestamp: new Date().toISOString()
    })
  }),

  http.get('*/api/v1/system/status', async () => {
    await addDelay()
    return HttpResponse.json({
      version: '2.0.0',
      environment: 'development',
      features: {
        forecasting: true,
        insights: true,
        analytics: true,
        export: true
      }
    })
  }),

  // Catch-all for unhandled endpoints
  http.all('*/api/*', () => {
    return new HttpResponse(null, { status: 404 })
  })
]