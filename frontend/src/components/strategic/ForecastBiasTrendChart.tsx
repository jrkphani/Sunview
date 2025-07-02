import React, { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Bar
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { TrendingUp, TrendingDown, Target, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

interface ForecastBiasDataPoint {
  week: number
  date: string
  productGroup: string
  bias: number
  confidence: number
  absoluteBias: number
}

interface ForecastBiasTrendChartProps {
  data: ForecastBiasDataPoint[]
  height?: number
  compact?: boolean
  className?: string
}

const biasThresholds = {
  excellent: 5,
  good: 10,
  fair: 15,
  poor: 20
}

export default function ForecastBiasTrendChart({ 
  data = [], 
  height = 400,
  compact = false,
  className 
}: ForecastBiasTrendChartProps) {
  const [selectedProductGroup, setSelectedProductGroup] = useState<string>('all')
  const [viewMode, setViewMode] = useState<string>('trend')
  const [selectedMetric, setSelectedMetric] = useState<string>('bias')

  // Extract unique product groups
  const productGroups = useMemo(() => {
    const unique = [...new Set(data.map(d => d.productGroup))]
    return [{ value: 'all', label: 'All Product Groups' }, ...unique.map(group => ({ value: group, label: group }))]
  }, [data])

  // Process data for visualization
  const chartData = useMemo(() => {
    const filteredData = selectedProductGroup === 'all' 
      ? data 
      : data.filter(d => d.productGroup === selectedProductGroup)

    // Group by week and aggregate
    const weeklyData = filteredData.reduce((acc, curr) => {
      const week = curr.week
      if (!acc[week]) {
        acc[week] = {
          week,
          date: curr.date,
          totalBias: 0,
          totalAbsoluteBias: 0,
          totalConfidence: 0,
          count: 0,
          groups: []
        }
      }
      
      acc[week].totalBias += curr.bias
      acc[week].totalAbsoluteBias += curr.absoluteBias
      acc[week].totalConfidence += curr.confidence
      acc[week].count += 1
      acc[week].groups.push({
        productGroup: curr.productGroup,
        bias: curr.bias,
        confidence: curr.confidence
      })
      
      return acc
    }, {} as Record<number, any>)

    // Convert to array and calculate averages
    return Object.values(weeklyData).map((week: any) => {
      const avgBias = week.totalBias / week.count
      const avgAbsoluteBias = week.totalAbsoluteBias / week.count
      const avgConfidence = week.totalConfidence / week.count
      
      return {
        ...week,
        avgBias,
        avgAbsoluteBias,
        avgConfidence,
        biasCategory: getBiasCategory(avgAbsoluteBias),
        trend: avgBias > 0 ? 'over' : 'under',
        formattedDate: new Date(week.date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      }
    }).sort((a, b) => a.week - b.week)
  }, [data, selectedProductGroup])

  // Calculate statistics and insights
  const statistics = useMemo(() => {
    if (chartData.length === 0) return null

    const biases = chartData.map(d => d.avgBias)
    const absoluteBiases = chartData.map(d => d.avgAbsoluteBias)
    const confidences = chartData.map(d => d.avgConfidence)

    const avgBias = biases.reduce((sum, val) => sum + val, 0) / biases.length
    const avgAbsoluteBias = absoluteBiases.reduce((sum, val) => sum + val, 0) / absoluteBiases.length
    const avgConfidence = confidences.reduce((sum, val) => sum + val, 0) / confidences.length

    // Trend analysis
    const recentBias = biases.slice(-4).reduce((sum, val) => sum + val, 0) / 4
    const earlierBias = biases.slice(0, 4).reduce((sum, val) => sum + val, 0) / 4
    const trendDirection = recentBias > earlierBias ? 'worsening' : 'improving'

    // Bias distribution
    const biasDistribution = {
      excellent: chartData.filter(d => d.avgAbsoluteBias <= biasThresholds.excellent).length,
      good: chartData.filter(d => d.avgAbsoluteBias > biasThresholds.excellent && d.avgAbsoluteBias <= biasThresholds.good).length,
      fair: chartData.filter(d => d.avgAbsoluteBias > biasThresholds.good && d.avgAbsoluteBias <= biasThresholds.fair).length,
      poor: chartData.filter(d => d.avgAbsoluteBias > biasThresholds.fair).length
    }

    // Systematic bias detection
    const overForecastWeeks = chartData.filter(d => d.avgBias > 5).length
    const underForecastWeeks = chartData.filter(d => d.avgBias < -5).length
    const systematicBias = overForecastWeeks > underForecastWeeks ? 'over' : 
                          underForecastWeeks > overForecastWeeks ? 'under' : 'balanced'

    return {
      avgBias,
      avgAbsoluteBias,
      avgConfidence,
      trendDirection,
      biasDistribution,
      systematicBias,
      totalWeeks: chartData.length,
      overForecastWeeks,
      underForecastWeeks
    }
  }, [chartData])

  const chartConfig = {
    bias: {
      label: 'Forecast Bias (%)',
      color: 'hsl(var(--primary))',
    },
    absoluteBias: {
      label: 'Absolute Bias (%)',
      color: 'hsl(var(--destructive))',
    },
    confidence: {
      label: 'Confidence (%)',
      color: 'hsl(var(--success))',
    },
  } satisfies ChartConfig

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center space-y-2">
            <Target className="h-12 w-12 mx-auto opacity-50" />
            <p className="text-lg font-medium">No forecast bias data available</p>
            <p className="text-sm">Bias trend analysis will appear when data is loaded</p>
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
              <Target className="h-5 w-5" />
              <CardTitle>Forecast Bias Trend Analysis</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedProductGroup} onValueChange={setSelectedProductGroup}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {productGroups.map(group => (
                    <SelectItem key={group.value} value={group.value}>
                      {group.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {statistics && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge 
                variant={statistics.avgAbsoluteBias <= 10 ? "default" : "destructive"}
                className="text-xs px-2 py-1"
              >
                Avg Bias: {statistics.avgBias.toFixed(1)}%
              </Badge>
              <Badge 
                variant={statistics.systematicBias === 'balanced' ? "default" : "secondary"}
                className="text-xs px-2 py-1"
              >
                {statistics.systematicBias === 'over' ? 'Over-forecasting' : 
                 statistics.systematicBias === 'under' ? 'Under-forecasting' : 'Balanced'}
              </Badge>
              <span className="text-xs text-neutral-600 font-medium">
                Trend: {statistics.trendDirection}
              </span>
            </div>
          )}
        </CardHeader>
      )}
      
      <CardContent>
        <Tabs value={viewMode} onValueChange={setViewMode} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trend">Bias Trend</TabsTrigger>
            <TabsTrigger value="distribution">Distribution</TabsTrigger>
            <TabsTrigger value="confidence">Confidence</TabsTrigger>
          </TabsList>

          <TabsContent value="trend" className="space-y-4">
            <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <defs>
                  <linearGradient id="biasGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                
                <XAxis 
                  dataKey="formattedDate" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                  domain={[-30, 30]}
                />
                
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    formatter={(value, name, props) => {
                      const data = props.payload
                      return [
                        <div key="bias-details" className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span>Forecast Bias:</span>
                            <span className="font-mono font-bold">{data.avgBias.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Absolute Bias:</span>
                            <span className="font-mono">{data.avgAbsoluteBias.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Confidence:</span>
                            <span className="font-mono">{data.avgConfidence.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>Category:</span>
                            <Badge variant={data.biasCategory === 'excellent' ? "default" : 
                                          data.biasCategory === 'good' ? "secondary" : "destructive"}>
                              {data.biasCategory}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {data.trend === 'over' ? 'Over-forecasting' : 'Under-forecasting'}
                          </div>
                        </div>,
                        ''
                      ]
                    }}
                  />}
                />
                
                {/* Zero reference line */}
                <ReferenceLine 
                  y={0} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="2 2"
                  label={{ value: "No Bias", position: "left", fontSize: 10 }}
                />
                
                {/* Acceptable bias range */}
                <ReferenceLine 
                  y={10} 
                  stroke="hsl(var(--warning))" 
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                <ReferenceLine 
                  y={-10} 
                  stroke="hsl(var(--warning))" 
                  strokeDasharray="3 3"
                  strokeOpacity={0.5}
                />
                
                {/* Bias area with line */}
                <Area
                  type="monotone"
                  dataKey="avgBias"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fill="url(#biasGradient)"
                  dot={{ r: 4, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                />
              </ComposedChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="distribution" className="space-y-4">
            <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                
                <XAxis 
                  dataKey="formattedDate" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                
                <ChartTooltip content={<ChartTooltipContent />} />
                
                <Bar
                  dataKey="avgAbsoluteBias"
                  fill={(entry: any) => getBiasColor(entry.avgAbsoluteBias)}
                  radius={[2, 2, 0, 0]}
                />
              </ComposedChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="confidence" className="space-y-4">
            <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                
                <XAxis 
                  dataKey="formattedDate" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                  domain={[60, 100]}
                />
                
                <ChartTooltip content={<ChartTooltipContent />} />
                
                <Line
                  type="monotone"
                  dataKey="avgConfidence"
                  stroke="hsl(var(--success))"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "hsl(var(--success))" }}
                  activeDot={{ r: 6, fill: "hsl(var(--success))" }}
                />
              </LineChart>
            </ChartContainer>
          </TabsContent>
        </Tabs>

        {/* Summary Statistics */}
        {!compact && statistics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  {statistics.avgAbsoluteBias <= 10 ? (
                    <CheckCircle className="h-8 w-8 text-success" />
                  ) : statistics.avgAbsoluteBias <= 15 ? (
                    <AlertTriangle className="h-8 w-8 text-warning" />
                  ) : (
                    <XCircle className="h-8 w-8 text-error" />
                  )}
                </div>
                <div className="text-2xl font-bold">{statistics.avgAbsoluteBias.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Avg Absolute Bias</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-2">
                  {statistics.trendDirection === 'improving' ? (
                    <TrendingDown className="h-8 w-8 text-success" />
                  ) : (
                    <TrendingUp className="h-8 w-8 text-error" />
                  )}
                </div>
                <div className="text-lg font-bold capitalize">{statistics.trendDirection}</div>
                <div className="text-sm text-muted-foreground">Bias Trend</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">{statistics.avgConfidence.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Avg Confidence</div>
                <div className="mt-2">
                  <Badge variant={statistics.avgConfidence >= 85 ? "default" : "secondary"}>
                    {statistics.avgConfidence >= 85 ? 'High' : 'Medium'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold">
                  {Math.round((statistics.biasDistribution.excellent + statistics.biasDistribution.good) / 
                   statistics.totalWeeks * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Good Performance</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {statistics.biasDistribution.excellent + statistics.biasDistribution.good} of {statistics.totalWeeks} weeks
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Helper functions
function getBiasCategory(absoluteBias: number): string {
  if (absoluteBias <= biasThresholds.excellent) return 'excellent'
  if (absoluteBias <= biasThresholds.good) return 'good'
  if (absoluteBias <= biasThresholds.fair) return 'fair'
  return 'poor'
}

function getBiasColor(absoluteBias: number): string {
  const category = getBiasCategory(absoluteBias)
  switch (category) {
    case 'excellent': return 'hsl(var(--success))'
    case 'good': return 'hsl(var(--primary))'
    case 'fair': return 'hsl(var(--warning))'
    default: return 'hsl(var(--destructive))'
  }
}