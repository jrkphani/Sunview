import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DataTable, createSelectionColumn, createActionColumn } from "@/components/ui/data-table"
import { Lightbulb, TrendingUp, AlertTriangle, DollarSign } from "lucide-react"

export interface InsightData {
  id: string
  title: string
  category: 'operational_efficiency' | 'strategic_partnership' | 'commercial_opportunity' | 'risk_management'
  impact: number
  confidence: number
  description: string
  status: 'new' | 'reviewed' | 'implemented' | 'dismissed'
  created_date: string
  priority: 'high' | 'medium' | 'low'
  estimated_savings?: number
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'operational_efficiency':
      return TrendingUp
    case 'commercial_opportunity':
      return DollarSign
    case 'risk_management':
      return AlertTriangle
    default:
      return Lightbulb
  }
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'operational_efficiency':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'strategic_partnership':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'commercial_opportunity':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
    case 'risk_management':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

const columns: ColumnDef<InsightData>[] = [
  createSelectionColumn<InsightData>(),
  {
    accessorKey: "title",
    header: ({ column }) => (
      <button
        className="font-semibold hover:text-primary"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Insight
      </button>
    ),
    cell: ({ row }) => (
      <div className="max-w-[300px]">
        <div className="font-medium">{row.getValue("title")}</div>
        <div className="text-sm text-muted-foreground truncate">
          {row.original.description}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const category = row.getValue("category") as string
      const IconComponent = getCategoryIcon(category)
      const colorClass = getCategoryColor(category)
      
      return (
        <Badge variant="outline" className={colorClass}>
          <IconComponent className="h-3 w-3 mr-1" />
          {category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
        </Badge>
      )
    },
  },
  {
    accessorKey: "impact",
    header: ({ column }) => (
      <button
        className="font-semibold hover:text-primary"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Impact Score
      </button>
    ),
    cell: ({ row }) => {
      const impact = parseFloat(row.getValue("impact"))
      const getImpactColor = (score: number) => {
        if (score >= 8) return "text-success"
        if (score >= 6) return "text-warning"
        return "text-muted-foreground"
      }
      
      return (
        <div className="space-y-1">
          <div className={`font-mono tabular-nums font-medium ${getImpactColor(impact)}`}>
            {impact.toFixed(1)}/10
          </div>
          <Progress 
            value={impact * 10} 
            className="h-2"
            aria-label={`Impact score: ${impact.toFixed(1)} out of 10`}
          />
        </div>
      )
    },
  },
  {
    accessorKey: "confidence",
    header: "Confidence",
    cell: ({ row }) => {
      const confidence = row.original.confidence * 100
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
    accessorKey: "estimated_savings",
    header: "Est. Savings",
    cell: ({ row }) => {
      const savings = row.original.estimated_savings
      if (!savings) return <span className="text-muted-foreground">-</span>
      
      return (
        <div className="font-mono tabular-nums text-success">
          ${savings.toLocaleString()}
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      const statusColors = {
        new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
        reviewed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
        implemented: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        dismissed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      }
      
      return (
        <Badge variant="outline" className={statusColors[status as keyof typeof statusColors]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    },
  },
  {
    accessorKey: "created_date",
    header: "Created",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_date"))
      return (
        <div className="text-sm text-muted-foreground">
          {date.toLocaleDateString()}
        </div>
      )
    },
  },
  createActionColumn<InsightData>(
    undefined, // onEdit
    undefined, // onDelete
    [
      {
        label: "Mark as Reviewed",
        onClick: (row) => console.log("Mark as reviewed:", row.id)
      },
      {
        label: "Export Details",
        onClick: (row) => console.log("Export:", row.id)
      }
    ]
  )
]

interface InsightsDataTableProps {
  data: InsightData[]
}

export function InsightsDataTable({ data }: InsightsDataTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="title"
      searchPlaceholder="Search insights..."
    />
  )
}