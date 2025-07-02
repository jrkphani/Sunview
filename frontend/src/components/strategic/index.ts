// Strategic Planning Components
export { default as StrategicPlanningSection } from './StrategicPlanningSection'
export { default as SeasonalityCalendarHeatmap } from './SeasonalityCalendarHeatmap'
export { default as ForecastBiasTrendChart } from './ForecastBiasTrendChart'
export { default as SKULifecycleSankey } from './SKULifecycleSankey'
export { default as ProductMixShiftChart } from './ProductMixShiftChart'
export { default as StabilityIndexRadar } from './StabilityIndexRadar'
export { default as StrategicInsightsPanel } from './StrategicInsightsPanel'

// Type definitions for strategic planning data
export interface SeasonalityDataPoint {
  date: string
  category: string
  value: number
  week: number
  month: number
  quarter: number
}

export interface ForecastBiasDataPoint {
  week: number
  date: string
  productGroup: string
  bias: number
  confidence: number
  absoluteBias: number
}

export interface SKULifecycleTransition {
  source: string
  target: string
  value: number
  products: number
}

export interface SKULifecycleData {
  stages: string[]
  transitions: SKULifecycleTransition[]
  summary: {
    totalProducts: number
    stageDistribution: Record<string, number>
  }
}

export interface ProductCategory {
  category: string
  revenue: number
  volume: number
}

export interface ProductMixDataPoint {
  quarter: string
  total: number
  categories: ProductCategory[]
}

export interface StabilityMetric {
  metric: string
  value: number
  target: number
  trend: 'up' | 'down'
}

export interface StabilitySiteData {
  site: string
  metrics: StabilityMetric[]
}

export interface StrategicInsight {
  title: string
  description: string
  impact: 'High' | 'Medium' | 'Low'
  action: string
  timeline: string
}

export interface StrategicTrend {
  title: string
  description: string
  confidence: number
}

export interface StrategicInsightsData {
  critical: StrategicInsight[]
  opportunities: StrategicInsight[]
  trends: StrategicTrend[]
}