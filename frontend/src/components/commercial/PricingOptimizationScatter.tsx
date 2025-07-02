import { useState } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
  Tooltip
} from 'recharts'
import {
  ChartContainer,
  type ChartConfig,
} from '@/components/ui/chart'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Target, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  Filter,
  Lightbulb,
  ArrowUpRight
} from 'lucide-react'

interface PricingDataPoint {
  serviceId: string
  serviceName: string
  volatility: number
  cost: number
  currentPrice: number
  suggestedPrice: number
  volume: number
  revenue: number
  margin: number
  competitorPrice: number
  elasticity: number
  opportunity: 'high' | 'medium' | 'low'
  priceStrategy: 'increase' | 'decrease' | 'maintain' | 'premium' | 'discount'
  confidenceLevel: number
  marketPosition: 'leader' | 'challenger' | 'follower' | 'niche'
  clientSensitivity: number
  seasonality: number
}

interface PricingOptimizationScatterProps {
  className?: string
}

const mockData: PricingDataPoint[] = [
  {
    serviceId: 'SVC-001',
    serviceName: 'Express Delivery',
    volatility: 45,
    cost: 85,
    currentPrice: 120,
    suggestedPrice: 135,
    volume: 1200,
    revenue: 144000,
    margin: 29.2,
    competitorPrice: 125,
    elasticity: -0.8,
    opportunity: 'high',
    priceStrategy: 'increase',
    confidenceLevel: 87,
    marketPosition: 'leader',
    clientSensitivity: 0.3,
    seasonality: 15
  },
  {
    serviceId: 'SVC-002',
    serviceName: 'Standard Shipping',
    volatility: 28,
    cost: 45,
    currentPrice: 65,
    suggestedPrice: 62,
    volume: 3500,
    revenue: 227500,
    margin: 30.8,
    competitorPrice: 60,
    elasticity: -1.2,
    opportunity: 'medium',
    priceStrategy: 'decrease',
    confidenceLevel: 72,
    marketPosition: 'challenger',
    clientSensitivity: 0.7,
    seasonality: 8
  },
  {
    serviceId: 'SVC-003',
    serviceName: 'Premium Overnight',
    volatility: 62,
    cost: 150,
    currentPrice: 220,
    suggestedPrice: 265,
    volume: 580,
    revenue: 127600,
    margin: 31.8,
    competitorPrice: 240,
    elasticity: -0.5,
    opportunity: 'high',
    priceStrategy: 'premium',
    confidenceLevel: 91,
    marketPosition: 'niche',
    clientSensitivity: 0.2,
    seasonality: 25
  },
  {
    serviceId: 'SVC-004',
    serviceName: 'Economy Ground',
    volatility: 35,
    cost: 25,
    currentPrice: 40,
    suggestedPrice: 38,
    volume: 4200,
    revenue: 168000,
    margin: 37.5,
    competitorPrice: 35,
    elasticity: -1.8,
    opportunity: 'low',
    priceStrategy: 'maintain',
    confidenceLevel: 68,
    marketPosition: 'follower',
    clientSensitivity: 0.9,
    seasonality: 5
  },
  {
    serviceId: 'SVC-005',
    serviceName: 'White Glove',
    volatility: 78,
    cost: 200,
    currentPrice: 350,
    suggestedPrice: 420,
    volume: 180,
    revenue: 63000,
    margin: 42.9,
    competitorPrice: 380,
    elasticity: -0.3,
    opportunity: 'high',
    priceStrategy: 'premium',
    confidenceLevel: 89,
    marketPosition: 'leader',
    clientSensitivity: 0.1,
    seasonality: 30
  },
  {
    serviceId: 'SVC-006',
    serviceName: 'Bulk Freight',
    volatility: 52,
    cost: 180,
    currentPrice: 280,
    suggestedPrice: 265,
    volume: 650,
    revenue: 182000,
    margin: 35.7,
    competitorPrice: 260,
    elasticity: -1.1,
    opportunity: 'medium',
    priceStrategy: 'decrease',
    confidenceLevel: 75,
    marketPosition: 'challenger',
    clientSensitivity: 0.6,
    seasonality: 20
  },
  {
    serviceId: 'SVC-007',
    serviceName: 'International Express',
    volatility: 89,
    cost: 320,
    currentPrice: 480,
    suggestedPrice: 550,
    volume: 320,
    revenue: 153600,
    margin: 33.3,
    competitorPrice: 520,
    elasticity: -0.4,
    opportunity: 'high',
    priceStrategy: 'increase',
    confidenceLevel: 85,
    marketPosition: 'leader',
    clientSensitivity: 0.25,
    seasonality: 40
  },
  {
    serviceId: 'SVC-008',
    serviceName: 'Same-Day Local',
    volatility: 71,
    cost: 95,
    currentPrice: 150,
    suggestedPrice: 175,
    volume: 890,
    revenue: 133500,
    margin: 36.7,
    competitorPrice: 160,
    elasticity: -0.7,
    opportunity: 'high',
    priceStrategy: 'increase',
    confidenceLevel: 82,
    marketPosition: 'niche',
    clientSensitivity: 0.35,
    seasonality: 18
  }
]

export default function PricingOptimizationScatter({ className }: PricingOptimizationScatterProps) {
  const [viewMode, setViewMode] = useState<'opportunity' | 'strategy' | 'position'>('opportunity')
  const [filterStrategy, setFilterStrategy] = useState<'all' | 'increase' | 'decrease' | 'premium' | 'maintain'>('all')

  const chartConfig = {
    opportunity: {
      label: "Pricing Opportunity",
      color: "hsl(var(--primary))",
    },
    strategy: {
      label: "Price Strategy",
      color: "hsl(var(--secondary))",
    },
    position: {
      label: "Market Position",
      color: "hsl(var(--accent))",
    },
  } satisfies ChartConfig

  const filteredData = mockData.filter(item => 
    filterStrategy === 'all' || item.priceStrategy === filterStrategy
  )

  const getOpportunityColor = (opportunity: string, strategy: string) => {
    if (viewMode === 'opportunity') {
      switch (opportunity) {
        case 'high': return '#22c55e'
        case 'medium': return '#eab308'
        case 'low': return '#ef4444'
        default: return '#6b7280'
      }
    } else if (viewMode === 'strategy') {
      switch (strategy) {
        case 'increase': return '#22c55e'
        case 'premium': return '#8b5cf6'
        case 'decrease': return '#ef4444'
        case 'maintain': return '#6b7280'
        default: return '#f97316'
      }
    } else {
      return '#3b82f6' // default blue for market position
    }
  }

  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'increase': return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'premium': return <Target className="h-3 w-3 text-purple-600" />
      case 'decrease': return <ArrowUpRight className="h-3 w-3 text-red-600 rotate-180" />
      case 'maintain': return <BarChart3 className="h-3 w-3 text-gray-600" />
      default: return <DollarSign className="h-3 w-3 text-orange-600" />
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

  const calculatePotentialRevenue = (item: PricingDataPoint) => {
    const volumeAdjustment = Math.pow(item.suggestedPrice / item.currentPrice, item.elasticity)
    const newVolume = item.volume * volumeAdjustment
    return newVolume * item.suggestedPrice
  }

  const calculateRevenueImpact = (item: PricingDataPoint) => {
    const newRevenue = calculatePotentialRevenue(item)
    return newRevenue - item.revenue
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            <CardTitle>Pricing Optimization Opportunities</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opportunity">By Opportunity</SelectItem>
                <SelectItem value="strategy">By Strategy</SelectItem>
                <SelectItem value="position">By Position</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStrategy} onValueChange={(value: any) => setFilterStrategy(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Strategies</SelectItem>
                <SelectItem value="increase">Increase</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="decrease">Decrease</SelectItem>
                <SelectItem value="maintain">Maintain</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Key Metrics Summary */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">High Opportunity</div>
            <div className="text-lg font-bold text-green-600">
              {filteredData.filter(item => item.opportunity === 'high').length}
            </div>
            <div className="text-xs text-muted-foreground">services</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Avg. Price Increase</div>
            <div className="text-lg font-bold text-blue-600">
              {(filteredData
                .filter(item => item.priceStrategy === 'increase' || item.priceStrategy === 'premium')
                .reduce((sum, item) => sum + ((item.suggestedPrice - item.currentPrice) / item.currentPrice * 100), 0) /
                filteredData.filter(item => item.priceStrategy === 'increase' || item.priceStrategy === 'premium').length
              ).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">potential uplift</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Revenue Impact</div>
            <div className="text-lg font-bold text-purple-600">
              {formatCurrency(filteredData.reduce((sum, item) => sum + calculateRevenueImpact(item), 0))}
            </div>
            <div className="text-xs text-muted-foreground">annual potential</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">High Confidence</div>
            <div className="text-lg font-bold text-orange-600">
              {filteredData.filter(item => item.confidenceLevel >= 80).length}
            </div>
            <div className="text-xs text-muted-foreground">recommendations</div>
          </div>
        </div>

        {/* Scatter Chart */}
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
              <XAxis 
                type="number"
                dataKey="volatility"
                domain={[0, 100]}
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                label={{ value: 'Volatility Score', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                type="number"
                dataKey="cost"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `$${value}`}
                label={{ value: 'Cost ($)', angle: -90, position: 'insideLeft' }}
              />
              
              {/* Reference lines for quadrants */}
              <ReferenceLine x={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" strokeOpacity={0.5} />
              <ReferenceLine y={100} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" strokeOpacity={0.5} />
              
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length > 0) {
                    const data = payload[0].payload as PricingDataPoint
                    const revenueImpact = calculateRevenueImpact(data)
                    const potentialRevenue = calculatePotentialRevenue(data)
                    
                    return (
                      <div className="bg-background border rounded-lg shadow-lg p-4 w-80">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">{data.serviceName}</h4>
                            <div className="flex items-center gap-2">
                              {getStrategyIcon(data.priceStrategy)}
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", {
                                  'border-green-500 text-green-600': data.opportunity === 'high',
                                  'border-yellow-500 text-yellow-600': data.opportunity === 'medium',
                                  'border-red-500 text-red-600': data.opportunity === 'low'
                                })}
                              >
                                {data.opportunity.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Current Price:</span>
                                <span className="font-medium">{formatCurrency(data.currentPrice)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Suggested Price:</span>
                                <span className="font-semibold text-green-600">{formatCurrency(data.suggestedPrice)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Cost:</span>
                                <span className="font-medium">{formatCurrency(data.cost)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Competitor:</span>
                                <span className="font-medium">{formatCurrency(data.competitorPrice)}</span>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Volatility:</span>
                                <span className="font-medium">{data.volatility}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Volume:</span>
                                <span className="font-medium">{data.volume.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Elasticity:</span>
                                <span className="font-medium">{data.elasticity}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Confidence:</span>
                                <span className="font-medium">{data.confidenceLevel}%</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="border-t pt-2 space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Current Revenue:</span>
                              <span className="font-medium">{formatCurrency(data.revenue)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Potential Revenue:</span>
                              <span className="font-semibold text-blue-600">{formatCurrency(potentialRevenue)}</span>
                            </div>
                            <div className="flex justify-between text-sm border-t pt-1">
                              <span className="text-muted-foreground font-medium">Revenue Impact:</span>
                              <span className={cn("font-bold", {
                                'text-green-600': revenueImpact > 0,
                                'text-red-600': revenueImpact < 0,
                                'text-gray-600': revenueImpact === 0
                              })}>
                                {revenueImpact > 0 ? '+' : ''}{formatCurrency(revenueImpact)}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground">
                            Strategy: <span className="font-medium capitalize">{data.priceStrategy}</span> • 
                            Position: <span className="font-medium capitalize">{data.marketPosition}</span>
                          </div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />

              <Scatter data={filteredData}>
                {filteredData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getOpportunityColor(entry.opportunity, entry.priceStrategy)}
                    r={4 + (entry.confidenceLevel / 100) * 4} // Size based on confidence
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Quadrant Analysis */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Pricing Strategy Matrix</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="font-medium text-sm">Low Volatility, Low Cost</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Stable pricing opportunity</p>
              <div className="space-y-1">
                {filteredData
                  .filter(item => item.volatility < 50 && item.cost < 100)
                  .slice(0, 2)
                  .map(item => (
                    <div key={item.serviceId} className="flex justify-between text-xs">
                      <span>{item.serviceName}</span>
                      <span className="font-medium">{formatCurrency(calculateRevenueImpact(item))}</span>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full" />
                <span className="font-medium text-sm">High Volatility, Low Cost</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Dynamic pricing potential</p>
              <div className="space-y-1">
                {filteredData
                  .filter(item => item.volatility >= 50 && item.cost < 100)
                  .slice(0, 2)
                  .map(item => (
                    <div key={item.serviceId} className="flex justify-between text-xs">
                      <span>{item.serviceName}</span>
                      <span className="font-medium">{formatCurrency(calculateRevenueImpact(item))}</span>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="font-medium text-sm">Low Volatility, High Cost</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Premium service positioning</p>
              <div className="space-y-1">
                {filteredData
                  .filter(item => item.volatility < 50 && item.cost >= 100)
                  .slice(0, 2)
                  .map(item => (
                    <div key={item.serviceId} className="flex justify-between text-xs">
                      <span>{item.serviceName}</span>
                      <span className="font-medium">{formatCurrency(calculateRevenueImpact(item))}</span>
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full" />
                <span className="font-medium text-sm">High Volatility, High Cost</span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">Risk-adjusted pricing</p>
              <div className="space-y-1">
                {filteredData
                  .filter(item => item.volatility >= 50 && item.cost >= 100)
                  .slice(0, 2)
                  .map(item => (
                    <div key={item.serviceId} className="flex justify-between text-xs">
                      <span>{item.serviceName}</span>
                      <span className="font-medium">{formatCurrency(calculateRevenueImpact(item))}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Items */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">
                {filteredData.filter(item => item.opportunity === 'high').length} high-impact pricing 
                opportunities identified
              </span>
            </div>
            <Button size="sm" variant="outline">
              <Filter className="h-3 w-3 mr-1" />
              Price Banding Recommendations
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}