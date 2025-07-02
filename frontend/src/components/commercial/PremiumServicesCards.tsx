import { Line, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  TrendingUp, 
  Star, 
  Target, 
  DollarSign,
  ArrowUpRight,
  Users,
  Zap
} from 'lucide-react'

interface TrendData {
  month: string
  value: number
  forecast?: number
}

interface PremiumService {
  id: string
  name: string
  description: string
  currentRevenue: number
  potentialRevenue: number
  adoptionRate: number
  marketSize: number
  competitiveAdvantage: string
  timeToMarket: string
  confidenceScore: number
  trendData: TrendData[]
  opportunity: 'high' | 'medium' | 'low'
  rationale: string[]
  targetClients: string[]
}

interface PremiumServicesCardsProps {
  className?: string
}

const mockServices: PremiumService[] = [
  {
    id: 'express-premium',
    name: 'Express Premium Delivery',
    description: 'Same-day delivery service with real-time tracking and premium packaging',
    currentRevenue: 850000,
    potentialRevenue: 2100000,
    adoptionRate: 23,
    marketSize: 8500000,
    competitiveAdvantage: 'First-mover advantage in premium logistics',
    timeToMarket: '3 months',
    confidenceScore: 87,
    trendData: [
      { month: 'Jan', value: 450000, forecast: 520000 },
      { month: 'Feb', value: 520000, forecast: 580000 },
      { month: 'Mar', value: 680000, forecast: 720000 },
      { month: 'Apr', value: 750000, forecast: 850000 },
      { month: 'May', value: 820000, forecast: 980000 },
      { month: 'Jun', value: 850000, forecast: 1100000 }
    ],
    opportunity: 'high',
    rationale: [
      'Growing demand for expedited delivery in premium segment',
      'High margin potential with 40%+ profit margins',
      'Limited competition in same-day premium market',
      'Strong client interest from enterprise customers'
    ],
    targetClients: ['Tech Companies', 'Healthcare', 'Financial Services']
  },
  {
    id: 'white-glove',
    name: 'White Glove Service',
    description: 'Personalized handling and setup services for high-value shipments',
    currentRevenue: 320000,
    potentialRevenue: 1250000,
    adoptionRate: 12,
    marketSize: 4200000,
    competitiveAdvantage: 'Specialized expertise and certified technicians',
    timeToMarket: '2 months',
    confidenceScore: 79,
    trendData: [
      { month: 'Jan', value: 180000, forecast: 220000 },
      { month: 'Feb', value: 210000, forecast: 280000 },
      { month: 'Mar', value: 250000, forecast: 350000 },
      { month: 'Apr', value: 280000, forecast: 420000 },
      { month: 'May', value: 300000, forecast: 520000 },
      { month: 'Jun', value: 320000, forecast: 650000 }
    ],
    opportunity: 'high',
    rationale: [
      'Premium pricing model with 60%+ margins',
      'Growing luxury goods and electronics market',
      'Strong ROI with minimal infrastructure investment',
      'High client retention and repeat business'
    ],
    targetClients: ['Luxury Brands', 'Electronics', 'Art & Collectibles']
  },
  {
    id: 'green-logistics',
    name: 'Carbon-Neutral Logistics',
    description: 'Eco-friendly shipping with carbon offset and sustainability reporting',
    currentRevenue: 180000,
    potentialRevenue: 890000,
    adoptionRate: 8,
    marketSize: 3100000,
    competitiveAdvantage: 'ESG compliance and sustainability expertise',
    timeToMarket: '4 months',
    confidenceScore: 71,
    trendData: [
      { month: 'Jan', value: 95000, forecast: 120000 },
      { month: 'Feb', value: 110000, forecast: 150000 },
      { month: 'Mar', value: 135000, forecast: 200000 },
      { month: 'Apr', value: 155000, forecast: 280000 },
      { month: 'May', value: 165000, forecast: 380000 },
      { month: 'Jun', value: 180000, forecast: 520000 }
    ],
    opportunity: 'medium',
    rationale: [
      'Growing ESG requirements from corporate clients',
      'Government incentives for sustainable logistics',
      'Differentiation from traditional carriers',
      'Premium pricing for sustainability services'
    ],
    targetClients: ['Manufacturing', 'Retail Chains', 'Government']
  },
  {
    id: 'ai-optimization',
    name: 'AI-Powered Route Optimization',
    description: 'Machine learning-driven logistics optimization and predictive analytics',
    currentRevenue: 120000,
    potentialRevenue: 650000,
    adoptionRate: 5,
    marketSize: 2800000,
    competitiveAdvantage: 'Proprietary AI algorithms and data insights',
    timeToMarket: '6 months',
    confidenceScore: 68,
    trendData: [
      { month: 'Jan', value: 45000, forecast: 65000 },
      { month: 'Feb', value: 65000, forecast: 95000 },
      { month: 'Mar', value: 85000, forecast: 140000 },
      { month: 'Apr', value: 95000, forecast: 200000 },
      { month: 'May', value: 110000, forecast: 290000 },
      { month: 'Jun', value: 120000, forecast: 420000 }
    ],
    opportunity: 'medium',
    rationale: [
      'High-tech differentiator in competitive market',
      'Scalable software-based solution',
      'Cost reduction benefits for clients',
      'Recurring revenue model potential'
    ],
    targetClients: ['E-commerce', 'Distribution Centers', 'Supply Chain Mgmt']
  }
]

export default function PremiumServicesCards({ className }: PremiumServicesCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getOpportunityColor = (opportunity: string) => {
    switch (opportunity) {
      case 'high': return 'text-green-600 bg-green-100 border-green-300'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-300'
      case 'low': return 'text-gray-600 bg-gray-100 border-gray-300'
      default: return 'text-gray-600 bg-gray-100 border-gray-300'
    }
  }

  const getConfidenceIcon = (score: number) => {
    if (score >= 80) return <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
    if (score >= 70) return <TrendingUp className="h-4 w-4 text-blue-500" />
    return <Target className="h-4 w-4 text-gray-500" />
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Suggested Premium Services</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          {mockServices.length} Opportunities Identified
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {mockServices.map((service) => (
          <Card key={service.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {service.name}
                    {getConfidenceIcon(service.confidenceScore)}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={cn("text-xs font-medium", getOpportunityColor(service.opportunity))}
                >
                  {service.opportunity.toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Revenue Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Current Revenue</div>
                  <div className="text-lg font-bold">{formatCurrency(service.currentRevenue)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Potential Revenue</div>
                  <div className="text-lg font-bold text-green-600">{formatCurrency(service.potentialRevenue)}</div>
                </div>
              </div>

              {/* Trend Sparkline */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Revenue Trend & Forecast</span>
                  <span className="text-xs font-medium text-green-600">
                    +{((service.potentialRevenue / service.currentRevenue - 1) * 100).toFixed(0)}% Growth Potential
                  </span>
                </div>
                <div className="h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={service.trendData}>
                      <defs>
                        <linearGradient id={`gradient-${service.id}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill={`url(#gradient-${service.id})`}
                      />
                      <Line
                        type="monotone"
                        dataKey="forecast"
                        stroke="#10b981"
                        strokeWidth={2}
                        strokeDasharray="3 3"
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Adoption</div>
                  <div className="text-sm font-semibold">{service.adoptionRate}%</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Confidence</div>
                  <div className="text-sm font-semibold text-blue-600">{service.confidenceScore}%</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Time to Market</div>
                  <div className="text-sm font-semibold">{service.timeToMarket}</div>
                </div>
              </div>

              {/* Opportunity Rationale */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  Why This Opportunity
                </h4>
                <ul className="space-y-1">
                  {service.rationale.slice(0, 2).map((reason, index) => (
                    <li key={index} className="text-xs text-muted-foreground flex items-start gap-1">
                      <ArrowUpRight className="h-3 w-3 mt-0.5 text-green-500 flex-shrink-0" />
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Target Clients */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  Target Segments
                </h4>
                <div className="flex flex-wrap gap-1">
                  {service.targetClients.map((client, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {client}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <Button size="sm" className="w-full mt-4" variant="outline">
                <DollarSign className="h-3 w-3 mr-1" />
                Explore Revenue Impact
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-r from-primary/10 to-success/10 border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-semibold">Total Premium Opportunity</h4>
              <p className="text-sm text-neutral-600">
                Combined revenue potential from all identified opportunities
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-success">
                {formatCurrency(mockServices.reduce((sum, service) => sum + service.potentialRevenue, 0))}
              </div>
              <div className="text-xs text-neutral-600">
                vs {formatCurrency(mockServices.reduce((sum, service) => sum + service.currentRevenue, 0))} current
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}