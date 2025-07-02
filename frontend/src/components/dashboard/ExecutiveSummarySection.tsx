import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { RefreshCw, Download, Filter, Calendar, MapPin, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MockDataIndicator, useDataSourceStatus } from '@/components/ui/mock-data-indicator'

// Import individual components
import ForecastAccuracyKPI from './ForecastAccuracyKPI'
import TopSKUErrorsChart from './TopSKUErrorsChart'
import TruckUtilizationAreaChart from './TruckUtilizationAreaChart'
import DOHLineChart from './DOHLineChart'
import OTIFStackedBarChart from './OTIFStackedBarChart'
import AlertsSummaryPanel from './AlertsSummaryPanel'

// Mock hooks - in real implementation, these would fetch from the API
import { executiveSummaryService } from '@/services/executiveSummaryService'
import type { DrillDownFilters } from '@/types/api'

interface ExecutiveSummarySectionProps {
  className?: string
  onNavigateToRisk?: () => void
  onNavigateToResilience?: () => void
}

export default function ExecutiveSummarySection({
  className,
  onNavigateToRisk,
  onNavigateToResilience
}: ExecutiveSummarySectionProps) {
  const [filters, setFilters] = useState<DrillDownFilters>({
    timeRange: '30d',
    site: 'all',
    skuGroup: 'all',
    forecastHorizon: '7d'
  })
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toISOString())
  
  // Data source status
  const { isApiConnected, isLoading, isMockData } = useDataSourceStatus()

  // Filter options
  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '180d', label: '6 Months' },
    { value: '365d', label: '1 Year' }
  ]

  const siteOptions = [
    { value: 'all', label: 'All Sites' },
    { value: 'site-1', label: 'Distribution Center East' },
    { value: 'site-2', label: 'Distribution Center West' },
    { value: 'site-3', label: 'Regional Hub North' },
    { value: 'site-4', label: 'Regional Hub South' }
  ]

  const skuGroupOptions = [
    { value: 'all', label: 'All SKU Groups' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'apparel', label: 'Apparel' },
    { value: 'home-garden', label: 'Home & Garden' },
    { value: 'sports', label: 'Sports & Outdoors' }
  ]

  const forecastHorizonOptions = [
    { value: '1d', label: '1 Day' },
    { value: '7d', label: '7 Days' },
    { value: '14d', label: '14 Days' },
    { value: '28d', label: '28 Days' }
  ]

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await executiveSummaryService.refreshData()
      setLastUpdated(new Date().toISOString())
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleExport = async (format: 'pdf' | 'csv' = 'pdf') => {
    try {
      await executiveSummaryService.exportExecutiveSummary(format, filters)
    } catch (error) {
      console.error('Error exporting data:', error)
    }
  }

  const updateFilter = (key: keyof DrillDownFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value
    }))
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with data source indicator and controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <MockDataIndicator 
            isLoading={isLoading} 
            isMockData={isMockData} 
            dataSource={isApiConnected ? 'api' : 'mock'} 
            variant="badge" 
            showDetails={true}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Controls */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-neutral-600" />
            <Select value={filters.timeRange} onValueChange={(value) => updateFilter('timeRange', value)}>
              <SelectTrigger className="w-[120px]">
                <Calendar className="h-4 w-4" />
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.site || 'all'} onValueChange={(value) => updateFilter('site', value)}>
              <SelectTrigger className="w-[160px]">
                <MapPin className="h-4 w-4" />
                <SelectValue placeholder="Site" />
              </SelectTrigger>
              <SelectContent>
                {siteOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.skuGroup || 'all'} onValueChange={(value) => updateFilter('skuGroup', value)}>
              <SelectTrigger className="w-[140px]">
                <Package className="h-4 w-4" />
                <SelectValue placeholder="SKU Group" />
              </SelectTrigger>
              <SelectContent>
                {skuGroupOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="gap-2"
                  >
                    <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh all data</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('pdf')}
                    className="gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export executive summary as PDF</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Data Source Alert */}
      {isMockData && (
        <MockDataIndicator 
          isLoading={isLoading}
          isMockData={isMockData} 
          dataSource={isApiConnected ? 'api' : 'mock'}
          variant="alert" 
          showDetails={true}
          className="mb-4"
        />
      )}

      {/* Last Updated Badge */}
      <div className="flex justify-end">
        <Badge variant="outline" className="text-xs">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </Badge>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - KPIs and Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPI Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ForecastAccuracyKPI filters={filters} />
          </div>

          {/* Charts Section - Each tab shows unique chart combinations */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="logistics">Logistics & Performance</TabsTrigger>
              <TabsTrigger value="inventory">Inventory & SKU Analysis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <TopSKUErrorsChart filters={filters} />
              </div>
            </TabsContent>

            <TabsContent value="logistics" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <TruckUtilizationAreaChart filters={filters} />
                <OTIFStackedBarChart filters={filters} />
              </div>
            </TabsContent>

            <TabsContent value="inventory" className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <DOHLineChart filters={filters} />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Alerts and Quick Actions */}
        <div className="space-y-6">
          <AlertsSummaryPanel 
            filters={filters}
            onNavigateToRisk={onNavigateToRisk}
            onNavigateToResilience={onNavigateToResilience}
          />

          {/* Quick Insights Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Quick Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Top Priority:</span>
                  <span className="font-medium">Forecast Accuracy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Trend:</span>
                  <Badge variant="secondary" className="text-xs">Improving</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Next Review:</span>
                  <span className="font-medium">Tomorrow</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Options Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start gap-2"
                onClick={() => handleExport('pdf')}
              >
                <Download className="h-4 w-4" />
                Executive Report (PDF)
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start gap-2"
                onClick={() => handleExport('csv')}
              >
                <Download className="h-4 w-4" />
                Data Export (CSV)
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}