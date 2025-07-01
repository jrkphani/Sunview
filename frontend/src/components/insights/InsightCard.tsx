import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TrendingUp, Lightbulb, AlertTriangle, DollarSign } from 'lucide-react'

interface InsightCardProps {
  title: string
  category: 'operational_efficiency' | 'strategic_partnership' | 'commercial_opportunity' | 'risk_management'
  impact: number
  confidence: number
  description: string
  compact?: boolean
  className?: string
}

const categoryConfig = {
  operational_efficiency: {
    icon: TrendingUp,
    color: 'text-insight-operational bg-insight-operational/10 border-insight-operational/20',
    label: 'Operational'
  },
  strategic_partnership: {
    icon: Lightbulb,
    color: 'text-insight-strategic bg-insight-strategic/10 border-insight-strategic/20',
    label: 'Strategic'
  },
  commercial_opportunity: {
    icon: DollarSign,
    color: 'text-insight-commercial bg-insight-commercial/10 border-insight-commercial/20',
    label: 'Commercial'
  },
  risk_management: {
    icon: AlertTriangle,
    color: 'text-insight-risk bg-insight-risk/10 border-insight-risk/20',
    label: 'Risk'
  }
}

export default function InsightCard({
  title,
  category,
  impact,
  confidence,
  description,
  compact = false,
  className
}: InsightCardProps) {
  const config = categoryConfig[category]
  const Icon = config.icon

  const impactLevel = impact >= 8 ? 'High' : impact >= 6 ? 'Medium' : 'Low'
  const confidenceLevel = confidence >= 0.8 ? 'High' : confidence >= 0.6 ? 'Medium' : 'Low'

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)} role="article" aria-labelledby={`insight-title-${title.replace(/\s+/g, '-').toLowerCase()}`}>
      <CardHeader style={{ paddingBottom: compact ? 'var(--spacing-2)' : 'var(--spacing-3)' }}>
        <div className="flex items-start justify-between">
          <CardTitle id={`insight-title-${title.replace(/\s+/g, '-').toLowerCase()}`} className={compact ? "text-sm" : "text-base"}>
            {title}
          </CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" style={{ marginLeft: 'var(--spacing-2)' }} aria-hidden="true" />
        </div>
        <div className="flex items-center" style={{ gap: 'var(--spacing-2)' }}>
          <Badge variant="outline" className={cn("text-xs", config.color)} role="status" aria-label={`Category: ${config.label}`}>
            {config.label}
          </Badge>
          <Badge variant="outline" className="text-xs" role="status" aria-label={`Impact level: ${impactLevel}`}>
            Impact: {impactLevel}
          </Badge>
          <Badge variant="outline" className="text-xs" role="status" aria-label={`Confidence: ${Math.round(confidence * 100)} percent`}>
            {Math.round(confidence * 100)}% confident
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className={cn(
          "text-muted-foreground",
          compact ? "text-xs" : "text-sm"
        )}>
          {description}
        </p>
        {!compact && (
          <div className="flex items-center justify-between text-xs text-muted-foreground" style={{ marginTop: 'var(--spacing-3)' }}>
            <span>Impact Score: {impact}/10</span>
            <span>Confidence: {confidenceLevel}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}