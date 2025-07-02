import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { TrendingUp, TrendingDown, Minus, ChevronRight, Target, Info } from 'lucide-react'
import { InsightExplainer, ExplainerTrigger } from '@/components/ui/insight-explainer'
import { mapeWapeExplainer, forecastGradingExplainer } from '@/components/explainers/executive-summary-explainers'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

// Mock data hooks - in real implementation, would use React Query
import type { DrillDownFilters, ForecastAccuracyData } from '@/types/api'

interface ForecastAccuracyKPIProps {
  filters?: DrillDownFilters
  className?: string
}

// Mock data - replace with actual API call
const mockForecastAccuracyData: ForecastAccuracyData = {
  overall_mape: 12.5,
  overall_wape: 8.3,
  trend_direction: 'up',
  change_percentage: 2.1,
  time_series: [
    { date: '2024-01-01', mape: 14.2, wape: 9.1 },
    { date: '2024-01-02', mape: 13.8, wape: 8.9 },
    { date: '2024-01-03', mape: 13.1, wape: 8.6 },
    { date: '2024-01-04', mape: 12.9, wape: 8.4 },
    { date: '2024-01-05', mape: 12.5, wape: 8.3 },
    { date: '2024-01-06', mape: 12.7, wape: 8.5 },
    { date: '2024-01-07', mape: 12.3, wape: 8.2 }
  ],
  sku_breakdown: [
    { sku: 'SKU-001', name: 'Wireless Headphones', mape: 8.2, wape: 5.4, volume: 1250 },
    { sku: 'SKU-002', name: 'Gaming Laptop', mape: 15.7, wape: 12.3, volume: 450 },
    { sku: 'SKU-003', name: 'Running Shoes', mape: 11.3, wape: 7.8, volume: 890 }
  ],
  site_breakdown: [
    { site: 'DC-East', mape: 11.2, wape: 7.8, volume: 5600 },
    { site: 'DC-West', mape: 13.8, wape: 8.9, volume: 4200 },
    { site: 'Hub-North', mape: 12.1, wape: 8.1, volume: 3800 }
  ]
}

export default function ForecastAccuracyKPI({ filters: _filters, className }: ForecastAccuracyKPIProps) {
  const [selectedDrillDown, setSelectedDrillDown] = useState<'overview' | 'sku' | 'site'>('overview')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [mapeExplainerOpen, setMapeExplainerOpen] = useState(false)
  const [gradingExplainerOpen, setGradingExplainerOpen] = useState(false)
  
  const data = mockForecastAccuracyData // In real app: useForecastAccuracy(filters)

  const chartConfig = {
    mape: {
      label: "MAPE %",
      color: "hsl(var(--primary))",
    },
    wape: {
      label: "WAPE %", 
      color: "hsl(var(--secondary))",
    },
  } satisfies ChartConfig

  const trendIcon = data.trend_direction === 'up' ? TrendingUp : 
                   data.trend_direction === 'down' ? TrendingDown : Minus
  const trendColor = data.trend_direction === 'up' ? 'text-red-600' : 
                    data.trend_direction === 'down' ? 'text-green-600' : 'text-muted-foreground'

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      {/* MAPE KPI Card */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            MAPE (Forecast Accuracy)
            <ExplainerTrigger onClick={() => setMapeExplainerOpen(true)} />
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{formatPercentage(data.overall_mape)}</div>
            <div className={cn("flex items-center gap-1", trendColor)}>
              {React.createElement(trendIcon, { className: "h-4 w-4" })}
              <span className="text-sm font-medium">
                {formatPercentage(Math.abs(data.change_percentage))}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {data.change_percentage > 0 ? 'Increased' : 'Improved'} from last period
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge 
              variant={data.overall_mape <= 10 ? "default" : data.overall_mape <= 15 ? "secondary" : "destructive"}
            >
              {data.overall_mape <= 10 ? 'Excellent' : data.overall_mape <= 15 ? 'Good' : 'Needs Attention'}
            </Badge>
            <ExplainerTrigger 
              onClick={() => setGradingExplainerOpen(true)} 
              variant="button"
              size="sm"
              className="text-xs"
            >
              How is this graded?
            </ExplainerTrigger>
          </div>
        </CardContent>
      </Card>

      {/* WAPE KPI Card */}
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            WAPE (Volume-Weighted)
            <ExplainerTrigger onClick={() => setMapeExplainerOpen(true)} />
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold">{formatPercentage(data.overall_wape)}</div>
            <div className={cn("flex items-center gap-1", trendColor)}>
              {React.createElement(trendIcon, { className: "h-4 w-4" })}
              <span className="text-sm font-medium">
                {formatPercentage(Math.abs(data.change_percentage))}
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Target: &lt;10%
          </p>

          {/* Drill-down trigger */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto font-normal text-xs">
                View Details <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Forecast Accuracy Drill-Down</DialogTitle>
                <DialogDescription>
                  Detailed breakdown of forecast accuracy metrics with trend analysis
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Drill-down navigation */}
                <div className="flex gap-2">
                  <Button
                    variant={selectedDrillDown === 'overview' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDrillDown('overview')}
                  >
                    Overview
                  </Button>
                  <Button
                    variant={selectedDrillDown === 'sku' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDrillDown('sku')}
                  >
                    By SKU
                  </Button>
                  <Button
                    variant={selectedDrillDown === 'site' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedDrillDown('site')}
                  >
                    By Site
                  </Button>
                </div>

                {/* Trend Chart */}
                {selectedDrillDown === 'overview' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Accuracy Trend (Last 7 Days)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={data.time_series}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                            <XAxis 
                              dataKey="date" 
                              fontSize={10}
                              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <YAxis 
                              fontSize={10}
                              tickFormatter={(value) => `${value}%`}
                              tick={{ fill: 'hsl(var(--muted-foreground))' }}
                            />
                            <ChartTooltip 
                              content={<ChartTooltipContent 
                                labelFormatter={(label) => new Date(label).toLocaleDateString()}
                                formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
                              />}
                            />
                            <ReferenceLine y={10} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="Target" />
                            <Line 
                              type="monotone" 
                              dataKey="mape" 
                              stroke="hsl(var(--primary))" 
                              strokeWidth={2}
                              dot={{ r: 4, fill: "hsl(var(--primary))" }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="wape" 
                              stroke="hsl(var(--secondary))" 
                              strokeWidth={2}
                              dot={{ r: 4, fill: "hsl(var(--secondary))" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}

                {/* SKU Breakdown */}
                {selectedDrillDown === 'sku' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Top SKUs by Forecast Error</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {data.sku_breakdown.map((sku, _index) => (
                          <div key={sku.sku} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{sku.name}</div>
                              <div className="text-xs text-muted-foreground">{sku.sku} • Volume: {sku.volume.toLocaleString()}</div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="text-sm font-medium">MAPE: {formatPercentage(sku.mape)}</div>
                              <div className="text-xs text-muted-foreground">WAPE: {formatPercentage(sku.wape)}</div>
                            </div>
                            <Badge 
                              variant={sku.mape <= 10 ? "default" : sku.mape <= 15 ? "secondary" : "destructive"}
                              className="ml-3"
                            >
                              {sku.mape <= 10 ? 'Good' : sku.mape <= 15 ? 'Fair' : 'Poor'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Site Breakdown */}
                {selectedDrillDown === 'site' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Accuracy by Site</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {data.site_breakdown.map((site, _index) => (
                          <div key={site.site} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium text-sm">{site.site}</div>
                              <div className="text-xs text-muted-foreground">Volume: {site.volume.toLocaleString()} units</div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="text-sm font-medium">MAPE: {formatPercentage(site.mape)}</div>
                              <div className="text-xs text-muted-foreground">WAPE: {formatPercentage(site.wape)}</div>
                            </div>
                            <Badge 
                              variant={site.mape <= 10 ? "default" : site.mape <= 15 ? "secondary" : "destructive"}
                              className="ml-3"
                            >
                              {site.mape <= 10 ? 'Excellent' : site.mape <= 15 ? 'Good' : 'Poor'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* MAPE/WAPE Explainer */}
      <InsightExplainer
        isOpen={mapeExplainerOpen}
        onClose={() => setMapeExplainerOpen(false)}
        title={mapeWapeExplainer.title}
        description={mapeWapeExplainer.description}
        formula={mapeWapeExplainer.formula}
        methodology={mapeWapeExplainer.methodology}
        calculation={mapeWapeExplainer.calculation}
        dataSources={mapeWapeExplainer.dataSources}
        examples={mapeWapeExplainer.examples}
        grade={mapeWapeExplainer.grade}
        difficulty={mapeWapeExplainer.difficulty}
      />

      {/* Forecast Grading Explainer */}
      <InsightExplainer
        isOpen={gradingExplainerOpen}
        onClose={() => setGradingExplainerOpen(false)}
        title={forecastGradingExplainer.title}
        description={forecastGradingExplainer.description}
        methodology={forecastGradingExplainer.methodology}
        calculation={forecastGradingExplainer.calculation}
        examples={forecastGradingExplainer.examples}
        grade={forecastGradingExplainer.grade}
        difficulty={forecastGradingExplainer.difficulty}
      />
    </div>
  )
}