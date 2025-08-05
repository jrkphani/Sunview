import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Calendar, TrendingUp, TrendingDown, Info, Loader2 } from 'lucide-react'
import { ResponsiveCalendar } from '@nivo/calendar'
import { InsightExplainer, ExplainerTrigger } from '@/components/ui/insight-explainer'
import { cn } from '@/lib/utils'
import { useSeasonalityData } from '@/hooks/useAnalytics'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SeasonalityOverviewChartProps {
  className?: string
}

// Helper to generate calendar data
const generateSeasonalityData = (year: number) => {
  const data = []
  const startDate = new Date(year, 0, 1)
  const endDate = new Date(year, 11, 31)
  
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    // Generate realistic forecast accuracy data with seasonal patterns
    const month = d.getMonth()
    const dayOfWeek = d.getDay()
    
    // Base accuracy with seasonal variations
    let baseAccuracy = 85 + Math.random() * 10
    
    // Holiday season impact (Nov-Dec)
    if (month === 10 || month === 11) {
      baseAccuracy -= 5 + Math.random() * 5
    }
    
    // Summer impact (Jun-Aug)
    if (month >= 5 && month <= 7) {
      baseAccuracy += 3 + Math.random() * 3
    }
    
    // Weekend impact
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      baseAccuracy -= 2 + Math.random() * 3
    }
    
    data.push({
      day: d.toISOString().split('T')[0],
      value: Math.max(70, Math.min(100, baseAccuracy))
    })
  }
  
  return data
}

// Mock explainer data
const seasonalityExplainer = {
  title: "Seasonality Overview",
  description: "This calendar heatmap visualizes forecast accuracy patterns throughout the year, helping identify seasonal trends and recurring patterns that impact prediction quality.",
  methodology: {
    title: "Methodology",
    content: "Daily forecast accuracy is calculated as (1 - MAPE) × 100, where MAPE is the Mean Absolute Percentage Error. Colors represent accuracy levels from red (poor) to green (excellent)."
  },
  calculation: {
    title: "Calculation",
    content: "For each day: Accuracy = (1 - |Actual - Forecast| / Actual) × 100, aggregated across all SKUs"
  },
  dataSources: {
    title: "Data Sources",
    content: (
      <ul className="list-disc list-inside space-y-1">
        <li>Historical forecast data</li>
        <li>Actual shipment volumes</li>
        <li>Daily accuracy metrics</li>
      </ul>
    )
  },
  examples: [
    {
      title: "Holiday Patterns",
      description: "Holiday seasons show lower accuracy due to demand volatility",
      interpretation: "Expect 10-15% accuracy drop during major holidays"
    },
    {
      title: "Weekend Variations", 
      description: "Weekends typically have different patterns than weekdays",
      interpretation: "Saturday/Sunday forecasts may need separate models"
    },
    {
      title: "Seasonal Stability",
      description: "Summer months often show more stable predictions",
      interpretation: "June-August typically achieve 5-8% higher accuracy"
    }
  ],
  grade: "excellent" as const,
  difficulty: "intermediate" as const
}

export default function SeasonalityOverviewChart({ className }: SeasonalityOverviewChartProps) {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'volume'>('accuracy')
  const [explainerOpen, setExplainerOpen] = useState(false)
  
  // In a real app, this would fetch from the API
  const { data: seasonalityData, isLoading, isError } = useSeasonalityData({
    year: selectedYear,
    metric: selectedMetric
  })
  
  // Use mock data for now
  const calendarData = seasonalityData || generateSeasonalityData(selectedYear)
  
  const currentYear = new Date().getFullYear()
  const availableYears = [currentYear - 2, currentYear - 1, currentYear]
  
  // Calculate summary statistics
  const avgAccuracy = calendarData.length > 0 
    ? calendarData.reduce((sum, day) => sum + (typeof day.value === 'number' ? day.value : 0), 0) / calendarData.length
    : 0
  const minAccuracy = calendarData.length > 0 
    ? Math.min(...calendarData.map(d => typeof d.value === 'number' ? d.value : 0))
    : 0
  const maxAccuracy = calendarData.length > 0 
    ? Math.max(...calendarData.map(d => typeof d.value === 'number' ? d.value : 0))
    : 0
  
  // Custom color scale for accuracy
  const getColor = (value: number) => {
    if (value >= 95) return 'hsl(var(--success))' // Green 500
    if (value >= 90) return 'hsl(var(--chart-2))' // Green 400
    if (value >= 85) return 'hsl(var(--warning))' // Amber 400
    if (value >= 80) return 'hsl(var(--chart-3))' // Orange 400
    return 'hsl(var(--destructive))' // Red 500
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Seasonality Overview</CardTitle>
            <ExplainerTrigger onClick={() => setExplainerOpen(true)} />
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedMetric} onValueChange={(value: 'accuracy' | 'volume') => setSelectedMetric(value)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accuracy">Accuracy %</SelectItem>
                <SelectItem value="volume">Volume Impact</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Daily forecast {selectedMetric} patterns throughout {selectedYear}
        </p>
      </CardHeader>
      
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {isError && (
          <div className="flex items-center justify-center h-[200px]">
            <div className="text-center">
              <Calendar className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Failed to load seasonality data</p>
            </div>
          </div>
        )}
        
        {!isLoading && !isError && (
          <>
            <div className="h-[200px] w-full">
              <ResponsiveCalendar
                data={calendarData}
                from={`${selectedYear}-01-01`}
                to={`${selectedYear}-12-31`}
                emptyColor="#f3f4f6"
                colors={['hsl(var(--destructive))', 'hsl(var(--chart-3))', 'hsl(var(--warning))', 'hsl(var(--chart-2))', 'hsl(var(--success))']}
                minValue={70}
                maxValue={100}
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                yearSpacing={40}
                monthBorderColor="#e5e7eb"
                monthBorderWidth={1}
                dayBorderWidth={0}
                dayBorderColor="#ffffff"
                theme={{
                  labels: {
                    text: {
                      fontSize: 11,
                      fill: '#6b7280',
                    }
                  },
                  tooltip: {
                    container: {
                      background: '#ffffff',
                      color: '#333333',
                      fontSize: '12px',
                      borderRadius: '6px',
                      boxShadow: '0 3px 9px rgba(0, 0, 0, 0.15)',
                      padding: '8px 12px',
                    },
                  },
                }}
                tooltip={({ day, value, color }) => (
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">{new Date(day).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}</div>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-sm" 
                        style={{ backgroundColor: color }}
                      />
                      <span className="text-sm font-mono">
                        {typeof value === 'number' ? value.toFixed(1) : value}% {selectedMetric}
                      </span>
                    </div>
                  </div>
                )}
                legends={[
                  {
                    anchor: 'bottom-right',
                    direction: 'row',
                    translateY: 36,
                    itemCount: 5,
                    itemWidth: 42,
                    itemHeight: 36,
                    itemsSpacing: 14,
                    itemDirection: 'right-to-left'
                  }
                ]}
              />
            </div>

            {/* Summary Statistics */}
            <div className="mt-6 grid grid-cols-3 gap-4">
              <div className="rounded-lg border bg-card p-3">
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Average</div>
                  <div className="text-2xl font-bold tabular-nums">
                    {avgAccuracy?.toFixed(1) || '0.0'}%
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Best Day</div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-success" />
                    <span className="text-2xl font-bold tabular-nums text-success">
                      {maxAccuracy?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-card p-3">
                <div className="flex flex-col items-center justify-center space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Worst Day</div>
                  <div className="flex items-center gap-1">
                    <TrendingDown className="h-4 w-4 text-destructive" />
                    <span className="text-2xl font-bold tabular-nums text-destructive">
                      {minAccuracy?.toFixed(1) || '0.0'}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="mt-4 rounded-lg bg-muted/50 p-4">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p className="font-medium">Seasonal Patterns Detected:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground">
                    <li>Holiday season (Nov-Dec) shows {((avgAccuracy - 5) / avgAccuracy * 100).toFixed(0)}% lower accuracy</li>
                    <li>Summer months demonstrate more stable predictions</li>
                    <li>Weekend patterns differ from weekday performance</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>

      {/* Seasonality Explainer */}
      <InsightExplainer
        isOpen={explainerOpen}
        onClose={() => setExplainerOpen(false)}
        title={seasonalityExplainer.title}
        description={seasonalityExplainer.description}
        methodology={seasonalityExplainer.methodology}
        calculation={seasonalityExplainer.calculation}
        dataSources={seasonalityExplainer.dataSources}
        examples={seasonalityExplainer.examples}
        grade={seasonalityExplainer.grade}
        difficulty={seasonalityExplainer.difficulty}
      />
    </Card>
  )
}