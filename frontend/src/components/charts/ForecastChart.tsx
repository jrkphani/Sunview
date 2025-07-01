import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface ForecastDataPoint {
  date: string
  predicted_volume?: number
  confidence_lower?: number
  confidence_upper?: number
  day_of_week?: string
}

interface ForecastChartProps {
  data: ForecastDataPoint[]
  height?: number
  showConfidenceInterval?: boolean
  timeHorizon?: '1d' | '7d' | '14d' | '28d'
}

export default function ForecastChart({ 
  data = [], 
  height = 300,
  showConfidenceInterval = true 
}: ForecastChartProps) {
  
  const chartConfig = {
    predicted_volume: {
      label: "Predicted Volume",
      color: "hsl(var(--primary))",
    },
    confidence_lower: {
      label: "Lower Confidence Bound",
      color: "hsl(var(--primary))",
    },
    confidence_upper: {
      label: "Upper Confidence Bound", 
      color: "hsl(var(--primary))",
    },
    confidence_area: {
      label: "Confidence Interval",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig
  
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground" role="img" aria-label="No forecast data available">
        <div className="text-center" style={{ gap: 'var(--spacing-2)' }}>
          <p className="text-lg font-medium">No forecast data available</p>
          <p className="text-sm">Generating forecasts from limited pilot data...</p>
        </div>
      </div>
    )
  }

  // Format data for chart with enhanced data points
  const chartData = data.map((item, index) => {
    const date = new Date(item.date)
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    
    return {
      name: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      fullDate: item.date,
      value: item.predicted_volume || 0,
      lower: item.confidence_lower || 0,
      upper: item.confidence_upper || 0,
      dayOfWeek: item.day_of_week || date.toLocaleDateString('en-US', { weekday: 'long' }),
      isWeekend,
      confidenceRange: ((item.confidence_upper || 0) - (item.confidence_lower || 0)),
      confidencePercent: Math.round(((item.confidence_upper || 0) - (item.confidence_lower || 0)) / (item.predicted_volume || 1) * 100),
      dataIndex: index
    }
  })

  // Calculate statistics for enhanced tooltips
  const avgValue = chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length

  return (
    <ChartContainer 
      config={chartConfig}
      className="min-h-[200px] w-full"
      style={{ height }}
      role="img" 
      aria-label={`Forecast chart showing ${data.length} data points with ${showConfidenceInterval ? 'confidence intervals' : 'trend line'}`}
    >
      {showConfidenceInterval ? (
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.3}
            vertical={false}
          />
          <XAxis 
            dataKey="name" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => value.toLocaleString()}
            domain={['dataMin - 100', 'dataMax + 100']}
          />
          <ChartTooltip 
            content={<ChartTooltipContent 
              className="w-80"
              labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) {
                  const data = payload[0].payload
                  return (
                    <div className="space-y-1">
                      <div className="font-semibold text-card-foreground">{label}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span className="font-mono">{data.dayOfWeek}</span>
                        {data.isWeekend && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded-full font-medium">
                            Weekend
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {data.fullDate}
                      </div>
                    </div>
                  )
                }
                return label
              }}
              formatter={(value, _name, props) => {
                if (_name === 'value') {
                  const data = props.payload
                  const confidenceWidth = ((data.upper - data.lower) / data.value * 100).toFixed(1)
                  return [
                    <div key="forecast-details" className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-primary font-semibold">Predicted Volume:</span>
                        <span className="font-mono tabular-nums font-bold text-primary">
                          {value?.toLocaleString()}
                        </span>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Confidence Range:</span>
                          <span className="font-mono tabular-nums">
                            {data.lower?.toLocaleString()} - {data.upper?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Uncertainty:</span>
                          <span className="font-mono tabular-nums">±{confidenceWidth}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">vs Average:</span>
                          <span className={`font-mono tabular-nums ${data.value > avgValue ? 'text-green-600' : 'text-orange-600'}`}>
                            {data.value > avgValue ? '+' : ''}{(((data.value - avgValue) / avgValue) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>,
                    ''
                  ]
                }
                return [value, _name]
              }}
            />}
          />
          
          {/* Reference line for average */}
          <ReferenceLine 
            y={avgValue} 
            stroke="hsl(var(--muted-foreground))" 
            strokeDasharray="5 5" 
            strokeOpacity={0.5}
            label={{ value: "Average", position: "right", fontSize: 10 }}
          />
          
          {/* Confidence interval area */}
          <Area
            type="monotone"
            dataKey="upper"
            stroke="transparent"
            fill="url(#confidenceGradient)"
          />
          <Area
            type="monotone"
            dataKey="lower"
            stroke="transparent"
            fill="hsl(var(--background))"
          />
          
          {/* Main prediction line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ 
              fill: "hsl(var(--primary))", 
              strokeWidth: 2, 
              r: 5,
              stroke: "hsl(var(--background))"
            }}
            activeDot={{ 
              r: 8, 
              fill: "hsl(var(--primary))",
              stroke: "hsl(var(--background))",
              strokeWidth: 2
            }}
          />
          
          <ChartLegend 
            content={<ChartLegendContent />}
          />
        </AreaChart>
      ) : (
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="hsl(var(--border))" 
            strokeOpacity={0.3}
            vertical={false}
          />
          <XAxis 
            dataKey="name" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
            tickFormatter={(value) => value.toLocaleString()}
          />
          <ChartTooltip 
            content={<ChartTooltipContent 
              formatter={(value, _name, props) => {
                const data = props.payload
                return [
                  <div key="simple-forecast" className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-semibold">Volume:</span>
                      <span className="font-mono tabular-nums font-bold text-primary">
                        {value?.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {data.dayOfWeek} • {data.fullDate}
                    </div>
                  </div>,
                  ''
                ]
              }}
            />}
          />
          <ReferenceLine 
            y={avgValue} 
            stroke="hsl(var(--muted-foreground))" 
            strokeDasharray="5 5" 
            strokeOpacity={0.5}
            label={{ value: "Average", position: "right", fontSize: 10 }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            dot={{ 
              fill: "hsl(var(--primary))", 
              strokeWidth: 2, 
              r: 5,
              stroke: "hsl(var(--background))"
            }}
            activeDot={{ 
              r: 8, 
              fill: "hsl(var(--primary))",
              stroke: "hsl(var(--background))",
              strokeWidth: 2
            }}
          />
        </LineChart>
      )}
    </ChartContainer>
  )
}