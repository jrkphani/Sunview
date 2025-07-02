import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MockDataIndicator, useDataSourceStatus } from '@/components/ui/mock-data-indicator'
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Target, 
  BarChart3, 
  Radar,
  ArrowRight,
  Filter,
  RefreshCw,
  Download
} from 'lucide-react'

import SeasonalityCalendarHeatmap from './SeasonalityCalendarHeatmap'
import ForecastBiasTrendChart from './ForecastBiasTrendChart'
import SKULifecycleSankey from './SKULifecycleSankey'
import ProductMixShiftChart from './ProductMixShiftChart'
import StabilityIndexRadar from './StabilityIndexRadar'
import StrategicInsightsPanel from './StrategicInsightsPanel'

interface StrategicPlanningProps {
  data?: any
  className?: string
}

interface FilterState {
  timeRange: string
  category: string
  productGroup: string
  location: string
}

const timeRangeOptions = [
  { value: 'last_12_months', label: 'Last 12 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'current_year', label: 'Current Year' },
  { value: 'custom', label: 'Custom Range' }
]

const categoryOptions = [
  { value: 'all', label: 'All Categories' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'consumer', label: 'Consumer Goods' }
]

const productGroupOptions = [
  { value: 'all', label: 'All Product Groups' },
  { value: 'high_volume', label: 'High Volume' },
  { value: 'medium_volume', label: 'Medium Volume' },
  { value: 'low_volume', label: 'Low Volume' },
  { value: 'new_products', label: 'New Products' }
]

const locationOptions = [
  { value: 'all', label: 'All Locations' },
  { value: 'north_america', label: 'North America' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia_pacific', label: 'Asia Pacific' },
  { value: 'global', label: 'Global' }
]

export default function StrategicPlanningSection({ data, className }: StrategicPlanningProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [filters, setFilters] = useState<FilterState>({
    timeRange: 'last_12_months',
    category: 'all',
    productGroup: 'all',
    location: 'all'
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Data source status for MockDataIndicator
  const { isApiConnected, isLoading, isMockData } = useDataSourceStatus()

  // Generate sample strategic data
  const strategicData = useMemo(() => {
    return {
      seasonality: generateSeasonalityData(),
      forecastBias: generateForecastBiasData(),
      skuLifecycle: generateSKULifecycleData(),
      productMix: generateProductMixData(),
      stabilityIndex: generateStabilityData(),
      insights: generateStrategicInsights()
    }
  }, [filters])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsRefreshing(false)
  }

  const handleExport = () => {
    // Implement export functionality
    console.log('Exporting strategic planning data...')
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MockDataIndicator 
              isLoading={isLoading} 
              isMockData={isMockData} 
              dataSource={isApiConnected ? 'api' : 'mock'} 
              variant="badge" 
              showDetails={true}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <CardTitle className="text-sm">Strategic Analysis Filters</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Range</label>
                <Select 
                  value={filters.timeRange} 
                  onValueChange={(value) => handleFilterChange('timeRange', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timeRangeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={filters.category} 
                  onValueChange={(value) => handleFilterChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Product Group</label>
                <Select 
                  value={filters.productGroup} 
                  onValueChange={(value) => handleFilterChange('productGroup', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {productGroupOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Select 
                  value={filters.location} 
                  onValueChange={(value) => handleFilterChange('location', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
          <TabsTrigger value="overview" className="flex items-center gap-2 p-3">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="seasonality" className="flex items-center gap-2 p-3">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">Seasonality</span>
            <span className="sm:hidden">Season</span>
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2 p-3">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Forecast</span>
          </TabsTrigger>
          <TabsTrigger value="lifecycle" className="flex items-center gap-2 p-3">
            <ArrowRight className="h-4 w-4" />
            <span className="hidden sm:inline">Lifecycle</span>
            <span className="sm:hidden">Life</span>
          </TabsTrigger>
          <TabsTrigger value="mix" className="flex items-center gap-2 p-3">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Product Mix</span>
            <span className="sm:hidden">Mix</span>
          </TabsTrigger>
          <TabsTrigger value="stability" className="flex items-center gap-2 p-3">
            <Radar className="h-4 w-4" />
            <span className="hidden sm:inline">Stability</span>
            <span className="sm:hidden">Stable</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Seasonality Overview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <SeasonalityCalendarHeatmap 
                    data={strategicData.seasonality} 
                    height={300}
                    compact={true}
                  />
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5" />
                      <span>Forecast Bias</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ForecastBiasTrendChart 
                      data={strategicData.forecastBias} 
                      height={200}
                      compact={true}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Radar className="h-5 w-5" />
                      <span>Stability Index</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <StabilityIndexRadar 
                      data={strategicData.stabilityIndex} 
                      height={200}
                      compact={true}
                    />
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <StrategicInsightsPanel insights={strategicData.insights} />
            </div>
          </div>
        </TabsContent>

        {/* Individual Component Tabs */}
        <TabsContent value="seasonality">
          <SeasonalityCalendarHeatmap data={strategicData.seasonality} />
        </TabsContent>

        <TabsContent value="forecast">
          <ForecastBiasTrendChart data={strategicData.forecastBias} />
        </TabsContent>

        <TabsContent value="lifecycle">
          <SKULifecycleSankey data={strategicData.skuLifecycle} />
        </TabsContent>

        <TabsContent value="mix">
          <ProductMixShiftChart data={strategicData.productMix} />
        </TabsContent>

        <TabsContent value="stability">
          <StabilityIndexRadar data={strategicData.stabilityIndex} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Data generation functions
function generateSeasonalityData() {
  const data = []
  const categories = ['Electronics', 'Automotive', 'Industrial', 'Consumer']
  const startDate = new Date('2024-01-01')
  
  for (let day = 0; day < 365; day++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + day)
    
    categories.forEach(category => {
      const baseValue = Math.random() * 100
      const seasonalFactor = Math.sin((day / 365) * 2 * Math.PI) * 30
      const weekendFactor = (date.getDay() === 0 || date.getDay() === 6) ? -10 : 5
      
      data.push({
        date: date.toISOString().split('T')[0],
        category,
        value: Math.max(0, baseValue + seasonalFactor + weekendFactor),
        week: Math.floor(day / 7),
        month: date.getMonth(),
        quarter: Math.floor(date.getMonth() / 3)
      })
    })
  }
  
  return data
}

function generateForecastBiasData() {
  const data = []
  const productGroups = ['High Volume', 'Medium Volume', 'Low Volume', 'New Products']
  
  for (let week = 0; week < 52; week++) {
    productGroups.forEach(group => {
      const bias = (Math.random() - 0.5) * 40 // -20% to +20% bias
      const confidence = Math.random() * 30 + 70 // 70% to 100% confidence
      
      data.push({
        week,
        productGroup: group,
        bias,
        confidence,
        absoluteBias: Math.abs(bias),
        date: new Date(2024, 0, week * 7).toISOString().split('T')[0]
      })
    })
  }
  
  return data
}

function generateSKULifecycleData() {
  const stages = ['Introduction', 'Growth', 'Maturity', 'Decline']
  const transitions = []
  
  // Generate transition flows between lifecycle stages
  for (let i = 0; i < stages.length; i++) {
    for (let j = 0; j < stages.length; j++) {
      if (i !== j) {
        const value = Math.random() * 100
        transitions.push({
          source: stages[i],
          target: stages[j],
          value,
          products: Math.floor(value * 10)
        })
      }
    }
  }
  
  return {
    stages,
    transitions,
    summary: {
      totalProducts: 1250,
      stageDistribution: {
        'Introduction': 150,
        'Growth': 300,
        'Maturity': 650,
        'Decline': 150
      }
    }
  }
}

function generateProductMixData() {
  const quarters = ['Q1 2023', 'Q2 2023', 'Q3 2023', 'Q4 2023', 'Q1 2024', 'Q2 2024']
  const categories = ['Electronics', 'Automotive', 'Industrial', 'Consumer']
  
  return quarters.map(quarter => {
    const total = Math.random() * 1000000 + 5000000
    const distribution = categories.map(category => ({
      category,
      revenue: Math.random() * total * 0.4,
      volume: Math.random() * 10000 + 5000
    }))
    
    return {
      quarter,
      total,
      categories: distribution
    }
  })
}

function generateStabilityData() {
  const metrics = [
    'Forecast Accuracy',
    'Demand Variability', 
    'Supply Consistency',
    'Lead Time Stability',
    'Quality Metrics',
    'Customer Satisfaction'
  ]
  
  const sites = ['North America', 'Europe', 'Asia Pacific']
  
  return sites.map(site => ({
    site,
    metrics: metrics.map(metric => ({
      metric,
      value: Math.random() * 30 + 70, // 70-100% stability
      target: 85,
      trend: Math.random() > 0.5 ? 'up' : 'down'
    }))
  }))
}

function generateStrategicInsights() {
  return {
    critical: [
      {
        title: 'Seasonal Demand Concentration',
        description: 'Electronics category shows 65% higher demand during Q4, requiring inventory optimization.',
        impact: 'High',
        action: 'Implement seasonal inventory planning',
        timeline: '30 days'
      },
      {
        title: 'Forecast Bias in New Products',
        description: 'New product forecasts consistently overestimate demand by 15-25%.',
        impact: 'Medium',
        action: 'Adjust new product forecasting model',
        timeline: '45 days'
      }
    ],
    opportunities: [
      {
        title: 'Product Mix Optimization',
        description: 'High-margin industrial products show growing market share potential.',
        impact: 'High',
        action: 'Increase focus on industrial segment',
        timeline: '90 days'
      },
      {
        title: 'Stability Improvement',
        description: 'Asia Pacific region shows improvement potential in supply consistency.',
        impact: 'Medium',
        action: 'Implement regional supply chain optimization',
        timeline: '120 days'
      }
    ],
    trends: [
      {
        title: 'Digital Transformation Impact',
        description: 'Technology adoption is accelerating demand predictability improvements.',
        confidence: 85
      },
      {
        title: 'Sustainability Focus',
        description: 'Environmental considerations are becoming key factors in product lifecycle management.',
        confidence: 92
      }
    ]
  }
}