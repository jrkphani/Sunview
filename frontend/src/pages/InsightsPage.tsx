import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Home, Info, Lightbulb, TrendingUp, Filter, RefreshCw, Settings, AlertTriangle } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import InsightCard from '@/components/insights/InsightCard'
import { InsightsDataTable, type InsightData } from '@/components/tables/InsightsDataTable'
import { insightService, type InsightCategory, type Priority, type InsightStatus } from '@/services/insightService'

export default function InsightsPage() {
  // Filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [selectedPriority, setSelectedPriority] = useState<string>('all')
  const [showOnlyNew, setShowOnlyNew] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch insights data with real-time updates
  const { data: allInsights, isLoading: insightsLoading, error: insightsError } = useQuery({
    queryKey: ['insights'],
    queryFn: () => insightService.getInsights({ limit: 100 }),
    refetchInterval: autoRefresh ? 10 * 60 * 1000 : false, // 10 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const { data: categorySummary, isLoading: categorySummaryLoading } = useQuery({
    queryKey: ['insights-category-summary'],
    queryFn: insightService.getCategorySummary,
    refetchInterval: autoRefresh ? 15 * 60 * 1000 : false, // 15 minutes
    retry: 3,
  })

  const { data: insightStatistics, isLoading: statisticsLoading } = useQuery({
    queryKey: ['insights-statistics'],
    queryFn: insightService.getInsightStatistics,
    refetchInterval: autoRefresh ? 10 * 60 * 1000 : false,
    retry: 3,
  })

  // Filter insights based on current filters
  const filteredInsights = useMemo(() => {
    if (!allInsights) return []
    
    return allInsights.filter(insight => {
      if (selectedCategory !== 'all' && insight.category !== selectedCategory) return false
      if (selectedStatus !== 'all' && insight.status !== selectedStatus) return false
      if (selectedPriority !== 'all' && insight.priority !== selectedPriority) return false
      if (showOnlyNew && insight.status !== 'new') return false
      return true
    })
  }, [allInsights, selectedCategory, selectedStatus, selectedPriority, showOnlyNew])

  // Convert insights to table format
  const insightsTableData: InsightData[] = useMemo(() => {
    return filteredInsights.map(insight => ({
      id: insight.id,
      title: insight.title,
      category: insight.category,
      impact: insight.impact_score,
      confidence: insight.confidence_score,
      description: insight.description,
      status: insight.status || 'new',
      created_date: new Date(insight.created_at).toISOString().split('T')[0],
      priority: insight.priority,
      estimated_savings: insight.estimated_savings
    }))
  }, [filteredInsights])

  // Get top insights for cards (highest impact)
  const topInsights = useMemo(() => {
    return filteredInsights
      .sort((a, b) => b.impact_score - a.impact_score)
      .slice(0, 4)
  }, [filteredInsights])

  // Loading and error states
  if (insightsError) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Insights</AlertTitle>
          <AlertDescription>
            Failed to load insights data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  // Get insight counts for display
  const newInsightsCount = useMemo(() => {
    return filteredInsights.filter(i => i.status === 'new').length
  }, [filteredInsights])

  const pendingReviewCount = useMemo(() => {
    return filteredInsights.filter(i => i.status === 'reviewed').length
  }, [filteredInsights])

  return (
    <div className="flex-1 space-y-6 p-6">
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
            <BreadcrumbPage>Strategic Insights</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Strategic Insights</h1>
          <p className="text-muted-foreground">
            AI-powered business insights from logistics data
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh-insights"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <label htmlFor="auto-refresh-insights" className="text-sm font-medium">
              Auto-refresh
            </label>
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh Insights
          </Button>
          <Badge variant="outline" className="flex items-center gap-1">
            <Lightbulb className="h-4 w-4" />
            {insightStatistics ? `${insightStatistics.new_insights} New Insights` : 
             insightsLoading ? 'Loading...' : `${newInsightsCount} New Insights`}
          </Badge>
        </div>
      </div>

      {/* System Status Alert */}
      {autoRefresh && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertTitle>Auto-refresh Enabled</AlertTitle>
          <AlertDescription>
            Insights will automatically update every 10 minutes. Last updated at {new Date().toLocaleTimeString()}.
          </AlertDescription>
        </Alert>
      )}

      {/* Insights Filtering */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="operational_efficiency">Operational Efficiency</SelectItem>
                  <SelectItem value="strategic_partnership">Strategic Partnership</SelectItem>
                  <SelectItem value="commercial_opportunity">Commercial Opportunity</SelectItem>
                  <SelectItem value="risk_management">Risk Management</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="implemented">Implemented</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="low">Low Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2 pt-6">
              <Checkbox 
                id="show-only-new" 
                checked={showOnlyNew}
                onCheckedChange={(checked) => setShowOnlyNew(checked === true)}
              />
              <label htmlFor="show-only-new" className="text-sm font-medium">
                Show Only New
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insight Alerts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Alert>
          <TrendingUp className="h-4 w-4" />
          <AlertTitle>High-Impact Opportunity Detected</AlertTitle>
          <AlertDescription>
            {topInsights.length > 0 && topInsights[0] ? (
              `New insight with ${topInsights[0].impact_score}/10 impact score identified. ${topInsights[0].title} ${topInsights[0].expected_benefit ? `could provide ${topInsights[0].expected_benefit}` : 'requires attention'}.`
            ) : insightStatistics ? (
              `${insightStatistics.total_insights} insights analyzed with average impact score of ${insightStatistics.avg_impact_score.toFixed(1)}/10. Potential monthly savings: $${insightStatistics.potential_monthly_savings.toLocaleString()}.`
            ) : (
              'Analyzing insights for high-impact opportunities..'
            )}
          </AlertDescription>
        </Alert>
        <Alert variant="warning">
          <Info className="h-4 w-4" />
          <AlertTitle>Insights Pending Review</AlertTitle>
          <AlertDescription>
            {insightStatistics ? 
              `${insightStatistics.new_insights} insights require review and ${insightStatistics.pending_review} are awaiting implementation.` :
              `${newInsightsCount} insights require review and ${pendingReviewCount} are awaiting implementation.`
            }
          </AlertDescription>
        </Alert>
      </div>

      {/* Top Insights Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {insightsLoading ? (
          // Loading skeleton for insight cards
          [1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : topInsights.length > 0 ? (
          topInsights.map((insight) => (
            <InsightCard
              key={insight.id}
              title={insight.title}
              category={insight.category}
              impact={insight.impact_score}
              confidence={insight.confidence_score}
              description={insight.description}
            />
          ))
        ) : (
          <div className="col-span-2 text-center py-12 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No insights available</p>
            <p className="text-sm">Check back later for AI-generated strategic insights</p>
          </div>
        )}
      </div>

      {/* Comprehensive Insights Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Strategic Insights</CardTitle>
          <p className="text-sm text-muted-foreground">
            Comprehensive list of AI-generated insights with status tracking and impact analysis
          </p>
        </CardHeader>
        <CardContent>
          {insightsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : insightsTableData.length > 0 ? (
            <InsightsDataTable data={insightsTableData} />
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>No insights match the current filters</p>
              <p className="text-sm">Try adjusting your filter criteria</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Insight Generation Process */}
      <Card>
        <CardHeader>
          <CardTitle>Insight Generation Process</CardTitle>
          <p className="text-sm text-muted-foreground">
            How insights are generated from your logistics data
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-insight-strategic/10 rounded-full flex items-center justify-center">
                <span className="text-insight-strategic font-semibold text-sm font-mono">1</span>
              </div>
              <div>
                <p className="font-medium">Data Analysis</p>
                <p className="text-sm text-muted-foreground">Process historical patterns and anomalies</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-insight-commercial/10 rounded-full flex items-center justify-center">
                <span className="text-insight-commercial font-semibold text-sm font-mono">2</span>
              </div>
              <div>
                <p className="font-medium">Pattern Recognition</p>
                <p className="text-sm text-muted-foreground">Identify optimization opportunities and risks</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-insight-operational/10 rounded-full flex items-center justify-center">
                <span className="text-insight-operational font-semibold text-sm font-mono">3</span>
              </div>
              <div>
                <p className="font-medium">Business Context</p>
                <p className="text-sm text-muted-foreground">Generate actionable recommendations with impact scoring</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}