import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle } from 'lucide-react'
import { useState, useMemo } from 'react'
import type { ThroughputMetrics } from '@/types/api'

interface ThroughputComparisonChartProps {
  data: ThroughputMetrics[]
  loading?: boolean
  height?: number
  showDetailedView?: boolean
  onSiteSelect?: (siteId: string) => void
  onShiftSelect?: (shift: string) => void
}

const chartConfig = {
  forecasted_throughput: {
    label: "Forecasted Throughput",
    color: "hsl(var(--chart-1))",
  },
  actual_throughput: {
    label: "Actual Throughput", 
    color: "hsl(var(--chart-2))",
  },
  variance_line: {
    label: "Variance %",
    color: "hsl(var(--chart-4))",
  },
  target_line: {
    label: "Target",
    color: "hsl(var(--muted-foreground))",
  }
} satisfies ChartConfig

export default function ThroughputComparisonChart({
  data = [],
  loading = false,
  height = 350,
  showDetailedView = false,
  onSiteSelect,
  onShiftSelect
}: ThroughputComparisonChartProps) {
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedShift, setSelectedShift] = useState<string>('all')
  const [selectedSkuGroup, setSelectedSkuGroup] = useState<string>('all')
  const [chartType, setChartType] = useState<'daily' | 'weekly' | 'monthly'>('daily')

  // Filter and aggregate data based on selections
  const filteredData = useMemo(() => {
    let filtered = data

    if (selectedSite !== 'all') {
      filtered = filtered.filter(item => item.site_id === selectedSite)
    }

    if (selectedShift !== 'all') {
      filtered = filtered.filter(item => item.shift === selectedShift)
    }

    if (selectedSkuGroup !== 'all') {
      filtered = filtered.filter(item => item.sku_group === selectedSkuGroup)
    }

    // Group by date and aggregate
    const grouped = filtered.reduce((acc, item) => {
      const dateKey = item.date
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          forecasted_throughput: 0,
          actual_throughput: 0,
          count: 0,
          variance_sum: 0,
          statuses: []
        }
      }
      
      acc[dateKey].forecasted_throughput += item.forecasted_throughput
      acc[dateKey].actual_throughput += item.actual_throughput
      acc[dateKey].variance_sum += Math.abs(item.variance_percentage)
      acc[dateKey].count += 1
      acc[dateKey].statuses.push(item.status)
      
      return acc
    }, {} as Record<string, any>)

    return Object.values(grouped).map((item: any) => ({
      ...item,
      name: new Date(item.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      fullDate: item.date,
      variance_percentage: item.variance_sum / item.count,
      avg_forecasted: Math.round(item.forecasted_throughput / item.count),
      avg_actual: Math.round(item.actual_throughput / item.count),
      accuracy: 100 - (item.variance_sum / item.count),
      status: item.statuses.filter((s: string) => s === 'on_target').length >= item.count / 2 ? 'on_target' : 'off_target'
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [data, selectedSite, selectedShift, selectedSkuGroup])

  // Get unique values for filters
  const sites = useMemo(() => [...new Set(data.map(item => item.site_id))], [data])
  const shifts = useMemo(() => [...new Set(data.map(item => item.shift))], [data])
  const skuGroups = useMemo(() => [...new Set(data.map(item => item.sku_group))], [data])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (filteredData.length === 0) return null

    const totalForecasted = filteredData.reduce((sum, item) => sum + item.forecasted_throughput, 0)
    const totalActual = filteredData.reduce((sum, item) => sum + item.actual_throughput, 0)
    const avgVariance = filteredData.reduce((sum, item) => sum + Math.abs(item.variance_percentage), 0) / filteredData.length
    const onTargetCount = filteredData.filter(item => item.status === 'on_target').length
    const accuracy = ((onTargetCount / filteredData.length) * 100)

    return {
      totalForecasted: Math.round(totalForecasted),
      totalActual: Math.round(totalActual),
      avgVariance: avgVariance.toFixed(1),
      accuracy: accuracy.toFixed(1),
      trend: totalActual > totalForecasted ? 'up' : totalActual < totalForecasted ? 'down' : 'stable'
    }
  }, [filteredData])

  const handleSiteChange = (siteId: string) => {
    setSelectedSite(siteId)
    onSiteSelect?.(siteId)
  }

  const handleShiftChange = (shift: string) => {
    setSelectedShift(shift)
    onShiftSelect?.(shift)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Forecasted vs Actual Throughput</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[350px] w-full" />
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Forecasted vs Actual Throughput</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <p className="text-lg font-medium">No throughput data available</p>
              <p className="text-sm">Check your data sources and filters</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Forecasted vs Actual Throughput
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Compare predicted and actual throughput across sites and shifts
            </p>
          </div>
          
          {showDetailedView && (
            <div className="flex items-center gap-2">
              <Select value={selectedSite} onValueChange={handleSiteChange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {sites.map(site => (
                    <SelectItem key={site} value={site}>{site}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedShift} onValueChange={handleShiftChange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Shift" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Shifts</SelectItem>
                  {shifts.map(shift => (
                    <SelectItem key={shift} value={shift}>
                      {shift.charAt(0).toUpperCase() + shift.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSkuGroup} onValueChange={setSelectedSkuGroup}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="SKU Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SKUs</SelectItem>
                  {skuGroups.map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Summary Statistics */}
        {summaryStats && (
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Accuracy:</span>
              <Badge 
                variant="outline"
                className={cn(
                  parseFloat(summaryStats.accuracy) >= 90 ? 'text-success bg-success/10 border-success/20' :
                  parseFloat(summaryStats.accuracy) >= 80 ? 'text-warning bg-warning/10 border-warning/20' :
                  'text-destructive bg-destructive/10 border-destructive/20'
                )}
              >
                {parseFloat(summaryStats.accuracy) >= 85 ? (
                  <CheckCircle className="h-3 w-3 mr-1" />
                ) : (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                )}
                {summaryStats.accuracy}%
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Avg Variance:</span>
              <span className="text-sm font-mono">±{summaryStats.avgVariance}%</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Trend:</span>
              {summaryStats.trend === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
              {summaryStats.trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
              {summaryStats.trend === 'stable' && <span className="text-sm text-muted-foreground">Stable</span>}
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        <ChartContainer 
          config={chartConfig}
          className="min-h-[200px] w-full"
          style={{ height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={filteredData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="hsl(var(--border))" 
                strokeOpacity={0.3}
                vertical={false}
              />
              
              <XAxis 
                dataKey="name"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              
              <YAxis 
                yAxisId="left"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => value.toLocaleString()}
              />
              
              <YAxis 
                yAxisId="right"
                orientation="right"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `${value}%`}
              />

              <ChartTooltip 
                content={<ChartTooltipContent 
                  className="w-80"
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload
                      return (
                        <div className="space-y-1">
                          <div className="font-semibold text-card-foreground">{label}</div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {data.fullDate}
                          </div>
                        </div>
                      )
                    }
                    return label
                  }}
                  formatter={(value, name, props) => {
                    const data = props.payload
                    if (name === 'forecasted_throughput') {
                      return [
                        <div key="throughput-details" className="space-y-2">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-muted-foreground">Forecasted</div>
                              <div className="font-mono text-chart-1 font-semibold">
                                {data.forecasted_throughput?.toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground">Actual</div>
                              <div className="font-mono text-chart-2 font-semibold">
                                {data.actual_throughput?.toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Variance:</span>
                              <span className={cn(
                                "font-mono",
                                Math.abs(data.variance_percentage) <= 10 ? 'text-success' :
                                Math.abs(data.variance_percentage) <= 20 ? 'text-warning' : 'text-destructive'
                              )}>
                                {data.variance_percentage > 0 ? '+' : ''}{data.variance_percentage?.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Accuracy:</span>
                              <span className="font-mono">{data.accuracy?.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Status:</span>
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  data.status === 'on_target' ? 'text-success border-success' : 'text-warning border-warning'
                                )}
                              >
                                {data.status === 'on_target' ? 'On Target' : 'Off Target'}
                              </Badge>
                            </div>
                          </div>
                        </div>,
                        ''
                      ]
                    }
                    return [value, name]
                  }}
                />}
              />

              {/* Reference line for 0% variance */}
              <ReferenceLine 
                yAxisId="right"
                y={0} 
                stroke="hsl(var(--muted-foreground))" 
                strokeDasharray="2 2" 
                strokeOpacity={0.5}
              />

              {/* Forecasted throughput bars */}
              <Bar
                yAxisId="left"
                dataKey="forecasted_throughput"
                fill="hsl(var(--chart-1))"
                fillOpacity={0.6}
                name="Forecasted"
                radius={[2, 2, 0, 0]}
              />

              {/* Actual throughput bars */}
              <Bar
                yAxisId="left"
                dataKey="actual_throughput"
                fill="hsl(var(--chart-2))"
                fillOpacity={0.8}
                name="Actual"
                radius={[2, 2, 0, 0]}
              />

              {/* Variance percentage line */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="variance_percentage"
                stroke="hsl(var(--chart-4))"
                strokeWidth={3}
                dot={{ 
                  fill: "hsl(var(--chart-4))", 
                  strokeWidth: 2, 
                  r: 4
                }}
                activeDot={{ 
                  r: 6, 
                  fill: "hsl(var(--chart-4))",
                  stroke: "hsl(var(--background))",
                  strokeWidth: 2
                }}
                name="Variance %"
              />

              <ChartLegend content={<ChartLegendContent />} />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}