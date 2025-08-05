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
import { BarChart3, TrendingUp, TrendingDown, ChevronRight, AlertTriangle, Package, Loader2 } from 'lucide-react'
import { InsightExplainer, ExplainerTrigger } from '@/components/ui/insight-explainer'
import { topSkuErrorExplainer } from '@/components/explainers/executive-summary-explainers'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
  ReferenceLine,
  Cell
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { useTopSKUErrors } from '@/hooks/useAnalytics'

import type { DrillDownFilters, TopSKUErrorData } from '@/types/api'

interface TopSKUErrorsChartProps {
  filters?: DrillDownFilters
  className?: string
}

// Design token color values from our style guide
const chartColors = {
  chart1: '#3b82f6', // Primary blue
  chart2: '#16a34a', // Operational green  
  chart3: '#a855f7', // Commercial purple
  chart4: '#eab308', // Warning amber
  chart5: '#ef4444', // Risk red
}

export default function TopSKUErrorsChart({ filters, className }: TopSKUErrorsChartProps) {
  const [selectedSKU, setSelectedSKU] = useState<TopSKUErrorData | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [explainerOpen, setExplainerOpen] = useState(false)
  
  const { data: skuErrorData, isLoading, isError } = useTopSKUErrors({
    limit: 10,
    category: filters?.category,
    timeRange: filters?.timeRange
  })
  
  const data = skuErrorData?.top_sku_errors || []

  const chartConfig = {
    error_percentage: {
      label: "Forecast Error",
      color: "hsl(var(--chart-1))",
    },
    critical: {
      label: "Critical",
      color: "hsl(var(--destructive))",
    },
    high: {
      label: "High", 
      color: "hsl(var(--chart-2))",
    },
    medium: {
      label: "Medium",
      color: "hsl(var(--chart-3))",
    },
    low: {
      label: "Low",
      color: "hsl(var(--chart-4))",
    },
  } satisfies ChartConfig

  const getErrorSeverity = (errorPercent: number) => {
    if (errorPercent >= 20) return { level: 'critical', color: chartColors.chart5, label: 'Critical' } // Red
    if (errorPercent >= 15) return { level: 'high', color: chartColors.chart4, label: 'High' }      // Amber
    if (errorPercent >= 10) return { level: 'medium', color: chartColors.chart3, label: 'Medium' }  // Purple
    return { level: 'low', color: chartColors.chart2, label: 'Low' }                                // Green
  }

  const getTrend = (historical: TopSKUErrorData['historical_comparison']) => {
    if (historical.length < 2) return 'stable'
    const current = historical[historical.length - 1].error_percentage
    const previous = historical[historical.length - 2].error_percentage
    if (current > previous + 1) return 'worsening'
    if (current < previous - 1) return 'improving'
    return 'stable'
  }

  const handleSKUClick = (sku: TopSKUErrorData) => {
    setSelectedSKU(sku)
    setIsDialogOpen(true)
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Top 10 SKUs by Forecast Error</CardTitle>
            <ExplainerTrigger onClick={() => setExplainerOpen(true)} />
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline">
                  {data.length} items
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Showing SKUs with highest forecast error rates</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <p className="text-sm text-muted-foreground">
          Click on any bar to view historical forecast comparison
        </p>
      </CardHeader>
      
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {isError && (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load SKU error data</p>
            </div>
          </div>
        )}
        
        {!isLoading && !isError && data.length === 0 && (
          <div className="flex items-center justify-center h-[400px]">
            <div className="text-center">
              <Package className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No SKU error data available</p>
            </div>
          </div>
        )}
        
        {!isLoading && !isError && data.length > 0 && (
          <>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={data} 
            layout="horizontal"
            margin={{ 
              top: 5, 
              right: 30, 
              left: 150, 
              bottom: 5 
            }}
            accessibilityLayer
          >
            <CartesianGrid 
              horizontal={false} 
              strokeDasharray="3 3" 
              className="stroke-muted/20"
            />
            <XAxis 
              type="number"
              dataKey="error_percentage"
              domain={[0, 'dataMax + 5']}
              tickFormatter={(value) => `${value}%`}
              className="text-xs"
              axisLine={false}
              tickLine={false}
            />
            <YAxis 
              type="category"
              dataKey="name"
              className="text-xs"
              axisLine={false}
              tickLine={false}
              width={140}
              tick={({ x, y, payload }) => (
                <g transform={`translate(${x},${y})`}>
                  <text
                    x={-10}
                    y={0}
                    dy={4}
                    textAnchor="end"
                    fill="currentColor"
                    className="fill-muted-foreground text-xs font-medium"
                  >
                    {payload.value.length > 20 
                      ? `${payload.value.substring(0, 20)}...` 
                      : payload.value}
                  </text>
                </g>
              )}
            />
            
            <ChartTooltip 
              cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
              content={
                <ChartTooltipContent 
                  className="w-[280px]"
                  labelClassName="font-semibold"
                  formatter={(value, name, props) => {
                    const item = props.payload
                    const severity = getErrorSeverity(item.error_percentage)
                    const trend = getTrend(item.historical_comparison)
                    
                    return (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Error Rate:</span>
                          <span className="font-mono font-bold" style={{ color: severity.color }}>
                            {Number(value).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">SKU:</span>
                          <span className="font-medium">{item.sku}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Category:</span>
                          <span>{item.category}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Volume:</span>
                          <span className="font-mono">{item.volume.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Severity:</span>
                          <Badge 
                            variant={severity.level === 'critical' ? 'destructive' : 
                                   severity.level === 'high' ? 'default' : 'secondary'}
                            className="h-5 text-xs"
                          >
                            {severity.label}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Trend:</span>
                          <div className="flex items-center gap-1">
                            {trend === 'improving' && <TrendingDown className="h-3 w-3 text-success" />}
                            {trend === 'worsening' && <TrendingUp className="h-3 w-3 text-destructive" />}
                            {trend === 'stable' && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
                            <span className="capitalize">{trend}</span>
                          </div>
                        </div>
                        <div className="mt-1 pt-1 border-t text-xs text-muted-foreground">
                          Click to view historical comparison
                        </div>
                      </div>
                    )
                  }}
                />
              }
            />
            
            <ReferenceLine 
              x={15} 
              stroke="hsl(var(--destructive))" 
              strokeDasharray="5 5"
              opacity={0.5}
              label={{
                value: "Target",
                position: "top",
                className: "fill-destructive text-xs",
              }}
            />
            
            <Bar 
              dataKey="error_percentage" 
              radius={[0, 4, 4, 0]}
              onClick={(data) => handleSKUClick(data)}
              className="cursor-pointer transition-opacity hover:opacity-80"
              animationDuration={600}
              animationBegin={0}
            >
              {data.map((entry, index) => {
                const severity = getErrorSeverity(entry.error_percentage)
                return (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={severity.color}
                  />
                )
              })}
            </Bar>
          </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-3">
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Average Error</div>
              <div className="text-2xl font-bold tabular-nums text-destructive">
                {(data.reduce((acc, item) => acc + item.error_percentage, 0) / data.length).toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Critical SKUs</div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tabular-nums text-destructive">
                  {data.filter(item => item.error_percentage >= 20).length}
                </span>
                <span className="text-sm text-muted-foreground">/ {data.length}</span>
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Total Volume</div>
              <div className="text-2xl font-bold tabular-nums">
                {(data.reduce((acc, item) => acc + item.volume, 0) / 1000).toFixed(1)}K
              </div>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-3">
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Categories</div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tabular-nums">
                  {new Set(data.map(item => item.category)).size}
                </span>
                <Badge variant="secondary" className="text-xs">
                  Unique
                </Badge>
              </div>
            </div>
          </div>
        </div>
        </>
        )}
      </CardContent>

      {/* Historical Comparison Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Historical Forecast Comparison: {selectedSKU?.name}
            </DialogTitle>
            <DialogDescription>
              6-month trend analysis for {selectedSKU?.sku}
            </DialogDescription>
          </DialogHeader>

          {selectedSKU && (
            <div className="space-y-6">
              {/* SKU Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Current Error</div>
                  <div className="text-lg font-bold text-destructive">
                    {selectedSKU.error_percentage.toFixed(1)}%
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Category</div>
                  <div className="text-lg font-medium">{selectedSKU.category}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Volume</div>
                  <div className="text-lg font-medium">{selectedSKU.volume.toLocaleString()}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Trend</div>
                  <div className="flex items-center gap-1">
                    {getTrend(selectedSKU.historical_comparison) === 'improving' ? (
                      <><TrendingDown className="h-4 w-4 text-success" /> <span className="text-success">Improving</span></>
                    ) : getTrend(selectedSKU.historical_comparison) === 'worsening' ? (
                      <><TrendingUp className="h-4 w-4 text-destructive" /> <span className="text-destructive">Worsening</span></>
                    ) : (
                      <><span className="text-muted-foreground">Stable</span></>
                    )}
                  </div>
                </div>
              </div>

              {/* Historical Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">6-Month Forecast Error Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={selectedSKU.historical_comparison}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                        <XAxis 
                          dataKey="period" 
                          fontSize={10}
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          fontSize={10}
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent 
                            formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Forecast Error']}
                          />}
                        />
                        <ReferenceLine y={15} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="Threshold" />
                        <Line 
                          type="monotone" 
                          dataKey="error_percentage" 
                          stroke="hsl(var(--destructive))" 
                          strokeWidth={3}
                          dot={{ r: 6, fill: "hsl(var(--destructive))" }}
                          activeDot={{ r: 8 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    {selectedSKU.error_percentage >= 20 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="font-medium text-red-800">Critical Action Required</div>
                        <div className="text-red-700">
                          Forecast error exceeds 20%. Consider reviewing forecasting model parameters and historical data quality.
                        </div>
                      </div>
                    )}
                    
                    {getTrend(selectedSKU.historical_comparison) === 'worsening' && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="font-medium text-orange-800">Worsening Trend Detected</div>
                        <div className="text-orange-700">
                          Forecast accuracy is declining. Investigate demand pattern changes or external factors.
                        </div>
                      </div>
                    )}

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="font-medium text-blue-800">General Recommendations</div>
                      <ul className="list-disc list-inside text-blue-700 space-y-1">
                        <li>Review and update demand patterns</li>
                        <li>Check for seasonality adjustments</li>
                        <li>Validate input data quality</li>
                        <li>Consider external factor impacts</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Top SKU Errors Explainer */}
      <InsightExplainer
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
        title={topSkuErrorExplainer.title}
        description={topSkuErrorExplainer.description}
        methodology={topSkuErrorExplainer.methodology}
        calculation={topSkuErrorExplainer.calculation}
        dataSources={topSkuErrorExplainer.dataSources}
        examples={topSkuErrorExplainer.examples}
        grade={topSkuErrorExplainer.grade}
        difficulty={topSkuErrorExplainer.difficulty}
      />
    </Card>
  )
}