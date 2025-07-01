import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Cell
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface KPIBarData {
  name: string
  current: number
  target: number
  previous: number
  category: string
  unit?: string
  status: 'good' | 'warning' | 'critical'
}

interface KPIBarChartProps {
  data: KPIBarData[]
  height?: number
  title?: string
}

export default function KPIBarChart({ 
  data = [], 
  height = 300,
  title = "KPI Performance"
}: KPIBarChartProps) {
  
  const chartConfig = {
    current: {
      label: "Current Value",
      color: "hsl(var(--primary))",
    },
    target: {
      label: "Target",
      color: "hsl(var(--muted-foreground))",
    },
    previous: {
      label: "Previous",
      color: "hsl(var(--secondary))",
    },
  } satisfies ChartConfig

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground" role="img" aria-label="No KPI data available">
        <div className="text-center space-y-2">
          <p className="text-lg font-medium">No KPI data available</p>
          <p className="text-sm">Loading performance metrics...</p>
        </div>
      </div>
    )
  }

  // Enhanced data with performance indicators
  const chartData = data.map((item) => ({
    ...item,
    performance: (item.current / item.target) * 100,
    improvement: ((item.current - item.previous) / item.previous) * 100,
    shortName: item.name.split(' ').slice(0, 2).join(' '),
    getBarColor: () => {
      if (item.status === 'good') return 'hsl(var(--success))'
      if (item.status === 'warning') return 'hsl(var(--warning))'
      return 'hsl(var(--destructive))'
    }
  }))

  return (
    <ChartContainer 
      config={chartConfig}
      className="min-h-[200px] w-full"
      style={{ height }}
      role="img" 
      aria-label={`${title} showing ${data.length} KPI metrics with performance indicators and targets`}
    >
      <BarChart 
        data={chartData} 
        margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
      >
        <CartesianGrid 
          strokeDasharray="3 3" 
          stroke="hsl(var(--border))" 
          strokeOpacity={0.3}
          vertical={false}
        />
        <XAxis 
          dataKey="shortName" 
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis 
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(value) => `${value}${data[0]?.unit || ''}`}
        />
        
        <ChartTooltip 
          content={<ChartTooltipContent 
            className="w-72"
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                const data = payload[0].payload
                return (
                  <div className="space-y-2">
                    <div className="font-semibold text-card-foreground">{data.name}</div>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${
                        data.status === 'good' ? 'bg-green-500' : 
                        data.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm capitalize font-medium">
                        {data.status} Performance
                      </span>
                    </div>
                  </div>
                )
              }
              return label
            }}
            formatter={(value, _name, props) => {
              const data = props.payload
              const performancePercent = ((data.current / data.target) * 100).toFixed(1)
              const improvement = (((data.current - data.previous) / data.previous) * 100).toFixed(1)
              
              return [
                <div key="kpi-details" className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-primary font-semibold">Current:</span>
                      <span className="font-mono tabular-nums font-bold text-primary">
                        {value?.toLocaleString()}{data.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Target:</span>
                      <span className="font-mono tabular-nums">
                        {data.target?.toLocaleString()}{data.unit}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Previous:</span>
                      <span className="font-mono tabular-nums">
                        {data.previous?.toLocaleString()}{data.unit}
                      </span>
                    </div>
                  </div>
                  
                  <div className="border-t pt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Target Achievement:</span>
                      <span className={`font-mono tabular-nums font-semibold ${
                        parseFloat(performancePercent) >= 100 ? 'text-green-600' : 
                        parseFloat(performancePercent) >= 80 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {performancePercent}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">vs Previous:</span>
                      <span className={`font-mono tabular-nums font-semibold ${
                        parseFloat(improvement) > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {parseFloat(improvement) > 0 ? '+' : ''}{improvement}%
                      </span>
                    </div>
                  </div>
                </div>,
                ''
              ]
            }}
          />}
        />

        {/* Target reference lines for each bar */}
        {chartData.map((item, index) => (
          <ReferenceLine 
            key={`target-${index}`}
            y={item.target} 
            stroke="hsl(var(--muted-foreground))" 
            strokeDasharray="3 3" 
            strokeOpacity={0.6}
          />
        ))}

        <Bar 
          dataKey="current" 
          radius={[4, 4, 0, 0]}
          fill="hsl(var(--primary))"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.getBarColor()} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}