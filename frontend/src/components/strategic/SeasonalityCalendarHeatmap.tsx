import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ResponsiveCalendar } from '@nivo/calendar'
import { CalendarDays, TrendingUp, TrendingDown, Filter, Eye } from 'lucide-react'

interface SeasonalityDataPoint {
  date: string
  category: string
  value: number
  week: number
  month: number
  quarter: number
}

interface SeasonalityCalendarHeatmapProps {
  data: SeasonalityDataPoint[]
  height?: number
  compact?: boolean
  className?: string
}

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Design token color palette following our style guide
// Using hex values that match our CSS variables for Nivo compatibility
const designTokenColors = {
  // Chart colors from our design system
  chart1: '#3b82f6', // Primary blue (--chart-1: 217 91% 60%)
  chart2: '#16a34a', // Operational green (--chart-2: 142 76% 36%)
  chart3: '#a855f7', // Commercial purple (--chart-3: 262 83% 58%)
  chart4: '#eab308', // Warning amber (--chart-4: 45 93% 47%)
  chart5: '#ef4444', // Risk red (--chart-5: 0 84% 60%)
  
  // Semantic colors
  success: '#16a34a', // (--success: 142 76% 36%)
  warning: '#eab308', // (--warning: 45 93% 47%)
  error: '#ef4444',   // (--error: 0 84% 60%)
  
  // UI colors
  muted: '#f3f4f6',
  border: '#e5e7eb',
  background: '#ffffff',
  foreground: '#0a0a0a',
  mutedForeground: '#737373'
}

export default function SeasonalityCalendarHeatmap({ 
  data = [], 
  height = 400,
  compact = false,
  className 
}: SeasonalityCalendarHeatmapProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedMetric, setSelectedMetric] = useState<string>('value')

  // Extract unique categories
  const categories = useMemo(() => {
    const unique = [...new Set(data.map(d => d.category))]
    return [{ value: 'all', label: 'All Categories' }, ...unique.map(cat => ({ value: cat, label: cat }))]
  }, [data])

  // Process data for Nivo calendar heatmap
  const calendarData = useMemo(() => {
    // Return empty data structure if no data
    if (!data || data.length === 0) {
      return { nivoData: [], processedData: [] }
    }

    const filteredData = selectedCategory === 'all' 
      ? data 
      : data.filter(d => d.category === selectedCategory)

    // Group by date and aggregate values
    const dailyData = filteredData.reduce((acc, curr) => {
      const date = curr.date
      if (!acc[date]) {
        acc[date] = {
          date,
          totalValue: 0,
          count: 0,
          categories: []
        }
      }
      acc[date].totalValue += curr.value
      acc[date].count += 1
      acc[date].categories.push({ category: curr.category, value: curr.value })
      return acc
    }, {} as Record<string, any>)

    // Convert to Nivo calendar format
    const nivoData = Object.values(dailyData).map((day: any) => {
      const avgValue = day.totalValue / day.count
      return {
        day: day.date,
        value: avgValue
      }
    })


    // Also keep processed data for statistics
    const processedData = Object.values(dailyData).map((day: any) => {
      const date = new Date(day.date)
      const avgValue = day.totalValue / day.count
      
      return {
        ...day,
        avgValue,
        dayOfWeek: date.getDay(),
        weekOfYear: getWeekOfYear(date),
        month: date.getMonth(),
        dayOfMonth: date.getDate(),
        isWeekend: date.getDay() === 0 || date.getDay() === 6,
        intensity: normalizeValue(avgValue, filteredData)
      }
    })

    return { nivoData, processedData }
  }, [data, selectedCategory])

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!calendarData || !calendarData.processedData || calendarData.processedData.length === 0) return null

    const values = calendarData.processedData.map(d => d.avgValue)
    const max = Math.max(...values)
    const min = Math.min(...values)
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length

    // Seasonal patterns
    const seasonalAvg = calendarData.processedData.reduce((acc, curr) => {
      const season = getSeasonFromMonth(curr.month)
      if (!acc[season]) acc[season] = { total: 0, count: 0 }
      acc[season].total += curr.avgValue
      acc[season].count += 1
      return acc
    }, {} as Record<string, any>)

    Object.keys(seasonalAvg).forEach(season => {
      seasonalAvg[season].avg = seasonalAvg[season].total / seasonalAvg[season].count
    })

    // Weekly patterns
    const weeklyAvg = calendarData.processedData.reduce((acc, curr) => {
      if (!acc[curr.dayOfWeek]) acc[curr.dayOfWeek] = { total: 0, count: 0 }
      acc[curr.dayOfWeek].total += curr.avgValue
      acc[curr.dayOfWeek].count += 1
      return acc
    }, {} as Record<number, any>)

    Object.keys(weeklyAvg).forEach(day => {
      weeklyAvg[day].avg = weeklyAvg[day].total / weeklyAvg[day].count
    })

    return {
      max,
      min,
      avg,
      seasonal: seasonalAvg,
      weekly: weeklyAvg,
      totalDays: calendarData.processedData.length
    }
  }, [calendarData])

  const chartConfig = {
    value: {
      label: 'Demand Value',
      color: 'hsl(var(--primary))',
    },
  } satisfies ChartConfig

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center space-y-2">
            <CalendarDays className="h-12 w-12 mx-auto opacity-50" />
            <p className="text-lg font-medium">No seasonality data available</p>
            <p className="text-sm">Calendar heatmap will appear when data is loaded</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      {!compact && (
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5" />
              <CardTitle>Forecast Accuracy Seasonality - {new Date().getFullYear()}</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {statistics && (
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>Avg: {statistics.avg.toFixed(1)}</span>
              <span>Peak: {statistics.max.toFixed(1)}</span>
              <span>Low: {statistics.min.toFixed(1)}</span>
              <span>Days: {statistics.totalDays}</span>
            </div>
          )}
        </CardHeader>
      )}
      
      <CardContent>
        <div className="space-y-4">
          {/* Calendar Heatmap */}
          <div className="h-[200px] w-full">
            <ResponsiveCalendar
              data={calendarData?.nivoData || []}
              from={`${new Date().getFullYear()}-01-01`}
              to={`${new Date().getFullYear()}-12-31`}
              emptyColor={designTokenColors.muted}
              colors={[
                designTokenColors.chart5, // Red for low values
                designTokenColors.chart4, // Amber for medium-low
                designTokenColors.chart3, // Purple for medium
                designTokenColors.chart2, // Green for medium-high
                designTokenColors.chart1  // Blue for high values
              ]}
              minValue={70}
              maxValue={100}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              yearSpacing={40}
              monthBorderColor={designTokenColors.border}
              monthBorderWidth={1}
              dayBorderWidth={0}
              dayBorderColor={designTokenColors.background}
              theme={{
                labels: {
                  text: {
                    fontSize: 11,
                    fill: designTokenColors.mutedForeground,
                  }
                },
                tooltip: {
                  container: {
                    background: designTokenColors.background,
                    color: designTokenColors.foreground,
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
                      {typeof value === 'number' ? value.toFixed(1) : value}
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

          {/* Seasonal Insights */}
          {!compact && statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Seasonal Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(statistics.seasonal).map(([season, data]: [string, any]) => {
                      const isAboveAvg = data.avg > statistics.avg
                      return (
                        <div key={season} className="flex items-center justify-between">
                          <span className="text-sm">{season}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm">{data.avg.toFixed(1)}</span>
                            {isAboveAvg ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Weekly Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(statistics.weekly).map(([dayNum, data]: [string, any]) => {
                      const dayName = dayNames[parseInt(dayNum)]
                      const isAboveAvg = data.avg > statistics.avg
                      return (
                        <div key={dayNum} className="flex items-center justify-between">
                          <span className="text-sm">{dayName}</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-sm">{data.avg.toFixed(1)}</span>
                            {isAboveAvg ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-destructive" />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Helper functions
function getWeekOfYear(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7)
}

function getSeasonFromMonth(month: number): string {
  if (month >= 2 && month <= 4) return 'Spring'
  if (month >= 5 && month <= 7) return 'Summer'
  if (month >= 8 && month <= 10) return 'Fall'
  return 'Winter'
}

function normalizeValue(value: number, data: any[]): number {
  if (data.length === 0) return 0
  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  return max === min ? 0 : (value - min) / (max - min)
}