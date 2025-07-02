import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { Truck, TrendingUp, TrendingDown, ChevronRight, DollarSign, Route } from 'lucide-react'
import { InsightExplainer, ExplainerTrigger } from '@/components/ui/insight-explainer'
import { truckUtilizationExplainer } from '@/components/explainers/executive-summary-explainers'
import { cn } from '@/lib/utils'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  BarChart,
  Bar,
  Cell
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

import type { DrillDownFilters, TruckUtilizationData } from '@/types/api'

interface TruckUtilizationAreaChartProps {
  filters?: DrillDownFilters
  className?: string
}

// Mock data - replace with actual API call
const mockTruckUtilizationData: TruckUtilizationData = {
  seven_day_average: 78.5,
  trend_direction: 'up',
  change_percentage: 3.2,
  time_series: [
    { date: '2024-01-01', utilization: 75.2 },
    { date: '2024-01-02', utilization: 76.8 },
    { date: '2024-01-03', utilization: 78.1 },
    { date: '2024-01-04', utilization: 79.3 },
    { date: '2024-01-05', utilization: 77.9 },
    { date: '2024-01-06', utilization: 80.1 },
    { date: '2024-01-07', utilization: 82.4 },
    { date: '2024-01-08', utilization: 79.6 },
    { date: '2024-01-09', utilization: 78.8 },
    { date: '2024-01-10', utilization: 81.2 },
    { date: '2024-01-11', utilization: 79.7 },
    { date: '2024-01-12', utilization: 77.5 },
    { date: '2024-01-13', utilization: 78.9 },
    { date: '2024-01-14', utilization: 80.3 }
  ],
  consolidation_opportunities: [
    {
      route: 'Route A-1 → B-2',
      potential_savings: 12500,
      current_utilization: 65.4,
      optimized_utilization: 82.1
    },
    {
      route: 'Route C-3 → D-4',
      potential_savings: 8900,
      current_utilization: 58.2,
      optimized_utilization: 78.6
    },
    {
      route: 'Route E-5 → F-6',
      potential_savings: 7400,
      current_utilization: 62.1,
      optimized_utilization: 75.3
    },
    {
      route: 'Route G-7 → H-8',
      potential_savings: 6200,
      current_utilization: 69.7,
      optimized_utilization: 81.9
    },
    {
      route: 'Route I-9 → J-10',
      potential_savings: 5800,
      current_utilization: 71.3,
      optimized_utilization: 83.4
    }
  ]
}

export default function TruckUtilizationAreaChart({ filters: _filters, className }: TruckUtilizationAreaChartProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedView, setSelectedView] = useState<'trend' | 'opportunities'>('trend')
  const [explainerOpen, setExplainerOpen] = useState(false)
  
  const data = mockTruckUtilizationData // In real app: useTruckUtilization(filters)

  const chartConfig = {
    utilization: {
      label: "Utilization %",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  const trendIcon = data.trend_direction === 'up' ? TrendingUp : TrendingDown
  const trendColor = data.trend_direction === 'up' ? 'text-green-600' : 'text-red-600'
  
  const getUtilizationLevel = (util: number) => {
    if (util >= 85) return { level: 'excellent', color: '#22c55e', label: 'Excellent' }
    if (util >= 75) return { level: 'good', color: '#3b82f6', label: 'Good' }
    if (util >= 65) return { level: 'fair', color: '#eab308', label: 'Fair' }
    return { level: 'poor', color: '#ef4444', label: 'Needs Improvement' }
  }

  const currentLevel = getUtilizationLevel(data.seven_day_average)
  const totalSavings = data.consolidation_opportunities.reduce((acc, opp) => acc + opp.potential_savings, 0)

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Truck Utilization (7-day avg)</CardTitle>
            <ExplainerTrigger onClick={() => setExplainerOpen(true)} />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={currentLevel.level === 'excellent' ? 'default' : 'secondary'}>
              {currentLevel.label}
            </Badge>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  View Opportunities <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{data.seven_day_average.toFixed(1)}%</span>
            <div className={cn("flex items-center gap-1", trendColor)}>
              {React.createElement(trendIcon, { className: "h-4 w-4" })}
              <span className="text-sm font-medium">
                {data.change_percentage.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            Target: 80%+ • Current: {data.seven_day_average >= 80 ? 'On Target' : 'Below Target'}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.time_series} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="utilizationGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
              <XAxis 
                dataKey="date" 
                fontSize={10}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                fontSize={10}
                domain={[50, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              
              <ChartTooltip 
                content={<ChartTooltipContent 
                  labelFormatter={(label) => new Date(label).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  formatter={(value, _name, props) => {
                    const util = Number(value)
                    const level = getUtilizationLevel(util)
                    const isWeekend = new Date(props.payload?.date || '').getDay() === 0 || new Date(props.payload?.date || '').getDay() === 6
                    
                    return [
                      <div key="util-details" className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Utilization:</span>
                          <span className="font-mono font-bold text-primary">
                            {util.toFixed(1)}%
                          </span>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Performance:</span>
                            <Badge variant={level.level === 'excellent' ? 'default' : 'secondary'}>
                              {level.label}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">vs Target (80%):</span>
                            <span className={util >= 80 ? 'text-green-600' : 'text-red-600'}>
                              {util >= 80 ? '+' : ''}{(util - 80).toFixed(1)}%
                            </span>
                          </div>
                          {isWeekend && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Day Type:</span>
                              <span className="text-orange-600">Weekend</span>
                            </div>
                          )}
                        </div>
                      </div>,
                      ''
                    ]
                  }}
                />}
              />
              
              {/* Target line */}
              <ReferenceLine 
                y={80} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="5 5" 
                strokeOpacity={0.7}
                label={{ value: "Target 80%", position: "right", fontSize: 10 }}
              />
              
              {/* Optimal range */}
              <ReferenceLine 
                y={85} 
                stroke="hsl(var(--success))" 
                strokeDasharray="3 3" 
                strokeOpacity={0.5}
                label={{ value: "Optimal 85%", position: "right", fontSize: 10 }}
              />
              
              <Area
                type="monotone"
                dataKey="utilization"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#utilizationGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Peak Utilization</div>
            <div className="text-lg font-bold text-green-600">
              {Math.max(...data.time_series.map(d => d.utilization)).toFixed(1)}%
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Days Above Target</div>
            <div className="text-lg font-bold">
              {data.time_series.filter(d => d.utilization >= 80).length}/{data.time_series.length}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Potential Savings</div>
            <div className="text-lg font-bold text-blue-600">
              ${totalSavings.toLocaleString()}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Opportunities</div>
            <div className="text-lg font-bold">
              {data.consolidation_opportunities.length}
            </div>
          </div>
        </div>
      </CardContent>

      {/* Consolidation Opportunities Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              Truck Utilization Consolidation Opportunities
            </DialogTitle>
            <DialogDescription>
              Identify routes with optimization potential to improve efficiency and reduce costs
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={selectedView === 'trend' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('trend')}
              >
                Utilization Trend
              </Button>
              <Button
                variant={selectedView === 'opportunities' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('opportunities')}
              >
                Consolidation Opportunities
              </Button>
            </div>

            {/* Trend Analysis */}
            {selectedView === 'trend' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">14-Day Utilization Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Average</div>
                      <div className="text-lg font-bold">{data.seven_day_average.toFixed(1)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Trend</div>
                      <div className={cn("text-lg font-bold flex items-center justify-center gap-1", trendColor)}>
                        {React.createElement(trendIcon, { className: "h-4 w-4" })}
                        {data.change_percentage > 0 ? '+' : ''}{data.change_percentage.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Best Day</div>
                      <div className="text-lg font-bold text-green-600">
                        {Math.max(...data.time_series.map(d => d.utilization)).toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Worst Day</div>
                      <div className="text-lg font-bold text-red-600">
                        {Math.min(...data.time_series.map(d => d.utilization)).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="font-medium text-blue-800">Analysis Summary</div>
                      <div className="text-blue-700">
                        {data.trend_direction === 'up' 
                          ? 'Utilization is trending upward, indicating improved efficiency.' 
                          : 'Utilization is declining, suggesting potential optimization needs.'
                        }
                        {data.seven_day_average >= 80 
                          ? ' Current performance meets target levels.' 
                          : ' Performance is below the 80% target threshold.'
                        }
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Consolidation Opportunities */}
            {selectedView === 'opportunities' && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      Potential Monthly Savings: ${totalSavings.toLocaleString()}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={{
                      savings: { label: "Potential Savings", color: "hsl(var(--primary))" }
                    }} className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.consolidation_opportunities} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                          <XAxis 
                            dataKey="route" 
                            fontSize={9}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <YAxis 
                            fontSize={10}
                            tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                            tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          />
                          <ChartTooltip 
                            content={<ChartTooltipContent 
                              formatter={(value, _name, _props) => [
                                `$${Number(value).toLocaleString()}`,
                                'Monthly Savings'
                              ]}
                            />}
                          />
                          <Bar dataKey="potential_savings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                            {data.consolidation_opportunities.map((_entry, index) => (
                              <Cell key={`cell-${index}`} fill={`hsl(var(--primary))`} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Detailed Opportunities List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Route Consolidation Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {data.consolidation_opportunities.map((opportunity, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">{opportunity.route}</div>
                            <Badge variant="secondary">
                              ${opportunity.potential_savings.toLocaleString()}/month
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Current Utilization</div>
                              <div className="font-medium text-red-600">
                                {opportunity.current_utilization.toFixed(1)}%
                              </div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Optimized Utilization</div>
                              <div className="font-medium text-green-600">
                                {opportunity.optimized_utilization.toFixed(1)}%
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-muted-foreground">Improvement:</div>
                            <div className="text-xs font-medium text-green-600">
                              +{(opportunity.optimized_utilization - opportunity.current_utilization).toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Truck Utilization Explainer */}
      <InsightExplainer
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
        title={truckUtilizationExplainer.title}
        description={truckUtilizationExplainer.description}
        formula={truckUtilizationExplainer.formula}
        methodology={truckUtilizationExplainer.methodology}
        calculation={truckUtilizationExplainer.calculation}
        dataSources={truckUtilizationExplainer.dataSources}
        examples={truckUtilizationExplainer.examples}
        grade={truckUtilizationExplainer.grade}
        difficulty={truckUtilizationExplainer.difficulty}
      />
    </Card>
  )
}