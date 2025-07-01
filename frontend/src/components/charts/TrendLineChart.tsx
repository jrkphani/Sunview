import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Dot
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface TrendDataPoint {
  date: string
  predicted_volume?: number
  [key: string]: any
}

interface TrendLineChartProps {
  data: TrendDataPoint[]
  height?: number
  title?: string
  dataKey?: string
  yAxisLabel?: string
  showTrend?: boolean
  color?: string
}

export default function TrendLineChart({ 
  data = [], 
  height = 300,
  title = "Trend Analysis",
  dataKey = "predicted_volume",
  yAxisLabel = "Value",
  showTrend = true,
  color = "hsl(var(--primary))"
}: TrendLineChartProps) {
  
  const chartConfig = {
    [dataKey]: {
      label: yAxisLabel,
      color: color,
    },
    trend: {
      label: "Trend Line",
      color: "hsl(var(--muted-foreground))",
    },
  } satisfies ChartConfig

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground" role="img" aria-label="No trend data available">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">No trend data available</p>
          <p className="text-sm">Loading trend analysis...</p>
        </div>
      </div>
    )
  }

  // Enhanced data processing
  const chartData = data.map((item, index) => {
    const date = new Date(item.date)
    const value = item[dataKey] || 0
    
    return {
      name: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      }),
      fullDate: item.date,
      value: value,
      dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long' }),
      isWeekend: date.getDay() === 0 || date.getDay() === 6,
      dataIndex: index,
      dateObj: date,
      ...item
    }
  })

  // Calculate trend statistics
  const values = chartData.map(d => d.value)
  const avgValue = values.reduce((sum, val) => sum + val, 0) / values.length
  const maxValue = Math.max(...values)
  const minValue = Math.min(...values)
  
  // Simple linear regression for trend line
  const trendData = showTrend ? chartData.map((point, index) => {
    const n = chartData.length
    const sumX = chartData.reduce((sum, _, i) => sum + i, 0)
    const sumY = chartData.reduce((sum, d) => sum + d.value, 0)
    const sumXY = chartData.reduce((sum, d, i) => sum + i * d.value, 0)
    const sumXX = chartData.reduce((sum, _, i) => sum + i * i, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    return {
      ...point,
      trend: slope * index + intercept
    }
  }) : chartData

  // Determine trend direction
  const trendDirection = values[values.length - 1] > values[0] ? 'up' : 'down'
  const trendPercent = ((values[values.length - 1] - values[0]) / values[0] * 100).toFixed(1)

  return (
    <ChartContainer 
      config={chartConfig}
      className="min-h-[200px] w-full"
      style={{ height }}
      role="img" 
      aria-label={`${title} showing ${data.length} data points with trend analysis and statistical references`}
    >
      <LineChart 
        data={trendData} 
        margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity={0.8}/>
            <stop offset="100%" stopColor={color} stopOpacity={0.4}/>
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
          tickFormatter={(value) => `${value.toLocaleString()}${
            dataKey.includes('accuracy') || dataKey.includes('percent') ? '%' : ''
          }`}
          domain={['dataMin - 5', 'dataMax + 5']}
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
              const data = props.payload
              const vsAvg = (((data.value - avgValue) / avgValue) * 100).toFixed(1)
              
              return [
                <div key="trend-details" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-semibold">{yAxisLabel}:</span>
                    <span className="font-mono tabular-nums font-bold text-primary">
                      {value?.toLocaleString()}{dataKey.includes('accuracy') || dataKey.includes('percent') ? '%' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">vs Average:</span>
                      <span className={`font-mono tabular-nums ${
                        parseFloat(vsAvg) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {parseFloat(vsAvg) > 0 ? '+' : ''}{vsAvg}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Period High:</span>
                      <span className="font-mono tabular-nums">
                        {maxValue.toLocaleString()}{dataKey.includes('accuracy') || dataKey.includes('percent') ? '%' : ''}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Period Low:</span>
                      <span className="font-mono tabular-nums">
                        {minValue.toLocaleString()}{dataKey.includes('accuracy') || dataKey.includes('percent') ? '%' : ''}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Overall Trend:</span>
                      <span className={`font-mono tabular-nums font-semibold flex items-center gap-1 ${
                        trendDirection === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <span>{trendDirection === 'up' ? '↗' : '↘'}</span>
                        {trendDirection === 'up' ? '+' : ''}{trendPercent}%
                      </span>
                    </div>
                  </div>
                </div>,
                ''
              ]
            }}
          />}
        />
        
        {/* Average reference line */}
        <ReferenceLine 
          y={avgValue} 
          stroke="hsl(var(--muted-foreground))" 
          strokeDasharray="5 5" 
          strokeOpacity={0.5}
          label={{ 
            value: `Avg: ${avgValue.toFixed(1)}${dataKey.includes('accuracy') || dataKey.includes('percent') ? '%' : ''}`, 
            position: "right", 
            fontSize: 10,
            fill: "hsl(var(--muted-foreground))"
          }}
        />
        
        {/* Trend line */}
        {showTrend && (
          <Line
            type="monotone"
            dataKey="trend"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={false}
          />
        )}
        
        {/* Main data line */}
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={3}
          dot={({ cx, cy }) => (
            <Dot 
              cx={cx} 
              cy={cy} 
              r={5} 
              fill={color}
              stroke="hsl(var(--background))"
              strokeWidth={2}
            />
          )}
          activeDot={{ 
            r: 8, 
            fill: color,
            stroke: "hsl(var(--background))",
            strokeWidth: 3
          }}
        />
      </LineChart>
    </ChartContainer>
  )
}