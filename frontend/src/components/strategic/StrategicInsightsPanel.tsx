import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { 
  AlertTriangle, 
  TrendingUp, 
  Lightbulb,
  Clock,
  Target,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  BarChart3,
  Users,
  DollarSign,
  Activity
} from 'lucide-react'

interface StrategicInsight {
  title: string
  description: string
  impact: 'High' | 'Medium' | 'Low'
  action: string
  timeline: string
}

interface StrategicTrend {
  title: string
  description: string
  confidence: number
}

interface StrategicInsightsData {
  critical: StrategicInsight[]
  opportunities: StrategicInsight[]
  trends: StrategicTrend[]
}

interface StrategicInsightsPanelProps {
  insights: StrategicInsightsData
  className?: string
}

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'High': return 'text-error bg-error/10 border-error/30'
    case 'Medium': return 'text-warning bg-warning/10 border-warning/30'
    case 'Low': return 'text-success bg-success/10 border-success/30'
    default: return 'text-muted-foreground bg-muted border-border'
  }
}

const impactIcons = {
  'High': AlertTriangle,
  'Medium': AlertCircle,
  'Low': CheckCircle
}

export default function StrategicInsightsPanel({ 
  insights,
  className 
}: StrategicInsightsPanelProps) {
  const [activeTab, setActiveTab] = useState('critical')
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null)

  if (!insights) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center space-y-2">
            <Lightbulb className="h-12 w-12 mx-auto opacity-50" />
            <p className="text-lg font-medium">No strategic insights available</p>
            <p className="text-sm">Insights will appear when analysis is complete</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const allInsights = [...insights.critical, ...insights.opportunities]
  const criticalCount = insights.critical.length
  const opportunityCount = insights.opportunities.length
  const highImpactCount = allInsights.filter(i => i.impact === 'High').length

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lightbulb className="h-5 w-5" />
            <CardTitle>Strategic Insights</CardTitle>
          </div>
          <Badge variant="outline">
            {allInsights.length} insights
          </Badge>
        </div>
        
        {/* Summary metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-error">{criticalCount}</div>
            <div className="text-xs text-muted-foreground">Critical Issues</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{opportunityCount}</div>
            <div className="text-xs text-muted-foreground">Opportunities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{highImpactCount}</div>
            <div className="text-xs text-muted-foreground">High Impact</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
            <TabsTrigger value="critical" className="flex items-center space-x-2 p-3">
              <AlertTriangle className="h-4 w-4" />
              <span>Critical</span>
              {criticalCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs px-2 py-1">
                  {criticalCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center space-x-2 p-3">
              <TrendingUp className="h-4 w-4" />
              <span>Opportunities</span>
              {opportunityCount > 0 && (
                <Badge variant="default" className="ml-1 text-xs px-2 py-1">
                  {opportunityCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center space-x-2 p-3">
              <BarChart3 className="h-4 w-4" />
              <span>Trends</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="critical" className="space-y-4">
            <div className="space-y-3">
              {insights.critical.map((insight, index) => {
                const isExpanded = expandedInsight === `critical-${index}`
                const ImpactIcon = impactIcons[insight.impact]
                
                return (
                  <Card 
                    key={index}
                    className="border-l-4 border-l-error cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setExpandedInsight(
                      isExpanded ? null : `critical-${index}`
                    )}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <ImpactIcon 
                                className={cn("h-4 w-4 mt-0.5 flex-shrink-0", 
                                  insight.impact === 'High' ? 'text-error' : 
                                  insight.impact === 'Medium' ? 'text-warning' : 'text-success'
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm leading-tight break-words mb-2">{insight.title}</h3>
                                <Badge 
                                  variant={insight.impact === 'High' ? 'destructive' : 
                                          insight.impact === 'Medium' ? 'secondary' : 'default'}
                                  className="text-xs px-2 py-1"
                                >
                                  {insight.impact} Impact
                                </Badge>
                              </div>
                            </div>
                            
                            <p className="text-sm text-neutral-600 leading-relaxed break-words">
                              {insight.description}
                            </p>
                          </div>

                          {isExpanded && (
                            <div className="space-y-3 border-t pt-3">
                              <div className="flex items-start space-x-3">
                                <Target className="h-4 w-4 mt-1 text-primary" />
                                <div>
                                  <div className="text-sm font-medium">Recommended Action</div>
                                  <div className="text-sm text-muted-foreground">{insight.action}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-start space-x-3">
                                <Clock className="h-4 w-4 mt-1 text-warning" />
                                <div>
                                  <div className="text-sm font-medium">Timeline</div>
                                  <div className="text-sm text-muted-foreground">{insight.timeline}</div>
                                </div>
                              </div>

                              <div className="flex space-x-2 pt-2">
                                <Button size="sm" variant="default">
                                  Take Action
                                </Button>
                                <Button size="sm" variant="outline">
                                  Schedule Review
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2 flex-shrink-0 mt-2 sm:mt-0">
                          <ArrowRight className={`h-4 w-4 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`} />
                          <div className="text-xs text-neutral-500 text-right whitespace-nowrap">
                            {insight.timeline}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {insights.critical.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
                  <p className="text-lg font-medium">No Critical Issues</p>
                  <p className="text-sm">All strategic metrics are within acceptable ranges</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="opportunities" className="space-y-4">
            <div className="space-y-3">
              {insights.opportunities.map((insight, index) => {
                const isExpanded = expandedInsight === `opportunity-${index}`
                const ImpactIcon = impactIcons[insight.impact]
                
                return (
                  <Card 
                    key={index}
                    className="border-l-4 border-l-success cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setExpandedInsight(
                      isExpanded ? null : `opportunity-${index}`
                    )}
                  >
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0 text-success" />
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm leading-tight break-words mb-2">{insight.title}</h3>
                                <Badge 
                                  variant={insight.impact === 'High' ? 'default' : 'secondary'}
                                  className="text-xs px-2 py-1"
                                >
                                  {insight.impact} Potential
                                </Badge>
                              </div>
                            </div>
                          </div>
                          
                            <p className="text-sm text-neutral-600 leading-relaxed break-words">
                              {insight.description}
                            </p>

                          {isExpanded && (
                            <div className="space-y-3 border-t pt-3">
                              <div className="flex items-start space-x-3">
                                <Zap className="h-4 w-4 mt-1 text-warning" />
                                <div>
                                  <div className="text-sm font-medium">Implementation Strategy</div>
                                  <div className="text-sm text-muted-foreground">{insight.action}</div>
                                </div>
                              </div>
                              
                              <div className="flex items-start space-x-3">
                                <Clock className="h-4 w-4 mt-1 text-primary" />
                                <div>
                                  <div className="text-sm font-medium">Expected Timeline</div>
                                  <div className="text-sm text-muted-foreground">{insight.timeline}</div>
                                </div>
                              </div>

                              <div className="flex space-x-2 pt-2">
                                <Button size="sm" variant="default">
                                  Explore Opportunity
                                </Button>
                                <Button size="sm" variant="outline">
                                  Add to Roadmap
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col items-end space-y-2 flex-shrink-0 mt-2 sm:mt-0">
                          <ArrowRight className={`h-4 w-4 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`} />
                          <div className="text-xs text-neutral-500 text-right whitespace-nowrap">
                            {insight.timeline}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
              
              {insights.opportunities.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No Opportunities Identified</p>
                  <p className="text-sm">Continue monitoring for emerging opportunities</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="space-y-4">
              {insights.trends.map((trend, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="h-4 w-4 text-primary" />
                        <h3 className="font-semibold">{trend.title}</h3>
                      </div>
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        {trend.confidence}% confidence
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">
                      {trend.description}
                    </p>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Confidence Level</span>
                        <span className="font-mono">{trend.confidence}%</span>
                      </div>
                      <Progress 
                        value={trend.confidence} 
                        className="h-2"
                      />
                      <div className="text-xs text-muted-foreground">
                        Based on historical patterns and market analysis
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {insights.trends.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No Trends Detected</p>
                  <p className="text-sm">Trend analysis requires more historical data</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Summary */}
        {allInsights.length > 0 && (
          <Card className="mt-6 bg-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold mb-1">Next Steps</h4>
                  <p className="text-sm text-muted-foreground">
                    {criticalCount > 0 
                      ? `Address ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} first`
                      : `Focus on ${opportunityCount} growth opportunity${opportunityCount > 1 ? 'ies' : 'y'}`
                    }
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="default">
                    Create Action Plan
                  </Button>
                  <Button size="sm" variant="outline">
                    Export Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}