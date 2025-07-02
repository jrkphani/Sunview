import React, { useState, useMemo } from 'react'
import {
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight,
  ArrowDownRight,
  Shuffle,
  DollarSign,
  Package,
  Percent
} from 'lucide-react'

interface ProductCategory {
  category: string
  revenue: number
  volume: number
}

interface ProductMixDataPoint {
  quarter: string
  total: number
  categories: ProductCategory[]
}

interface ProductMixShiftChartProps {
  data: ProductMixDataPoint[]
  height?: number
  compact?: boolean
  className?: string
}

const categoryColors = [
  'hsl(210, 70%, 50%)', // Blue
  'hsl(120, 70%, 50%)', // Green
  'hsl(30, 70%, 50%)',  // Orange
  'hsl(280, 70%, 50%)', // Purple
  'hsl(0, 70%, 50%)',   // Red
  'hsl(60, 70%, 50%)'   // Yellow
]

export default function ProductMixShiftChart({ 
  data = [], 
  height = 400,
  compact = false,
  className 
}: ProductMixShiftChartProps) {
  const [selectedMetric, setSelectedMetric] = useState<string>('revenue')
  const [viewMode, setViewMode] = useState<string>('absolute')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Extract unique categories
  const categories = useMemo(() => {
    if (!data.length) return []
    const allCategories = new Set<string>()
    data.forEach(quarter => {
      quarter.categories.forEach(cat => allCategories.add(cat.category))
    })
    return Array.from(allCategories)
  }, [data])

  // Process data for visualization
  const chartData = useMemo(() => {
    if (!data.length) return []

    return data.map(quarter => {
      const totalMetric = quarter.categories.reduce((sum, cat) => 
        sum + cat[selectedMetric as keyof ProductCategory], 0)
      
      const processedCategories = quarter.categories.reduce((acc, cat) => {
        const value = cat[selectedMetric as keyof ProductCategory]
        const percentage = totalMetric > 0 ? (value / totalMetric) * 100 : 0
        
        acc[cat.category] = viewMode === 'percentage' ? percentage : value
        acc[`${cat.category}_raw`] = value
        acc[`${cat.category}_percentage`] = percentage
        
        return acc
      }, {} as Record<string, number>)

      return {
        quarter: quarter.quarter,
        totalMetric,
        ...processedCategories
      }
    })
  }, [data, selectedMetric, viewMode])

  // Calculate quarter-over-quarter changes
  const changeAnalysis = useMemo(() => {
    if (chartData.length < 2) return []

    return chartData.slice(1).map((current, index) => {
      const previous = chartData[index]
      const changes = categories.map(category => {
        const currentValue = current[`${category}_percentage`] || 0
        const previousValue = previous[`${category}_percentage`] || 0
        const change = currentValue - previousValue
        
        return {
          category,
          change,
          currentShare: currentValue,
          previousShare: previousValue,
          trend: change > 0.5 ? 'increasing' : change < -0.5 ? 'decreasing' : 'stable'
        }
      })

      return {
        quarter: current.quarter,
        previousQuarter: previous.quarter,
        changes,
        totalGrowth: ((current.totalMetric - previous.totalMetric) / previous.totalMetric) * 100
      }
    })
  }, [chartData, categories])

  // Identify significant shifts
  const significantShifts = useMemo(() => {
    if (!changeAnalysis.length) return []

    const allChanges = changeAnalysis.flatMap(quarter => 
      quarter.changes.map(change => ({
        ...change,
        quarter: quarter.quarter,
        absChange: Math.abs(change.change)
      }))
    )

    return allChanges
      .filter(change => change.absChange > 2) // Significant if >2% change
      .sort((a, b) => b.absChange - a.absChange)
      .slice(0, 5) // Top 5 shifts
  }, [changeAnalysis])

  const chartConfig = categories.reduce((config, category, index) => {
    config[category] = {
      label: category,
      color: categoryColors[index % categoryColors.length],
    }
    return config
  }, {} as ChartConfig)

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center space-y-2">
            <BarChart3 className="h-12 w-12 mx-auto opacity-50" />
            <p className="text-lg font-medium">No product mix data available</p>
            <p className="text-sm">Product mix shift analysis will appear when data is loaded</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {!compact && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shuffle className="h-5 w-5" />
              <CardTitle>Product Mix Shift Analysis</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="volume">Volume</SelectItem>
                </SelectContent>
              </Select>
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="absolute">Absolute</SelectItem>
                  <SelectItem value="percentage">Percentage</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent>
        <Tabs value="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Mix Overview</TabsTrigger>
            <TabsTrigger value="changes">Q-o-Q Changes</TabsTrigger>
            <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                
                <XAxis 
                  dataKey="quarter" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => 
                    viewMode === 'percentage' 
                      ? `${value.toFixed(0)}%` 
                      : selectedMetric === 'revenue' 
                        ? `$${(value / 1000000).toFixed(1)}M`
                        : `${(value / 1000).toFixed(0)}K`
                  }
                />
                
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    formatter={(value, name, props) => {
                      const data = props.payload
                      const category = name as string
                      const rawValue = data[`${category}_raw`] || 0
                      const percentage = data[`${category}_percentage`] || 0
                      
                      return [
                        <div key="mix-details" className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span>{category}:</span>
                            <span className="font-mono font-bold">
                              {selectedMetric === 'revenue' 
                                ? `$${(rawValue / 1000000).toFixed(2)}M`
                                : `${rawValue.toLocaleString()}`
                              }
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Share:</span>
                            <span className="font-mono">{percentage.toFixed(1)}%</span>
                          </div>
                        </div>,
                        ''
                      ]
                    }}
                  />}
                />
                
                <Legend />
                
                {/* Stacked bars for each category */}
                {categories.map((category, index) => (
                  <Bar
                    key={category}
                    dataKey={category}
                    stackId="mix"
                    fill={categoryColors[index % categoryColors.length]}
                    name={category}
                  />
                ))}
              </BarChart>
            </ChartContainer>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {categories.map((category, index) => {
                const latestData = chartData[chartData.length - 1]
                const currentShare = latestData?.[`${category}_percentage`] || 0
                const currentValue = latestData?.[`${category}_raw`] || 0
                
                // Calculate trend from last two quarters
                const previousData = chartData[chartData.length - 2]
                const previousShare = previousData?.[`${category}_percentage`] || 0
                const shareChange = currentShare - previousShare
                
                return (
                  <Card key={category}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium">{category}</h3>
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                        />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="text-lg font-bold">{currentShare.toFixed(1)}%</div>
                        <div className="text-xs text-muted-foreground">
                          {selectedMetric === 'revenue' 
                            ? `$${(currentValue / 1000000).toFixed(1)}M`
                            : `${currentValue.toLocaleString()}`
                          }
                        </div>
                        
                        {shareChange !== 0 && (
                          <div className={`flex items-center space-x-1 text-xs ${
                            shareChange > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {shareChange > 0 ? (
                              <ArrowUpRight className="h-3 w-3" />
                            ) : (
                              <ArrowDownRight className="h-3 w-3" />
                            )}
                            <span>{Math.abs(shareChange).toFixed(1)}pp</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="changes" className="space-y-4">
            <div className="space-y-4">
              {changeAnalysis.map(quarter => (
                <Card key={quarter.quarter}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        {quarter.previousQuarter} → {quarter.quarter}
                      </CardTitle>
                      <Badge variant={quarter.totalGrowth > 0 ? "default" : "destructive"}>
                        {quarter.totalGrowth > 0 ? '+' : ''}{quarter.totalGrowth.toFixed(1)}% Total Growth
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {quarter.changes.map(change => (
                        <div 
                          key={change.category}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div>
                            <div className="font-medium text-sm">{change.category}</div>
                            <div className="text-xs text-muted-foreground">
                              {change.previousShare.toFixed(1)}% → {change.currentShare.toFixed(1)}%
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className={`font-bold text-sm ${
                              change.change > 0 ? 'text-green-600' : 
                              change.change < 0 ? 'text-red-600' : 'text-gray-600'
                            }`}>
                              {change.change > 0 ? '+' : ''}{change.change.toFixed(1)}pp
                            </div>
                            <Badge 
                              variant={
                                change.trend === 'increasing' ? 'default' :
                                change.trend === 'decreasing' ? 'destructive' : 'secondary'
                              }
                              className="text-xs"
                            >
                              {change.trend}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            {/* Significant Shifts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Significant Market Share Shifts</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {significantShifts.map((shift, index) => (
                    <div 
                      key={`${shift.category}-${shift.quarter}`}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-lg font-bold text-muted-foreground">
                          #{index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{shift.category}</div>
                          <div className="text-sm text-muted-foreground">{shift.quarter}</div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-lg font-bold ${
                          shift.change > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {shift.change > 0 ? '+' : ''}{shift.change.toFixed(1)}pp
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {shift.previousShare.toFixed(1)}% → {shift.currentShare.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {significantShifts.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shuffle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No significant market share shifts detected</p>
                      <p className="text-sm">All category changes are below 2% threshold</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category Performance Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Category Performance Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-green-600">Growing Categories</h4>
                    <div className="space-y-2">
                      {categories
                        .map(category => {
                          const latestChange = changeAnalysis[changeAnalysis.length - 1]?.changes
                            .find(c => c.category === category)
                          return { category, change: latestChange?.change || 0 }
                        })
                        .filter(c => c.change > 0.5)
                        .sort((a, b) => b.change - a.change)
                        .map(({ category, change }) => (
                          <div key={category} className="flex justify-between">
                            <span>{category}</span>
                            <span className="font-mono text-green-600">+{change.toFixed(1)}pp</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 text-red-600">Declining Categories</h4>
                    <div className="space-y-2">
                      {categories
                        .map(category => {
                          const latestChange = changeAnalysis[changeAnalysis.length - 1]?.changes
                            .find(c => c.category === category)
                          return { category, change: latestChange?.change || 0 }
                        })
                        .filter(c => c.change < -0.5)
                        .sort((a, b) => a.change - b.change)
                        .map(({ category, change }) => (
                          <div key={category} className="flex justify-between">
                            <span>{category}</span>
                            <span className="font-mono text-red-600">{change.toFixed(1)}pp</span>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}