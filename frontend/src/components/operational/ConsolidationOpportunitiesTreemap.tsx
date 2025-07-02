import {
  Treemap,
  ResponsiveContainer,
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
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { 
  Truck, 
  DollarSign, 
  Clock, 
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Route,
  Shuffle,
  Target,
  Calendar
} from 'lucide-react'
import { useState, useMemo } from 'react'
import type { ConsolidationOpportunity } from '@/types/api'

interface ConsolidationOpportunitiesTreemapProps {
  data: ConsolidationOpportunity[]
  loading?: boolean
  height?: number
  showDetailedView?: boolean
  onOpportunityClick?: (opportunity: ConsolidationOpportunity) => void
  onConsolidateAction?: (opportunities: ConsolidationOpportunity[]) => void
}

const chartConfig = {
  potential_savings: {
    label: "Potential Savings",
    color: "hsl(var(--chart-1))",
  },
  consolidation_feasibility: {
    label: "Feasibility Score",
    color: "hsl(var(--chart-2))",
  },
  timeline_compatibility: {
    label: "Timeline Compatibility",
    color: "hsl(var(--chart-3))",
  }
} satisfies ChartConfig

// Helper function to get color based on savings potential and feasibility
const getOpportunityColor = (savings: number, feasibility: number, timeline: number) => {
  const score = (feasibility + timeline) / 2
  const savingsNormalized = Math.min(savings / 100000, 1) // Normalize to 0-1 based on $100k max
  
  if (score >= 80 && savingsNormalized >= 0.5) {
    return 'hsl(var(--chart-2))' // High priority - green
  } else if (score >= 60 && savingsNormalized >= 0.3) {
    return 'hsl(var(--chart-1))' // Medium priority - blue
  } else if (score >= 40) {
    return 'hsl(var(--chart-4))' // Lower priority - yellow
  } else {
    return 'hsl(var(--chart-5))' // Low priority - red
  }
}

const getActionColor = (action: string) => {
  switch (action) {
    case 'consolidate':
      return 'hsl(var(--chart-2))'
    case 'reschedule':
      return 'hsl(var(--chart-4))'
    case 'optimize_route':
      return 'hsl(var(--chart-1))'
    default:
      return 'hsl(var(--muted))'
  }
}

export default function ConsolidationOpportunitiesTreemap({
  data = [],
  loading = false,
  height = 400,
  showDetailedView = false,
  onOpportunityClick,
  onConsolidateAction
}: ConsolidationOpportunitiesTreemapProps) {
  const [selectedAction, setSelectedAction] = useState<string>('all')
  const [minSavings, setMinSavings] = useState<number>(0)
  const [sortBy, setSortBy] = useState<'savings' | 'feasibility' | 'timeline'>('savings')

  // Filter and process data
  const processedData = useMemo(() => {
    let filtered = data

    if (selectedAction !== 'all') {
      filtered = filtered.filter(item => item.recommended_action === selectedAction)
    }

    if (minSavings > 0) {
      filtered = filtered.filter(item => item.potential_savings >= minSavings)
    }

    // Transform for treemap visualization
    return filtered.map((opportunity, index) => {
      const avgFillPercentage = opportunity.partial_loads.reduce((sum, load) => 
        sum + load.current_fill_percentage, 0) / opportunity.partial_loads.length
      
      const totalWeight = opportunity.partial_loads.reduce((sum, load) => 
        sum + load.weight_utilized, 0)
      
      const totalCapacity = opportunity.partial_loads.reduce((sum, load) => 
        sum + load.weight_capacity, 0)

      return {
        name: opportunity.destination,
        route_id: opportunity.route_id,
        value: opportunity.potential_savings, // Size based on savings
        savings: opportunity.potential_savings,
        feasibility: opportunity.consolidation_feasibility,
        timeline: opportunity.timeline_compatibility,
        action: opportunity.recommended_action,
        loads_count: opportunity.partial_loads.length,
        avg_fill_percentage: avgFillPercentage,
        total_weight: totalWeight,
        total_capacity: totalCapacity,
        utilization: (totalWeight / totalCapacity) * 100,
        priority_score: (opportunity.consolidation_feasibility + opportunity.timeline_compatibility) / 2,
        color: getOpportunityColor(
          opportunity.potential_savings, 
          opportunity.consolidation_feasibility, 
          opportunity.timeline_compatibility
        ),
        actionColor: getActionColor(opportunity.recommended_action),
        original: opportunity
      }
    }).sort((a, b) => {
      switch (sortBy) {
        case 'feasibility':
          return b.feasibility - a.feasibility
        case 'timeline':
          return b.timeline - a.timeline
        default:
          return b.savings - a.savings
      }
    })
  }, [data, selectedAction, minSavings, sortBy])

  // Get unique values for filters
  const actions = useMemo(() => [...new Set(data.map(item => item.recommended_action))], [data])

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (processedData.length === 0) return null

    const totalSavings = processedData.reduce((sum, item) => sum + item.savings, 0)
    const avgFeasibility = processedData.reduce((sum, item) => sum + item.feasibility, 0) / processedData.length
    const avgTimeline = processedData.reduce((sum, item) => sum + item.timeline, 0) / processedData.length
    const highPriorityOps = processedData.filter(item => item.priority_score >= 80).length
    const avgUtilization = processedData.reduce((sum, item) => sum + item.utilization, 0) / processedData.length

    const actionBreakdown = processedData.reduce((acc, item) => {
      acc[item.action] = (acc[item.action] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      totalSavings,
      avgFeasibility: avgFeasibility.toFixed(1),
      avgTimeline: avgTimeline.toFixed(1),
      highPriorityOps,
      avgUtilization: avgUtilization.toFixed(1),
      actionBreakdown,
      totalOpportunities: processedData.length
    }
  }, [processedData])

  // Get top opportunities for quick actions
  const topOpportunities = useMemo(() => {
    return processedData
      .filter(item => item.priority_score >= 70 && item.savings >= 10000)
      .slice(0, 5)
  }, [processedData])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Truck Consolidation Opportunities</CardTitle>
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
          <CardTitle>Truck Consolidation Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <div className="text-center">
              <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No consolidation opportunities found</p>
              <p className="text-sm">Check your load optimization settings</p>
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
                  <Truck className="h-5 w-5" />
                  Truck Consolidation Opportunities
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Identify partial loads with matching timelines for cost optimization
                </p>
              </div>

              {showDetailedView && onConsolidateAction && topOpportunities.length > 0 && (
                <Button
                  onClick={() => onConsolidateAction(topOpportunities.map(op => op.original))}
                  className="flex items-center gap-2"
                >
                  <Shuffle className="h-4 w-4" />
                  Consolidate Top {topOpportunities.length}
                </Button>
              )}
            </div>

            {/* Filters */}
            {showDetailedView && (
              <div className="flex flex-wrap items-center gap-4">
                <Select value={selectedAction} onValueChange={setSelectedAction}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {actions.map(action => (
                      <SelectItem key={action} value={action}>
                        {action.replace('_', ' ').toUpperCase()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={minSavings.toString()} onValueChange={(value) => setMinSavings(parseInt(value))}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Min Savings" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Any Savings</SelectItem>
                    <SelectItem value="5000">$5K+</SelectItem>
                    <SelectItem value="10000">$10K+</SelectItem>
                    <SelectItem value="25000">$25K+</SelectItem>
                    <SelectItem value="50000">$50K+</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="feasibility">Feasibility</SelectItem>
                    <SelectItem value="timeline">Timeline</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Summary Statistics */}
            {summaryStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold text-chart-2">
                    ${(summaryStats.totalSavings / 1000).toFixed(0)}K
                  </div>
                  <div className="text-xs text-muted-foreground">Total Savings</div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{summaryStats.highPriorityOps}</div>
                  <div className="text-xs text-muted-foreground">High Priority</div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{summaryStats.avgFeasibility}%</div>
                  <div className="text-xs text-muted-foreground">Avg Feasibility</div>
                </div>

                <div className="text-center p-3 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{summaryStats.avgUtilization}%</div>
                  <div className="text-xs text-muted-foreground">Avg Utilization</div>
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
              <Treemap
                data={processedData}
                dataKey="value"
                aspectRatio={4/3}
                stroke="hsl(var(--background))"
                strokeWidth={2}
                content={({ root, depth, x, y, width, height, index, payload, colors }) => {
                  if (!payload) return null
                  
                  const data = payload as any
                  const isLargeCell = width > 100 && height > 60
                  const isSmallCell = width < 80 || height < 40

                  return (
                    <g
                      onClick={() => onOpportunityClick?.(data.original)}
                      style={{ cursor: 'pointer' }}
                    >
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={data.color}
                        fillOpacity={0.8}
                        stroke="hsl(var(--border))"
                        strokeWidth={1}
                        rx={4}
                      />
                      
                      {/* Action indicator border */}
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill="none"
                        stroke={data.actionColor}
                        strokeWidth={3}
                        strokeOpacity={0.6}
                        rx={4}
                      />

                      {!isSmallCell && (
                        <>
                          {/* Destination name */}
                          <text
                            x={x + width / 2}
                            y={y + (isLargeCell ? 20 : height / 2 - 10)}
                            textAnchor="middle"
                            fill="hsl(var(--card-foreground))"
                            fontSize={isLargeCell ? 14 : 12}
                            fontWeight="bold"
                          >
                            {data.name.length > 12 ? `${data.name.substring(0, 12)}...` : data.name}
                          </text>

                          {/* Savings amount */}
                          <text
                            x={x + width / 2}
                            y={y + (isLargeCell ? 40 : height / 2 + 5)}
                            textAnchor="middle"
                            fill="hsl(var(--card-foreground))"
                            fontSize={isLargeCell ? 12 : 10}
                            fontFamily="monospace"
                          >
                            ${(data.savings / 1000).toFixed(0)}K
                          </text>

                          {isLargeCell && (
                            <>
                              {/* Loads count */}
                              <text
                                x={x + width / 2}
                                y={y + 55}
                                textAnchor="middle"
                                fill="hsl(var(--muted-foreground))"
                                fontSize={10}
                              >
                                {data.loads_count} loads
                              </text>

                              {/* Feasibility score */}
                              <text
                                x={x + width / 2}
                                y={y + 70}
                                textAnchor="middle"
                                fill="hsl(var(--muted-foreground))"
                                fontSize={10}
                              >
                                {data.feasibility.toFixed(0)}% feasible
                              </text>

                              {/* Action badge */}
                              <rect
                                x={x + 5}
                                y={y + height - 20}
                                width={width - 10}
                                height={15}
                                fill={data.actionColor}
                                fillOpacity={0.2}
                                rx={2}
                              />
                              <text
                                x={x + width / 2}
                                y={y + height - 8}
                                textAnchor="middle"
                                fill="hsl(var(--card-foreground))"
                                fontSize={9}
                                fontWeight="bold"
                              >
                                {data.action.replace('_', ' ').toUpperCase()}
                              </text>
                            </>
                          )}
                        </>
                      )}

                      {/* Priority indicator for high-value opportunities */}
                      {data.priority_score >= 80 && (
                        <circle
                          cx={x + width - 8}
                          cy={y + 8}
                          r={4}
                          fill="hsl(var(--chart-2))"
                          stroke="hsl(var(--background))"
                          strokeWidth={1}
                        />
                      )}
                    </g>
                  )
                }}
              />
            </ResponsiveContainer>
          </ChartContainer>

          {/* Treemap Legend */}
          <div className="flex flex-wrap justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-chart-2" />
              <span>High Priority (80%+ feasible)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-chart-1" />
              <span>Medium Priority (60-80%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-chart-4" />
              <span>Lower Priority (40-60%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-chart-5" />
              <span>Low Priority ({'<'}40%)</span>
            </div>
          </div>

          {/* Action Legend */}
          <div className="flex flex-wrap justify-center gap-6 mt-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-chart-2 rounded-sm" />
              <span>Consolidate</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-chart-4 rounded-sm" />
              <span>Reschedule</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-chart-1 rounded-sm" />
              <span>Optimize Route</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Breakdown */}
      {summaryStats && Object.keys(summaryStats.actionBreakdown).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(summaryStats.actionBreakdown).map(([action, count]) => {
                const actionData = processedData.filter(item => item.action === action)
                const totalSavings = actionData.reduce((sum, item) => sum + item.savings, 0)
                const avgFeasibility = actionData.reduce((sum, item) => sum + item.feasibility, 0) / actionData.length

                return (
                  <div key={action} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold capitalize">{action.replace('_', ' ')}</h4>
                      <Badge variant="outline">{count} opportunities</Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Savings:</span>
                        <span className="font-mono">${(totalSavings / 1000).toFixed(0)}K</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Avg Feasibility:</span>
                        <span className="font-mono">{avgFeasibility.toFixed(1)}%</span>
                      </div>
                      <Progress value={avgFeasibility} className="h-2" />
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full mt-3"
                      onClick={() => onConsolidateAction?.(actionData.map(item => item.original))}
                    >
                      Execute All
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Opportunities List */}
      {topOpportunities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Top Consolidation Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topOpportunities.slice(0, 3).map((opportunity, index) => (
                <Alert key={index} className="cursor-pointer hover:bg-muted/50" onClick={() => onOpportunityClick?.(opportunity.original)}>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold">{opportunity.name}</span>
                        <span className="text-muted-foreground ml-2">
                          {opportunity.loads_count} loads • {opportunity.utilization.toFixed(0)}% utilized
                        </span>
                        <div className="text-sm mt-1">
                          <span className="text-chart-2 font-semibold">
                            ${(opportunity.savings / 1000).toFixed(0)}K savings
                          </span>
                          <span className="text-muted-foreground ml-2">
                            • {opportunity.feasibility.toFixed(0)}% feasible
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={cn(
                          opportunity.action === 'consolidate' ? 'text-chart-2 border-chart-2' :
                          opportunity.action === 'reschedule' ? 'text-chart-4 border-chart-4' :
                          'text-chart-1 border-chart-1'
                        )}>
                          {opportunity.action.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Button size="sm">
                          <Calendar className="h-3 w-3 mr-1" />
                          Schedule
                        </Button>
                      </div>
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