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
import { BarChart3, TrendingUp, TrendingDown, ChevronRight, AlertTriangle, Package } from 'lucide-react'
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

import type { DrillDownFilters, TopSKUErrorData } from '@/types/api'

interface TopSKUErrorsChartProps {
  filters?: DrillDownFilters
  className?: string
}

// Mock data - replace with actual API call
const mockTopSKUErrors: TopSKUErrorData[] = [
  {
    sku: 'SKU-001',
    name: 'Gaming Laptop Pro',
    category: 'Electronics',
    error_percentage: 24.5,
    volume: 450,
    historical_comparison: [
      { period: '6 months ago', error_percentage: 18.2 },
      { period: '5 months ago', error_percentage: 19.8 },
      { period: '4 months ago', error_percentage: 21.3 },
      { period: '3 months ago', error_percentage: 22.7 },
      { period: '2 months ago', error_percentage: 23.9 },
      { period: '1 month ago', error_percentage: 24.5 }
    ]
  },
  {
    sku: 'SKU-002',
    name: 'Wireless Headphones Elite',
    category: 'Electronics',
    error_percentage: 18.7,
    volume: 1250,
    historical_comparison: [
      { period: '6 months ago', error_percentage: 22.1 },
      { period: '5 months ago', error_percentage: 21.3 },
      { period: '4 months ago', error_percentage: 20.5 },
      { period: '3 months ago', error_percentage: 19.8 },
      { period: '2 months ago', error_percentage: 19.2 },
      { period: '1 month ago', error_percentage: 18.7 }
    ]
  },
  {
    sku: 'SKU-003',
    name: 'Running Shoes Premium',
    category: 'Apparel',
    error_percentage: 16.3,
    volume: 890,
    historical_comparison: [
      { period: '6 months ago', error_percentage: 14.8 },
      { period: '5 months ago', error_percentage: 15.2 },
      { period: '4 months ago', error_percentage: 15.9 },
      { period: '3 months ago', error_percentage: 16.1 },
      { period: '2 months ago', error_percentage: 16.0 },
      { period: '1 month ago', error_percentage: 16.3 }
    ]
  },
  {
    sku: 'SKU-004',
    name: 'Smart Home Hub',
    category: 'Electronics',
    error_percentage: 15.9,
    volume: 320,
    historical_comparison: [
      { period: '6 months ago', error_percentage: 12.3 },
      { period: '5 months ago', error_percentage: 13.1 },
      { period: '4 months ago', error_percentage: 14.2 },
      { period: '3 months ago', error_percentage: 14.8 },
      { period: '2 months ago', error_percentage: 15.4 },
      { period: '1 month ago', error_percentage: 15.9 }
    ]
  },
  {
    sku: 'SKU-005',
    name: 'Outdoor Camping Gear',
    category: 'Sports',
    error_percentage: 14.2,
    volume: 560,
    historical_comparison: [
      { period: '6 months ago', error_percentage: 16.8 },
      { period: '5 months ago', error_percentage: 16.1 },
      { period: '4 months ago', error_percentage: 15.5 },
      { period: '3 months ago', error_percentage: 15.0 },
      { period: '2 months ago', error_percentage: 14.6 },
      { period: '1 month ago', error_percentage: 14.2 }
    ]
  }
]

export default function TopSKUErrorsChart({ filters, className }: TopSKUErrorsChartProps) {
  const [selectedSKU, setSelectedSKU] = useState<TopSKUErrorData | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [explainerOpen, setExplainerOpen] = useState(false)
  
  const data = mockTopSKUErrors // In real app: useTopSKUErrors(filters)

  const chartConfig = {
    error_percentage: {
      label: "Forecast Error %",
      color: "hsl(var(--destructive))",
    },
  } satisfies ChartConfig

  const getErrorSeverity = (errorPercent: number) => {
    if (errorPercent >= 20) return { level: 'critical', color: '#dc2626', label: 'Critical' } // Red 600
    if (errorPercent >= 15) return { level: 'high', color: '#ea580c', label: 'High' } // Orange 600
    if (errorPercent >= 10) return { level: 'medium', color: '#ca8a04', label: 'Medium' } // Yellow 600
    return { level: 'low', color: '#16a34a', label: 'Low' } // Green 600
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
            <BarChart3 className="h-5 w-5 text-neutral-600" />
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
        <p className="text-sm text-neutral-600">
          Click on any bar to view historical forecast comparison
        </p>
      </CardHeader>
      
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              layout="horizontal"
              margin={{ top: 20, right: 30, left: 120, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
              <XAxis 
                type="number"
                domain={[0, 30]}
                fontSize={12}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                type="category"
                dataKey="name"
                fontSize={12}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                width={110}
                tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
              />
              
              <ChartTooltip 
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    const severity = getErrorSeverity(data.error_percentage)
                    const trend = getTrend(data.historical_comparison)
                    const trendIcon = trend === 'improving' ? '📈' : trend === 'worsening' ? '📉' : '➡️'
                    
                    return (
                      <div className="rounded-lg border bg-background p-3 shadow-md">
                        <div className="space-y-2">
                          <div className="font-medium">{label}</div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Forecast Error:</span>
                            <span className="font-mono font-bold text-destructive">
                              {data.error_percentage.toFixed(1)}%
                            </span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Category:</span>
                              <span className="font-medium">{data.category}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Volume:</span>
                              <span className="font-mono">{data.volume.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Severity:</span>
                              <Badge variant={severity.level === 'critical' ? 'destructive' : 'secondary'}>
                                {severity.label}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Trend:</span>
                              <span className="flex items-center gap-1">
                                {trendIcon} {trend}
                              </span>
                            </div>
                          </div>
                          <div className="pt-1 border-t">
                            <p className="text-xs text-muted-foreground">Click to view historical comparison</p>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
              
              <ReferenceLine x={15} stroke="hsl(var(--destructive))" strokeDasharray="3 3" />
              
              <Bar 
                dataKey="error_percentage" 
                radius={[0, 4, 4, 0]}
                onClick={(data) => handleSKUClick(data)}
                style={{ cursor: 'pointer' }}
              >
                {data.map((entry, index) => {
                  const severity = getErrorSeverity(entry.error_percentage)
                  return (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={severity.color}
                      stroke="none"
                    />
                  )
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">Avg Error</div>
            <div className="text-lg font-bold text-error">
              {(data.reduce((acc, item) => acc + item.error_percentage, 0) / data.length).toFixed(1)}%
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">Critical SKUs</div>
            <div className="text-lg font-bold text-error">
              {data.filter(item => item.error_percentage >= 20).length}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">Total Volume</div>
            <div className="text-lg font-bold">
              {data.reduce((acc, item) => acc + item.volume, 0).toLocaleString()}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-neutral-500">Categories</div>
            <div className="text-lg font-bold">
              {new Set(data.map(item => item.category)).size}
            </div>
          </div>
        </div>
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
                      <><TrendingDown className="h-4 w-4 text-green-600" /> <span className="text-green-600">Improving</span></>
                    ) : getTrend(selectedSKU.historical_comparison) === 'worsening' ? (
                      <><TrendingUp className="h-4 w-4 text-red-600" /> <span className="text-red-600">Worsening</span></>
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