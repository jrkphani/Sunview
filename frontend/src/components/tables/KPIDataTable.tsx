import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTable, createSortableHeader } from "@/components/ui/data-table"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export interface KPIData {
  id: string
  metric: string
  current_value: number
  previous_value: number
  unit: string
  category: 'accuracy' | 'efficiency' | 'cost' | 'service'
  trend: 'up' | 'down' | 'stable'
  change_percentage: number
  target?: number
  status: 'good' | 'warning' | 'critical'
}

const columns: ColumnDef<KPIData>[] = [
  createSortableHeader<KPIData>("metric", "Metric"),
  {
    accessorKey: "current_value",
    header: ({ column }) => (
      <button
        className="font-semibold hover:text-primary"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Current Value
      </button>
    ),
    cell: ({ row }) => {
      const value = parseFloat(row.getValue("current_value"))
      const unit = row.original.unit
      return (
        <div className="font-mono tabular-nums">
          {value.toLocaleString()}{unit}
        </div>
      )
    },
  },
  {
    accessorKey: "trend",
    header: "Trend",
    cell: ({ row }) => {
      const trend = row.getValue("trend") as string
      const change = row.original.change_percentage
      
      return (
        <div className="flex items-center space-x-2">
          {trend === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
          {trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
          {trend === 'stable' && <Minus className="h-4 w-4 text-muted-foreground" />}
          <span className={`text-sm font-mono tabular-nums ${
            trend === 'up' ? 'text-success' : 
            trend === 'down' ? 'text-destructive' : 
            'text-muted-foreground'
          }`}>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category") as string
      const categoryColors = {
        accuracy: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
        efficiency: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
        cost: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
        service: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      }
      
      return (
        <Badge variant="outline" className={categoryColors[category as keyof typeof categoryColors]}>
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      
      return (
        <Badge variant={
          status === 'good' ? 'default' : 
          status === 'warning' ? 'secondary' : 
          'destructive'
        }>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "target",
    header: "Target",
    cell: ({ row }) => {
      const target = row.original.target
      const unit = row.original.unit
      if (!target) return <span className="text-muted-foreground">-</span>
      
      return (
        <div className="font-mono tabular-nums text-muted-foreground">
          {target.toLocaleString()}{unit}
        </div>
      )
    },
  },
]

interface KPIDataTableProps {
  data: KPIData[]
}

export function KPIDataTable({ data }: KPIDataTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="metric"
      searchPlaceholder="Search metrics..."
    />
  )
}