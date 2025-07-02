import { useState } from 'react'
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { BarChart3, AlertTriangle, TrendingDown } from 'lucide-react'

interface ServiceTierData {
  tier: string
  marginLeakage: number
  breachFrequency: number
  cumulativePercentage: number
  totalRevenue: number
  profitMargin: number
  clientCount: number
  severity: 'critical' | 'high' | 'medium' | 'low'
}

interface ServiceTierParetoChartProps {
  className?: string
}

const mockData: ServiceTierData[] = [
  {
    tier: 'Premium Express',
    marginLeakage: 450000,
    breachFrequency: 23,
    cumulativePercentage: 37.5,
    totalRevenue: 3200000,
    profitMargin: -2.1,
    clientCount: 45,
    severity: 'critical'
  },
  {
    tier: 'Standard Plus',
    marginLeakage: 380000,
    breachFrequency: 18,
    cumulativePercentage: 69.2,
    totalRevenue: 5600000,
    profitMargin: 1.2,
    clientCount: 123,
    severity: 'high'
  },
  {
    tier: 'Economy Pro',
    marginLeakage: 220000,
    breachFrequency: 12,
    cumulativePercentage: 87.5,
    totalRevenue: 2800000,
    profitMargin: 3.8,
    clientCount: 89,
    severity: 'medium'
  },
  {
    tier: 'Basic Service',
    marginLeakage: 150000,
    breachFrequency: 8,
    cumulativePercentage: 100,
    totalRevenue: 1900000,
    profitMargin: 5.2,
    clientCount: 167,
    severity: 'low'
  }
]

export default function ServiceTierParetoChart({ className }: ServiceTierParetoChartProps) {
  const [sortBy, setSortBy] = useState<'marginLeakage' | 'breachFrequency'>('marginLeakage')

  const chartConfig = {
    marginLeakage: {
      label: "Margin Leakage",
      color: "hsl(var(--destructive))",
    },
    breachFrequency: {
      label: "Breach Frequency",
      color: "hsl(var(--warning))",
    },
    cumulativePercentage: {
      label: "Cumulative %",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  // Sort data based on selected metric
  const sortedData = [...mockData].sort((a, b) => b[sortBy] - a[sortBy])
  
  // Recalculate cumulative percentage based on sort
  let cumulative = 0
  const total = sortedData.reduce((sum, item) => sum + item[sortBy], 0)
  const chartData = sortedData.map((item) => {
    cumulative += item[sortBy]
    return {
      ...item,
      cumulativePercentage: (cumulative / total) * 100
    }
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444'
      case 'high': return '#f97316'
      case 'medium': return '#eab308'
      case 'low': return '#22c55e'
      default: return '#6b7280'
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle>Unprofitable Service Tiers</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={sortBy} onValueChange={(value: 'marginLeakage' | 'breachFrequency') => setSortBy(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="marginLeakage">Sort by Margin Leakage</SelectItem>
                <SelectItem value="breachFrequency">Sort by Breach Frequency</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Key Metrics Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total Leakage</div>
              <div className="text-lg font-bold text-destructive">
                {formatCurrency(chartData.reduce((sum, item) => sum + item.marginLeakage, 0))}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Critical Tiers</div>
              <div className="text-lg font-bold text-orange-600">
                {chartData.filter(item => item.severity === 'critical' || item.severity === 'high').length}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">80/20 Impact</div>
              <div className="text-lg font-bold text-primary">
                {chartData.filter(item => item.cumulativePercentage <= 80).length} tiers
              </div>
            </div>
          </div>

          {/* Pareto Chart */}
          <ChartContainer config={chartConfig} className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                <XAxis 
                  dataKey="tier" 
                  fontSize={11}
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
                  tickFormatter={(value) => sortBy === 'marginLeakage' ? `$${(value/1000).toFixed(0)}K` : value.toString()}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                />
                
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    className="w-80"
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload
                        return (
                          <div className="space-y-2">
                            <div className="font-semibold text-card-foreground">{data.tier}</div>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: getSeverityColor(data.severity) }}
                              />
                              <Badge variant="outline" className={`text-xs ${
                                data.severity === 'critical' ? 'border-red-500 text-red-600' :
                                data.severity === 'high' ? 'border-orange-500 text-orange-600' :
                                data.severity === 'medium' ? 'border-yellow-500 text-yellow-600' :
                                'border-green-500 text-green-600'
                              }`}>
                                {data.severity.toUpperCase()} PRIORITY
                              </Badge>
                            </div>
                          </div>
                        )
                      }
                      return label
                    }}
                    formatter={(_value, _name, props) => {
                      const data = props.payload
                      
                      return [
                        <div key="tier-details" className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-destructive font-semibold">Margin Leakage:</span>
                                <span className="font-mono text-destructive font-bold">
                                  {formatCurrency(data.marginLeakage)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Breach Frequency:</span>
                                <span className="font-mono">{data.breachFrequency}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Cumulative %:</span>
                                <span className="font-mono">{data.cumulativePercentage.toFixed(1)}%</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Total Revenue:</span>
                                <span className="font-mono">{formatCurrency(data.totalRevenue)}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Profit Margin:</span>
                                <span className={`font-mono font-semibold ${
                                  data.profitMargin < 0 ? 'text-red-600' : 'text-green-600'
                                }`}>
                                  {data.profitMargin.toFixed(1)}%
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Client Count:</span>
                                <span className="font-mono">{data.clientCount}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t pt-2">
                            <div className="text-xs text-muted-foreground">
                              <AlertTriangle className="h-3 w-3 inline mr-1" />
                              Revenue per client: {formatCurrency(data.totalRevenue / data.clientCount)}
                            </div>
                          </div>
                        </div>,
                        ''
                      ]
                    }}
                  />}
                />

                <Bar 
                  yAxisId="left"
                  dataKey={sortBy} 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getSeverityColor(entry.severity)} />
                  ))}
                </Bar>
                
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="cumulativePercentage" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'hsl(var(--primary))', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>

          {/* Service Tier Details */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Service Tier Analysis</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {chartData.map((tier) => (
                <div 
                  key={tier.tier}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: getSeverityColor(tier.severity) }}
                      />
                      <span className="font-medium text-sm">{tier.tier}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="text-right">
                      <div className="font-semibold text-destructive">
                        {formatCurrency(tier.marginLeakage)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {tier.breachFrequency} breaches
                      </div>
                    </div>
                    {tier.profitMargin < 0 && (
                      <TrendingDown className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}