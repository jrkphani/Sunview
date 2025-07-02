import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { 
  Lightbulb, 
  TrendingUp, 
  Target, 
  CheckCircle,
  Clock,
  DollarSign,
  BarChart3,
  ArrowRight,
  Star,
  Zap
} from 'lucide-react'

interface Recommendation {
  id: string
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  impact: 'high' | 'medium' | 'low'
  effort: 'low' | 'medium' | 'high'
  timeframe: string
  revenueImpact: number
  confidence: number
  category: string
  actionItems: string[]
  metrics: { name: string; current: string; target: string }[]
  dependencies?: string[]
  risks?: string[]
}

interface CommercialRecommendationsPanelProps {
  type: 'service-tiers' | 'premium-services' | 'client-volatility' | 'pricing-optimization'
  className?: string
}

const getRecommendations = (type: string): Recommendation[] => {
  switch (type) {
    case 'service-tiers':
      return [
        {
          id: 'st-001',
          title: 'Restructure Premium Express Tier',
          description: 'Critical margin leakage in Premium Express requiring immediate restructuring of cost model and service scope.',
          priority: 'critical',
          impact: 'high',
          effort: 'medium',
          timeframe: '2-3 months',
          revenueImpact: 450000,
          confidence: 89,
          category: 'Service Optimization',
          actionItems: [
            'Conduct cost analysis of Premium Express operations',
            'Renegotiate carrier partnerships for better rates',
            'Implement dynamic pricing based on demand',
            'Review and optimize delivery routes'
          ],
          metrics: [
            { name: 'Margin Leakage', current: '$450K', target: '$50K' },
            { name: 'Profit Margin', current: '-2.1%', target: '8.5%' },
            { name: 'Client Retention', current: '67%', target: '85%' }
          ],
          dependencies: ['Cost structure analysis', 'Carrier contract negotiations'],
          risks: ['Client churn during transition', 'Operational disruption']
        },
        {
          id: 'st-002',
          title: 'Introduce Tiered SLA Pricing',
          description: 'Implement differentiated pricing based on service level commitments to reduce breach frequency.',
          priority: 'high',
          impact: 'medium',
          effort: 'medium',
          timeframe: '4-6 weeks',
          revenueImpact: 280000,
          confidence: 76,
          category: 'Pricing Strategy',
          actionItems: [
            'Define SLA tiers with clear performance metrics',
            'Create pricing matrix for different commitment levels',
            'Develop client communication strategy',
            'Implement SLA monitoring dashboard'
          ],
          metrics: [
            { name: 'Breach Frequency', current: '23/month', target: '8/month' },
            { name: 'Premium Uptake', current: '0%', target: '35%' },
            { name: 'Average Revenue per Client', current: '$71K', target: '$89K' }
          ]
        },
        {
          id: 'st-003',
          title: 'Sunset Unprofitable Economy Pro',
          description: 'Phase out Economy Pro tier and migrate clients to Standard Plus or Basic Service.',
          priority: 'medium',
          impact: 'medium',
          effort: 'high',
          timeframe: '6-8 months',
          revenueImpact: 220000,
          confidence: 68,
          category: 'Portfolio Rationalization',
          actionItems: [
            'Analyze client migration scenarios',
            'Develop client retention strategy',
            'Create transition timeline and communication plan',
            'Monitor competitive response'
          ],
          metrics: [
            { name: 'Client Migration Rate', current: '0%', target: '90%' },
            { name: 'Revenue per Client', current: '$31K', target: '$42K' }
          ],
          risks: ['Client attrition', 'Competitive pressure']
        }
      ]

    case 'premium-services':
      return [
        {
          id: 'ps-001',
          title: 'Accelerate Express Premium Delivery Launch',
          description: 'Fast-track launch of Express Premium Delivery to capture first-mover advantage in same-day premium market.',
          priority: 'high',
          impact: 'high',
          effort: 'medium',
          timeframe: '2-3 months',
          revenueImpact: 1250000,
          confidence: 87,
          category: 'New Service Launch',
          actionItems: [
            'Finalize premium packaging partnerships',
            'Establish same-day delivery network',
            'Create premium customer experience journey',
            'Launch pilot program with key enterprise clients'
          ],
          metrics: [
            { name: 'Service Launch', current: '0%', target: '100%' },
            { name: 'Client Adoption', current: '0%', target: '23%' },
            { name: 'Revenue Target', current: '$0', target: '$2.1M' }
          ]
        },
        {
          id: 'ps-002',
          title: 'Scale White Glove Service Operations',
          description: 'Expand White Glove service capacity to meet growing demand in luxury and high-value shipments.',
          priority: 'high',
          impact: 'high',
          effort: 'low',
          timeframe: '1-2 months',
          revenueImpact: 930000,
          confidence: 79,
          category: 'Capacity Expansion',
          actionItems: [
            'Hire and train certified technicians',
            'Establish regional White Glove centers',
            'Create specialized handling equipment inventory',
            'Develop partnerships with luxury brands'
          ],
          metrics: [
            { name: 'Service Capacity', current: '180 orders/month', target: '500 orders/month' },
            { name: 'Technician Team', current: '12', target: '35' },
            { name: 'Margin', current: '60%', target: '65%' }
          ]
        },
        {
          id: 'ps-003',
          title: 'Develop Carbon-Neutral Service Package',
          description: 'Create comprehensive eco-friendly logistics solution to meet growing ESG requirements.',
          priority: 'medium',
          impact: 'medium',
          effort: 'high',
          timeframe: '4-6 months',
          revenueImpact: 710000,
          confidence: 71,
          category: 'ESG Initiative',
          actionItems: [
            'Partner with carbon offset providers',
            'Develop sustainability reporting dashboard',
            'Create green certification program',
            'Launch ESG-focused marketing campaign'
          ],
          metrics: [
            { name: 'Carbon Offset Partnerships', current: '0', target: '3' },
            { name: 'ESG Client Adoption', current: '8%', target: '35%' },
            { name: 'Premium for Green Service', current: '0%', target: '15%' }
          ]
        }
      ]

    case 'client-volatility':
      return [
        {
          id: 'cv-001',
          title: 'Implement Dynamic Risk Pricing',
          description: 'Introduce volatility-based pricing adjustments to protect margins from high-risk clients.',
          priority: 'critical',
          impact: 'high',
          effort: 'medium',
          timeframe: '6-8 weeks',
          revenueImpact: 380000,
          confidence: 85,
          category: 'Risk Management',
          actionItems: [
            'Develop volatility scoring algorithm',
            'Create dynamic pricing engine',
            'Implement real-time risk monitoring',
            'Train sales team on risk-based pricing'
          ],
          metrics: [
            { name: 'Risk-Adjusted Margin', current: '12.3%', target: '18.7%' },
            { name: 'High-Risk Client Profitability', current: '-5.2%', target: '8.1%' },
            { name: 'Forecast Accuracy', current: '67%', target: '82%' }
          ]
        },
        {
          id: 'cv-002',
          title: 'Establish Client Stability Program',
          description: 'Create incentive program to reward clients with stable, predictable demand patterns.',
          priority: 'high',
          impact: 'medium',
          effort: 'low',
          timeframe: '4-6 weeks',
          revenueImpact: 290000,
          confidence: 78,
          category: 'Client Retention',
          actionItems: [
            'Design stability reward structure',
            'Create predictable demand incentives',
            'Develop long-term contract options',
            'Launch client stability dashboard'
          ],
          metrics: [
            { name: 'Stable Client Ratio', current: '45%', target: '70%' },
            { name: 'Demand Predictability', current: '62%', target: '85%' },
            { name: 'Client Retention', current: '78%', target: '92%' }
          ]
        },
        {
          id: 'cv-003',
          title: 'Deploy Predictive Analytics Platform',
          description: 'Implement advanced analytics to predict client volatility and proactively manage risk.',
          priority: 'medium',
          impact: 'high',
          effort: 'high',
          timeframe: '3-4 months',
          revenueImpact: 520000,
          confidence: 73,
          category: 'Technology Investment',
          actionItems: [
            'Select predictive analytics platform',
            'Integrate client data sources',
            'Train data science team',
            'Develop early warning system'
          ],
          metrics: [
            { name: 'Prediction Accuracy', current: '65%', target: '88%' },
            { name: 'Early Warning Coverage', current: '0%', target: '95%' },
            { name: 'Risk Mitigation', current: '23%', target: '67%' }
          ]
        }
      ]

    case 'pricing-optimization':
      return [
        {
          id: 'po-001',
          title: 'Implement Dynamic Pricing Engine',
          description: 'Deploy AI-powered pricing optimization to maximize revenue across all service tiers.',
          priority: 'high',
          impact: 'high',
          effort: 'high',
          timeframe: '4-6 months',
          revenueImpact: 890000,
          confidence: 82,
          category: 'Technology Investment',
          actionItems: [
            'Select dynamic pricing platform',
            'Integrate market data feeds',
            'Develop pricing algorithms',
            'Create A/B testing framework'
          ],
          metrics: [
            { name: 'Revenue Optimization', current: '0%', target: '12.3%' },
            { name: 'Price Response Time', current: '72 hours', target: '15 minutes' },
            { name: 'Competitive Positioning', current: '67%', target: '85%' }
          ]
        },
        {
          id: 'po-002',
          title: 'Launch Premium Service Price Testing',
          description: 'Test premium pricing strategies for high-value services with low price elasticity.',
          priority: 'high',
          impact: 'medium',
          effort: 'low',
          timeframe: '2-3 weeks',
          revenueImpact: 340000,
          confidence: 89,
          category: 'Price Testing',
          actionItems: [
            'Design premium pricing test matrix',
            'Select test client segments',
            'Implement price testing infrastructure',
            'Monitor client response metrics'
          ],
          metrics: [
            { name: 'Premium Price Acceptance', current: '0%', target: '65%' },
            { name: 'Revenue per Premium Client', current: '$89K', target: '$127K' },
            { name: 'Client Churn Risk', current: 'Unknown', target: '<5%' }
          ]
        },
        {
          id: 'po-003',
          title: 'Optimize Cost-Plus Pricing Model',
          description: 'Refine cost-plus pricing methodology to ensure appropriate margin targets across services.',
          priority: 'medium',
          impact: 'medium',
          effort: 'medium',
          timeframe: '6-8 weeks',
          revenueImpact: 450000,
          confidence: 75,
          category: 'Pricing Strategy',
          actionItems: [
            'Conduct comprehensive cost analysis',
            'Benchmark industry margin standards',
            'Develop cost allocation methodology',
            'Create margin monitoring dashboard'
          ],
          metrics: [
            { name: 'Cost Accuracy', current: '78%', target: '94%' },
            { name: 'Margin Consistency', current: '62%', target: '87%' },
            { name: 'Pricing Transparency', current: '45%', target: '82%' }
          ]
        }
      ]

    default:
      return []
  }
}

export default function CommercialRecommendationsPanel({ 
  type, 
  className 
}: CommercialRecommendationsPanelProps) {
  const recommendations = getRecommendations(type)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-error bg-error/10 border-error/30'
      case 'high': return 'text-forecast-medium bg-forecast-medium/10 border-forecast-medium/30'
      case 'medium': return 'text-warning bg-warning/10 border-warning/30'
      case 'low': return 'text-success bg-success/10 border-success/30'
      default: return 'text-muted-foreground bg-muted border-border'
    }
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <TrendingUp className="h-4 w-4 text-success" />
      case 'medium': return <BarChart3 className="h-4 w-4 text-warning" />
      case 'low': return <Target className="h-4 w-4 text-muted-foreground" />
      default: return <BarChart3 className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-success'
      case 'medium': return 'text-warning'
      case 'high': return 'text-error'
      default: return 'text-muted-foreground'
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

  const getTypeTitle = (type: string) => {
    switch (type) {
      case 'service-tiers': return 'Service Tier Optimization'
      case 'premium-services': return 'Premium Service Opportunities'
      case 'client-volatility': return 'Client Risk Management'
      case 'pricing-optimization': return 'Pricing Strategy'
      default: return 'Commercial Recommendations'
    }
  }

  const totalImpact = recommendations.reduce((sum, rec) => sum + rec.revenueImpact, 0)
  const avgConfidence = recommendations.reduce((sum, rec) => sum + rec.confidence, 0) / recommendations.length

  return (
    <Card className={cn("h-fit", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-warning" />
            <CardTitle className="text-base">{getTypeTitle(type)}</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {recommendations.length} Recommendations
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Summary Metrics */}
        <div className="p-3 bg-muted/30 rounded-lg space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total Revenue Impact:</span>
            <span className="font-bold text-success">{formatCurrency(totalImpact)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Average Confidence:</span>
            <span className="font-semibold">{avgConfidence.toFixed(0)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Critical Actions:</span>
            <span className="font-semibold text-error">
              {recommendations.filter(r => r.priority === 'critical').length}
            </span>
          </div>
        </div>

        {/* Recommendations List */}
        <div className="space-y-3">
          {recommendations.map((rec) => (
            <div key={rec.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow space-y-3">
              <div className="space-y-4">
                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm leading-tight">{rec.title}</h4>
                        {getImpactIcon(rec.impact)}
                      </div>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs flex-shrink-0", getPriorityColor(rec.priority))}
                    >
                      {rec.priority.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed break-words">{rec.description}</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Revenue Impact</div>
                    <div className="font-semibold text-success">{formatCurrency(rec.revenueImpact)}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Timeframe</div>
                    <div className="font-medium">{rec.timeframe}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Effort</div>
                    <div className={cn("font-medium", getEffortColor(rec.effort))}>
                      {rec.effort.charAt(0).toUpperCase() + rec.effort.slice(1)}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-muted-foreground">Confidence</div>
                    <div className="font-semibold">{rec.confidence}%</div>
                  </div>
                </div>

                {/* Confidence Progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Implementation Confidence</span>
                    <span className="font-medium">{rec.confidence}%</span>
                  </div>
                  <Progress value={rec.confidence} className="h-1" />
                </div>

                {/* Key Metrics */}
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-muted-foreground">Key Metrics</h5>
                  <div className="space-y-1">
                    {rec.metrics.slice(0, 2).map((metric, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{metric.name}:</span>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">{metric.current}</span>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                          <span className="font-semibold text-success">{metric.target}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Items Preview */}
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Next Actions ({rec.actionItems.length})
                  </h5>
                  <ul className="space-y-1">
                    {rec.actionItems.slice(0, 2).map((action, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                        <div className="w-1 h-1 bg-muted-foreground rounded-full mt-1.5 flex-shrink-0" />
                        {action}
                      </li>
                    ))}
                    {rec.actionItems.length > 2 && (
                      <li className="text-xs text-muted-foreground">
                        +{rec.actionItems.length - 2} more actions...
                      </li>
                    )}
                  </ul>
                </div>

                {/* Risks & Dependencies */}
                {(rec.risks || rec.dependencies) && (
                  <div className="grid grid-cols-1 gap-2">
                    {rec.dependencies && (
                      <div className="text-xs">
                        <span className="text-muted-foreground font-medium">Dependencies: </span>
                        <span className="text-muted-foreground">{rec.dependencies.join(', ')}</span>
                      </div>
                    )}
                    {rec.risks && (
                      <div className="text-xs">
                        <span className="text-warning font-medium">Risks: </span>
                        <span className="text-muted-foreground">{rec.risks.join(', ')}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <Button size="sm" variant="outline" className="w-full text-xs">
                  <Zap className="h-3 w-3 mr-1" />
                  View Implementation Plan
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Actions */}
        <div className="pt-3 border-t space-y-2">
          <Button size="sm" className="w-full">
            <Star className="h-3 w-3 mr-1" />
            Prioritize All Recommendations
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant="outline">
              <DollarSign className="h-3 w-3 mr-1" />
              ROI Analysis
            </Button>
            <Button size="sm" variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              Timeline View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}