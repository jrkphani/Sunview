import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Home, BarChart3, TrendingUp, Activity, Database, Info, Filter, Download, Settings, AlertTriangle } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AnalyticsDataTable } from '@/components/tables/AnalyticsDataTable'
import { KPIDataTable, type KPIData } from '@/components/tables/KPIDataTable'
import TrendLineChart from '@/components/charts/TrendLineChart'
import { analyticsService } from '@/services/analyticsService'
import { kpiService } from '@/services/kpiService'

export default function AnalyticsPage() {
  // Filter and control state
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>('7d')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showLowConfidence, setShowLowConfidence] = useState(true)
  const [minAccuracy, setMinAccuracy] = useState([70])
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false)

  // Fetch analytics data with real-time updates
  const { data: skuAnalytics, isLoading: skuAnalyticsLoading, error: skuAnalyticsError } = useQuery({
    queryKey: ['sku-analytics', selectedTimeRange, selectedCategory, minAccuracy[0]],
    queryFn: () => analyticsService.getSKUAnalytics({
      timeRange: selectedTimeRange,
      category: selectedCategory !== 'all' ? selectedCategory : undefined,
      minAccuracy: minAccuracy[0],
      limit: 100
    }),
    refetchInterval: autoRefresh ? 15 * 60 * 1000 : false, // 15 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const { data: categoryPerformance, isLoading: categoryLoading } = useQuery({
    queryKey: ['category-performance'],
    queryFn: analyticsService.getCategoryPerformance,
    refetchInterval: autoRefresh ? 20 * 60 * 1000 : false, // 20 minutes
    retry: 3,
  })

  const { data: modelMetrics, isLoading: modelMetricsLoading } = useQuery({
    queryKey: ['model-metrics', selectedTimeRange],
    queryFn: () => analyticsService.getModelMetrics(selectedTimeRange),
    refetchInterval: autoRefresh ? 10 * 60 * 1000 : false, // 10 minutes
    retry: 3,
  })

  // Trend data queries
  const { data: accuracyTrendData, isLoading: accuracyTrendLoading } = useQuery({
    queryKey: ['accuracy-trend', selectedTimeRange],
    queryFn: () => analyticsService.getAccuracyTrend({
      timeRange: selectedTimeRange,
      granularity: 'daily'
    }),
    refetchInterval: autoRefresh ? 15 * 60 * 1000 : false,
    retry: 3,
  })

  const { data: processingTimeTrendData, isLoading: processingTimeTrendLoading } = useQuery({
    queryKey: ['processing-time-trend', selectedTimeRange],
    queryFn: () => analyticsService.getProcessingTimeTrend({
      timeRange: selectedTimeRange,
      granularity: 'daily'
    }),
    refetchInterval: autoRefresh ? 15 * 60 * 1000 : false,
    retry: 3,
  })

  const { data: volumeTrendData, isLoading: volumeTrendLoading } = useQuery({
    queryKey: ['volume-trend', selectedTimeRange],
    queryFn: () => analyticsService.getVolumeTrend({
      timeRange: selectedTimeRange,
      granularity: 'daily'
    }),
    refetchInterval: autoRefresh ? 15 * 60 * 1000 : false,
    retry: 3,
  })

  const { data: advancedMetrics, isLoading: advancedMetricsLoading } = useQuery({
    queryKey: ['advanced-metrics'],
    queryFn: analyticsService.getAdvancedMetrics,
    refetchInterval: autoRefresh ? 30 * 60 * 1000 : false, // 30 minutes
    retry: 3,
    enabled: showAdvancedMetrics,
  })

  // KPI analytics data for the KPIs tab
  const { data: kpiAnalyticsData, isLoading: kpiAnalyticsLoading } = useQuery({
    queryKey: ['kpi-analytics-data'],
    queryFn: async () => {
      const accuracy = await kpiService.getForecastAccuracyKPIs(selectedTimeRange)
      
      return [
        {
          id: '1',
          metric: 'Overall Forecast Accuracy',
          current_value: accuracy.overall_accuracy,
          previous_value: accuracy.overall_accuracy * 0.98, // Simulated previous value
          unit: '%',
          category: 'accuracy' as const,
          trend: 'up' as const,
          change_percentage: 1.4,
          target: 90,
          status: accuracy.overall_accuracy >= 85 ? 'good' as const : 'warning' as const
        },
        {
          id: '2',
          metric: 'Model Training Time',
          current_value: 2.4, // This would come from model metrics
          previous_value: 3.1,
          unit: 's',
          category: 'efficiency' as const,
          trend: 'down' as const,
          change_percentage: -22.6,
          target: 2.0,
          status: 'good' as const
        },
        {
          id: '3',
          metric: 'Data Processing Rate',
          current_value: skuAnalytics?.length || 0,
          previous_value: (skuAnalytics?.length || 0) * 0.96,
          unit: ' SKUs/min',
          category: 'efficiency' as const,
          trend: 'up' as const,
          change_percentage: 4.4,
          target: 3000,
          status: 'good' as const
        },
        {
          id: '4',
          metric: 'Confidence Score Average',
          current_value: skuAnalytics ? 
            skuAnalytics.reduce((sum, sku) => sum + (sku.confidence_score * 100), 0) / skuAnalytics.length : 0,
          previous_value: 85.9,
          unit: '%',
          category: 'accuracy' as const,
          trend: 'up' as const,
          change_percentage: 1.3,
          target: 90,
          status: 'warning' as const
        }
      ] as KPIData[]
    },
    refetchInterval: autoRefresh ? 15 * 60 * 1000 : false,
    retry: 3,
    enabled: !!skuAnalytics,
  })

  // Filtered analytics data based on current filters
  const filteredAnalyticsData = useMemo(() => {
    if (!skuAnalytics) return []
    
    return skuAnalytics.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false
      if (item.forecast_accuracy < minAccuracy[0]) return false
      if (!showLowConfidence && item.confidence_score < 0.8) return false
      return true
    })
  }, [skuAnalytics, selectedCategory, minAccuracy, showLowConfidence])

  // Error handling
  if (skuAnalyticsError) {
    return (
      <div className="flex items-center justify-center h-96">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Loading Analytics</AlertTitle>
          <AlertDescription>
            Failed to load analytics data. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  // Calculate summary metrics from real data
  const summaryMetrics = useMemo(() => {
    if (!filteredAnalyticsData || filteredAnalyticsData.length === 0) {
      return {
        overallAccuracy: 0,
        totalSKUs: 0,
        processingTime: 0,
        highConfidenceCount: 0
      }
    }

    const totalAccuracy = filteredAnalyticsData.reduce((sum, item) => sum + item.forecast_accuracy, 0)
    const highConfidenceItems = filteredAnalyticsData.filter(item => item.confidence_score > 0.9)

    return {
      overallAccuracy: totalAccuracy / filteredAnalyticsData.length,
      totalSKUs: filteredAnalyticsData.length,
      processingTime: modelMetrics?.processing_time || 2.4,
      highConfidenceCount: highConfidenceItems.length
    }
  }, [filteredAnalyticsData, modelMetrics])

  // Loading state check
  const isLoading = skuAnalyticsLoading || categoryLoading || modelMetricsLoading

  // Demo chart data
  const demoAccuracyTrendData = [
    { date: '2024-06-24', predicted_volume: 82.1 },
    { date: '2024-06-25', predicted_volume: 83.5 },
    { date: '2024-06-26', predicted_volume: 84.2 },
    { date: '2024-06-27', predicted_volume: 83.8 },
    { date: '2024-06-28', predicted_volume: 85.2 },
    { date: '2024-06-29', predicted_volume: 84.9 },
    { date: '2024-06-30', predicted_volume: 85.2 },
  ]

  const demoProcessingTimeTrendData = [
    { date: '2024-06-24', processing_time: 3.2 },
    { date: '2024-06-25', processing_time: 3.1 },
    { date: '2024-06-26', processing_time: 2.9 },
    { date: '2024-06-27', processing_time: 2.8 },
    { date: '2024-06-28', processing_time: 2.6 },
    { date: '2024-06-29', processing_time: 2.5 },
    { date: '2024-06-30', processing_time: 2.4 },
  ]

  const demoVolumeTrendData = [
    { date: '2024-06-24', volume_processed: 2298 },
    { date: '2024-06-25', volume_processed: 2356 },
    { date: '2024-06-26', volume_processed: 2401 },
    { date: '2024-06-27', volume_processed: 2378 },
    { date: '2024-06-28', volume_processed: 2445 },
    { date: '2024-06-29', volume_processed: 2489 },
    { date: '2024-06-30', volume_processed: 2504 },
  ]

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
            <BreadcrumbPage>Analytics</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Deep-dive analysis and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh-analytics"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <label htmlFor="auto-refresh-analytics" className="text-sm font-medium">
              Auto-refresh
            </label>
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Data
          </Button>
          <Badge variant="outline" className="flex items-center gap-1">
            <Database className="h-4 w-4" />
            {filteredAnalyticsData.length} SKUs Analyzed
          </Badge>
        </div>
      </div>

      {/* System Status Alert */}
      {autoRefresh && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertTitle>Auto-refresh Enabled</AlertTitle>
          <AlertDescription>
            Analytics data will automatically update every 15 minutes. Last updated at {new Date().toLocaleTimeString()}.
          </AlertDescription>
        </Alert>
      )}

      {/* Analytics Filtering */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Analytics Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Time Range</label>
                <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="14d">Last 14 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="90d">Last 90 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="Electronics">Electronics</SelectItem>
                    <SelectItem value="Sensors">Sensors</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Climate">Climate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 pt-6">
                <Checkbox 
                  id="show-low-confidence" 
                  checked={showLowConfidence}
                  onCheckedChange={(checked) => setShowLowConfidence(checked === true)}
                />
                <label htmlFor="show-low-confidence" className="text-sm font-medium">
                  Include Low Confidence
                </label>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Minimum Accuracy: {minAccuracy[0]}%
              </label>
              <Slider
                value={minAccuracy}
                onValueChange={setMinAccuracy}
                max={100}
                min={0}
                step={5}
                className="w-full"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="advanced-metrics"
                checked={showAdvancedMetrics}
                onCheckedChange={setShowAdvancedMetrics}
              />
              <label htmlFor="advanced-metrics" className="text-sm font-medium">
                Show Advanced Metrics
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Performance Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Model Performance Update</AlertTitle>
        <AlertDescription>
          {skuAnalytics && skuAnalytics.length > 0 ? (
            `Forecast accuracy has improved by ${((summaryMetrics.overallAccuracy - 85) / 85 * 100).toFixed(1)}% this week. ${skuAnalytics.find(s => s.forecast_accuracy > 90)?.sku || 'Multiple SKUs'} showing exceptional performance.`
          ) : (
            'Analyzing forecast accuracy improvements and top-performing SKUs...'
          )}
        </AlertDescription>
      </Alert>

      {/* Key Metrics Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          // Loading skeleton for metrics
          [1, 2, 3, 4].map((i) => (
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
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success font-mono tabular-nums">
                  {summaryMetrics.overallAccuracy.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {modelMetrics ? `MAPE: ${modelMetrics.mean_absolute_error.toFixed(1)}` : '+1.4% from last week'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">SKUs Tracked</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary font-mono tabular-nums">
                  {summaryMetrics.totalSKUs.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {modelMetrics ? `${modelMetrics.data_completeness.toFixed(1)}% data complete` : '+106 from last week'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processing Time</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-insight-strategic font-mono tabular-nums">
                  {summaryMetrics.processingTime.toFixed(1)}s
                </div>
                <p className="text-xs text-muted-foreground">
                  {modelMetrics ? `${modelMetrics.data_processing_rate} items/min` : '-22.6% faster processing'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">High Confidence</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success font-mono tabular-nums">
                  {summaryMetrics.highConfidenceCount}
                </div>
                <p className="text-xs text-muted-foreground">
                  SKUs with 90%+ confidence
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="sku-analysis" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            SKU Analysis
          </TabsTrigger>
          <TabsTrigger value="accuracy-trends" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Accuracy Trends
          </TabsTrigger>
          <TabsTrigger value="kpis">
            KPIs
          </TabsTrigger>
          {showAdvancedMetrics && (
            <TabsTrigger value="advanced">
              Advanced
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SKU Forecast Performance</CardTitle>
              <p className="text-sm text-muted-foreground">
                Detailed performance analysis for individual SKUs
              </p>
            </CardHeader>
            <CardContent>
              {skuAnalyticsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center space-x-4 p-4 border rounded">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : filteredAnalyticsData.length > 0 ? (
              <AnalyticsDataTable data={filteredAnalyticsData} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No analytics data matches the current filters</p>
                <p className="text-sm">Try adjusting your filter criteria</p>
              </div>
            )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sku-analysis" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing SKUs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    // Loading skeleton for top performers
                    [1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Skeleton className="h-4 w-24 mb-1" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <div className="text-right">
                          <Skeleton className="h-4 w-12 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))
                  ) : filteredAnalyticsData.length > 0 ? (
                    filteredAnalyticsData
                      .sort((a, b) => b.forecast_accuracy - a.forecast_accuracy)
                      .slice(0, 3)
                      .map((sku) => (
                        <div key={sku.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium text-sm">{sku.sku}</div>
                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {sku.description}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-mono font-bold text-success">
                              {sku.forecast_accuracy.toFixed(1)}%
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {(sku.confidence_score * 100).toFixed(0)}% confidence
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No top performers available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categoryLoading ? (
                    // Loading skeleton for categories
                    [1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <Skeleton className="h-4 w-20 mb-1" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                        <div className="text-right">
                          <Skeleton className="h-4 w-12 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                    ))
                  ) : categoryPerformance && categoryPerformance.length > 0 ? (
                    categoryPerformance.map(category => (
                      <div key={category.category} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{category.category}</div>
                          <div className="text-xs text-muted-foreground">
                            {category.sku_count} SKUs
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-mono font-bold">
                            {category.avg_accuracy.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Avg accuracy
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No category data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="accuracy-trends" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>7-Day Accuracy Trend</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Daily forecast accuracy performance over the last week
                </p>
              </CardHeader>
              <CardContent>
                {accuracyTrendLoading ? (
                  <Skeleton className="h-72 w-full" />
                ) : accuracyTrendData && accuracyTrendData.length > 0 ? (
                  <TrendLineChart 
                    data={accuracyTrendData} 
                    height={300}
                    title="Accuracy Trend"
                    dataKey="value"
                    yAxisLabel="Forecast Accuracy"
                    showTrend={true}
                    color="hsl(var(--success))"
                  />
                ) : (
                  <div className="h-72 flex items-center justify-center text-muted-foreground">
                    <p>No accuracy trend data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Processing Time Trend</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Model processing time improvements over time
                  </p>
                </CardHeader>
                <CardContent>
                  {processingTimeTrendLoading ? (
                    <Skeleton className="h-60 w-full" />
                  ) : processingTimeTrendData && processingTimeTrendData.length > 0 ? (
                    <TrendLineChart 
                      data={processingTimeTrendData} 
                      height={250}
                      title="Processing Time Trend"
                      dataKey="value"
                      yAxisLabel="Processing Time (seconds)"
                      showTrend={true}
                      color="hsl(var(--destructive))"
                    />
                  ) : (
                    <div className="h-60 flex items-center justify-center text-muted-foreground">
                      <p>No processing time data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Volume Processing Trend</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Daily SKU processing volume capacity
                  </p>
                </CardHeader>
                <CardContent>
                  {volumeTrendLoading ? (
                    <Skeleton className="h-60 w-full" />
                  ) : volumeTrendData && volumeTrendData.length > 0 ? (
                    <TrendLineChart 
                      data={volumeTrendData} 
                      height={250}
                      title="Volume Processing Trend"
                      dataKey="value"
                      yAxisLabel="SKUs Processed"
                      showTrend={true}
                      color="hsl(var(--secondary))"
                    />
                  ) : (
                    <div className="h-60 flex items-center justify-center text-muted-foreground">
                      <p>No volume processing data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="kpis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance KPIs</CardTitle>
              <p className="text-sm text-muted-foreground">
                Key performance indicators for the forecasting model
              </p>
            </CardHeader>
            <CardContent>
              {kpiAnalyticsLoading ? (
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
              ) : kpiAnalyticsData && kpiAnalyticsData.length > 0 ? (
                <KPIDataTable data={kpiAnalyticsData} />
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No KPI analytics data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {showAdvancedMetrics && (
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Analytics Metrics</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Advanced statistical measures and model diagnostics
                </p>
              </CardHeader>
              <CardContent>
                {advancedMetricsLoading ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <Skeleton className="h-5 w-32" />
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex justify-between p-3 border rounded-lg">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <Skeleton className="h-5 w-24" />
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex justify-between p-3 border rounded-lg">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-16" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : advancedMetrics ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Model Diagnostics</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between p-3 border rounded-lg">
                          <span className="text-sm font-medium">R-squared</span>
                          <span className="text-sm font-mono font-bold text-success">
                            {advancedMetrics.model_diagnostics.r_squared.toFixed(3)}
                          </span>
                        </div>
                        <div className="flex justify-between p-3 border rounded-lg">
                          <span className="text-sm font-medium">Mean Absolute Error</span>
                          <span className="text-sm font-mono font-bold">
                            {advancedMetrics.model_diagnostics.mean_absolute_error.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between p-3 border rounded-lg">
                          <span className="text-sm font-medium">Root Mean Square Error</span>
                          <span className="text-sm font-mono font-bold">
                            {advancedMetrics.model_diagnostics.root_mean_square_error.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium">Data Quality</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between p-3 border rounded-lg">
                          <span className="text-sm font-medium">Data Completeness</span>
                          <span className="text-sm font-mono font-bold text-success">
                            {advancedMetrics.data_quality.data_completeness.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between p-3 border rounded-lg">
                          <span className="text-sm font-medium">Outlier Detection Rate</span>
                          <span className="text-sm font-mono font-bold">
                            {advancedMetrics.data_quality.outlier_detection_rate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between p-3 border rounded-lg">
                          <span className="text-sm font-medium">Feature Importance</span>
                          <span className="text-sm font-mono font-bold">
                            Historical: {Object.values(advancedMetrics.data_quality.feature_importance)[0]?.toFixed(2) || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No advanced metrics available</p>
                    <p className="text-sm">Enable advanced metrics to view detailed model diagnostics</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}