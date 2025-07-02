import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { MockDataIndicator, useDataSourceStatus } from '@/components/ui/mock-data-indicator'
import { 
  TrendingUp, 
  DollarSign, 
  AlertTriangle, 
  Target, 
  BarChart3,
  PieChart,
  LineChart,
  Calculator
} from 'lucide-react'

import ServiceTierParetoChart from './ServiceTierParetoChart'
import PremiumServicesCards from './PremiumServicesCards'
import ClientVolatilityHeatmap from './ClientVolatilityHeatmap'
import PricingOptimizationScatter from './PricingOptimizationScatter'
import CommercialRecommendationsPanel from './CommercialRecommendationsPanel'
import RevenueImpactCalculator from './RevenueImpactCalculator'

interface CommercialMetrics {
  totalRevenue: number
  revenueGrowth: number
  marginLeakage: number
  pricingOpportunities: number
  riskClients: number
  premiumOpportunities: number
}

interface CommercialInsightsSectionProps {
  className?: string
  metrics?: CommercialMetrics
}

const defaultMetrics: CommercialMetrics = {
  totalRevenue: 24500000,
  revenueGrowth: 8.3,
  marginLeakage: 1200000,
  pricingOpportunities: 15,
  riskClients: 8,
  premiumOpportunities: 12
}

export default function CommercialInsightsSection({ 
  className,
  metrics = defaultMetrics 
}: CommercialInsightsSectionProps) {
  
  // Data source status for MockDataIndicator
  const { isApiConnected, isLoading, isMockData } = useDataSourceStatus()
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Data Source Indicator */}
      <div className="flex items-center gap-3 mb-4">
        <MockDataIndicator 
          isLoading={isLoading} 
          isMockData={isMockData} 
          dataSource={isApiConnected ? 'api' : 'mock'} 
          variant="badge" 
          showDetails={true}
        />
      </div>
      
      {/* Commercial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.totalRevenue)}</div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-success" />
              <span className="text-success font-medium">{formatPercent(metrics.revenueGrowth)}</span>
              vs last period
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margin Leakage</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-error">{formatCurrency(metrics.marginLeakage)}</div>
            <div className="flex items-center gap-1 text-xs">
              <Badge variant="destructive" className="text-xs">Critical</Badge>
              <span className="text-muted-foreground">requires attention</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pricing Opportunities</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{metrics.pricingOpportunities}</div>
            <div className="flex items-center gap-1 text-xs">
              <Badge variant="secondary" className="text-xs">Active</Badge>
              <span className="text-muted-foreground">optimization targets</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Clients</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{metrics.riskClients}</div>
            <div className="flex items-center gap-1 text-xs">
              <Badge variant="outline" className="text-xs border-warning text-warning">Monitor</Badge>
              <span className="text-muted-foreground">volatility alerts</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Premium Services</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{metrics.premiumOpportunities}</div>
            <div className="flex items-center gap-1 text-xs">
              <Badge variant="outline" className="text-xs border-success text-success">Growth</Badge>
              <span className="text-muted-foreground">expansion ready</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimization Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-insight-commercial">73%</div>
            <div className="flex items-center gap-1 text-xs">
              <Badge variant="outline" className="text-xs border-insight-commercial text-insight-commercial">Good</Badge>
              <span className="text-muted-foreground">improvement potential</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="service-tiers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="service-tiers" className="flex items-center gap-2 p-3">
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Service Tiers</span>
            <span className="sm:hidden">Tiers</span>
          </TabsTrigger>
          <TabsTrigger value="premium-services" className="flex items-center gap-2 p-3">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Premium Services</span>
            <span className="sm:hidden">Premium</span>
          </TabsTrigger>
          <TabsTrigger value="client-volatility" className="flex items-center gap-2 p-3">
            <LineChart className="h-4 w-4" />
            <span className="hidden sm:inline">Client Volatility</span>
            <span className="sm:hidden">Volatility</span>
          </TabsTrigger>
          <TabsTrigger value="pricing-optimization" className="flex items-center gap-2 p-3">
            <Target className="h-4 w-4" />
            <span className="hidden sm:inline">Pricing</span>
            <span className="sm:hidden">Price</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="service-tiers" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <ServiceTierParetoChart />
            </div>
            <div className="xl:col-span-1">
              <CommercialRecommendationsPanel type="service-tiers" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="premium-services" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <PremiumServicesCards />
            </div>
            <div className="xl:col-span-1">
              <CommercialRecommendationsPanel type="premium-services" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="client-volatility" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <ClientVolatilityHeatmap />
            </div>
            <div className="xl:col-span-1">
              <CommercialRecommendationsPanel type="client-volatility" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pricing-optimization" className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <PricingOptimizationScatter />
            </div>
            <div className="xl:col-span-1">
              <CommercialRecommendationsPanel type="pricing-optimization" />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Revenue Impact Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Revenue Impact Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <RevenueImpactCalculator />
        </CardContent>
      </Card>
    </div>
  )
}