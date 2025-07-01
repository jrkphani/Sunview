import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb'
import { TrendingUp, Truck, Target, AlertTriangle, DollarSign, Home, Info, Settings, RefreshCw } from 'lucide-react'
import { kpiService } from '@/services/kpiService'
import { forecastService } from '@/services/forecastService'
import { systemService } from '@/services/systemService'
import { insightService } from '@/services/insightService'
import KPICard from '@/components/dashboard/KPICard'
import ForecastChart from '@/components/charts/ForecastChart'
import KPIBarChart from '@/components/charts/KPIBarChart'
import InsightCard from '@/components/insights/InsightCard'
import { KPIDataTable, type KPIData } from '@/components/tables/KPIDataTable'

export default function DashboardPage() {
  // Dashboard control state
  const [refreshInterval, setRefreshInterval] = useState<string>('5m')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [compactView, setCompactView] = useState(false)
  // Fetch dashboard data with proper error handling and refetch intervals
  const { data: kpiData, isLoading: kpiLoading, error: kpiError } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: kpiService.getDashboardKPIs,
    refetchInterval: autoRefresh ? (parseInt(refreshInterval.replace('m', '')) * 60 * 1000) : false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const { data: businessImpact, isLoading: businessImpactLoading } = useQuery({
    queryKey: ['business-impact'],
    queryFn: systemService.getBusinessImpactMetrics,
    refetchInterval: autoRefresh ? (parseInt(refreshInterval.replace('m', '')) * 60 * 1000) : false,
    retry: 3,
  })

  const { data: volumeData, isLoading: volumeLoading } = useQuery({
    queryKey: ['volume-forecasts', '7d'],
    queryFn: () => forecastService.getVolumeForecasts('7d'),
    refetchInterval: autoRefresh ? (parseInt(refreshInterval.replace('m', '')) * 60 * 1000) : false,
    retry: 3,
  })

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['dashboard-insights'],
    queryFn: () => insightService.getInsights({ limit: 3, priority: 'high' }),
    refetchInterval: autoRefresh ? (parseInt(refreshInterval.replace('m', '')) * 60 * 1000) : false,
    retry: 3,
  })

  const { data: systemStatus, isLoading: systemStatusLoading } = useQuery({
    queryKey: ['system-status'],
    queryFn: systemService.getSystemStatus,
    refetchInterval: autoRefresh ? 30000 : false, // System status updates every 30 seconds
    retry: 3,
  })

  const { data: kpiTableData, isLoading: kpiTableLoading } = useQuery({
    queryKey: ['kpi-trends-table'],
    queryFn: async () => {
      // Fetch multiple KPI trends for table display
      const [accuracy, utilization, costSavings, demandAccuracy] = await Promise.all([
        kpiService.getKPITrends('forecast_accuracy', '30d'),
        kpiService.getKPITrends('truck_utilization_improvement', '30d'),
        kpiService.getKPITrends('cost_savings_percentage', '30d'),
        kpiService.getKPITrends('demand_prediction_accuracy', '30d')
      ])
      
      return [
        {
          id: '1',
          metric: 'Forecast Accuracy',
          current_value: accuracy.values[accuracy.values.length - 1]?.value || 0,
          previous_value: accuracy.values[accuracy.values.length - 2]?.value || 0,
          unit: '%',
          category: 'accuracy' as const,
          trend: accuracy.trend_direction as 'up' | 'down' | 'stable',
          change_percentage: accuracy.improvement_percentage,
          target: accuracy.values[accuracy.values.length - 1]?.target || 90,
          status: (accuracy.values[accuracy.values.length - 1]?.value || 0) >= 85 ? 'good' as const : 'warning' as const
        },
        {
          id: '2',
          metric: 'Truck Utilization Improvement',
          current_value: utilization.values[utilization.values.length - 1]?.value || 0,
          previous_value: utilization.values[utilization.values.length - 2]?.value || 0,
          unit: '%',
          category: 'efficiency' as const,
          trend: utilization.trend_direction as 'up' | 'down' | 'stable',
          change_percentage: utilization.improvement_percentage,
          target: utilization.values[utilization.values.length - 1]?.target || 15,
          status: (utilization.values[utilization.values.length - 1]?.value || 0) >= 10 ? 'good' as const : 'warning' as const
        },
        {
          id: '3',
          metric: 'Cost Savings',
          current_value: costSavings.values[costSavings.values.length - 1]?.value || 0,
          previous_value: costSavings.values[costSavings.values.length - 2]?.value || 0,
          unit: '%',
          category: 'cost' as const,
          trend: costSavings.trend_direction as 'up' | 'down' | 'stable',
          change_percentage: costSavings.improvement_percentage,
          target: costSavings.values[costSavings.values.length - 1]?.target || 20,
          status: (costSavings.values[costSavings.values.length - 1]?.value || 0) >= 12 ? 'good' as const : 'warning' as const
        },
        {
          id: '4',
          metric: 'Demand Prediction Accuracy',
          current_value: demandAccuracy.values[demandAccuracy.values.length - 1]?.value || 0,
          previous_value: demandAccuracy.values[demandAccuracy.values.length - 2]?.value || 0,
          unit: '%',
          category: 'accuracy' as const,
          trend: demandAccuracy.trend_direction as 'up' | 'down' | 'stable',
          change_percentage: demandAccuracy.improvement_percentage,
          target: demandAccuracy.values[demandAccuracy.values.length - 1]?.target || 92,
          status: (demandAccuracy.values[demandAccuracy.values.length - 1]?.value || 0) >= 87 ? 'good' as const : 'warning' as const
        }
      ] as KPIData[]
    },
    refetchInterval: autoRefresh ? (parseInt(refreshInterval.replace('m', '')) * 60 * 1000) : false,
    retry: 3,
    enabled: !!kpiData, // Only fetch after basic KPI data is loaded
  })

  // Create KPI bar chart data from API responses
  const kpiBarData = kpiData && kpiTableData ? [
    {
      name: 'Forecast Accuracy',
      current: kpiData.forecast_accuracy,
      target: 90,
      previous: kpiTableData.find(k => k.metric === 'Forecast Accuracy')?.previous_value || 0,
      category: 'accuracy',
      unit: '%',
      status: kpiData.forecast_accuracy >= 85 ? 'good' as const : 'warning' as const
    },
    {
      name: 'Truck Utilization',
      current: kpiData.truck_utilization_improvement,
      target: 15,
      previous: kpiTableData.find(k => k.metric === 'Truck Utilization Improvement')?.previous_value || 0,
      category: 'efficiency',
      unit: '%',
      status: kpiData.truck_utilization_improvement >= 10 ? 'good' as const : 'warning' as const
    },
    {
      name: 'Cost Savings',
      current: kpiData.cost_savings_percentage,
      target: 20,
      previous: kpiTableData.find(k => k.metric === 'Cost Savings')?.previous_value || 0,
      category: 'cost',
      unit: '%',
      status: kpiData.cost_savings_percentage >= 12 ? 'good' as const : 'warning' as const
    },
    {
      name: 'Demand Accuracy',
      current: kpiData.demand_prediction_accuracy,
      target: 92,
      previous: kpiTableData.find(k => k.metric === 'Demand Prediction Accuracy')?.previous_value || 0,
      category: 'accuracy',
      unit: '%',
      status: kpiData.demand_prediction_accuracy >= 87 ? 'good' as const : 'warning' as const
    }
  ] : []

  // Loading state check
  const isLoading = kpiLoading || businessImpactLoading || volumeLoading || insightsLoading
  
  // Error handling
  if (kpiError) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Dashboard</AlertTitle>
          <AlertDescription>
            Failed to load dashboard data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1" style={{ gap: 'var(--spacing-6)', padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column' }}>
        {/* Breadcrumb Navigation */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/" className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">GXO Signify Forecasting Dashboard</h1>
            <p className="text-muted-foreground">
              Real-time logistics insights powered by machine learning
            </p>
          </div>
          <Skeleton className="h-10 w-32" />
        </header>

        {/* Loading KPI Cards */}
        <section>
          <div className="grid md:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--spacing-4)' }}>
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Loading Charts */}
        <section>
          <div className="grid lg:grid-cols-3" style={{ gap: 'var(--spacing-6)' }}>
            <Card className="lg:col-span-2">
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-64" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-72 w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-between items-center">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    )
  }

  return (
    <main className="flex-1" style={{ gap: 'var(--spacing-6)', padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column' }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              Home
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Dashboard</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">GXO Signify Forecasting Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time logistics insights powered by machine learning
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh-dashboard"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <label htmlFor="auto-refresh-dashboard" className="text-sm font-medium">
              Auto-refresh
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="compact-view"
              checked={compactView}
              onCheckedChange={setCompactView}
            />
            <label htmlFor="compact-view" className="text-sm font-medium">
              Compact
            </label>
          </div>
          <Select value={refreshInterval} onValueChange={setRefreshInterval}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1m">1 minute</SelectItem>
              <SelectItem value="5m">5 minutes</SelectItem>
              <SelectItem value="15m">15 minutes</SelectItem>
              <SelectItem value="30m">30 minutes</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Badge variant="outline" className="text-sm" role="status" aria-label={`Dashboard last updated at ${new Date().toLocaleTimeString()}`}>
            Last updated: {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </header>

      {/* Dashboard Settings Alert */}
      {autoRefresh && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertTitle>Auto-refresh Active</AlertTitle>
          <AlertDescription>
            Dashboard data refreshes every {refreshInterval.replace('m', ' minutes')}. {compactView ? 'Compact view enabled.' : 'Full view enabled.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Key Performance Indicators */}
      <section aria-labelledby="kpi-section-title">
        <h2 id="kpi-section-title" className="sr-only">Key Performance Indicators</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--spacing-4)' }}>
        {kpiData && kpiTableData ? (
          <>
            <KPICard
              title="Forecast Accuracy"
              value={`${kpiData.forecast_accuracy.toFixed(1)}%`}
              icon={Target}
              trend={kpiTableData.find(k => k.metric === 'Forecast Accuracy')?.trend || 'stable'}
              change={`${kpiTableData.find(k => k.metric === 'Forecast Accuracy')?.change_percentage > 0 ? '+' : ''}${kpiTableData.find(k => k.metric === 'Forecast Accuracy')?.change_percentage.toFixed(1)}%`}
              severity={kpiData.forecast_accuracy >= 85 ? 'success' : 'warning'}
              description="ML model prediction accuracy"
            />
            
            <KPICard
              title="Truck Utilization"
              value={`${kpiData.truck_utilization_improvement.toFixed(1)}%`}
              icon={Truck}
              trend={kpiTableData.find(k => k.metric === 'Truck Utilization Improvement')?.trend || 'stable'}
              change={`${kpiTableData.find(k => k.metric === 'Truck Utilization Improvement')?.change_percentage > 0 ? '+' : ''}${kpiTableData.find(k => k.metric === 'Truck Utilization Improvement')?.change_percentage.toFixed(1)}%`}
              severity={kpiData.truck_utilization_improvement >= 10 ? 'success' : 'warning'}
              description="Improvement vs baseline"
            />
            
            <KPICard
              title="Cost Savings"
              value={`${kpiData.cost_savings_percentage.toFixed(1)}%`}
              icon={DollarSign}
              trend={kpiTableData.find(k => k.metric === 'Cost Savings')?.trend || 'stable'}
              change={`${kpiTableData.find(k => k.metric === 'Cost Savings')?.change_percentage > 0 ? '+' : ''}${kpiTableData.find(k => k.metric === 'Cost Savings')?.change_percentage.toFixed(1)}%`}
              severity={kpiData.cost_savings_percentage >= 12 ? 'success' : 'warning'}
              description="Monthly cost reduction"
            />
            
            <KPICard
              title="Demand Accuracy"
              value={`${kpiData.demand_prediction_accuracy.toFixed(1)}%`}
              icon={TrendingUp}
              trend={kpiTableData.find(k => k.metric === 'Demand Prediction Accuracy')?.trend || 'stable'}
              change={`${kpiTableData.find(k => k.metric === 'Demand Prediction Accuracy')?.change_percentage > 0 ? '+' : ''}${kpiTableData.find(k => k.metric === 'Demand Prediction Accuracy')?.change_percentage.toFixed(1)}%`}
              severity={kpiData.demand_prediction_accuracy >= 87 ? 'success' : 'info'}
              description="SKU-level prediction accuracy"
            />
          </>
        ) : (
          // Loading skeleton for KPI cards
          <>  
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-20" />
                </CardContent>
              </Card>
            ))}
          </>
        )}
        </div>
      </section>

      {/* Charts and Insights Grid */}
      <section aria-labelledby="charts-section-title">
        <h2 id="charts-section-title" className="sr-only">Charts and Insights</h2>
        <div className="grid lg:grid-cols-3" style={{ gap: 'var(--spacing-6)' }}>
        {/* Volume Forecast Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>7-Day Volume Forecast</CardTitle>
            <p className="text-sm text-muted-foreground">
              Predicted daily volume with confidence intervals
            </p>
          </CardHeader>
          <CardContent>
            <ForecastChart data={volumeData || []} height={300} />
          </CardContent>
        </Card>

        {/* Business Impact Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Business Impact</CardTitle>
          </CardHeader>
          <CardContent style={{ gap: 'var(--spacing-4)', display: 'flex', flexDirection: 'column' }}>
            {businessImpact ? (
              <>
                <div style={{ gap: 'var(--spacing-2)', display: 'flex', flexDirection: 'column' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monthly Savings</span>
                    <span className="text-sm font-bold font-mono tabular-nums">
                      ${businessImpact.financial_impact.monthly_cost_savings.toLocaleString()}
                    </span>
                  </div>
                  <Progress 
                    value={(businessImpact.financial_impact.monthly_cost_savings / 60000) * 100} 
                    className="h-2" 
                    aria-label={`Monthly savings progress: ${((businessImpact.financial_impact.monthly_cost_savings / 60000) * 100).toFixed(0)}%`} 
                  />
                </div>
                
                <div style={{ gap: 'var(--spacing-2)', display: 'flex', flexDirection: 'column' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Delivery Time</span>
                    <span className="text-sm font-bold font-mono tabular-nums">
                      -{businessImpact.operational_impact.delivery_time_improvement_days.toFixed(1)} days
                    </span>
                  </div>
                  <Progress 
                    value={(businessImpact.operational_impact.delivery_time_improvement_days / 4) * 100} 
                    className="h-2" 
                    aria-label={`Delivery time improvement progress: ${((businessImpact.operational_impact.delivery_time_improvement_days / 4) * 100).toFixed(0)}%`} 
                  />
                </div>
                
                <div style={{ gap: 'var(--spacing-2)', display: 'flex', flexDirection: 'column' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Inventory Reduction</span>
                    <span className="text-sm font-bold font-mono tabular-nums">
                      {businessImpact.operational_impact.inventory_reduction_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress 
                    value={businessImpact.operational_impact.inventory_reduction_percentage * 4} 
                    className="h-2" 
                    aria-label={`Inventory reduction progress: ${(businessImpact.operational_impact.inventory_reduction_percentage * 4).toFixed(0)}%`} 
                  />
                </div>
                
                <div style={{ gap: 'var(--spacing-2)', display: 'flex', flexDirection: 'column' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Customer Satisfaction</span>
                    <span className="text-sm font-bold font-mono tabular-nums">
                      {businessImpact.customer_impact.satisfaction_score.toFixed(1)}/5.0
                    </span>
                  </div>
                  <Progress 
                    value={(businessImpact.customer_impact.satisfaction_score / 5) * 100} 
                    className="h-2" 
                    aria-label={`Customer satisfaction progress: ${((businessImpact.customer_impact.satisfaction_score / 5) * 100).toFixed(0)}%`} 
                  />
                </div>
              </>
            ) : (
              // Loading skeleton for business impact
              <>
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} style={{ gap: 'var(--spacing-2)', display: 'flex', flexDirection: 'column' }}>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </section>

      {/* KPI Performance Chart */}
      <section aria-labelledby="kpi-chart-section-title">
        <Card>
          <CardHeader>
            <CardTitle id="kpi-chart-section-title" className="flex items-center gap-2">
              <Target className="h-5 w-5" aria-hidden="true" />
              KPI Performance vs Targets
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Current performance compared to targets and previous values
            </p>
          </CardHeader>
          <CardContent>
            {kpiBarData.length > 0 ? (
              <KPIBarChart data={kpiBarData} height={350} />
            ) : (
              <Skeleton className="h-80 w-full" />
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recent Insights */}
      <section aria-labelledby="insights-section-title">
        <h2 id="insights-section-title" className="sr-only">Recent Insights</h2>
        <div className="grid lg:grid-cols-2" style={{ gap: 'var(--spacing-6)' }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <TrendingUp className="h-5 w-5" aria-hidden="true" />
              Top Strategic Insights
            </CardTitle>
          </CardHeader>
          <CardContent style={{ gap: 'var(--spacing-4)', display: 'flex', flexDirection: 'column' }}>
            {insights && insights.length > 0 ? (
              insights.slice(0, 3).map((insight, index) => (
                <div key={insight.id}>
                  <InsightCard
                    title={insight.title}
                    category={insight.category}
                    impact={insight.impact_score}
                    confidence={insight.confidence_score}
                    description={insight.description}
                    compact
                  />
                  {index < Math.min(insights.length, 3) - 1 && <Separator />}
                </div>
              ))
            ) : insightsLoading ? (
              // Loading skeleton for insights
              <>
                {[1, 2, 3].map((i, index) => (
                  <div key={i}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-12" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                    </div>
                    {index < 2 && <Separator />}
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No strategic insights available</p>
                <p className="text-sm">Check back later for AI-generated recommendations</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              System Status & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent style={{ gap: 'var(--spacing-4)', display: 'flex', flexDirection: 'column' }}>
            {systemStatus && systemStatus.length > 0 ? (
              systemStatus.slice(0, 3).map((status) => {
                const statusColor = {
                  operational: 'success',
                  degraded: 'warning',
                  maintenance: 'secondary',
                  error: 'destructive'
                }[status.status] || 'secondary'
                
                const statusBg = {
                  operational: 'border-success/20 bg-success/10',
                  degraded: 'border-warning/20 bg-warning/10',
                  maintenance: 'border-secondary/20 bg-secondary/10',
                  error: 'border-destructive/20 bg-destructive/10'
                }[status.status] || 'border-secondary/20 bg-secondary/10'
                
                return (
                  <div key={status.service_name} className={`flex items-center justify-between rounded-lg border ${statusBg}`} style={{ padding: 'var(--spacing-3)' }}>
                    <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                      <div className={`w-2 h-2 bg-${statusColor} rounded-full`} role="status" aria-label={`${status.status} status`}></div>
                      <span className="text-sm font-medium">{status.service_name}</span>
                    </div>
                    <Badge variant="outline" className={`text-${statusColor} border-${statusColor}/30`} role="status">
                      {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                    </Badge>
                  </div>
                )
              })
            ) : systemStatusLoading ? (
              // Loading skeleton for system status
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border" style={{ padding: 'var(--spacing-3)' }}>
                    <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
                      <Skeleton className="w-2 h-2 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                ))}
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>System status unavailable</p>
              </div>
            )}
            
            <div className="rounded-lg border border-primary/20 bg-primary/10" style={{ marginTop: 'var(--spacing-4)', padding: 'var(--spacing-3)' }}>
              <div className="text-sm font-medium text-primary font-mono" style={{ marginBottom: 'var(--spacing-1)' }}>Data Freshness</div>
              <div className="text-sm text-primary/80 font-mono tabular-nums">
                Last update: {kpiData ? new Date(kpiData.report_date).toLocaleString() : new Date().toLocaleString()}
              </div>
              <div className="text-xs text-primary/70 font-mono" style={{ marginTop: 'var(--spacing-1)' }}>
                Next scheduled update in {autoRefresh ? refreshInterval.replace('m', ' minutes') : 'manual mode'}
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </section>

      {/* System Alerts */}
      <section aria-labelledby="alerts-section-title">
        <h2 id="alerts-section-title" className="sr-only">System Alerts</h2>
        <div className="grid lg:grid-cols-2" style={{ gap: 'var(--spacing-4)' }}>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Model Performance Update</AlertTitle>
            <AlertDescription>
              Forecast accuracy has improved by 2.1% this week. The model is adapting well to recent demand patterns.
            </AlertDescription>
          </Alert>
          <Alert variant="warning">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Weekend Accuracy Monitoring</AlertTitle>
            <AlertDescription>
              Weekend forecasts showing higher variance. System is monitoring performance closely.
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Detailed KPI Metrics */}
      <section aria-labelledby="detailed-kpi-section-title">
        <Card>
          <CardHeader>
            <CardTitle id="detailed-kpi-section-title">Detailed KPI Metrics</CardTitle>
            <p className="text-sm text-muted-foreground">
              Comprehensive performance metrics with historical trends and targets
            </p>
          </CardHeader>
          <CardContent>
            {kpiTableData && kpiTableData.length > 0 ? (
              <KPIDataTable data={kpiTableData} />
            ) : kpiTableLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No KPI data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Quick Actions */}
      <section aria-labelledby="actions-section-title">
        <Card>
          <CardHeader>
            <CardTitle id="actions-section-title">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4" style={{ gap: 'var(--spacing-4)' }}>
              <button 
                className="text-left border rounded-lg hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                style={{ padding: 'var(--spacing-4)' }}
                aria-label="Generate comprehensive KPI report"
              >
                <div className="text-sm font-medium">Generate Report</div>
                <div className="text-xs text-muted-foreground">Export comprehensive KPI report</div>
              </button>
              
              <button 
                className="text-left border rounded-lg hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                style={{ padding: 'var(--spacing-4)' }}
                aria-label="Trigger new forecast generation"
              >
                <div className="text-sm font-medium">Refresh Forecasts</div>
                <div className="text-xs text-muted-foreground">Trigger new forecast generation</div>
              </button>
              
              <button 
                className="text-left border rounded-lg hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                style={{ padding: 'var(--spacing-4)' }}
                aria-label="Check detected anomalies"
              >
                <div className="text-sm font-medium">View Anomalies</div>
                <div className="text-xs text-muted-foreground">Check detected anomalies</div>
              </button>
              
              <button 
                className="text-left border rounded-lg hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                style={{ padding: 'var(--spacing-4)' }}
                aria-label="Configure alerts and thresholds"
              >
                <div className="text-sm font-medium">Settings</div>
                <div className="text-xs text-muted-foreground">Configure alerts and thresholds</div>
              </button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}