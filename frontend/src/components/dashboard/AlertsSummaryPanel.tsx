import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  AlertTriangle, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  ExternalLink, 
  Filter,
  TrendingUp,
  Package,
  Truck,
  BarChart3,
  Bell,
  X,
  Check,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

import type { DrillDownFilters, AlertData } from '@/types/api'

interface AlertsSummaryPanelProps {
  filters?: DrillDownFilters
  className?: string
  onNavigateToRisk?: () => void
  onNavigateToResilience?: () => void
}

// Mock data - replace with actual API call
const mockAlerts: AlertData[] = [
  {
    id: 'alert-001',
    title: 'Forecast Accuracy Declining',
    description: 'MAPE has increased by 15% over the last 7 days for Electronics category',
    severity: 'high',
    category: 'forecast',
    created_at: '2024-01-07T10:30:00Z',
    status: 'active',
    impact_score: 8.5,
    recommended_action: 'Review model parameters and recent demand patterns',
    drill_down_link: '/risk-analysis/forecast-accuracy'
  },
  {
    id: 'alert-002',
    title: 'Inventory Excess Alert',
    description: '5 SKUs in Home & Garden category have DOH > 40 days',
    severity: 'medium',
    category: 'inventory',
    created_at: '2024-01-07T09:15:00Z',
    status: 'active',
    impact_score: 6.8,
    recommended_action: 'Consider promotional pricing or redistribution',
    drill_down_link: '/resilience/inventory-optimization'
  },
  {
    id: 'alert-003',
    title: 'Truck Utilization Below Target',
    description: 'Route A-1 → B-2 utilization at 65.4%, below 80% target',
    severity: 'medium',
    category: 'logistics',
    created_at: '2024-01-07T08:45:00Z',
    status: 'acknowledged',
    impact_score: 7.2,
    recommended_action: 'Evaluate consolidation opportunities',
    drill_down_link: '/resilience/logistics-optimization'
  },
  {
    id: 'alert-004',
    title: 'OTIF Performance Drop',
    description: 'Hub-South OTIF dropped to 73.6%, below 75% SLA',
    severity: 'critical',
    category: 'performance',
    created_at: '2024-01-07T07:20:00Z',
    status: 'active',
    impact_score: 9.1,
    recommended_action: 'Immediate site performance review required',
    drill_down_link: '/risk-analysis/performance-monitoring'
  },
  {
    id: 'alert-005',
    title: 'Demand Pattern Anomaly',
    description: 'Unusual spike in Gaming Laptop demand detected',
    severity: 'low',
    category: 'forecast',
    created_at: '2024-01-07T06:00:00Z',
    status: 'resolved',
    impact_score: 4.3,
    recommended_action: 'Monitor for trend continuation',
    drill_down_link: '/risk-analysis/anomaly-detection'
  }
]

export default function AlertsSummaryPanel({ 
  filters, 
  className, 
  onNavigateToRisk, 
  onNavigateToResilience 
}: AlertsSummaryPanelProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  const data = mockAlerts // In real app: useKeyAlerts(filters)

  const getSeverityIcon = (severity: AlertData['severity']) => {
    switch (severity) {
      case 'critical': return AlertTriangle
      case 'high': return AlertCircle
      case 'medium': return Clock
      case 'low': return CheckCircle
    }
  }

  const getSeverityColor = (severity: AlertData['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-600'
      case 'high': return 'text-orange-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-blue-600'
    }
  }

  const getSeverityBadge = (severity: AlertData['severity']) => {
    switch (severity) {
      case 'critical': return 'destructive'
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
    }
  }

  const getCategoryIcon = (category: AlertData['category']) => {
    switch (category) {
      case 'forecast': return TrendingUp
      case 'inventory': return Package
      case 'logistics': return Truck
      case 'performance': return BarChart3
    }
  }

  const getStatusIcon = (status: AlertData['status']) => {
    switch (status) {
      case 'active': return Bell
      case 'acknowledged': return Clock
      case 'resolved': return CheckCircle
    }
  }

  const getStatusColor = (status: AlertData['status']) => {
    switch (status) {
      case 'active': return 'text-red-600'
      case 'acknowledged': return 'text-yellow-600'
      case 'resolved': return 'text-green-600'
    }
  }

  const handleNavigate = (alert: AlertData) => {
    if (alert.drill_down_link?.includes('/risk-analysis')) {
      onNavigateToRisk?.()
    } else if (alert.drill_down_link?.includes('/resilience')) {
      onNavigateToResilience?.()
    }
  }

  const handleAcknowledge = (alertId: string) => {
    // In real app: acknowledgeAlert(alertId)
    console.log('Acknowledging alert:', alertId)
  }

  const handleResolve = (alertId: string) => {
    // In real app: resolveAlert(alertId)
    console.log('Resolving alert:', alertId)
  }

  // Filter alerts
  const filteredAlerts = data.filter(alert => {
    const severityMatch = selectedSeverity === 'all' || alert.severity === selectedSeverity
    const categoryMatch = selectedCategory === 'all' || alert.category === selectedCategory
    return severityMatch && categoryMatch
  })

  const alertStats = {
    total: data.length,
    active: data.filter(a => a.status === 'active').length,
    critical: data.filter(a => a.severity === 'critical').length,
    avgImpact: data.reduce((acc, alert) => acc + alert.impact_score, 0) / data.length
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Key Alerts Summary</CardTitle>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Active Alerts:</span>
            <Badge variant={alertStats.active > 3 ? 'destructive' : 'secondary'}>
              {alertStats.active}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Critical:</span>
            <Badge variant={alertStats.critical > 0 ? 'destructive' : 'outline'}>
              {alertStats.critical}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Recent Alerts List */}
        <div className="space-y-3">
          {filteredAlerts.slice(0, 5).map((alert) => {
            const SeverityIcon = getSeverityIcon(alert.severity)
            const CategoryIcon = getCategoryIcon(alert.category)
            const StatusIcon = getStatusIcon(alert.status)
            
            return (
              <div 
                key={alert.id} 
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => handleNavigate(alert)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('mt-0.5', getSeverityColor(alert.severity))}>
                    <SeverityIcon className="h-4 w-4" />
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-sm">{alert.title}</div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSeverityBadge(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <div className={cn('', getStatusColor(alert.status))}>
                          <StatusIcon className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      {alert.description}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs">
                        <CategoryIcon className="h-3 w-3" />
                        <span className="capitalize">{alert.category}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">
                          Impact: {alert.impact_score.toFixed(1)}/10
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {alert.status === 'active' && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="p-1 h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAcknowledge(alert.id)
                                  }}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Acknowledge alert</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Quick Navigation */}
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="text-xs text-muted-foreground mb-2">Quick Navigation</div>
          <div className="grid grid-cols-1 gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start gap-2"
              onClick={onNavigateToRisk}
            >
              <AlertTriangle className="h-4 w-4 text-red-600" />
              Risk Analysis Panel
              <Badge variant="destructive" className="ml-auto">
                {data.filter(a => a.drill_down_link?.includes('/risk-analysis')).length}
              </Badge>
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="justify-start gap-2"
              onClick={onNavigateToResilience}
            >
              <Package className="h-4 w-4 text-blue-600" />
              Resilience Panel
              <Badge variant="secondary" className="ml-auto">
                {data.filter(a => a.drill_down_link?.includes('/resilience')).length}
              </Badge>
            </Button>
          </div>
        </div>
      </CardContent>

      {/* All Alerts Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              All System Alerts
            </DialogTitle>
            <DialogDescription>
              Comprehensive view of all system alerts with filtering and management capabilities
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Filters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select 
                  value={selectedSeverity} 
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="text-sm border rounded px-2 py-1"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">All Categories</option>
                <option value="forecast">Forecast</option>
                <option value="inventory">Inventory</option>
                <option value="logistics">Logistics</option>
                <option value="performance">Performance</option>
              </select>
            </div>

            {/* Summary Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Alert Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Total Alerts</div>
                    <div className="text-2xl font-bold">{alertStats.total}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Active</div>
                    <div className="text-2xl font-bold text-red-600">{alertStats.active}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Critical</div>
                    <div className="text-2xl font-bold text-red-600">{alertStats.critical}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground">Avg Impact</div>
                    <div className="text-2xl font-bold">{alertStats.avgImpact.toFixed(1)}/10</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Alerts List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Alert Details ({filteredAlerts.length} items)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredAlerts.map((alert) => {
                    const SeverityIcon = getSeverityIcon(alert.severity)
                    const CategoryIcon = getCategoryIcon(alert.category)
                    const StatusIcon = getStatusIcon(alert.status)
                    
                    return (
                      <div key={alert.id} className="p-4 border rounded-lg space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={cn('', getSeverityColor(alert.severity))}>
                              <SeverityIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="font-medium">{alert.title}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(alert.created_at).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityBadge(alert.severity)}>
                              {alert.severity}
                            </Badge>
                            <div className={cn('', getStatusColor(alert.status))}>
                              <StatusIcon className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-sm">{alert.description}</div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <CategoryIcon className="h-3 w-3" />
                            <span className="capitalize">{alert.category}</span>
                          </div>
                          <div>Impact Score: {alert.impact_score.toFixed(1)}/10</div>
                          <div>Status: <span className="capitalize">{alert.status}</span></div>
                        </div>
                        
                        <div className="bg-primary/10 p-3 rounded text-sm">
                          <div className="font-medium text-primary">Recommended Action:</div>
                          <div className="text-neutral-700">{alert.recommended_action}</div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleNavigate(alert)}
                            className="gap-2"
                          >
                            <ExternalLink className="h-4 w-4" />
                            View Details
                          </Button>
                          
                          <div className="flex items-center gap-2">
                            {alert.status === 'active' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleAcknowledge(alert.id)}
                                >
                                  Acknowledge
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm"
                                  onClick={() => handleResolve(alert.id)}
                                >
                                  Resolve
                                </Button>
                              </>
                            )}
                            
                            {alert.status === 'acknowledged' && (
                              <Button 
                                variant="default" 
                                size="sm"
                                onClick={() => handleResolve(alert.id)}
                              >
                                Resolve
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}