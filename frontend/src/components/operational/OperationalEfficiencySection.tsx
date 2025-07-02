import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { MockDataIndicator, useDataSourceStatus } from '@/components/ui/mock-data-indicator'
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Users, 
  Package, 
  Truck,
  AlertTriangle,
  CheckCircle,
  Filter,
  RefreshCw,
  Download
} from 'lucide-react'
import { useState, useMemo } from 'react'
import type { 
  OperationalEfficiencyMetrics,
  OperationalEfficiencyFilters,
  ThroughputMetrics,
  LaborForecastData,
  DockToStockData,
  PickRateMetrics,
  ConsolidationOpportunity
} from '@/types/api'

// Import individual chart components
import ThroughputComparisonChart from './ThroughputComparisonChart'
import ConsumptionRateHeatmap from './ConsumptionRateHeatmap'
import LaborForecastOverlay from './LaborForecastOverlay'
import DockToStockBoxplot from './DockToStockBoxplot'
import PickRateShiftChart from './PickRateShiftChart'
import ConsolidationOpportunitiesTreemap from './ConsolidationOpportunitiesTreemap'

interface OperationalEfficiencySectionProps {
  data?: OperationalEfficiencyMetrics
  loading?: boolean
  error?: string
  onRefresh?: () => void
  onExport?: (format: 'csv' | 'pdf') => void
}

const defaultFilters: OperationalEfficiencyFilters = {
  sites: [],
  sku_groups: [],
  date_range: {
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  },
  shifts: [],
  outliers_only: false,
  performance_threshold: 85
}

export default function OperationalEfficiencySection({
  data,
  loading = false,
  error,
  onRefresh,
  onExport
}: OperationalEfficiencySectionProps) {
  const [filters, setFilters] = useState<OperationalEfficiencyFilters>(defaultFilters)
  const [activeTab, setActiveTab] = useState('overview')
  const [showFilters, setShowFilters] = useState(false)
  
  // Data source status for MockDataIndicator
  const { isApiConnected, isLoading, isMockData } = useDataSourceStatus()

  // Calculate key performance indicators
  const kpis = useMemo(() => {
    if (!data) return null

    const throughputAccuracy = data.throughput_analysis.overall_accuracy
    const laborOptimalPercentage = data.labor_efficiency.cost_impact_summary.optimal_shifts_percentage
    const outlierPercentage = data.processing_times.outlier_analysis.total_outliers > 0 
      ? (data.processing_times.outlier_analysis.total_outliers / data.processing_times.dock_to_stock_data.length) * 100 
      : 0
    const consolidationSavings = data.consolidation_opportunities.potential_monthly_savings

    return {
      throughputAccuracy: {
        value: throughputAccuracy,
        trend: throughputAccuracy >= 90 ? 'up' : throughputAccuracy >= 80 ? 'stable' : 'down',
        severity: throughputAccuracy >= 90 ? 'success' : throughputAccuracy >= 80 ? 'warning' : 'error'
      },
      laborEfficiency: {
        value: laborOptimalPercentage,
        trend: laborOptimalPercentage >= 80 ? 'up' : laborOptimalPercentage >= 70 ? 'stable' : 'down',
        severity: laborOptimalPercentage >= 80 ? 'success' : laborOptimalPercentage >= 70 ? 'warning' : 'error'
      },
      processingEfficiency: {
        value: 100 - outlierPercentage,
        trend: outlierPercentage <= 10 ? 'up' : outlierPercentage <= 20 ? 'stable' : 'down',
        severity: outlierPercentage <= 10 ? 'success' : outlierPercentage <= 20 ? 'warning' : 'error'
      },
      consolidationSavings: {
        value: consolidationSavings,
        trend: consolidationSavings > 50000 ? 'up' : consolidationSavings > 25000 ? 'stable' : 'down',
        severity: consolidationSavings > 50000 ? 'success' : consolidationSavings > 25000 ? 'warning' : 'info'
      }
    }
  }, [data])

  const handleFilterChange = (key: keyof OperationalEfficiencyFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const resetFilters = () => {
    setFilters(defaultFilters)
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Operational Efficiency Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          {onRefresh && (
            <Button onClick={onRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <MockDataIndicator 
            isLoading={isLoading} 
            isMockData={isMockData} 
            dataSource={isApiConnected ? 'api' : 'mock'} 
            variant="badge" 
            showDetails={true}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(showFilters && "bg-accent")}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          {onRefresh && (
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
          )}
          {onExport && (
            <Select onValueChange={(value) => onExport(value as 'csv' | 'pdf')}>
              <SelectTrigger className="w-32">
                <Download className="h-4 w-4 mr-2" />
                Export
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters & Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sites">Sites</Label>
                <Select
                  value={filters.sites?.join(',') || 'all'}
                  onValueChange={(value) => 
                    handleFilterChange('sites', value === 'all' ? [] : value.split(','))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Sites" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sites</SelectItem>
                    <SelectItem value="site1,site2">Multiple Sites</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shifts">Shifts</Label>
                <Select
                  value={filters.shifts?.join(',') || 'all'}
                  onValueChange={(value) => 
                    handleFilterChange('shifts', value === 'all' ? [] : value.split(','))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Shifts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Shifts</SelectItem>
                    <SelectItem value="morning">Morning</SelectItem>
                    <SelectItem value="afternoon">Afternoon</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="threshold">Performance Threshold (%)</Label>
                <Input
                  id="threshold"
                  type="number"
                  min={0}
                  max={100}
                  value={filters.performance_threshold || 85}
                  onChange={(e) => 
                    handleFilterChange('performance_threshold', parseInt(e.target.value))
                  }
                />
              </div>

              <div className="flex items-end">
                <Button variant="outline" onClick={resetFilters} className="w-full">
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Overview Cards */}
      {kpis && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Throughput Accuracy</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{kpis.throughputAccuracy.value.toFixed(1)}%</div>
                {kpis.throughputAccuracy.trend === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
                {kpis.throughputAccuracy.trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  kpis.throughputAccuracy.severity === 'success' && 'text-success bg-success/10 border-success/20',
                  kpis.throughputAccuracy.severity === 'warning' && 'text-warning bg-warning/10 border-warning/20',
                  kpis.throughputAccuracy.severity === 'error' && 'text-destructive bg-destructive/10 border-destructive/20'
                )}
              >
                {kpis.throughputAccuracy.severity === 'success' && <CheckCircle className="h-3 w-3 mr-1" />}
                {kpis.throughputAccuracy.severity !== 'success' && <AlertTriangle className="h-3 w-3 mr-1" />}
                {kpis.throughputAccuracy.severity}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Labor Efficiency</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{kpis.laborEfficiency.value.toFixed(1)}%</div>
                {kpis.laborEfficiency.trend === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
                {kpis.laborEfficiency.trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Optimal staffing achieved</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Processing Efficiency</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">{kpis.processingEfficiency.value.toFixed(1)}%</div>
                {kpis.processingEfficiency.trend === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
                {kpis.processingEfficiency.trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">On-time processing</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Savings</CardTitle>
              <Truck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  ${(kpis.consolidationSavings.value / 1000).toFixed(0)}K
                </div>
                {kpis.consolidationSavings.trend === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
                {kpis.consolidationSavings.trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Consolidation opportunities</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="throughput">Throughput</TabsTrigger>
          <TabsTrigger value="consumption">Consumption</TabsTrigger>
          <TabsTrigger value="labor">Labor</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="consolidation">Consolidation</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ThroughputComparisonChart 
              data={data?.throughput_analysis.site_performance || []}
              loading={loading}
              height={300}
            />
            <LaborForecastOverlay 
              data={data?.labor_efficiency.staffing_analysis || []}
              loading={loading}
              height={300}
            />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PickRateShiftChart 
              data={data?.pick_rate_analysis.shift_performance || []}
              loading={loading}
              height={300}
            />
            <ConsolidationOpportunitiesTreemap 
              data={data?.consolidation_opportunities.opportunities || []}
              loading={loading}
              height={300}
            />
          </div>
        </TabsContent>

        <TabsContent value="throughput">
          <ThroughputComparisonChart 
            data={data?.throughput_analysis.site_performance || []}
            loading={loading}
            height={400}
            showDetailedView={true}
          />
        </TabsContent>

        <TabsContent value="consumption">
          <ConsumptionRateHeatmap 
            data={data?.consumption_rates.sku_performance || []}
            loading={loading}
            height={400}
          />
        </TabsContent>

        <TabsContent value="labor">
          <LaborForecastOverlay 
            data={data?.labor_efficiency.staffing_analysis || []}
            loading={loading}
            height={400}
            showDetailedView={true}
          />
        </TabsContent>

        <TabsContent value="processing">
          <DockToStockBoxplot 
            data={data?.processing_times.dock_to_stock_data || []}
            loading={loading}
            height={400}
          />
        </TabsContent>

        <TabsContent value="consolidation">
          <ConsolidationOpportunitiesTreemap 
            data={data?.consolidation_opportunities.opportunities || []}
            loading={loading}
            height={400}
            showDetailedView={true}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}