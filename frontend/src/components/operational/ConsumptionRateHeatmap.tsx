import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  Tooltip,
  Legend
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { useState, useMemo } from 'react'
import type { ConsumptionRateData } from '@/types/api'

interface ConsumptionRateHeatmapProps {
  data: ConsumptionRateData[]
  loading?: boolean
  height?: number
  viewBy?: 'sku' | 'segment' | 'warehouse'
  onDataPointClick?: (dataPoint: ConsumptionRateData) => void
}

const chartConfig = {
  consumption_rate: {
    label: "Consumption Rate Variance",
    color: "hsl(var(--chart-1))",
  },
  confidence: {
    label: "Confidence Score",
    color: "hsl(var(--chart-2))",
  }
} satisfies ChartConfig

// Color scale for heatmap based on variance
const getVarianceColor = (variance: number, confidence: number) => {
  const absVariance = Math.abs(variance)
  const opacity = confidence / 100
  
  if (absVariance <= 5) {
    return `hsla(var(--chart-2), ${opacity})` // Green for good performance
  } else if (absVariance <= 15) {
    return `hsla(var(--chart-4), ${opacity})` // Yellow for moderate variance
  } else {
    return `hsla(var(--chart-5), ${opacity})` // Red for high variance
  }
}

const getVarianceSize = (variance: number) => {
  const absVariance = Math.abs(variance)
  return Math.max(8, Math.min(20, 8 + (absVariance / 5)))
}

export default function ConsumptionRateHeatmap({
  data = [],
  loading = false,
  height = 400,
  viewBy = 'sku',
  onDataPointClick
}: ConsumptionRateHeatmapProps) {
  const [selectedView, setSelectedView] = useState<'sku' | 'segment' | 'warehouse'>(viewBy)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('all')
  const [showOutliersOnly, setShowOutliersOnly] = useState(false)

  // Process and filter data
  const processedData = useMemo(() => {
    let filtered = data

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    // Filter by warehouse
    if (selectedWarehouse !== 'all') {
      filtered = filtered.filter(item => item.warehouse_id === selectedWarehouse)
    }

    // Filter outliers only
    if (showOutliersOnly) {
      filtered = filtered.filter(item => Math.abs(item.variance) > 15)
    }

    // Group data based on selected view
    const grouped = filtered.reduce((acc, item) => {
      let groupKey: string
      
      switch (selectedView) {
        case 'segment':
          groupKey = item.segment
          break
        case 'warehouse':
          groupKey = item.warehouse_name
          break
        default:
          groupKey = item.sku_name
      }

      if (!acc[groupKey]) {
        acc[groupKey] = {
          group: groupKey,
          items: [],
          avgVariance: 0,
          avgConfidence: 0,
          count: 0,
          totalForecast: 0,
          totalActual: 0
        }
      }

      acc[groupKey].items.push(item)
      acc[groupKey].avgVariance += Math.abs(item.variance)
      acc[groupKey].avgConfidence += item.confidence_score
      acc[groupKey].count += 1
      acc[groupKey].totalForecast += item.forecast_consumption_rate
      acc[groupKey].totalActual += item.actual_consumption_rate

      return acc
    }, {} as Record<string, any>)

    // Convert to chart data with calculated metrics
    return Object.values(grouped).map((group: any) => {
      const avgVariance = group.avgVariance / group.count
      const avgConfidence = group.avgConfidence / group.count
      const efficiency = 100 - avgVariance

      return {
        name: group.group,
        x: group.totalForecast / group.count, // Average forecast rate
        y: group.totalActual / group.count,   // Average actual rate
        variance: avgVariance,
        confidence: avgConfidence,
        efficiency,
        count: group.count,
        items: group.items,
        size: getVarianceSize(avgVariance),
        fill: getVarianceColor(avgVariance, avgConfidence),
        category: group.items[0]?.category || 'unknown',
        warehouse: group.items[0]?.warehouse_name || 'unknown'
      }
    }).sort((a, b) => b.confidence - a.confidence)
  }, [data, selectedView, selectedCategory, selectedWarehouse, showOutliersOnly])

  // Get unique values for filters
  const categories = useMemo(() => 
    [...new Set(data.map(item => item.category))], [data]
  )
  const warehouses = useMemo(() => 
    [...new Set(data.map(item => item.warehouse_name))], [data]
  )

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (processedData.length === 0) return null

    const avgEfficiency = processedData.reduce((sum, item) => sum + item.efficiency, 0) / processedData.length
    const highPerformers = processedData.filter(item => item.variance <= 5).length
    const outliers = processedData.filter(item => item.variance > 15).length
    const avgConfidence = processedData.reduce((sum, item) => sum + item.confidence, 0) / processedData.length

    return {
      avgEfficiency: avgEfficiency.toFixed(1),
      highPerformers,
      outliers,
      avgConfidence: avgConfidence.toFixed(1),
      totalItems: processedData.length
    }
  }, [processedData])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Forecast Consumption Rate Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Forecast Consumption Rate Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No consumption data available</p>
              <p className="text-sm">Check your data sources and time range</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Forecast Consumption Rate Analysis
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Heatmap view of consumption rate variance by {selectedView}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <ToggleGroup 
                type="single" 
                value={selectedView} 
                onValueChange={(value) => value && setSelectedView(value as typeof selectedView)}
                className="grid grid-cols-3"
              >
                <ToggleGroupItem value="sku" className="text-xs">SKU</ToggleGroupItem>
                <ToggleGroupItem value="segment" className="text-xs">Segment</ToggleGroupItem>
                <ToggleGroupItem value="warehouse" className="text-xs">Warehouse</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.replace('_', ' ').toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Warehouse" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses.map(warehouse => (
                  <SelectItem key={warehouse} value={warehouse}>{warehouse}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant={showOutliersOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowOutliersOnly(!showOutliersOnly)}
              className="flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4" />
              Outliers Only
            </Button>
          </div>

          {/* Summary Statistics */}
          {summaryStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-chart-2">{summaryStats.avgEfficiency}%</div>
                <div className="text-xs text-muted-foreground">Avg Efficiency</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-chart-1">{summaryStats.highPerformers}</div>
                <div className="text-xs text-muted-foreground">High Performers</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-chart-5">{summaryStats.outliers}</div>
                <div className="text-xs text-muted-foreground">Outliers</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">{summaryStats.avgConfidence}%</div>
                <div className="text-xs text-muted-foreground">Avg Confidence</div>
              </div>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer 
          config={chartConfig}
          className="min-h-[200px] w-full"
          style={{ height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart 
              data={processedData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.3}
              />
              
              <XAxis 
                type="number"
                dataKey="x"
                name="Forecasted Rate"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => value.toFixed(1)}
                label={{ 
                  value: 'Forecasted Consumption Rate', 
                  position: 'insideBottom', 
                  offset: -10,
                  style: { textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }
                }}
              />
              
              <YAxis 
                type="number"
                dataKey="y"
                name="Actual Rate"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => value.toFixed(1)}
                label={{ 
                  value: 'Actual Consumption Rate', 
                  angle: -90, 
                  position: 'insideLeft',
                  style: { textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }
                }}
              />

              <ChartTooltip 
                content={<ChartTooltipContent 
                  className="w-80"
                  labelFormatter={() => ''}
                  formatter={(value, name, props) => {
                    const data = props.payload
                    return [
                      <div key="consumption-details" className="space-y-3">
                        <div className="font-semibold text-card-foreground border-b pb-2">
                          {data.name}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">Forecasted Rate</div>
                            <div className="font-mono text-chart-1 font-semibold">
                              {data.x?.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">Actual Rate</div>
                            <div className="font-mono text-chart-2 font-semibold">
                              {data.y?.toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted-foreground">Variance:</span>
                            <div className="flex items-center gap-1">
                              {data.variance <= 5 ? 
                                <CheckCircle2 className="h-3 w-3 text-success" /> :
                                <AlertCircle className="h-3 w-3 text-destructive" />
                              }
                              <span className={cn(
                                "text-xs font-mono",
                                data.variance <= 5 ? 'text-success' :
                                data.variance <= 15 ? 'text-warning' : 'text-destructive'
                              )}>
                                ±{data.variance?.toFixed(1)}%
                              </span>
                            </div>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Confidence:</span>
                            <span className="text-xs font-mono">{data.confidence?.toFixed(1)}%</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Efficiency:</span>
                            <span className="text-xs font-mono">{data.efficiency?.toFixed(1)}%</span>
                          </div>

                          <div className="flex justify-between">
                            <span className="text-xs text-muted-foreground">Items:</span>
                            <span className="text-xs">{data.count}</span>
                          </div>

                          {selectedView !== 'warehouse' && (
                            <div className="flex justify-between">
                              <span className="text-xs text-muted-foreground">Warehouse:</span>
                              <span className="text-xs">{data.warehouse}</span>
                            </div>
                          )}

                          <div className="pt-2 border-t">
                            <Badge 
                              variant="outline"
                              className={cn(
                                data.variance <= 5 ? 'text-success border-success' :
                                data.variance <= 15 ? 'text-warning border-warning' :
                                'text-destructive border-destructive'
                              )}
                            >
                              {data.variance <= 5 ? 'High Performance' :
                               data.variance <= 15 ? 'Moderate Variance' : 'Needs Attention'}
                            </Badge>
                          </div>
                        </div>
                      </div>,
                      ''
                    ]
                  }}
                />}
                cursor={{ strokeDasharray: '3 3' }}
              />

              <Scatter 
                name="Consumption Rate"
                data={processedData}
                onClick={onDataPointClick}
              >
                {processedData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill}
                    stroke={entry.variance > 15 ? 'hsl(var(--destructive))' : 'hsl(var(--border))'}
                    strokeWidth={entry.variance > 15 ? 2 : 1}
                    r={entry.size}
                  />
                ))}
              </Scatter>

              {/* Add a diagonal reference line for perfect accuracy */}
              <Scatter 
                data={[
                  { x: Math.min(...processedData.map(d => d.x)), y: Math.min(...processedData.map(d => d.x)) },
                  { x: Math.max(...processedData.map(d => d.x)), y: Math.max(...processedData.map(d => d.x)) }
                ]}
                line={{ stroke: 'hsl(var(--muted-foreground))', strokeDasharray: '5 5', strokeOpacity: 0.5 }}
                shape={() => null}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Legend */}
        <div className="flex flex-wrap justify-center gap-6 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-2 opacity-80" />
            <span>High Performance (≤5% variance)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-4 opacity-80" />
            <span>Moderate (5-15% variance)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-5 opacity-80" />
            <span>Needs Attention ({'>'}15% variance)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}