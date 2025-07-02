import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
  Cell
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { useState, useMemo } from 'react'
import type { LaborForecastData } from '@/types/api'

interface LaborForecastOverlayProps {
  data: LaborForecastData[]
  loading?: boolean
  height?: number
  showDetailedView?: boolean
  onShiftClick?: (shift: LaborForecastData) => void
  onRescheduleAlert?: (shift: LaborForecastData) => void
}

const chartConfig = {
  forecasted_headcount: {
    label: "Forecasted Headcount",
    color: "hsl(var(--chart-1))",
  },
  actual_headcount: {
    label: "Actual Headcount",
    color: "hsl(var(--chart-2))",
  },
  efficiency_line: {
    label: "Efficiency %",
    color: "hsl(var(--chart-4))",
  },
  cost_impact: {
    label: "Cost Impact",
    color: "hsl(var(--chart-5))",
  }
} satisfies ChartConfig

// Helper function to get status color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'optimal':
      return 'hsl(var(--chart-2))'
    case 'overstaffed':
      return 'hsl(var(--chart-5))'
    case 'understaffed':
      return 'hsl(var(--chart-4))'
    default:
      return 'hsl(var(--muted))'
  }
}

export default function LaborForecastOverlay({
  data = [],
  loading = false,
  height = 350,
  showDetailedView = false,
  onShiftClick,
  onRescheduleAlert
}: LaborForecastOverlayProps) {
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedShift, setSelectedShift] = useState<string>('all')
  const [timeView, setTimeView] = useState<'daily' | 'weekly'>('daily')
  const [highlightIssues, setHighlightIssues] = useState(true)

  // Filter and process data
  const processedData = useMemo(() => {
    let filtered = data

    if (selectedSite !== 'all') {
      filtered = filtered.filter(item => item.site_id === selectedSite)
    }

    if (selectedShift !== 'all') {
      filtered = filtered.filter(item => item.shift_type === selectedShift)
    }

    // Group by date and shift
    const grouped = filtered.reduce((acc, item) => {
      const dateKey = `${item.shift_date}_${item.shift_type}`
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: item.shift_date,
          shift_type: item.shift_type,
          site_name: item.site_name,
          items: []
        }
      }
      acc[dateKey].items.push(item)
      return acc
    }, {} as Record<string, any>)

    // Calculate aggregated metrics
    return Object.values(grouped).map((group: any) => {
      const items = group.items as LaborForecastData[]
      const totalForecasted = items.reduce((sum, item) => sum + item.forecasted_headcount, 0)
      const totalActual = items.reduce((sum, item) => sum + item.actual_headcount, 0)
      const avgEfficiency = items.reduce((sum, item) => sum + item.efficiency_percentage, 0) / items.length
      const totalCostImpact = items.reduce((sum, item) => sum + Math.abs(item.cost_impact), 0)
      const avgVariance = items.reduce((sum, item) => sum + item.variance_percentage, 0) / items.length

      // Determine overall status
      const overstaffed = items.filter(item => item.status === 'overstaffed').length
      const understaffed = items.filter(item => item.status === 'understaffed').length
      const optimal = items.filter(item => item.status === 'optimal').length
      
      let overallStatus: string
      if (optimal >= overstaffed && optimal >= understaffed) {
        overallStatus = 'optimal'
      } else if (overstaffed > understaffed) {
        overallStatus = 'overstaffed'
      } else {
        overallStatus = 'understaffed'
      }

      return {
        name: `${new Date(group.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${group.shift_type.charAt(0).toUpperCase()}`,
        fullDate: group.date,
        shift_type: group.shift_type,
        site_name: group.site_name,
        forecasted_headcount: totalForecasted,
        actual_headcount: totalActual,
        efficiency_percentage: avgEfficiency,
        cost_impact: totalCostImpact,
        variance_percentage: avgVariance,
        status: overallStatus,
        items,
        needsAttention: Math.abs(avgVariance) > 15 || avgEfficiency < 80,
        fill: getStatusColor(overallStatus)
      }
    }).sort((a, b) => new Date(a.fullDate).getTime() - new Date(b.fullDate).getTime())
  }, [data, selectedSite, selectedShift])

  // Get unique values for filters
  const sites = useMemo(() => [...new Set(data.map(item => item.site_id))], [data])
  const shifts = useMemo(() => [...new Set(data.map(item => item.shift_type))], [data])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (processedData.length === 0) return null

    const avgEfficiency = processedData.reduce((sum, item) => sum + item.efficiency_percentage, 0) / processedData.length
    const totalCostImpact = processedData.reduce((sum, item) => sum + item.cost_impact, 0)
    const optimalShifts = processedData.filter(item => item.status === 'optimal').length
    const problematicShifts = processedData.filter(item => item.needsAttention).length

    return {
      avgEfficiency: avgEfficiency.toFixed(1),
      totalCostImpact: totalCostImpact,
      optimalShifts,
      problematicShifts,
      optimalPercentage: ((optimalShifts / processedData.length) * 100).toFixed(1)
    }
  }, [processedData])

  // Get shifts that need rescheduling recommendations
  const shiftsNeedingAttention = useMemo(() => {
    return processedData.filter(item => item.needsAttention).slice(0, 3)
  }, [processedData])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Labor Forecast vs Actual</CardTitle>
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
          <CardTitle>Labor Forecast vs Actual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No labor data available</p>
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Labor Forecast vs Actual
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Track staffing efficiency and identify under/overstaffed shifts
              </p>
            </div>
            
            {showDetailedView && (
              <div className="flex items-center gap-2">
                <Select value={selectedSite} onValueChange={setSelectedSite}>
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

                <Select value={selectedShift} onValueChange={setSelectedShift}>
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

                <Button
                  variant={highlightIssues ? "default" : "outline"}
                  size="sm"
                  onClick={() => setHighlightIssues(!highlightIssues)}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Issues
                </Button>
              </div>
            )}
          </div>

          {/* Summary Statistics */}
          {summaryStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center gap-1">
                  <div className="text-2xl font-bold">{summaryStats.avgEfficiency}%</div>
                  {parseFloat(summaryStats.avgEfficiency) >= 85 ? 
                    <TrendingUp className="h-4 w-4 text-success" /> : 
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  }
                </div>
                <div className="text-xs text-muted-foreground">Avg Efficiency</div>
              </div>

              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-chart-2">{summaryStats.optimalShifts}</div>
                <div className="text-xs text-muted-foreground">Optimal Shifts</div>
              </div>

              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-chart-5">{summaryStats.problematicShifts}</div>
                <div className="text-xs text-muted-foreground">Need Attention</div>
              </div>

              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold">
                  ${(summaryStats.totalCostImpact / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-muted-foreground">Cost Impact</div>
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
              <ComposedChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                
                <YAxis 
                  yAxisId="left"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  label={{ value: 'Headcount', angle: -90, position: 'insideLeft' }}
                />
                
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value}%`}
                  label={{ value: 'Efficiency %', angle: 90, position: 'insideRight' }}
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
                            <div className="text-xs text-muted-foreground">
                              {data.site_name} • {data.fullDate}
                            </div>
                          </div>
                        )
                      }
                      return label
                    }}
                    formatter={(value, name, props) => {
                      const data = props.payload
                      if (name === 'forecasted_headcount') {
                        return [
                          <div key="labor-details" className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs text-muted-foreground">Forecasted</div>
                                <div className="font-mono text-chart-1 font-semibold">
                                  {data.forecasted_headcount} people
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Actual</div>
                                <div className="font-mono text-chart-2 font-semibold">
                                  {data.actual_headcount} people
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Variance:</span>
                                <div className="flex items-center gap-1">
                                  {data.variance_percentage > 0 ? 
                                    <ArrowUp className="h-3 w-3 text-chart-5" /> : 
                                    <ArrowDown className="h-3 w-3 text-chart-4" />
                                  }
                                  <span className={cn(
                                    "font-mono",
                                    Math.abs(data.variance_percentage) <= 10 ? 'text-success' :
                                    Math.abs(data.variance_percentage) <= 20 ? 'text-warning' : 'text-destructive'
                                  )}>
                                    {data.variance_percentage > 0 ? '+' : ''}{data.variance_percentage?.toFixed(1)}%
                                  </span>
                                </div>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Efficiency:</span>
                                <span className="font-mono">{data.efficiency_percentage?.toFixed(1)}%</span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Cost Impact:</span>
                                <span className={cn(
                                  "font-mono",
                                  data.cost_impact > 0 ? 'text-destructive' : 'text-success'
                                )}>
                                  ${Math.abs(data.cost_impact).toLocaleString()}
                                </span>
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t">
                                <span className="text-muted-foreground">Status:</span>
                                <Badge 
                                  variant="outline"
                                  className={cn(
                                    data.status === 'optimal' ? 'text-success border-success' :
                                    data.status === 'overstaffed' ? 'text-destructive border-destructive' :
                                    'text-warning border-warning'
                                  )}
                                >
                                  {data.status === 'optimal' && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {data.status !== 'optimal' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                  {data.status === 'optimal' ? 'Optimal' :
                                   data.status === 'overstaffed' ? 'Overstaffed' : 'Understaffed'}
                                </Badge>
                              </div>

                              {data.needsAttention && (
                                <div className="pt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => onRescheduleAlert?.(data.items[0])}
                                    className="w-full"
                                  >
                                    <Calendar className="h-3 w-3 mr-1" />
                                    Suggest Reschedule
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>,
                          ''
                        ]
                      }
                      return [value, name]
                    }}
                  />}
                />

                {/* Reference line for 100% efficiency */}
                <ReferenceLine 
                  yAxisId="right"
                  y={100} 
                  stroke="hsl(var(--muted-foreground))" 
                  strokeDasharray="2 2" 
                  strokeOpacity={0.5}
                  label={{ value: "100% Efficiency", position: "topRight", fontSize: 10 }}
                />

                {/* Forecasted headcount bars */}
                <Bar
                  yAxisId="left"
                  dataKey="forecasted_headcount"
                  fill="hsl(var(--chart-1))"
                  fillOpacity={0.6}
                  name="Forecasted"
                  radius={[2, 2, 0, 0]}
                />

                {/* Actual headcount bars with dynamic coloring */}
                <Bar
                  yAxisId="left"
                  dataKey="actual_headcount"
                  name="Actual"
                  radius={[2, 2, 0, 0]}
                  onClick={onShiftClick}
                >
                  {processedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={highlightIssues && entry.needsAttention ? 
                        entry.fill : 
                        'hsl(var(--chart-2))'
                      }
                      stroke={entry.needsAttention ? 'hsl(var(--destructive))' : 'transparent'}
                      strokeWidth={entry.needsAttention ? 2 : 0}
                    />
                  ))}
                </Bar>

                {/* Efficiency percentage line */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="efficiency_percentage"
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
                  name="Efficiency %"
                />

                <ChartLegend content={<ChartLegendContent />} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Scheduling Recommendations */}
      {shiftsNeedingAttention.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Scheduling Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {shiftsNeedingAttention.map((shift, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold">{shift.name}</span> - 
                      <span className={cn(
                        "ml-1",
                        shift.status === 'overstaffed' ? 'text-destructive' : 'text-warning'
                      )}>
                        {shift.status === 'overstaffed' ? 'Reduce' : 'Increase'} by {Math.abs(shift.variance_percentage).toFixed(0)}%
                      </span>
                      <span className="text-muted-foreground ml-2">
                        (Cost impact: ${Math.abs(shift.cost_impact).toLocaleString()})
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onRescheduleAlert?.(shift.items[0])}
                    >
                      Action
                    </Button>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}