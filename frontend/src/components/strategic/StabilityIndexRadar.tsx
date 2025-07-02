import React, { useState, useMemo } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { 
  Radar as RadarIcon, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3
} from 'lucide-react'

interface StabilityMetric {
  metric: string
  value: number
  target: number
  trend: 'up' | 'down'
}

interface StabilitySiteData {
  site: string
  metrics: StabilityMetric[]
}

interface StabilityIndexRadarProps {
  data: StabilitySiteData[]
  height?: number
  compact?: boolean
  className?: string
}

const metricColors = [
  'hsl(210, 70%, 50%)', // Blue
  'hsl(120, 70%, 50%)', // Green
  'hsl(30, 70%, 50%)',  // Orange
  'hsl(280, 70%, 50%)', // Purple
  'hsl(0, 70%, 50%)',   // Red
  'hsl(60, 70%, 50%)'   // Yellow
]

const stabilityThresholds = {
  excellent: 90,
  good: 80,
  fair: 70,
  poor: 60
}

export default function StabilityIndexRadar({ 
  data = [], 
  height = 400,
  compact = false,
  className 
}: StabilityIndexRadarProps) {
  const [selectedSites, setSelectedSites] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<string>('radar')
  const [comparisonMode, setComparisonMode] = useState<string>('all')

  // Initialize selected sites
  React.useEffect(() => {
    if (data.length > 0 && selectedSites.length === 0) {
      setSelectedSites(data.slice(0, 3).map(site => site.site))
    }
  }, [data, selectedSites.length])

  // Get all unique metrics
  const allMetrics = useMemo(() => {
    if (!data.length) return []
    return data[0].metrics.map(m => m.metric)
  }, [data])

  // Process data for radar chart
  const radarData = useMemo(() => {
    if (!allMetrics.length) return []

    return allMetrics.map(metric => {
      const dataPoint: any = { metric }
      
      selectedSites.forEach(siteName => {
        const site = data.find(s => s.site === siteName)
        const metricData = site?.metrics.find(m => m.metric === metric)
        dataPoint[siteName] = metricData?.value || 0
        dataPoint[`${siteName}_target`] = metricData?.target || 85
      })

      return dataPoint
    })
  }, [allMetrics, selectedSites, data])

  // Calculate stability scores
  const stabilityScores = useMemo(() => {
    return data.map(site => {
      const metrics = site.metrics
      const avgScore = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length
      const targetGap = metrics.reduce((sum, m) => sum + Math.max(0, m.target - m.value), 0) / metrics.length
      
      const improvingMetrics = metrics.filter(m => m.trend === 'up').length
      const decliningMetrics = metrics.filter(m => m.trend === 'down').length
      
      return {
        site: site.site,
        overallScore: avgScore,
        category: getStabilityCategory(avgScore),
        targetGap,
        improvingMetrics,
        decliningMetrics,
        totalMetrics: metrics.length,
        metrics: metrics.map(m => ({
          ...m,
          performanceGap: m.value - m.target,
          category: getStabilityCategory(m.value)
        }))
      }
    })
  }, [data])

  // Process data for trend analysis
  const trendData = useMemo(() => {
    // Simulate historical data for trend analysis
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    
    return months.map(month => {
      const dataPoint: any = { month }
      
      selectedSites.forEach(siteName => {
        const site = data.find(s => s.site === siteName)
        if (site) {
          // Simulate trend - add some variation around current value
          const currentScore = site.metrics.reduce((sum, m) => sum + m.value, 0) / site.metrics.length
          const variation = (Math.random() - 0.5) * 10
          dataPoint[siteName] = Math.max(0, Math.min(100, currentScore + variation))
        }
      })
      
      return dataPoint
    })
  }, [selectedSites, data])

  const chartConfig = selectedSites.reduce((config, site, index) => {
    config[site] = {
      label: site,
      color: metricColors[index % metricColors.length],
    }
    return config
  }, {} as ChartConfig)

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center space-y-2">
            <RadarIcon className="h-12 w-12 mx-auto opacity-50" />
            <p className="text-lg font-medium">No stability data available</p>
            <p className="text-sm">Stability index radar will appear when data is loaded</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {!compact && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Forecast Stability Index</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={viewMode} onValueChange={setViewMode}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="radar">Radar View</SelectItem>
                  <SelectItem value="trends">Trends</SelectItem>
                  <SelectItem value="comparison">Comparison</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Site Selection */}
          <div className="flex flex-wrap gap-2">
            {data.map(site => (
              <Badge
                key={site.site}
                variant={selectedSites.includes(site.site) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => {
                  setSelectedSites(prev => 
                    prev.includes(site.site)
                      ? prev.filter(s => s !== site.site)
                      : [...prev, site.site]
                  )
                }}
              >
                {site.site}
              </Badge>
            ))}
          </div>
        </CardHeader>
      )}
      
      <CardContent>
        <Tabs value={viewMode} onValueChange={setViewMode} className="space-y-4">
          <TabsContent value="radar" className="space-y-4">
            <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
              <RadarChart data={radarData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <PolarGrid 
                  stroke="hsl(var(--border))" 
                  strokeOpacity={0.3}
                />
                
                <PolarAngleAxis 
                  dataKey="metric" 
                  className="text-xs"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                />
                
                <PolarRadiusAxis 
                  angle={90} 
                  domain={[0, 100]} 
                  className="text-xs"
                  tick={{ fontSize: 8, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value}%`}
                />
                
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    formatter={(value, name, props) => {
                      const siteName = name as string
                      const metricName = props.payload.metric
                      const target = props.payload[`${siteName}_target`]
                      
                      return [
                        <div key="stability-details" className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span>{siteName}:</span>
                            <span className="font-mono font-bold">{value}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Target:</span>
                            <span className="font-mono">{target}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span>Gap:</span>
                            <span className={`font-mono ${
                              (value as number) >= target ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {((value as number) - target).toFixed(1)}%
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground border-t pt-2">
                            {metricName}
                          </div>
                        </div>,
                        ''
                      ]
                    }}
                  />}
                />
                
                {/* Target reference area */}
                <Radar
                  name="Target"
                  dataKey={() => 85}
                  stroke="hsl(var(--muted-foreground))"
                  fill="hsl(var(--muted-foreground))"
                  fillOpacity={0.1}
                  strokeDasharray="3 3"
                />
                
                {/* Site data */}
                {selectedSites.map((siteName, index) => (
                  <Radar
                    key={siteName}
                    name={siteName}
                    dataKey={siteName}
                    stroke={metricColors[index % metricColors.length]}
                    fill={metricColors[index % metricColors.length]}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                ))}
                
                <Legend />
              </RadarChart>
            </ChartContainer>

            {/* Stability Scores Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {stabilityScores
                .filter(score => selectedSites.includes(score.site))
                .map(score => (
                  <Card key={score.site}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-sm truncate flex-1 mr-2">{score.site}</h3>
                        <div className="flex items-center space-x-1 flex-shrink-0">
                          {score.category === 'excellent' ? (
                            <CheckCircle className="h-4 w-4 text-success" />
                          ) : score.category === 'good' ? (
                            <Target className="h-4 w-4 text-primary" />
                          ) : score.category === 'fair' ? (
                            <AlertTriangle className="h-4 w-4 text-warning" />
                          ) : (
                            <XCircle className="h-4 w-4 text-error" />
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="space-y-1">
                            <div className="text-muted-foreground">Overall Score</div>
                            <div className="font-mono font-bold text-sm">{score.overallScore.toFixed(1)}%</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-muted-foreground">Target Gap</div>
                            <div className={`font-mono text-sm font-semibold ${
                              score.targetGap <= 5 ? 'text-success' : 'text-error'
                            }`}>
                              {score.targetGap.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Improving</span>
                          <span className="font-mono text-sm font-semibold text-success">
                            {score.improvingMetrics}/{score.totalMetrics}
                          </span>
                        </div>
                        
                        <Badge 
                          variant={
                            score.category === 'excellent' || score.category === 'good' 
                              ? 'default' : 'destructive'
                          }
                          className="w-full justify-center text-xs px-2 py-1"
                        >
                          {score.category.charAt(0).toUpperCase() + score.category.slice(1)}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              }
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
              <LineChart data={trendData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                
                <XAxis 
                  dataKey="month" 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                
                <YAxis 
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${value}%`}
                  domain={[60, 100]}
                />
                
                <ChartTooltip content={<ChartTooltipContent />} />
                
                {selectedSites.map((siteName, index) => (
                  <Line
                    key={siteName}
                    type="monotone"
                    dataKey={siteName}
                    stroke={metricColors[index % metricColors.length]}
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <div className="space-y-6">
              {/* Metric Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Metric Performance Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allMetrics.map(metric => {
                      const metricData = selectedSites.map(siteName => {
                        const site = data.find(s => s.site === siteName)
                        const metricInfo = site?.metrics.find(m => m.metric === metric)
                        return {
                          site: siteName,
                          value: metricInfo?.value || 0,
                          target: metricInfo?.target || 85,
                          trend: metricInfo?.trend || 'down'
                        }
                      }).sort((a, b) => b.value - a.value)

                      return (
                        <div key={metric} className="p-4 border rounded-lg">
                          <h4 className="font-medium mb-3">{metric}</h4>
                          <div className="space-y-2">
                            {metricData.map((site, index) => (
                              <div key={site.site} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className="flex items-center space-x-2">
                                    <div className="text-sm font-medium">#{index + 1}</div>
                                    <span>{site.site}</span>
                                  </div>
                                  {site.trend === 'up' ? (
                                    <TrendingUp className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <TrendingDown className="h-4 w-4 text-red-500" />
                                  )}
                                </div>
                                
                                <div className="text-right">
                                  <div className={`font-mono font-bold ${
                                    site.value >= site.target ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    {site.value.toFixed(1)}%
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    Target: {site.target}%
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Performance Rankings */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Performance Rankings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {stabilityScores
                      .sort((a, b) => b.overallScore - a.overallScore)
                      .map((score, index) => (
                        <div 
                          key={score.site}
                          className="flex items-center justify-between p-3 rounded-lg border"
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`
                              w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                              ${index === 0 ? 'bg-yellow-100 text-yellow-800' : 
                                index === 1 ? 'bg-gray-100 text-gray-800' : 
                                index === 2 ? 'bg-orange-100 text-orange-800' : 
                                'bg-gray-50 text-gray-600'}
                            `}>
                              {index + 1}
                            </div>
                            <div>
                              <div className="font-medium">{score.site}</div>
                              <div className="text-sm text-muted-foreground">
                                {score.improvingMetrics} of {score.totalMetrics} metrics improving
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold">{score.overallScore.toFixed(1)}%</div>
                            <Badge 
                              variant={
                                score.category === 'excellent' || score.category === 'good' 
                                  ? 'default' : 'destructive'
                              }
                            >
                              {score.category}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Helper function to categorize stability scores
function getStabilityCategory(score: number): string {
  if (score >= stabilityThresholds.excellent) return 'excellent'
  if (score >= stabilityThresholds.good) return 'good'
  if (score >= stabilityThresholds.fair) return 'fair'
  return 'poor'
}