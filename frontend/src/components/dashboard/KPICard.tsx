import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'stable'
  change?: string
  severity?: 'success' | 'warning' | 'error' | 'info' | 'default'
  description?: string
  className?: string
}

const severityStyles = {
  success: 'text-success bg-success/10 border-success/20',
  warning: 'text-warning bg-warning/10 border-warning/20',
  error: 'text-destructive bg-destructive/10 border-destructive/20', 
  info: 'text-primary bg-primary/10 border-primary/20',
  default: 'text-muted-foreground bg-muted/10 border-muted/20'
}

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus
}

const trendColors = {
  up: 'text-success',
  down: 'text-destructive', 
  stable: 'text-muted-foreground'
}

export default function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  change,
  severity = 'default',
  description,
  className
}: KPICardProps) {
  const TrendIcon = trend ? trendIcons[trend] : null

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)} role="article" aria-labelledby={`kpi-title-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0" style={{ paddingBottom: 'var(--spacing-2)' }}>
        <CardTitle id={`kpi-title-${title.replace(/\s+/g, '-').toLowerCase()}`} className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
      </CardHeader>
      <CardContent>
        <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
          <div className="text-2xl font-bold" role="text" aria-label={`${title} value is ${value}`}>{value}</div>
          {trend && change && TrendIcon && (
            <div className={cn("flex items-center", trendColors[trend])} style={{ gap: 'var(--spacing-1)' }}>
              <TrendIcon className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm font-medium" role="text" aria-label={`Change is ${change} ${trend}`}>{change}</span>
            </div>
          )}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground" style={{ marginTop: 'var(--spacing-1)' }}>{description}</p>
        )}
        {severity !== 'default' && (
          <Badge 
            variant="outline" 
            className={cn(severityStyles[severity])}
            style={{ marginTop: 'var(--spacing-2)' }}
            role="status"
            aria-label={`Status: ${severity}`}
          >
            {severity.charAt(0).toUpperCase() + severity.slice(1)}
          </Badge>
        )}
      </CardContent>
    </Card>
  )
}