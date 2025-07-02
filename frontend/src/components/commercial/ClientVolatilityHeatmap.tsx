import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Filter,
  Eye
} from 'lucide-react'

interface ClientVolatilityData {
  clientId: string
  clientName: string
  industry: string
  revenue: number
  volatilityScore: number
  forecastVariance: number
  riskLevel: 'critical' | 'high' | 'medium' | 'low'
  monthlyVariance: number[]
  recentTrend: 'up' | 'down' | 'stable'
  percentile: number
  sku: string
  skuVolatility: number
}

interface ClientVolatilityHeatmapProps {
  className?: string
}

const mockData: ClientVolatilityData[] = [
  {
    clientId: 'CLI-001',
    clientName: 'TechNova Corp',
    industry: 'Technology',
    revenue: 2400000,
    volatilityScore: 89,
    forecastVariance: 34.2,
    riskLevel: 'critical',
    monthlyVariance: [15, 28, 45, 22, 67, 34],
    recentTrend: 'up',
    percentile: 95,
    sku: 'Express Tech',
    skuVolatility: 42
  },
  {
    clientId: 'CLI-002',
    clientName: 'Global Manufacturing',
    industry: 'Manufacturing',
    revenue: 3200000,
    volatilityScore: 76,
    forecastVariance: 28.7,
    riskLevel: 'high',
    monthlyVariance: [12, 34, 28, 41, 19, 32],
    recentTrend: 'down',
    percentile: 88,
    sku: 'Industrial Plus',
    skuVolatility: 38
  },
  {
    clientId: 'CLI-003',
    clientName: 'RetailMax Inc',
    industry: 'Retail',
    revenue: 1800000,
    volatilityScore: 68,
    forecastVariance: 23.1,
    riskLevel: 'high',
    monthlyVariance: [18, 25, 31, 29, 35, 22],
    recentTrend: 'stable',
    percentile: 82,
    sku: 'Retail Standard',
    skuVolatility: 29
  },
  {
    clientId: 'CLI-004',
    clientName: 'HealthCare Solutions',
    industry: 'Healthcare',
    revenue: 2800000,
    volatilityScore: 45,
    forecastVariance: 16.4,
    riskLevel: 'medium',
    monthlyVariance: [8, 12, 15, 11, 18, 14],
    recentTrend: 'stable',
    percentile: 65,
    sku: 'Medical Priority',
    skuVolatility: 22
  },
  {
    clientId: 'CLI-005',
    clientName: 'Financial Partners',
    industry: 'Finance',
    revenue: 1950000,
    volatilityScore: 52,
    forecastVariance: 19.8,
    riskLevel: 'medium',
    monthlyVariance: [9, 16, 22, 18, 24, 19],
    recentTrend: 'up',
    percentile: 71,
    sku: 'Finance Express',
    skuVolatility: 25
  },
  {
    clientId: 'CLI-006',
    clientName: 'Energy Dynamics',
    industry: 'Energy',
    revenue: 4100000,
    volatilityScore: 82,
    forecastVariance: 31.5,
    riskLevel: 'critical',
    monthlyVariance: [22, 38, 29, 45, 51, 36],
    recentTrend: 'up',
    percentile: 92,
    sku: 'Energy Premium',
    skuVolatility: 44
  },
  {
    clientId: 'CLI-007',
    clientName: 'Consumer Goods Ltd',
    industry: 'Consumer Goods',
    revenue: 1400000,
    volatilityScore: 38,
    forecastVariance: 12.7,
    riskLevel: 'low',
    monthlyVariance: [6, 9, 11, 8, 13, 10],
    recentTrend: 'stable',
    percentile: 45,
    sku: 'Consumer Basic',
    skuVolatility: 18
  },
  {
    clientId: 'CLI-008',
    clientName: 'Automotive Group',
    industry: 'Automotive',
    revenue: 3600000,
    volatilityScore: 71,
    forecastVariance: 26.3,
    riskLevel: 'high',
    monthlyVariance: [14, 31, 25, 38, 22, 29],
    recentTrend: 'down',
    percentile: 85,
    sku: 'Auto Express',
    skuVolatility: 35
  }
]

export default function ClientVolatilityHeatmap({ className }: ClientVolatilityHeatmapProps) {
  const [viewMode, setViewMode] = useState<'client' | 'sku'>('client')
  const [filterLevel, setFilterLevel] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all')

  const filteredData = mockData.filter(item => 
    filterLevel === 'all' || item.riskLevel === filterLevel
  )

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-error'
      case 'high': return 'bg-forecast-medium'
      case 'medium': return 'bg-warning'
      case 'low': return 'bg-success'
      default: return 'bg-muted'
    }
  }

  const getVolatilityColor = (score: number) => {
    // Return base text color - we'll handle backgrounds separately for better contrast
    if (score >= 80) return 'text-white'
    if (score >= 60) return 'text-white'
    if (score >= 40) return 'text-neutral-800'
    return 'text-neutral-800'
  }

  const getIntensity = (score: number) => {
    return Math.min(100, Math.max(10, score)) / 100
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-error" />
      case 'down': return <TrendingDown className="h-3 w-3 text-success" />
      default: return <Activity className="h-3 w-3 text-muted-foreground" />
    }
  }

  const getPercentileRank = (percentile: number) => {
    if (percentile >= 90) return 'Top 10%'
    if (percentile >= 75) return 'Top 25%'
    if (percentile >= 50) return 'Above Avg'
    return 'Below Avg'
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <CardTitle>High Volatility Clients & SKUs</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(value: 'client' | 'sku') => setViewMode(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">By Client</SelectItem>
                <SelectItem value="sku">By SKU</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterLevel} onValueChange={(value: any) => setFilterLevel(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Risk Level Summary */}
        <div className="grid grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          {['critical', 'high', 'medium', 'low'].map(level => {
            const count = mockData.filter(item => item.riskLevel === level).length
            const totalRevenue = mockData
              .filter(item => item.riskLevel === level)
              .reduce((sum, item) => sum + item.revenue, 0)
            
            return (
              <div key={level} className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <div className={cn("w-3 h-3 rounded-full", getRiskColor(level))} />
                  <span className="text-sm font-medium capitalize">{level}</span>
                </div>
                <div className="text-lg font-bold">{count}</div>
                <div className="text-xs text-muted-foreground">{formatCurrency(totalRevenue)}</div>
              </div>
            )
          })}
        </div>

        {/* Volatility Heatmap Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Volatility Heatmap</h4>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-success rounded" />
                <span>Low (0-40)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-warning rounded" />
                <span>Medium (40-60)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-forecast-medium rounded" />
                <span>High (60-80)</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-error rounded" />
                <span>Critical (80+)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredData.map((client) => (
              <div
                key={client.clientId}
                className={cn(
                  "relative p-4 rounded-lg border-2 hover:shadow-md transition-all cursor-pointer min-h-[200px] flex flex-col",
                  getVolatilityColor(client.volatilityScore),
                  // Enhanced background colors with proper contrast
                  client.volatilityScore >= 80 ? 'bg-error/80 border-error' :
                  client.volatilityScore >= 60 ? 'bg-forecast-medium/80 border-forecast-medium' :
                  client.volatilityScore >= 40 ? 'bg-warning/60 border-warning' :
                  'bg-success/60 border-success'
                )}
              >
                <div className="space-y-3 flex-1">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <h5 className="font-semibold text-sm leading-tight break-words">{client.clientName}</h5>
                        <p className="text-xs opacity-80 truncate">{client.industry}</p>
                      </div>
                      <div className="flex-shrink-0">
                        {getTrendIcon(client.recentTrend)}
                      </div>
                    </div>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-xs w-fit",
                        client.volatilityScore >= 60 ? 'bg-white/90 text-neutral-800' : 'bg-neutral-800/90 text-white'
                      )}
                    >
                      {getPercentileRank(client.percentile)}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="space-y-1">
                        <div className="opacity-80">Volatility</div>
                        <div className="font-bold text-lg">{client.volatilityScore}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="opacity-80">Variance</div>
                        <div className="font-semibold">{client.forecastVariance.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="text-xs">
                      <div className="opacity-80">Revenue</div>
                      <div className="font-semibold truncate">{formatCurrency(client.revenue)}</div>
                    </div>
                  </div>

                  {viewMode === 'sku' && (
                    <div className="pt-2 border-t border-current/20 space-y-1">
                      <div className="text-xs">
                        <div className="opacity-80">SKU</div>
                        <div className="font-medium truncate">{client.sku}</div>
                      </div>
                      <div className="text-xs">
                        <div className="opacity-80">SKU Volatility</div>
                        <div className="font-bold">{client.skuVolatility}</div>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 mt-auto">
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs font-semibold", {
                        'border-white text-white bg-white/20': client.riskLevel === 'critical' || client.riskLevel === 'high',
                        'border-neutral-800 text-neutral-800 bg-neutral-800/20': client.riskLevel === 'medium' || client.riskLevel === 'low'
                      })}
                    >
                      {client.riskLevel.toUpperCase()}
                    </Badge>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className={cn(
                        "h-6 px-2 text-xs",
                        client.volatilityScore >= 60 ? 'text-white hover:bg-white/20' : 'text-neutral-800 hover:bg-neutral-800/20'
                      )}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* Volatility intensity indicator */}
                <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-current opacity-60" />
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Variance Trend */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm">Monthly Variance Trends (Top Risk Clients)</h4>
          <div className="space-y-2">
            {filteredData
              .filter(client => client.riskLevel === 'critical' || client.riskLevel === 'high')
              .slice(0, 4)
              .map((client) => (
                <div key={client.clientId} className="flex items-center justify-between p-2 rounded bg-muted/20">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-3 h-3 rounded-full", getRiskColor(client.riskLevel))} />
                    <div>
                      <span className="font-medium text-sm">{client.clientName}</span>
                      <span className="text-xs text-muted-foreground ml-2">({client.industry})</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-semibold">{client.volatilityScore}</div>
                      <div className="text-xs text-muted-foreground">Vol. Score</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{client.forecastVariance.toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Variance</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {client.monthlyVariance.map((variance, index) => (
                        <div
                          key={index}
                          className={cn(
                            "w-2 h-4 rounded-sm",
                            variance > 30 ? 'bg-error' : 
                            variance > 20 ? 'bg-forecast-medium' : 
                            variance > 10 ? 'bg-warning' : 'bg-success'
                          )}
                          style={{
                            opacity: 0.3 + (variance / 50) * 0.7
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Action Items */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium">
                {filteredData.filter(c => c.riskLevel === 'critical' || c.riskLevel === 'high').length} clients 
                require immediate attention
              </span>
            </div>
            <Button size="sm" variant="outline">
              <Filter className="h-3 w-3 mr-1" />
              Generate Risk Report
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}