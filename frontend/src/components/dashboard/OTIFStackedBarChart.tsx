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
import { Clock, Package, TrendingUp, TrendingDown, ChevronRight, CheckCircle, AlertTriangle, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
  Cell
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

import type { DrillDownFilters, OTIFData } from '@/types/api'

interface OTIFStackedBarChartProps {
  filters?: DrillDownFilters
  className?: string
}

// Mock data - replace with actual API call
const mockOTIFData: OTIFData = {
  overall_otif: 78.2,
  on_time_percentage: 85.4,
  in_full_percentage: 91.6,
  trend_direction: 'up',
  change_percentage: 2.8,
  site_breakdown: [
    {
      site: 'DC-East',
      otif_percentage: 82.1,
      on_time_percentage: 87.5,
      in_full_percentage: 93.8,
      sla_compliance: 'above'
    },
    {
      site: 'DC-West',
      otif_percentage: 75.8,
      on_time_percentage: 83.2,
      in_full_percentage: 91.1,
      sla_compliance: 'at'
    },
    {
      site: 'Hub-North',
      otif_percentage: 79.4,
      on_time_percentage: 86.1,
      in_full_percentage: 92.2,
      sla_compliance: 'above'
    },
    {
      site: 'Hub-South',
      otif_percentage: 73.6,
      on_time_percentage: 81.7,
      in_full_percentage: 90.1,
      sla_compliance: 'below'
    },
    {
      site: 'Regional-A',
      otif_percentage: 77.9,
      on_time_percentage: 84.8,
      in_full_percentage: 91.9,
      sla_compliance: 'at'
    }
  ],
  time_series: [
    { date: '2024-01-01', on_time: 83.2, in_full: 90.8, otif: 75.5 },
    { date: '2024-01-02', on_time: 84.1, in_full: 91.2, otif: 76.7 },
    { date: '2024-01-03', on_time: 85.0, in_full: 91.5, otif: 77.8 },
    { date: '2024-01-04', on_time: 84.8, in_full: 91.8, otif: 77.9 },
    { date: '2024-01-05', on_time: 85.2, in_full: 91.7, otif: 78.1 },
    { date: '2024-01-06', on_time: 85.6, in_full: 91.9, otif: 78.6 },
    { date: '2024-01-07', on_time: 85.4, in_full: 91.6, otif: 78.2 }
  ]
}

export default function OTIFStackedBarChart({ filters: _filters, className }: OTIFStackedBarChartProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedView, setSelectedView] = useState<'overview' | 'trends' | 'sites'>('overview')
  
  const data = mockOTIFData // In real app: useOTIFData(filters)

  const chartConfig = {
    otif: {
      label: "OTIF %",
      color: "hsl(var(--primary))",
    },
    on_time: {
      label: "On-Time %", 
      color: "hsl(var(--success))",
    },
    in_full: {
      label: "In-Full %",
      color: "hsl(var(--info))",
    },
  } satisfies ChartConfig

  const trendIcon = data.trend_direction === 'up' ? TrendingUp : TrendingDown
  const trendColor = data.trend_direction === 'up' ? 'text-green-600' : 'text-red-600'
  
  const getSLAIcon = (compliance: 'above' | 'at' | 'below') => {
    switch (compliance) {
      case 'above': return CheckCircle
      case 'at': return Clock
      case 'below': return AlertTriangle
    }
  }

  const getSLAColor = (compliance: 'above' | 'at' | 'below') => {
    switch (compliance) {
      case 'above': return 'text-green-600'
      case 'at': return 'text-yellow-600'  
      case 'below': return 'text-red-600'
    }
  }

  const getSLABadge = (compliance: 'above' | 'at' | 'below') => {
    switch (compliance) {
      case 'above': return 'default'
      case 'at': return 'secondary'
      case 'below': return 'destructive'
    }
  }

  const getOTIFLevel = (otif: number) => {
    if (otif >= 85) return { level: 'excellent', color: '#22c55e', label: 'Excellent' }
    if (otif >= 75) return { level: 'good', color: '#3b82f6', label: 'Good' }
    if (otif >= 65) return { level: 'fair', color: '#eab308', label: 'Fair' }
    return { level: 'poor', color: '#ef4444', label: 'Poor' }
  }

  const currentLevel = getOTIFLevel(data.overall_otif)
  const slaTarget = 75 // Typical OTIF SLA target

  // Prepare data for stacked bar chart
  const stackedData = data.site_breakdown.map(site => ({
    site: site.site,
    otif: site.otif_percentage,
    on_time: site.on_time_percentage,
    in_full: site.in_full_percentage,
    sla_compliance: site.sla_compliance,
    // Calculate the gap (what's missing from 100%)
    on_time_gap: 100 - site.on_time_percentage,
    in_full_gap: 100 - site.in_full_percentage
  }))

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-green-600" />
              <Package className="h-4 w-4 text-blue-600" />
            </div>
            <CardTitle>OTIF % (On-Time In-Full)</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={currentLevel.level === 'excellent' ? 'default' : currentLevel.level === 'poor' ? 'destructive' : 'secondary'}>
              {currentLevel.label}
            </Badge>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  SLA Compliance <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-xs text-muted-foreground">Overall OTIF</div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-2xl font-bold">{data.overall_otif.toFixed(1)}%</span>
              <div className={cn("flex items-center gap-1", trendColor)}>
                {React.createElement(trendIcon, { className: "h-4 w-4" })}
                <span className="text-sm font-medium">
                  {data.change_percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">On-Time %</div>
            <div className="text-xl font-bold text-green-600">{data.on_time_percentage.toFixed(1)}%</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground">In-Full %</div>
            <div className="text-xl font-bold text-blue-600">{data.in_full_percentage.toFixed(1)}%</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stackedData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
              <XAxis 
                dataKey="site" 
                fontSize={10}
                angle={-45}
                textAnchor="end"
                height={60}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                fontSize={10}
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              
              <ChartTooltip 
                content={<ChartTooltipContent 
                  formatter={(_value, _name, props) => {
                    const data = props.payload
                    const SLAIcon = getSLAIcon(data.sla_compliance)
                    const slaColor = getSLAColor(data.sla_compliance)
                    
                    return [
                      <div key="otif-details" className="space-y-2">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-muted-foreground">OTIF</div>
                            <div className="font-bold text-primary">{data.otif.toFixed(1)}%</div>
                          </div>
                          <div>
                            <div className="text-xs text-muted-foreground">SLA Status</div>
                            <div className={cn("flex items-center gap-1", slaColor)}>
                              <SLAIcon className="h-3 w-3" />
                              <span className="text-xs">{data.sla_compliance}</span>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-muted-foreground">On-Time:</span>
                            <span className="font-medium ml-1">{data.on_time.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">In-Full:</span>
                            <span className="font-medium ml-1">{data.in_full.toFixed(1)}%</span>
                          </div>
                        </div>
                        <div className="pt-1 border-t">
                          <div className="text-xs text-muted-foreground">
                            vs SLA Target ({slaTarget}%): {data.otif >= slaTarget ? '+' : ''}{(data.otif - slaTarget).toFixed(1)}%
                          </div>
                        </div>
                      </div>,
                      ''
                    ]
                  }}
                />}
              />
              
              {/* SLA target line */}
              <ReferenceLine 
                y={slaTarget} 
                stroke="hsl(var(--destructive))" 
                strokeDasharray="5 5" 
                strokeOpacity={0.7}
                label={{ value: `SLA ${slaTarget}%`, position: "right", fontSize: 10 }}
              />
              
              {/* Excellence threshold */}
              <ReferenceLine 
                y={85} 
                stroke="hsl(var(--success))" 
                strokeDasharray="3 3" 
                strokeOpacity={0.5}
                label={{ value: "Excellence 85%", position: "right", fontSize: 10 }}
              />
              
              <Bar dataKey="otif" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                {stackedData.map((entry, index) => {
                  const level = getOTIFLevel(entry.otif)
                  return <Cell key={`cell-${index}`} fill={level.color} />
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Performance Summary */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Sites Above SLA</div>
            <div className="text-lg font-bold text-green-600">
              {data.site_breakdown.filter(site => site.otif_percentage >= slaTarget).length}/{data.site_breakdown.length}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Best Performer</div>
            <div className="text-lg font-bold">
              {data.site_breakdown.reduce((best, site) => 
                site.otif_percentage > best.otif_percentage ? site : best
              ).site}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Avg On-Time</div>
            <div className="text-lg font-bold text-green-600">
              {(data.site_breakdown.reduce((acc, site) => acc + site.on_time_percentage, 0) / data.site_breakdown.length).toFixed(1)}%
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Avg In-Full</div>
            <div className="text-lg font-bold text-blue-600">
              {(data.site_breakdown.reduce((acc, site) => acc + site.in_full_percentage, 0) / data.site_breakdown.length).toFixed(1)}%
            </div>
          </div>
        </div>
      </CardContent>

      {/* SLA Compliance Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              OTIF SLA Compliance by Site
            </DialogTitle>
            <DialogDescription>
              Detailed analysis of On-Time In-Full performance and SLA compliance across all sites
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* View Toggle */}
            <div className="flex gap-2">
              <Button
                variant={selectedView === 'overview' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('overview')}
              >
                Overview
              </Button>
              <Button
                variant={selectedView === 'trends' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('trends')}
              >
                Trends
              </Button>
              <Button
                variant={selectedView === 'sites' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedView('sites')}
              >
                Site Details
              </Button>
            </div>

            {/* Overview */}
            {selectedView === 'overview' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Overall OTIF</div>
                      <div className="text-2xl font-bold">{data.overall_otif.toFixed(1)}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">SLA Compliance</div>
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round((data.site_breakdown.filter(s => s.otif_percentage >= slaTarget).length / data.site_breakdown.length) * 100)}%
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Sites at Risk</div>
                      <div className="text-2xl font-bold text-red-600">
                        {data.site_breakdown.filter(s => s.otif_percentage < slaTarget).length}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground">Trend</div>
                      <div className={cn("text-2xl font-bold flex items-center justify-center gap-1", trendColor)}>
                        {React.createElement(trendIcon, { className: "h-6 w-6" })}
                        {data.change_percentage > 0 ? '+' : ''}{data.change_percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="font-medium text-blue-800">Performance Analysis</div>
                      <div className="text-blue-700">
                        {data.overall_otif >= 85 
                          ? 'Excellent performance across the network with strong OTIF metrics.'
                          : data.overall_otif >= 75 
                          ? 'Good performance with room for improvement in delivery consistency.'
                          : 'Performance below target - immediate attention required for service level improvements.'
                        }
                      </div>
                    </div>

                    {data.site_breakdown.filter(s => s.otif_percentage < slaTarget).length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="font-medium text-red-800">Sites Requiring Attention</div>
                        <div className="text-red-700">
                          {data.site_breakdown.filter(s => s.otif_percentage < slaTarget).length} site(s) are below SLA targets and need immediate improvement plans.
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Trends */}
            {selectedView === 'trends' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">7-Day OTIF Trend</CardTitle>
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
                          domain={[70, 95]}
                          tickFormatter={(value) => `${value}%`}
                          tick={{ fill: 'hsl(var(--muted-foreground))' }}
                        />
                        <ChartTooltip 
                          content={<ChartTooltipContent 
                            labelFormatter={(label) => new Date(label).toLocaleDateString()}
                            formatter={(value, name) => [`${Number(value).toFixed(1)}%`, name]}
                          />}
                        />
                        <ReferenceLine y={slaTarget} stroke="hsl(var(--destructive))" strokeDasharray="3 3" label="SLA Target" />
                        <Line 
                          type="monotone" 
                          dataKey="otif" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={3}
                          dot={{ r: 4, fill: "hsl(var(--primary))" }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="on_time" 
                          stroke="hsl(var(--success))" 
                          strokeWidth={2}
                          dot={{ r: 3, fill: "hsl(var(--success))" }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="in_full" 
                          stroke="hsl(var(--info))" 
                          strokeWidth={2}
                          dot={{ r: 3, fill: "hsl(var(--info))" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                </CardContent>
              </Card>
            )}

            {/* Site Details */}
            {selectedView === 'sites' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Site Performance Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.site_breakdown
                      .sort((a, b) => b.otif_percentage - a.otif_percentage)
                      .map((site) => {
                        const SLAIcon = getSLAIcon(site.sla_compliance)
                        const slaColor = getSLAColor(site.sla_compliance)
                        const level = getOTIFLevel(site.otif_percentage)
                        
                        return (
                          <div key={site.site} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                <div className="font-medium">{site.site}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={getSLABadge(site.sla_compliance)}>
                                  {site.sla_compliance} SLA
                                </Badge>
                                <div className={cn("flex items-center gap-1", slaColor)}>
                                  <SLAIcon className="h-4 w-4" />
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground">OTIF</div>
                                <div className="text-xl font-bold" style={{ color: level.color }}>
                                  {site.otif_percentage.toFixed(1)}%
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground">On-Time</div>
                                <div className="text-xl font-bold text-green-600">
                                  {site.on_time_percentage.toFixed(1)}%
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="text-xs text-muted-foreground">In-Full</div>
                                <div className="text-xl font-bold text-blue-600">
                                  {site.in_full_percentage.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                            
                            <div className="mt-3 flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">
                                vs SLA Target ({slaTarget}%):
                              </span>
                              <span className={site.otif_percentage >= slaTarget ? 'text-green-600' : 'text-red-600'}>
                                {site.otif_percentage >= slaTarget ? '+' : ''}{(site.otif_percentage - slaTarget).toFixed(1)}%
                              </span>
                            </div>
                            
                            {site.otif_percentage < slaTarget && (
                              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs">
                                <div className="font-medium text-red-800">Action Required</div>
                                <div className="text-red-700">
                                  Performance below SLA. Focus on {site.on_time_percentage < site.in_full_percentage ? 'delivery timing' : 'order fulfillment'} improvements.
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}