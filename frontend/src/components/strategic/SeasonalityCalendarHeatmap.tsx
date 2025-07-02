import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
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

const monthNames = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function SeasonalityCalendarHeatmap({ 
  data = [], 
  height = 400,
  compact = false,
  className 
}: SeasonalityCalendarHeatmapProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedMetric, setSelectedMetric] = useState<string>('value')
  const [hoveredCell, setHoveredCell] = useState<any>(null)

  // Extract unique categories
  const categories = useMemo(() => {
    const unique = [...new Set(data.map(d => d.category))]
    return [{ value: 'all', label: 'All Categories' }, ...unique.map(cat => ({ value: cat, label: cat }))]
  }, [data])

  // Process data for calendar heatmap
  const calendarData = useMemo(() => {
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

    // Convert to array and add calendar positioning
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

    return processedData
  }, [data, selectedCategory])

  // Calculate statistics
  const statistics = useMemo(() => {
    if (calendarData.length === 0) return null

    const values = calendarData.map(d => d.avgValue)
    const max = Math.max(...values)
    const min = Math.min(...values)
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length

    // Seasonal patterns
    const seasonalAvg = calendarData.reduce((acc, curr) => {
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
    const weeklyAvg = calendarData.reduce((acc, curr) => {
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
      totalDays: calendarData.length
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
        <CardContent className="flex items-center justify-center h-64 text-neutral-500">
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
              <CardTitle>Seasonality Analysis - Calendar Heatmap</CardTitle>
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
            <div className="flex items-center space-x-4 text-sm text-neutral-500">
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
          <div className="relative">
            <div className="w-full" style={{ height }}>
              <div className="calendar-heatmap">
                {/* Responsive calendar container */}
                <div className="overflow-x-auto overflow-y-hidden pb-2">
                  <div className="min-w-full">
                    {/* Month labels */}
                    <div className="flex text-xs text-muted-foreground mb-2 min-w-fit">
                      {monthNames.map((month, index) => (
                        <div key={month} className="text-center flex-shrink-0" style={{ width: '56px' }}>{month}</div>
                      ))}
                    </div>

                    {/* Calendar layout with day labels */}
                    <div className="flex min-w-fit">
                      {/* Day labels */}
                      <div className="flex flex-col space-y-1 text-xs text-muted-foreground mr-2 flex-shrink-0">
                        {dayNames.map(day => (
                          <div key={day} className="h-3 flex items-center justify-end" style={{ width: '20px' }}>{day.slice(0, 1)}</div>
                        ))}
                      </div>

                      {/* Calendar grid with proper week-based layout */}
                      <div 
                        className="grid gap-1 flex-shrink-0" 
                        style={{ 
                          gridTemplateColumns: 'repeat(53, 12px)',
                          gridTemplateRows: 'repeat(7, 12px)',
                          gridAutoFlow: 'column',
                          width: '636px'
                        }}
                      >
                        {Array.from({ length: 53 * 7 }, (_, index) => {
                          // Calculate position in column-first order
                          const dayOfWeek = index % 7
                          const week = Math.floor(index / 7)
                          
                          // Calculate actual date
                          const startOfYear = new Date(2024, 0, 1)
                          const startDay = startOfYear.getDay() // Day of week for Jan 1, 2024
                          
                          // Adjust for proper calendar alignment
                          const dayOffset = week * 7 + dayOfWeek - startDay
                          const date = new Date(2024, 0, 1 + dayOffset)
                          
                          // Check if date is outside 2024
                          if (date.getFullYear() !== 2024) {
                            return (
                              <div
                                key={index}
                                className="w-3 h-3"
                              />
                            )
                          }

                          const dayData = calendarData.find(d => 
                            new Date(d.date).toDateString() === date.toDateString()
                          )

                          return (
                            <div
                              key={index}
                              className={`
                                w-3 h-3 rounded-sm border border-border cursor-pointer
                                transition-all duration-200 hover:scale-110 hover:border-primary
                                ${getIntensityColor(dayData?.intensity || 0)}
                              `}
                              onMouseEnter={() => setHoveredCell(dayData)}
                              onMouseLeave={() => setHoveredCell(null)}
                              title={dayData ? 
                                `${date.toLocaleDateString()}: ${dayData.avgValue.toFixed(1)}` : 
                                date.toLocaleDateString()
                              }
                            />
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Intensity legend */}
            <div className="flex items-center justify-center mt-4 space-x-2 text-xs">
              <span className="text-muted-foreground">Less</span>
              {[0, 0.2, 0.4, 0.6, 0.8, 1].map(intensity => (
                <div
                  key={intensity}
                  className={`w-3 h-3 rounded-sm border border-border ${getIntensityColor(intensity)}`}
                />
              ))}
              <span className="text-muted-foreground">More</span>
            </div>

            {/* Hover tooltip */}
            {hoveredCell && (
              <div className="absolute top-4 right-4 bg-background border rounded-lg p-3 shadow-lg z-10">
                <div className="space-y-2">
                  <div className="font-semibold">
                    {new Date(hoveredCell.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </div>
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span>Avg Value:</span>
                      <span className="font-mono">{hoveredCell.avgValue.toFixed(1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Categories:</span>
                      <span className="font-mono">{hoveredCell.count}</span>
                    </div>
                    {hoveredCell.isWeekend && (
                      <Badge variant="secondary" className="mt-1">Weekend</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}
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
                              <TrendingUp className="h-4 w-4 text-success" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-error" />
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
                              <TrendingUp className="h-4 w-4 text-success" />
                            ) : (
                              <TrendingDown className="h-4 w-4 text-error" />
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

function getIntensityColor(intensity: number): string {
  if (intensity === 0) return 'bg-muted'
  if (intensity <= 0.2) return 'bg-primary/10'
  if (intensity <= 0.4) return 'bg-primary/25'
  if (intensity <= 0.6) return 'bg-primary/40'
  if (intensity <= 0.8) return 'bg-primary/60'
  return 'bg-primary/80'
}