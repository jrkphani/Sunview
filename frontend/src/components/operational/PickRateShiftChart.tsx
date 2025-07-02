import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Legend,
  ComposedChart,
  Line
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
  Target,
  Shuffle
} from 'lucide-react'
import { useState, useMemo } from 'react'
import type { PickRateMetrics } from '@/types/api'

interface PickRateShiftChartProps {
  data: PickRateMetrics[]
  loading?: boolean
  height?: number
  showDetailedView?: boolean
  onShiftClick?: (shift: PickRateMetrics) => void
  onRescheduleRecommendation?: (recommendations: any[]) => void
}

const chartConfig = {
  picks_per_hour: {
    label: "Picks per Hour",
    color: "hsl(var(--chart-1))",
  },
  target_picks_per_hour: {
    label: "Target Picks per Hour",
    color: "hsl(var(--chart-2))",
  },
  efficiency_percentage: {
    label: "Efficiency %",
    color: "hsl(var(--chart-4))",
  },
  equipment_utilization: {
    label: "Equipment Utilization %",
    color: "hsl(var(--chart-3))",
  }
} satisfies ChartConfig

// Helper function to get performance grade color
const getPerformanceColor = (grade: string) => {
  switch (grade) {
    case 'excellent':
      return 'hsl(var(--chart-2))'
    case 'good':
      return 'hsl(var(--chart-1))'
    case 'needs_improvement':
      return 'hsl(var(--chart-4))'
    case 'poor':
      return 'hsl(var(--chart-5))'
    default:
      return 'hsl(var(--muted))'
  }
}

const getShiftTimeRange = (shiftType: string) => {
  switch (shiftType) {
    case 'morning':
      return '6:00 AM - 2:00 PM'
    case 'afternoon':
      return '2:00 PM - 10:00 PM'
    case 'night':
      return '10:00 PM - 6:00 AM'
    default:
      return 'Unknown'
  }
}

export default function PickRateShiftChart({
  data = [],
  loading = false,
  height = 350,
  showDetailedView = false,
  onShiftClick,
  onRescheduleRecommendation
}: PickRateShiftChartProps) {
  const [selectedSite, setSelectedSite] = useState<string>('all')
  const [selectedShift, setSelectedShift] = useState<string>('all')
  const [comparisonMode, setComparisonMode] = useState<'daily' | 'shift_comparison' | 'trend'>('daily')
  const [performanceFilter, setPerformanceFilter] = useState<string>('all')

  // Filter and process data
  const processedData = useMemo(() => {
    let filtered = data

    if (selectedSite !== 'all') {
      filtered = filtered.filter(item => item.site_id === selectedSite)
    }

    if (selectedShift !== 'all') {
      filtered = filtered.filter(item => item.shift_type === selectedShift)
    }

    if (performanceFilter !== 'all') {
      filtered = filtered.filter(item => item.performance_grade === performanceFilter)
    }

    if (comparisonMode === 'shift_comparison') {
      // Group by shift type for comparison
      const grouped = filtered.reduce((acc, item) => {
        if (!acc[item.shift_type]) {
          acc[item.shift_type] = {
            shift_type: item.shift_type,
            items: [],
            totalPicks: 0,
            totalHours: 0,
            totalWorkers: 0,
            totalDowntime: 0,
            totalEquipmentUtil: 0,
            count: 0
          }
        }
        
        acc[item.shift_type].items.push(item)
        acc[item.shift_type].totalPicks += item.total_picks
        acc[item.shift_type].totalHours += item.total_hours
        acc[item.shift_type].totalWorkers += item.worker_count
        acc[item.shift_type].totalDowntime += item.downtime_minutes
        acc[item.shift_type].totalEquipmentUtil += item.equipment_utilization
        acc[item.shift_type].count += 1

        return acc
      }, {} as Record<string, any>)

      return Object.values(grouped).map((group: any) => {
        const avgPicksPerHour = group.totalPicks / group.totalHours
        const avgTargetPicks = group.items.reduce((sum: number, item: PickRateMetrics) => 
          sum + item.target_picks_per_hour, 0) / group.count
        const avgEfficiency = group.items.reduce((sum: number, item: PickRateMetrics) => 
          sum + item.efficiency_percentage, 0) / group.count
        const avgEquipmentUtil = group.totalEquipmentUtil / group.count
        
        // Determine overall performance grade
        const gradeScore = group.items.reduce((sum: number, item: PickRateMetrics) => {
          const scores = { excellent: 4, good: 3, needs_improvement: 2, poor: 1 }
          return sum + (scores[item.performance_grade as keyof typeof scores] || 0)
        }, 0) / group.count
        
        const overallGrade = gradeScore >= 3.5 ? 'excellent' : 
                           gradeScore >= 2.5 ? 'good' : 
                           gradeScore >= 1.5 ? 'needs_improvement' : 'poor'

        return {
          name: `${group.shift_type.charAt(0).toUpperCase() + group.shift_type.slice(1)} Shift`,
          shift_type: group.shift_type,
          timeRange: getShiftTimeRange(group.shift_type),
          picks_per_hour: avgPicksPerHour,
          target_picks_per_hour: avgTargetPicks,
          efficiency_percentage: avgEfficiency,
          equipment_utilization: avgEquipmentUtil,
          total_picks: group.totalPicks,
          total_hours: group.totalHours,
          worker_count: Math.round(group.totalWorkers / group.count),
          downtime_minutes: Math.round(group.totalDowntime / group.count),
          performance_grade: overallGrade,
          items: group.items,
          count: group.count,
          fill: getPerformanceColor(overallGrade),
          needsImprovement: avgEfficiency < 85 || overallGrade === 'poor' || overallGrade === 'needs_improvement'
        }
      })
    } else {
      // Group by date for daily view
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

      return Object.values(grouped).map((group: any) => {
        const items = group.items as PickRateMetrics[]
        const avgPicksPerHour = items.reduce((sum, item) => sum + item.picks_per_hour, 0) / items.length
        const avgTargetPicks = items.reduce((sum, item) => sum + item.target_picks_per_hour, 0) / items.length
        const avgEfficiency = items.reduce((sum, item) => sum + item.efficiency_percentage, 0) / items.length
        const avgEquipmentUtil = items.reduce((sum, item) => sum + item.equipment_utilization, 0) / items.length
        
        // Determine dominant performance grade
        const gradeCounts = items.reduce((acc, item) => {
          acc[item.performance_grade] = (acc[item.performance_grade] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        
        const dominantGrade = Object.entries(gradeCounts).reduce((a, b) => 
          gradeCounts[a[0]] > gradeCounts[b[0]] ? a : b
        )[0]

        return {
          name: `${new Date(group.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} ${group.shift_type.charAt(0).toUpperCase()}`,
          fullDate: group.date,
          shift_type: group.shift_type,
          site_name: group.site_name,
          picks_per_hour: avgPicksPerHour,
          target_picks_per_hour: avgTargetPicks,
          efficiency_percentage: avgEfficiency,
          equipment_utilization: avgEquipmentUtil,
          total_picks: items.reduce((sum, item) => sum + item.total_picks, 0),
          total_hours: items.reduce((sum, item) => sum + item.total_hours, 0),
          worker_count: Math.round(items.reduce((sum, item) => sum + item.worker_count, 0) / items.length),
          downtime_minutes: Math.round(items.reduce((sum, item) => sum + item.downtime_minutes, 0) / items.length),
          performance_grade: dominantGrade,
          items,
          fill: getPerformanceColor(dominantGrade),
          needsImprovement: avgEfficiency < 85 || dominantGrade === 'poor' || dominantGrade === 'needs_improvement'
        }
      }).sort((a, b) => new Date(a.fullDate || 0).getTime() - new Date(b.fullDate || 0).getTime())
    }
  }, [data, selectedSite, selectedShift, comparisonMode, performanceFilter])

  // Get unique values for filters
  const sites = useMemo(() => [...new Set(data.map(item => item.site_id))], [data])
  const shifts = useMemo(() => [...new Set(data.map(item => item.shift_type))], [data])
  const performanceGrades = useMemo(() => [...new Set(data.map(item => item.performance_grade))], [data])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (processedData.length === 0) return null

    const avgPicksPerHour = processedData.reduce((sum, item) => sum + item.picks_per_hour, 0) / processedData.length
    const avgEfficiency = processedData.reduce((sum, item) => sum + item.efficiency_percentage, 0) / processedData.length
    const avgEquipmentUtil = processedData.reduce((sum, item) => sum + item.equipment_utilization, 0) / processedData.length
    const underperformingShifts = processedData.filter(item => item.needsImprovement).length

    // Best and worst performing shifts
    const bestShift = processedData.reduce((best, current) => 
      current.efficiency_percentage > best.efficiency_percentage ? current : best
    )
    const worstShift = processedData.reduce((worst, current) => 
      current.efficiency_percentage < worst.efficiency_percentage ? current : worst
    )

    return {
      avgPicksPerHour: avgPicksPerHour.toFixed(1),
      avgEfficiency: avgEfficiency.toFixed(1),
      avgEquipmentUtil: avgEquipmentUtil.toFixed(1),
      underperformingShifts,
      bestShift,
      worstShift,
      totalShifts: processedData.length
    }
  }, [processedData])

  // Generate rescheduling recommendations
  const rescheduleRecommendations = useMemo(() => {
    if (comparisonMode !== 'shift_comparison') return []

    return processedData
      .filter(item => item.needsImprovement)
      .map(shift => ({
        shift: shift.shift_type,
        currentEfficiency: shift.efficiency_percentage,
        recommendation: shift.efficiency_percentage < 70 ? 
          'Consider reducing staff or reassigning to higher-performing shifts' :
          'Investigate equipment utilization and provide additional training',
        priority: shift.efficiency_percentage < 70 ? 'high' : 'medium',
        estimatedImprovement: shift.efficiency_percentage < 70 ? '15-25%' : '5-15%'
      }))
  }, [processedData, comparisonMode])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pick Rate by Shift</CardTitle>
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
          <CardTitle>Pick Rate by Shift</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No pick rate data available</p>
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
                  <Activity className="h-5 w-5" />
                  Pick Rate Performance by Shift
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Compare shift performance and identify optimization opportunities
                </p>
              </div>

              <div className="flex items-center gap-2">
                <ToggleGroup 
                  type="single" 
                  value={comparisonMode} 
                  onValueChange={(value) => value && setComparisonMode(value as typeof comparisonMode)}
                >
                  <ToggleGroupItem value="daily" className="text-xs">Daily</ToggleGroupItem>
                  <ToggleGroupItem value="shift_comparison" className="text-xs">Compare</ToggleGroupItem>
                  <ToggleGroupItem value="trend" className="text-xs">Trend</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            {/* Filters */}
            {showDetailedView && (
              <div className="flex flex-wrap items-center gap-4">
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

                <Select value={performanceFilter} onValueChange={setPerformanceFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Performance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {performanceGrades.map(grade => (
                      <SelectItem key={grade} value={grade}>
                        {grade.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {rescheduleRecommendations.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRescheduleRecommendation?.(rescheduleRecommendations)}
                  >
                    <Shuffle className="h-4 w-4 mr-2" />
                    Reschedule ({rescheduleRecommendations.length})
                  </Button>
                )}
              </div>
            )}

            {/* Summary Statistics */}
            {summaryStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1">
                    <div className="text-2xl font-bold">{summaryStats.avgPicksPerHour}</div>
                    <BarChart3 className="h-4 w-4" />
                  </div>
                  <div className="text-xs text-muted-foreground">Avg Picks/Hour</div>
                </div>

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
                  <div className="text-2xl font-bold">{summaryStats.avgEquipmentUtil}%</div>
                  <div className="text-xs text-muted-foreground">Equipment Util</div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-chart-5">{summaryStats.underperformingShifts}</div>
                  <div className="text-xs text-muted-foreground">Need Attention</div>
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
                  label={{ value: 'Picks per Hour', angle: -90, position: 'insideLeft' }}
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
                              {data.site_name} • {data.timeRange || data.fullDate}
                            </div>
                          </div>
                        )
                      }
                      return label
                    }}
                    formatter={(value, name, props) => {
                      const data = props.payload
                      if (name === 'picks_per_hour') {
                        return [
                          <div key="pick-rate-details" className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <div className="text-xs text-muted-foreground">Actual Rate</div>
                                <div className="font-mono text-chart-1 font-semibold">
                                  {data.picks_per_hour?.toFixed(1)} picks/hr
                                </div>
                              </div>
                              <div>
                                <div className="text-xs text-muted-foreground">Target Rate</div>
                                <div className="font-mono text-chart-2 font-semibold">
                                  {data.target_picks_per_hour?.toFixed(1)} picks/hr
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Efficiency:</span>
                                <span className={cn(
                                  "font-mono",
                                  data.efficiency_percentage >= 85 ? 'text-success' :
                                  data.efficiency_percentage >= 70 ? 'text-warning' : 'text-destructive'
                                )}>
                                  {data.efficiency_percentage?.toFixed(1)}%
                                </span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Total Picks:</span>
                                <span className="font-mono">{data.total_picks?.toLocaleString()}</span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Workers:</span>
                                <span className="font-mono">{data.worker_count}</span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Equipment Util:</span>
                                <span className="font-mono">{data.equipment_utilization?.toFixed(1)}%</span>
                              </div>

                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Downtime:</span>
                                <span className="font-mono">{data.downtime_minutes} min</span>
                              </div>

                              <div className="flex justify-between items-center pt-2 border-t">
                                <span className="text-muted-foreground">Grade:</span>
                                <Badge 
                                  variant="outline"
                                  className={cn(
                                    data.performance_grade === 'excellent' ? 'text-success border-success' :
                                    data.performance_grade === 'good' ? 'text-chart-1 border-chart-1' :
                                    data.performance_grade === 'needs_improvement' ? 'text-warning border-warning' :
                                    'text-destructive border-destructive'
                                  )}
                                >
                                  {data.performance_grade === 'excellent' && <CheckCircle className="h-3 w-3 mr-1" />}
                                  {data.performance_grade !== 'excellent' && <AlertTriangle className="h-3 w-3 mr-1" />}
                                  {data.performance_grade?.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>

                              {data.needsImprovement && (
                                <div className="pt-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => onShiftClick?.(data.items?.[0] || data)}
                                    className="w-full"
                                  >
                                    <Target className="h-3 w-3 mr-1" />
                                    Optimize Shift
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

                {/* Target line */}
                <ReferenceLine 
                  yAxisId="left"
                  y={data.length > 0 ? data.reduce((sum, item) => sum + item.target_picks_per_hour, 0) / data.length : 100} 
                  stroke="hsl(var(--chart-2))" 
                  strokeDasharray="5 5" 
                  strokeOpacity={0.7}
                  label={{ value: "Target", position: "topRight", fontSize: 10 }}
                />

                {/* Pick rate bars with performance-based coloring */}
                <Bar
                  yAxisId="left"
                  dataKey="picks_per_hour"
                  name="Picks per Hour"
                  radius={[2, 2, 0, 0]}
                  onClick={onShiftClick}
                >
                  {processedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill}
                      stroke={entry.needsImprovement ? 'hsl(var(--destructive))' : 'transparent'}
                      strokeWidth={entry.needsImprovement ? 2 : 0}
                    />
                  ))}
                </Bar>

                {/* Efficiency line */}
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

          {/* Performance Legend */}
          <div className="flex flex-wrap justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-2" />
              <span>Excellent ({'>'}90%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-1" />
              <span>Good (75-90%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-4" />
              <span>Needs Improvement (60-75%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-chart-5" />
              <span>Poor ({'<'}60%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Best vs Worst Performance Comparison */}
      {summaryStats && comparisonMode === 'shift_comparison' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Shift Performance Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h4 className="font-semibold text-success flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Best Performing Shift
                </h4>
                <div className="p-4 bg-success/10 border border-success/20 rounded-lg">
                  <div className="text-lg font-bold">{summaryStats.bestShift.name}</div>
                  <div className="text-sm text-muted-foreground mb-2">{summaryStats.bestShift.timeRange}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Efficiency:</span>
                      <span className="font-mono">{summaryStats.bestShift.efficiency_percentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Picks/Hour:</span>
                      <span className="font-mono">{summaryStats.bestShift.picks_per_hour.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-destructive flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Needs Most Improvement
                </h4>
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <div className="text-lg font-bold">{summaryStats.worstShift.name}</div>
                  <div className="text-sm text-muted-foreground mb-2">{summaryStats.worstShift.timeRange}</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Efficiency:</span>
                      <span className="font-mono">{summaryStats.worstShift.efficiency_percentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Picks/Hour:</span>
                      <span className="font-mono">{summaryStats.worstShift.picks_per_hour.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rescheduling Recommendations */}
      {rescheduleRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rescheduleRecommendations.map((rec, index) => (
                <Alert key={index}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold capitalize">{rec.shift} Shift</span> - 
                        <span className="text-muted-foreground ml-1">
                          Current efficiency: {rec.currentEfficiency.toFixed(1)}%
                        </span>
                        <div className="text-sm mt-1">{rec.recommendation}</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Estimated improvement: {rec.estimatedImprovement}
                        </div>
                      </div>
                      <Badge variant={rec.priority === 'high' ? 'destructive' : 'default'}>
                        {rec.priority.toUpperCase()} PRIORITY
                      </Badge>
                    </div>
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