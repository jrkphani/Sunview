import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle
} from '@/components/ui/dialog'
import { Package2, TrendingUp, TrendingDown, ChevronRight, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Legend
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

import type { DrillDownFilters, DOHData } from '@/types/api'

interface DOHLineChartProps {
  filters?: DrillDownFilters
  className?: string
}

// Mock data - replace with actual API call
const mockDOHData: DOHData = {
  sku_groups: [
    {
      group: 'Electronics',
      average_doh: 28.5,
      trend_direction: 'up',
      sku_details: [
        { sku: 'SKU-E001', name: 'Wireless Headphones', doh: 45.2, aging_category: 'excess', demand_rate: 12.3 },
        { sku: 'SKU-E002', name: 'Gaming Laptop', doh: 23.8, aging_category: 'healthy', demand_rate: 28.7 },
        { sku: 'SKU-E003', name: 'Smart Watch', doh: 16.4, aging_category: 'healthy', demand_rate: 45.2 },
        { sku: 'SKU-E004', name: 'Tablet Pro', doh: 38.9, aging_category: 'aging', demand_rate: 15.6 }
      ]
    },
    {
      group: 'Apparel',
      average_doh: 22.1,
      trend_direction: 'down',
      sku_details: [
        { sku: 'SKU-A001', name: 'Running Shoes', doh: 18.3, aging_category: 'healthy', demand_rate: 52.1 },
        { sku: 'SKU-A002', name: 'Casual Jacket', doh: 31.2, aging_category: 'aging', demand_rate: 18.9 },
        { sku: 'SKU-A003', name: 'Sports T-Shirt', doh: 14.7, aging_category: 'healthy', demand_rate: 68.4 },
        { sku: 'SKU-A004', name: 'Winter Coat', doh: 24.2, aging_category: 'healthy', demand_rate: 23.5 }
      ]
    },
    {
      group: 'Home & Garden',
      average_doh: 35.7,
      trend_direction: 'stable',
      sku_details: [
        { sku: 'SKU-H001', name: 'Garden Tool Set', doh: 42.8, aging_category: 'excess', demand_rate: 8.9 },
        { sku: 'SKU-H002', name: 'Kitchen Appliance', doh: 26.3, aging_category: 'healthy', demand_rate: 22.1 },
        { sku: 'SKU-H003', name: 'Outdoor Furniture', doh: 38.9, aging_category: 'aging', demand_rate: 12.4 },
        { sku: 'SKU-H004', name: 'Home Decor', doh: 34.8, aging_category: 'aging', demand_rate: 16.7 }
      ]
    },
    {
      group: 'Sports',
      average_doh: 19.8,
      trend_direction: 'down',
      sku_details: [
        { sku: 'SKU-S001', name: 'Fitness Equipment', doh: 21.5, aging_category: 'healthy', demand_rate: 35.2 },
        { sku: 'SKU-S002', name: 'Camping Gear', doh: 18.1, aging_category: 'healthy', demand_rate: 41.8 },
        { sku: 'SKU-S003', name: 'Sports Accessories', doh: 19.9, aging_category: 'healthy', demand_rate: 38.7 },
        { sku: 'SKU-S004', name: 'Athletic Wear', doh: 19.7, aging_category: 'healthy', demand_rate: 42.3 }
      ]
    }
  ],
  time_series: [
    { date: '2024-01-01', values: { 'Electronics': 29.2, 'Apparel': 24.1, 'Home & Garden': 37.8, 'Sports': 21.3 } },
    { date: '2024-01-02', values: { 'Electronics': 28.9, 'Apparel': 23.5, 'Home & Garden': 36.9, 'Sports': 20.8 } },
    { date: '2024-01-03', values: { 'Electronics': 28.1, 'Apparel': 22.8, 'Home & Garden': 36.2, 'Sports': 20.2 } },
    { date: '2024-01-04', values: { 'Electronics': 28.5, 'Apparel': 22.3, 'Home & Garden': 35.9, 'Sports': 19.9 } },
    { date: '2024-01-05', values: { 'Electronics': 28.7, 'Apparel': 22.0, 'Home & Garden': 35.5, 'Sports': 19.6 } },
    { date: '2024-01-06', values: { 'Electronics': 28.3, 'Apparel': 21.8, 'Home & Garden': 35.8, 'Sports': 19.4 } },
    { date: '2024-01-07', values: { 'Electronics': 28.5, 'Apparel': 22.1, 'Home & Garden': 35.7, 'Sports': 19.8 } }
  ]
}

export default function DOHLineChart({ filters: _filters, className }: DOHLineChartProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const data = mockDOHData // In real app: useDOHData(filters)

  const chartConfig = {
    Electronics: {
      label: "Electronics",
      color: "#3b82f6",
    },
    Apparel: {
      label: "Apparel", 
      color: "#10b981",
    },
    'Home & Garden': {
      label: "Home & Garden",
      color: "#f59e0b",
    },
    Sports: {
      label: "Sports",
      color: "#8b5cf6",
    },
  } satisfies ChartConfig

  const getAgingIcon = (category: 'healthy' | 'aging' | 'excess') => {
    switch (category) {
      case 'healthy': return CheckCircle
      case 'aging': return Clock
      case 'excess': return AlertCircle
    }
  }

  const getAgingColor = (category: 'healthy' | 'aging' | 'excess') => {
    switch (category) {
      case 'healthy': return 'text-green-600'
      case 'aging': return 'text-yellow-600'
      case 'excess': return 'text-red-600'
    }
  }

  const getAgingBadge = (category: 'healthy' | 'aging' | 'excess') => {
    switch (category) {
      case 'healthy': return 'default'
      case 'aging': return 'secondary'
      case 'excess': return 'destructive'
    }
  }

  const getDOHLevel = (doh: number) => {
    if (doh <= 20) return { level: 'excellent', color: '#22c55e', label: 'Optimal' }
    if (doh <= 30) return { level: 'good', color: '#3b82f6', label: 'Good' }
    if (doh <= 40) return { level: 'warning', color: '#eab308', label: 'High' }
    return { level: 'critical', color: '#ef4444', label: 'Excess' }
  }

  const handleGroupClick = (groupName: string) => {
    const group = data.sku_groups.find(g => g.group === groupName)
    if (group) {
      setSelectedGroup(groupName)
      setIsDialogOpen(true)
    }
  }

  const formatTimeSeries = data.time_series.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }))

  const overallStats = {
    avgDOH: data.sku_groups.reduce((acc, group) => acc + group.average_doh, 0) / data.sku_groups.length,
    totalSKUs: data.sku_groups.reduce((acc, group) => acc + group.sku_details.length, 0),
    excessSKUs: data.sku_groups.reduce((acc, group) => 
      acc + group.sku_details.filter(sku => sku.aging_category === 'excess').length, 0),
    agingSKUs: data.sku_groups.reduce((acc, group) => 
      acc + group.sku_details.filter(sku => sku.aging_category === 'aging').length, 0)
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Days of Inventory on Hand (DOH)</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Avg: {overallStats.avgDOH.toFixed(1)} days
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant={overallStats.excessSKUs > 2 ? 'destructive' : 'secondary'}>
                    {overallStats.excessSKUs} excess items
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>SKUs with inventory levels exceeding optimal thresholds</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground">
          Track inventory levels by SKU group. Click on lines to drill into SKU aging analysis.
        </p>
      </CardHeader>
      
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={formatTimeSeries} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
              <XAxis 
                dataKey="formattedDate" 
                fontSize={10}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                fontSize={10}
                tickFormatter={(value) => `${value}d`}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              
              <ChartTooltip 
                content={<ChartTooltipContent 
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      const data = payload[0].payload
                      return new Date(data.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    }
                    return label
                  }}
                  formatter={(value, name) => [`${Number(value).toFixed(1)} days`, name]}
                />}
              />
              
              {/* Optimal range reference lines */}
              <ReferenceLine 
                y={20} 
                stroke="hsl(var(--success))" 
                strokeDasharray="3 3" 
                strokeOpacity={0.5}
                label={{ value: "Optimal (20d)", position: "right", fontSize: 10 }}
              />
              <ReferenceLine 
                y={30} 
                stroke="hsl(var(--warning))" 
                strokeDasharray="5 5" 
                strokeOpacity={0.5}
                label={{ value: "Warning (30d)", position: "right", fontSize: 10 }}
              />
              
              {Object.keys(chartConfig).map((groupName) => (
                <Line
                  key={groupName}
                  type="monotone"
                  dataKey={`values.${groupName}`}
                  stroke={chartConfig[groupName as keyof typeof chartConfig].color}
                  strokeWidth={2}
                  dot={{ r: 4, fill: chartConfig[groupName as keyof typeof chartConfig].color }}
                  activeDot={{ 
                    r: 6, 
                    fill: chartConfig[groupName as keyof typeof chartConfig].color,
                    stroke: "hsl(var(--background))",
                    strokeWidth: 2,
                    style: { cursor: 'pointer' },
                    onClick: () => handleGroupClick(groupName)
                  }}
                />
              ))}
              
              <Legend 
                wrapperStyle={{ fontSize: '12px' }}
                onClick={(e) => e.value && handleGroupClick(e.value)}
                iconType="line"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Summary Stats */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Average DOH</div>
            <div className="text-lg font-bold">
              {overallStats.avgDOH.toFixed(1)} days
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Total SKUs</div>
            <div className="text-lg font-bold">
              {overallStats.totalSKUs}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Aging Items</div>
            <div className="text-lg font-bold text-yellow-600">
              {overallStats.agingSKUs}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Excess Items</div>
            <div className="text-lg font-bold text-red-600">
              {overallStats.excessSKUs}
            </div>
          </div>
        </div>

        {/* SKU Group Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.sku_groups.map((group) => {
            const level = getDOHLevel(group.average_doh)
            const trendIcon = group.trend_direction === 'up' ? TrendingUp : 
                             group.trend_direction === 'down' ? TrendingDown : null
            const trendColor = group.trend_direction === 'up' ? 'text-red-600' : 
                              group.trend_direction === 'down' ? 'text-green-600' : 'text-muted-foreground'
            
            return (
              <Card 
                key={group.group} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleGroupClick(group.group)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{group.group}</div>
                    <div className="flex items-center gap-1">
                      <Badge variant={level.level === 'excellent' ? 'default' : level.level === 'critical' ? 'destructive' : 'secondary'}>
                        {level.label}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold">{group.average_doh.toFixed(1)} days</div>
                    {trendIcon && (
                      <div className={cn("flex items-center gap-1", trendColor)}>
                        {React.createElement(trendIcon, { className: "h-4 w-4" })}
                        <span className="text-sm">{group.trend_direction}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-1">
                    {group.sku_details.length} SKUs • 
                    {group.sku_details.filter(s => s.aging_category === 'excess').length} excess items
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </CardContent>

      {/* SKU Aging Drill-down Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package2 className="h-5 w-5" />
              SKU Aging Analysis: {selectedGroup}
            </DialogTitle>
            <DialogDescription>
              Detailed breakdown of inventory aging and demand rates for {selectedGroup} category
            </DialogDescription>
          </DialogHeader>

          {selectedGroup && (
            <div className="space-y-6">
              {/* Group Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Category Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {(() => {
                      const group = data.sku_groups.find(g => g.group === selectedGroup)!
                      const healthyCount = group.sku_details.filter(s => s.aging_category === 'healthy').length
                      const agingCount = group.sku_details.filter(s => s.aging_category === 'aging').length
                      const excessCount = group.sku_details.filter(s => s.aging_category === 'excess').length
                      const avgDemandRate = group.sku_details.reduce((acc, s) => acc + s.demand_rate, 0) / group.sku_details.length
                      
                      return (
                        <>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Avg DOH</div>
                            <div className="text-lg font-bold">{group.average_doh.toFixed(1)} days</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Avg Demand Rate</div>
                            <div className="text-lg font-bold">{avgDemandRate.toFixed(1)}/day</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Healthy Items</div>
                            <div className="text-lg font-bold text-green-600">{healthyCount}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">Risk Items</div>
                            <div className="text-lg font-bold text-red-600">{agingCount + excessCount}</div>
                          </div>
                        </>
                      )
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* SKU Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">SKU Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {data.sku_groups
                      .find(g => g.group === selectedGroup)
                      ?.sku_details
                      .sort((a, b) => b.doh - a.doh)
                      .map((sku) => {
                        const AgingIcon = getAgingIcon(sku.aging_category)
                        const agingColor = getAgingColor(sku.aging_category)
                        const level = getDOHLevel(sku.doh)
                        
                        return (
                          <div key={sku.sku} className="p-4 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <AgingIcon className={cn('h-4 w-4', agingColor)} />
                                <div className="font-medium">{sku.name}</div>
                              </div>
                              <Badge variant={getAgingBadge(sku.aging_category)}>
                                {sku.aging_category}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">Days on Hand</div>
                                <div className="font-bold text-lg" style={{ color: level.color }}>
                                  {sku.doh.toFixed(1)} days
                                </div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">Demand Rate</div>
                                <div className="font-medium">{sku.demand_rate.toFixed(1)}/day</div>
                              </div>
                              <div>
                                <div className="text-muted-foreground">SKU Code</div>
                                <div className="font-mono text-xs">{sku.sku}</div>
                              </div>
                            </div>
                            
                            {sku.aging_category !== 'healthy' && (
                              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                <div className="font-medium text-yellow-800">
                                  {sku.aging_category === 'excess' ? 'Action Required' : 'Monitor Closely'}
                                </div>
                                <div className="text-yellow-700">
                                  {sku.aging_category === 'excess' 
                                    ? 'Consider promotions or redistribution to reduce excess inventory'
                                    : 'Monitor demand patterns and adjust replenishment schedules'
                                  }
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}