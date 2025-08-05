import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
import { ResponsiveBar } from '@nivo/bar'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ReferenceLine } from 'recharts'
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

// Helper function for error severity
const getErrorSeverity = (errorPercent: number) => {
  if (errorPercent >= 20) return { level: 'critical', color: chartColors.chart5, label: 'Critical' } // Red
  if (errorPercent >= 15) return { level: 'high', color: chartColors.chart4, label: 'High' }      // Amber
  if (errorPercent >= 10) return { level: 'medium', color: chartColors.chart3, label: 'Medium' }  // Purple
  return { level: 'low', color: chartColors.chart2, label: 'Low' }                                // Green
}

export default function TopSKUErrorsChart({ filters, className }: TopSKUErrorsChartProps) {
  const [selectedSKU, setSelectedSKU] = useState<TopSKUErrorData | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [explainerOpen, setExplainerOpen] = useState(false)
  
  const { data: skuErrorData, isLoading, isError, error } = useTopSKUErrors({
    limit: 10,
    category: filters?.category,
    timeRange: filters?.timeRange || '30d'
  })
  
  const data = skuErrorData?.top_sku_errors || []
  
  // Transform data for Nivo bar chart
  const nivoData = data.map((item, index) => ({
    id: item.sku,
    sku: item.name,
    error_percentage: item.error_percentage,
    volume: item.volume,
    category: item.category,
    historical_comparison: item.historical_comparison,
    // Add color based on severity
    color: getErrorSeverity(item.error_percentage).color
  }))
  
  // Log for debugging
  if (import.meta.env.DEV) {
    console.log('TopSKUErrorsChart - Raw data:', skuErrorData)
    console.log('TopSKUErrorsChart - Processed data:', data)
    console.log('TopSKUErrorsChart - Nivo data:', nivoData)
    if (data.length > 0) {
      console.log('TopSKUErrorsChart - First item structure:', data[0])
      console.log('TopSKUErrorsChart - Required fields check:', {
        hasName: !!data[0].name,
        hasErrorPercentage: !!data[0].error_percentage,
        hasVolume: !!data[0].volume
      })
    }
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
            <UITooltip>
              <TooltipTrigger>
                <Badge variant="outline">
                  {data.length} items
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Showing SKUs with highest forecast error rates</p>
              </TooltipContent>
            </UITooltip>
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
              {import.meta.env.DEV && error && (
                <p className="text-xs text-muted-foreground mt-1">
                  {error instanceof Error ? error.message : 'Unknown error'}
                </p>
              )}
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
        
        <div className="h-[400px] w-full">
          <ResponsiveBar
            data={nivoData}
            keys={['error_percentage']}
            indexBy="sku"
            layout="horizontal"
            margin={{ top: 20, right: 80, bottom: 50, left: 180 }}
            padding={0.3}
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={({ data }) => data.color}
            borderColor={{
              from: 'color',
              modifiers: [['darker', 1.6]]
            }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Error Percentage (%)',
              legendPosition: 'middle',
              legendOffset: 32,
              format: (value) => `${value}%`
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: '',
              legendPosition: 'middle',
              legendOffset: -40,
              format: (value) => value.length > 20 ? `${value.substring(0, 20)}...` : value
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor={{
              from: 'color',
              modifiers: [['darker', 1.6]]
            }}
            tooltip={({ data, value }) => (
              <div className="bg-background border rounded-lg p-3 shadow-lg">
                <div className="flex flex-col gap-2">
                  <div className="font-medium">{data.sku}</div>
                  <div className="text-sm">
                    Error: <span className="font-mono" style={{ color: data.color }}>
                      {Number(value).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Volume: {data.volume?.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Category: {data.category}
                  </div>
                  <div className="text-xs text-muted-foreground border-t pt-1">
                    Click to view historical comparison
                  </div>
                </div>
              </div>
            )}
            onClick={(node) => {
              const originalItem = data.find(item => item.sku === node.data.id)
              if (originalItem) {
                handleSKUClick(originalItem)
              }
            }}
            theme={{
              background: 'transparent',
              text: {
                fontSize: 12,
                fill: 'hsl(var(--muted-foreground))',
                outlineWidth: 0,
                outlineColor: 'transparent'
              },
              axis: {
                domain: {
                  line: {
                    stroke: 'hsl(var(--border))',
                    strokeWidth: 1
                  }
                },
                legend: {
                  text: {
                    fontSize: 12,
                    fill: 'hsl(var(--muted-foreground))'
                  }
                },
                ticks: {
                  line: {
                    stroke: 'hsl(var(--border))',
                    strokeWidth: 1
                  },
                  text: {
                    fontSize: 11,
                    fill: 'hsl(var(--muted-foreground))'
                  }
                }
              },
              grid: {
                line: {
                  stroke: 'hsl(var(--border))',
                  strokeWidth: 1,
                  strokeOpacity: 0.2
                }
              }
            }}
            enableGridX={true}
            enableGridY={false}
            animate={true}
            motionConfig="gentle"
          />
        </div>

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
                  <div className="h-[250px]">
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
                        <RechartsTooltip 
                          content={({ active, payload, label }) => {
                            if (!active || !payload || !payload[0]) return null
                            const value = payload[0].value
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <div className="flex flex-col gap-1">
                                  <div className="text-sm font-medium">{label}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Forecast Error: <span className="font-mono text-destructive">{Number(value).toFixed(1)}%</span>
                                  </div>
                                </div>
                              </div>
                            )
                          }}
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
                  </div>
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