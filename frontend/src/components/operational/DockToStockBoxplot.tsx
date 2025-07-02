import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Tooltip
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown,
  Package,
  Truck,
  Search,
  Filter,
  Target
} from 'lucide-react'
import { useState, useMemo } from 'react'
import type { DockToStockData } from '@/types/api'

interface DockToStockBoxplotProps {
  data: DockToStockData[]
  loading?: boolean
  height?: number
  onOutlierClick?: (outlier: DockToStockData) => void
  onDelayAnalysis?: (delayCategory: string) => void
}

const chartConfig = {
  processing_time: {
    label: "Processing Time (Hours)",
    color: "hsl(var(--chart-1))",
  },
  target_time: {
    label: "Target Time",
    color: "hsl(var(--chart-2))",
  },
  outliers: {
    label: "Outliers",
    color: "hsl(var(--chart-5))",
  }
} satisfies ChartConfig

// Helper functions for boxplot calculations
const calculateQuartiles = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b)
  const n = sorted.length
  
  const q1Index = Math.floor(n * 0.25)
  const q2Index = Math.floor(n * 0.5)
  const q3Index = Math.floor(n * 0.75)
  
  return {
    min: sorted[0],
    q1: sorted[q1Index],
    median: sorted[q2Index],
    q3: sorted[q3Index],
    max: sorted[n - 1],
    iqr: sorted[q3Index] - sorted[q1Index]
  }
}

const getDelayColor = (category: string) => {
  switch (category) {
    case 'receiving':
      return 'hsl(var(--chart-1))'
    case 'inspection':
      return 'hsl(var(--chart-2))'
    case 'putaway':
      return 'hsl(var(--chart-3))'
    case 'system_processing':
      return 'hsl(var(--chart-4))'
    default:
      return 'hsl(var(--muted))'
  }
}

export default function DockToStockBoxplot({
  data = [],
  loading = false,
  height = 400,
  onOutlierClick,
  onDelayAnalysis
}: DockToStockBoxplotProps) {
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedSkuGroup, setSelectedSkuGroup] = useState<string>('all')
  const [showOutliersOnly, setShowOutliersOnly] = useState(false)
  const [viewType, setViewType] = useState<'boxplot' | 'scatter'>('boxplot')
  const [groupBy, setGroupBy] = useState<'site' | 'sku_group' | 'delay_category'>('site')

  // Filter and process data
  const filteredData = useMemo(() => {
    let filtered = data

    if (selectedSite !== 'all') {
      filtered = filtered.filter(item => item.site_id === selectedSite)
    }

    if (selectedSkuGroup !== 'all') {
      filtered = filtered.filter(item => item.sku_group === selectedSkuGroup)
    }

    if (showOutliersOnly) {
      filtered = filtered.filter(item => item.is_outlier)
    }

    return filtered
  }, [data, selectedSite, selectedSkuGroup, showOutliersOnly])

  // Process data for visualization
  const processedData = useMemo(() => {
    if (viewType === 'boxplot') {
      // Group data for boxplot
      const grouped = filteredData.reduce((acc, item) => {
        let groupKey: string
        
        switch (groupBy) {
          case 'sku_group':
            groupKey = item.sku_group
            break
          case 'delay_category':
            groupKey = item.delay_category
            break
          default:
            groupKey = item.site_name
        }

        if (!acc[groupKey]) {
          acc[groupKey] = []
        }
        acc[groupKey].push(item.processing_time_hours)
        return acc
      }, {} as Record<string, number[]>)

      // Calculate boxplot statistics for each group
      return Object.entries(grouped).map(([group, times], index) => {
        const stats = calculateQuartiles(times)
        const outlierThreshold = stats.iqr * 1.5
        const lowerFence = stats.q1 - outlierThreshold
        const upperFence = stats.q3 + outlierThreshold
        
        const outliers = filteredData.filter(item => {
          const groupKey = groupBy === 'sku_group' ? item.sku_group : 
                          groupBy === 'delay_category' ? item.delay_category : 
                          item.site_name
          return groupKey === group && 
                 (item.processing_time_hours < lowerFence || item.processing_time_hours > upperFence)
        })

        return {
          name: group,
          index,
          ...stats,
          outliers,
          outlierCount: outliers.length,
          totalItems: times.length,
          averageTime: times.reduce((sum, time) => sum + time, 0) / times.length,
          targetTime: filteredData.find(item => {
            const groupKey = groupBy === 'sku_group' ? item.sku_group : 
                            groupBy === 'delay_category' ? item.delay_category : 
                            item.site_name
            return groupKey === group
          })?.target_time_hours || 24
        }
      })
    } else {
      // Scatter plot data
      return filteredData.map((item, index) => ({
        x: index,
        y: item.processing_time_hours,
        name: item.site_name,
        sku_group: item.sku_group,
        delay_category: item.delay_category,
        is_outlier: item.is_outlier,
        target_time: item.target_time_hours,
        variance_hours: item.variance_hours,
        impact_score: item.impact_score,
        delay_reason: item.delay_reason,
        receipt_date: item.receipt_date,
        fill: item.is_outlier ? 'hsl(var(--chart-5))' : getDelayColor(item.delay_category),
        size: item.is_outlier ? 8 : 6
      }))
    }
  }, [filteredData, viewType, groupBy])

  // Get unique values for filters
  const sites = useMemo(() => [...new Set(data.map(item => item.site_id))], [data])
  const skuGroups = useMemo(() => [...new Set(data.map(item => item.sku_group))], [data])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (filteredData.length === 0) return null

    const avgProcessingTime = filteredData.reduce((sum, item) => sum + item.processing_time_hours, 0) / filteredData.length
    const avgTargetTime = filteredData.reduce((sum, item) => sum + item.target_time_hours, 0) / filteredData.length
    const outlierCount = filteredData.filter(item => item.is_outlier).length
    const onTimeCount = filteredData.filter(item => item.processing_time_hours <= item.target_time_hours).length
    
    const delayBreakdown = filteredData.reduce((acc, item) => {
      if (!acc[item.delay_category]) {
        acc[item.delay_category] = 0
      }
      acc[item.delay_category]++
      return acc
    }, {} as Record<string, number>)

    const mostCommonDelay = Object.entries(delayBreakdown).sort(([,a], [,b]) => b - a)[0]

    return {
      avgProcessingTime: avgProcessingTime.toFixed(1),
      avgTargetTime: avgTargetTime.toFixed(1),
      outlierCount,
      outlierPercentage: ((outlierCount / filteredData.length) * 100).toFixed(1),
      onTimePercentage: ((onTimeCount / filteredData.length) * 100).toFixed(1),
      mostCommonDelay: mostCommonDelay ? mostCommonDelay[0] : 'N/A',
      delayBreakdown
    }
  }, [filteredData])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dock-to-Stock Processing Time</CardTitle>
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
          <CardTitle>Dock-to-Stock Processing Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No processing time data available</p>
              <p className="text-sm">Check your data sources and time range</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Dock-to-Stock Processing Time Analysis
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Identify processing delays and operational bottlenecks
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ToggleGroup 
                  type="single" 
                  value={viewType} 
                  onValueChange={(value) => value && setViewType(value as typeof viewType)}
                >
                  <ToggleGroupItem value="boxplot">Boxplot</ToggleGroupItem>
                  <ToggleGroupItem value="scatter">Scatter</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Site" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sites</SelectItem>
                  {sites.map(site => (
                    <SelectItem key={site} value={site}>{site}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSkuGroup} onValueChange={setSelectedSkuGroup}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="SKU Group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All SKU Groups</SelectItem>
                  {skuGroups.map(group => (
                    <SelectItem key={group} value={group}>{group}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={groupBy} onValueChange={(value) => setGroupBy(value as typeof groupBy)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Group By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="site">Site</SelectItem>
                  <SelectItem value="sku_group">SKU Group</SelectItem>
                  <SelectItem value="delay_category">Delay Category</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showOutliersOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowOutliersOnly(!showOutliersOnly)}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Outliers Only
              </Button>
            </div>

            {/* Summary Statistics */}
            {summaryStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{summaryStats.avgProcessingTime}h</div>
                  <div className="text-xs text-muted-foreground">Avg Processing Time</div>
                  <div className="text-xs text-muted-foreground">
                    Target: {summaryStats.avgTargetTime}h
                  </div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-chart-2">{summaryStats.onTimePercentage}%</div>
                  <div className="text-xs text-muted-foreground">On-Time Performance</div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-chart-5">{summaryStats.outlierCount}</div>
                  <div className="text-xs text-muted-foreground">
                    Outliers ({summaryStats.outlierPercentage}%)
                  </div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-lg font-bold capitalize">
                    {summaryStats.mostCommonDelay.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-muted-foreground">Most Common Delay</div>
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
                  type={viewType === 'boxplot' ? 'category' : 'number'}
                  dataKey={viewType === 'boxplot' ? 'name' : 'x'}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  angle={viewType === 'boxplot' ? -45 : 0}
                  textAnchor={viewType === 'boxplot' ? 'end' : 'middle'}
                  height={viewType === 'boxplot' ? 80 : 60}
                  label={viewType === 'scatter' ? { 
                    value: 'Item Index', 
                    position: 'insideBottom', 
                    offset: -10,
                    style: { textAnchor: 'middle', fontSize: '12px', fill: 'hsl(var(--muted-foreground))' }
                  } : undefined}
                />
                
                <YAxis 
                  type="number"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value}h`}
                  label={{ 
                    value: 'Processing Time (Hours)', 
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
                      
                      if (viewType === 'boxplot') {
                        return [
                          <div key="boxplot-details" className="space-y-3">
                            <div className="font-semibold text-card-foreground border-b pb-2">
                              {data.name} - Processing Time Statistics
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs text-muted-foreground">Median</div>
                                <div className="font-mono text-lg font-semibold">{data.median?.toFixed(1)}h</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Average</div>
                                <div className="font-mono text-lg font-semibold">{data.averageTime?.toFixed(1)}h</div>
                              </div>
                            </div>

                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Range:</span>
                                <span className="font-mono">{data.min?.toFixed(1)}h - {data.max?.toFixed(1)}h</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Q1 - Q3:</span>
                                <span className="font-mono">{data.q1?.toFixed(1)}h - {data.q3?.toFixed(1)}h</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Target:</span>
                                <span className="font-mono">{data.targetTime?.toFixed(1)}h</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Items:</span>
                                <span>{data.totalItems}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Outliers:</span>
                                <Badge variant="outline" className={cn(
                                  data.outlierCount > 0 ? 'text-destructive border-destructive' : 'text-success border-success'
                                )}>
                                  {data.outlierCount} items
                                </Badge>
                              </div>
                            </div>

                            {data.outlierCount > 0 && (
                              <div className="pt-2 border-t">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => onDelayAnalysis?.(data.name)}
                                  className="w-full"
                                >
                                  <Search className="h-3 w-3 mr-1" />
                                  Analyze Delays
                                </Button>
                              </div>
                            )}
                          </div>,
                          ''
                        ]
                      } else {
                        return [
                          <div key="scatter-details" className="space-y-3">
                            <div className="font-semibold text-card-foreground border-b pb-2">
                              {data.name} - {data.sku_group}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs text-muted-foreground">Processing Time</div>
                                <div className="font-mono text-lg font-semibold">{data.y?.toFixed(1)}h</div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Target Time</div>
                                <div className="font-mono text-lg font-semibold">{data.target_time?.toFixed(1)}h</div>
                              </div>
                            </div>

                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Variance:</span>
                                <span className={cn(
                                  "font-mono",
                                  (data.variance_hours || 0) <= 0 ? 'text-success' : 'text-destructive'
                                )}>
                                  {(data.variance_hours || 0) > 0 ? '+' : ''}{data.variance_hours?.toFixed(1)}h
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Impact Score:</span>
                                <span className="font-mono">{data.impact_score?.toFixed(1)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Delay Category:</span>
                                <span className="capitalize">{data.delay_category?.replace('_', ' ')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Receipt Date:</span>
                                <span className="font-mono">{data.receipt_date}</span>
                              </div>
                              {data.delay_reason && (
                                <div className="pt-2 border-t">
                                  <div className="text-muted-foreground text-xs">Delay Reason:</div>
                                  <div className="text-xs">{data.delay_reason}</div>
                                </div>
                              )}
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t">
                              <Badge 
                                variant="outline"
                                className={cn(
                                  data.is_outlier ? 'text-destructive border-destructive' : 'text-success border-success'
                                )}
                              >
                                {data.is_outlier ? 'Outlier' : 'Normal'}
                              </Badge>
                              {data.is_outlier && (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => onOutlierClick?.(data as any)}
                                >
                                  <Target className="h-3 w-3 mr-1" />
                                  Investigate
                                </Button>
                              )}
                            </div>
                          </div>,
                          ''
                        ]
                      }
                    }}
                  />}
                  cursor={{ strokeDasharray: '3 3' }}
                />

                {viewType === 'boxplot' ? (
                  // Boxplot visualization (simplified as scatter points for quartiles)
                  processedData.map((group: any, index) => (
                    <ReferenceLine 
                      key={`target-${index}`}
                      y={group.targetTime} 
                      stroke="hsl(var(--chart-2))" 
                      strokeDasharray="5 5" 
                      strokeOpacity={0.5}
                    />
                  ))
                ) : (
                  <Scatter 
                    name="Processing Time"
                    data={processedData}
                    onClick={onOutlierClick}
                  >
                    {(processedData as any[]).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.fill}
                        stroke={entry.is_outlier ? 'hsl(var(--destructive))' : 'transparent'}
                        strokeWidth={entry.is_outlier ? 2 : 0}
                        r={entry.size}
                      />
                    ))}
                  </Scatter>
                )}

                {/* Average target time reference line */}
                <ReferenceLine 
                  y={summaryStats?.avgTargetTime ? parseFloat(summaryStats.avgTargetTime) : 24} 
                  stroke="hsl(var(--chart-2))" 
                  strokeDasharray="5 5" 
                  strokeOpacity={0.7}
                  label={{ value: "Target", position: "topRight", fontSize: 10 }}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Legend */}
          <div className="flex flex-wrap justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-1" />
              <span>Receiving</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-2" />
              <span>Inspection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-3" />
              <span>Putaway</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-4" />
              <span>System Processing</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-5 border-2 border-destructive" />
              <span>Outliers</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delay Analysis Summary */}
      {summaryStats && Object.keys(summaryStats.delayBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Delay Category Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(summaryStats.delayBreakdown).map(([category, count]) => (
                <div key={category} className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {category.replace('_', ' ')}
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="mt-2 w-full"
                    onClick={() => onDelayAnalysis?.(category)}
                  >
                    Analyze
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}