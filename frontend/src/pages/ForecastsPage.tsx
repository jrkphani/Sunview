import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from '@/components/ui/breadcrumb'
import { Home, Filter, Calendar, TrendingUp, Settings } from 'lucide-react'
import ForecastChart from '@/components/charts/ForecastChart'
import { forecastService } from '@/services/forecastService'

export default function ForecastsPage() {
  // State for filtering controls
  const [timeHorizon, setTimeHorizon] = useState<'7d' | '14d' | '28d'>('28d')
  const [showConfidenceInterval, setShowConfidenceInterval] = useState(true)
  const [confidenceThreshold, setConfidenceThreshold] = useState([80])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  const { data: forecasts, isLoading } = useQuery({
    queryKey: ['forecasts'],
    queryFn: () => forecastService.getForecasts(),
  })

  const { data: volumeData } = useQuery({
    queryKey: ['volume-forecasts', timeHorizon],
    queryFn: () => forecastService.getVolumeForecasts(timeHorizon),
  })

  const { data: volumeData7d } = useQuery({
    queryKey: ['volume-forecasts', '7d'],
    queryFn: () => forecastService.getVolumeForecasts('7d'),
  })

  const { data: volumeData14d } = useQuery({
    queryKey: ['volume-forecasts', '14d'],
    queryFn: () => forecastService.getVolumeForecasts('14d'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

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
            <BreadcrumbPage>Forecasts</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forecasts</h1>
          <p className="text-muted-foreground">
            Manage and analyze demand and volume forecasts
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <label htmlFor="auto-refresh" className="text-sm font-medium">
              Auto-refresh
            </label>
          </div>
          <Badge variant="outline">
            {forecasts?.length || 0} Active Forecasts
          </Badge>
        </div>
      </div>

      {/* System Status Alert */}
      {autoRefresh && (
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertTitle>Auto-refresh Enabled</AlertTitle>
          <AlertDescription>
            Forecasts will automatically update every 5 minutes. Data was last updated at {new Date().toLocaleTimeString()}.
          </AlertDescription>
        </Alert>
      )}

      {/* Filtering Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Forecast Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Horizon</label>
              <Select value={timeHorizon} onValueChange={(value: '7d' | '14d' | '28d') => setTimeHorizon(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 Days</SelectItem>
                  <SelectItem value="14d">14 Days</SelectItem>
                  <SelectItem value="28d">28 Days</SelectItem>
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
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="demand">Demand</SelectItem>
                  <SelectItem value="seasonal">Seasonal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="confidence-interval" 
                  checked={showConfidenceInterval}
                  onCheckedChange={(checked) => setShowConfidenceInterval(checked === true)}
                />
                <label htmlFor="confidence-interval" className="text-sm font-medium">
                  Show Confidence Intervals
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="advanced-filters"
                  checked={showAdvancedFilters}
                  onCheckedChange={setShowAdvancedFilters}
                />
                <label htmlFor="advanced-filters" className="text-sm font-medium">
                  Advanced Filters
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Confidence Threshold: {confidenceThreshold[0]}%
            </label>
            <Slider
              value={confidenceThreshold}
              onValueChange={setConfidenceThreshold}
              max={100}
              min={50}
              step={5}
              className="w-full"
            />
          </div>

          {/* Advanced Filters Section */}
          {showAdvancedFilters && (
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-medium mb-3">Advanced Filtering Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">SKU Priority</label>
                  <Select defaultValue="all">
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
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Model Version</label>
                  <Select defaultValue="latest">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Latest (v2.1)</SelectItem>
                      <SelectItem value="v2.0">Version 2.0</SelectItem>
                      <SelectItem value="v1.9">Version 1.9</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="exclude-outliers" defaultChecked />
                  <label htmlFor="exclude-outliers" className="text-sm font-medium">
                    Exclude Outliers
                  </label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox id="seasonal-adjustment" />
                  <label htmlFor="seasonal-adjustment" className="text-sm font-medium">
                    Apply Seasonal Adjustment
                  </label>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Forecast Tabs */}
      <Tabs defaultValue="volume" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="volume" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Volume Forecasts
          </TabsTrigger>
          <TabsTrigger value="demand" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Demand Forecasts
          </TabsTrigger>
          <TabsTrigger value="management">
            Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="volume" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{timeHorizon.toUpperCase().replace('D', '-Day')} Volume Forecast</CardTitle>
              <p className="text-sm text-muted-foreground">
                Daily volume predictions with confidence intervals
              </p>
            </CardHeader>
            <CardContent>
              <ForecastChart 
                data={volumeData || []} 
                height={400}
                showConfidenceInterval={showConfidenceInterval}
                timeHorizon={timeHorizon}
              />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>7-Day Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ForecastChart 
                  data={volumeData7d || []} 
                  height={250}
                  showConfidenceInterval={showConfidenceInterval}
                  timeHorizon="7d"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>14-Day Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ForecastChart 
                  data={volumeData14d || []} 
                  height={250}
                  showConfidenceInterval={showConfidenceInterval}
                  timeHorizon="14d"
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="demand" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Demand Forecasting</CardTitle>
              <p className="text-sm text-muted-foreground">
                SKU-level demand predictions and analysis
              </p>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <p>Demand forecasting features coming soon...</p>
                <p className="text-sm mt-2">Will include SKU-level predictions and seasonal adjustments</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Forecast Management</CardTitle>
              <p className="text-sm text-muted-foreground">
                Configure and monitor forecast generation
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Auto-refresh Forecasts</h4>
                    <p className="text-sm text-muted-foreground">Automatically update forecasts daily</p>
                  </div>
                  <Button variant="outline">Configure</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Export Forecasts</h4>
                    <p className="text-sm text-muted-foreground">Download forecast data as CSV or JSON</p>
                  </div>
                  <Button variant="outline">Export</Button>
                </div>
                
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Model Retraining</h4>
                    <p className="text-sm text-muted-foreground">Retrain models with latest data</p>
                  </div>
                  <Button variant="outline">Schedule</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}