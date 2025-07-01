import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DataTable, createSortableHeader, createSelectionColumn } from "@/components/ui/data-table"

export interface AnalyticsData {
  id: string
  sku: string
  description: string
  forecast_accuracy: number
  volume_predicted: number
  volume_actual?: number
  demand_variance: number
  category: string
  priority: 'high' | 'medium' | 'low'
  last_updated: string
  confidence_score: number
}

const columns: ColumnDef<AnalyticsData>[] = [
  createSelectionColumn<AnalyticsData>(),
  createSortableHeader<AnalyticsData>("sku", "SKU"),
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => (
      <div className="max-w-[200px] truncate" title={row.getValue("description")}>
        {row.getValue("description")}
      </div>
    ),
  },
  {
    accessorKey: "forecast_accuracy",
    header: ({ column }) => (
      <button
        className="font-semibold hover:text-primary"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Accuracy
      </button>
    ),
    cell: ({ row }) => {
      const accuracy = parseFloat(row.getValue("forecast_accuracy"))
      return (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-mono tabular-nums">
              {accuracy.toFixed(1)}%
            </span>
          </div>
          <Progress 
            value={accuracy} 
            className="h-2"
            aria-label={`Forecast accuracy: ${accuracy.toFixed(1)}%`}
          />
        </div>
      )
    },
  },
  {
    accessorKey: "volume_predicted",
    header: ({ column }) => (
      <button
        className="font-semibold hover:text-primary text-right"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Predicted Volume
      </button>
    ),
    cell: ({ row }) => (
      <div className="text-right font-mono tabular-nums">
        {parseInt(row.getValue("volume_predicted")).toLocaleString()}
      </div>
    ),
  },
  {
    accessorKey: "volume_actual",
    header: "Actual Volume",
    cell: ({ row }) => {
      const actual = row.original.volume_actual
      return (
        <div className="text-right font-mono tabular-nums">
          {actual ? actual.toLocaleString() : 
            <span className="text-muted-foreground">Pending</span>
          }
        </div>
      )
    },
  },
  {
    accessorKey: "confidence_score",
    header: "Confidence",
    cell: ({ row }) => {
      const confidence = row.original.confidence_score * 100
      const getConfidenceColor = (score: number) => {
        if (score >= 90) return "text-success"
        if (score >= 75) return "text-warning"
        return "text-destructive"
      }
      
      return (
        <div className={`font-mono tabular-nums ${getConfidenceColor(confidence)}`}>
          {confidence.toFixed(0)}%
        </div>
      )
    },
  },
  {
    accessorKey: "priority",
    header: "Priority",
    cell: ({ row }) => {
      const priority = row.getValue("priority") as string
      
      return (
        <Badge variant={
          priority === 'high' ? 'destructive' : 
          priority === 'medium' ? 'secondary' : 
          'outline'
        }>
          {priority.charAt(0).toUpperCase() + priority.slice(1)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => (
      <Badge variant="outline">
        {row.getValue("category")}
      </Badge>
    ),
  },
  {
    accessorKey: "last_updated",
    header: "Last Updated",
    cell: ({ row }) => {
      const date = new Date(row.getValue("last_updated"))
      return (
        <div className="text-sm text-muted-foreground">
          {date.toLocaleDateString()}
        </div>
      )
    },
  },
]

interface AnalyticsDataTableProps {
  data: AnalyticsData[]
}

export function AnalyticsDataTable({ data }: AnalyticsDataTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="sku"
      searchPlaceholder="Search SKU or description..."
    />
  )
}