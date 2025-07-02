import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { 
  ArrowRight, 
  ArrowUp, 
  ArrowDown, 
  TrendingUp, 
  TrendingDown,
  RotateCcw,
  Eye,
  Activity,
  Users,
  DollarSign
} from 'lucide-react'

interface SKULifecycleTransition {
  source: string
  target: string
  value: number
  products: number
}

interface SKULifecycleData {
  stages: string[]
  transitions: SKULifecycleTransition[]
  summary: {
    totalProducts: number
    stageDistribution: Record<string, number>
  }
}

interface SKULifecycleSankeyProps {
  data: SKULifecycleData
  height?: number
  compact?: boolean
  className?: string
}

const stageColors = {
  'Introduction': 'hsl(120, 70%, 50%)', // Green
  'Growth': 'hsl(60, 70%, 50%)',       // Yellow-green
  'Maturity': 'hsl(210, 70%, 50%)',    // Blue
  'Decline': 'hsl(0, 70%, 50%)'        // Red
}

const stageIcons = {
  'Introduction': Activity,
  'Growth': TrendingUp,
  'Maturity': Users,
  'Decline': TrendingDown
}

export default function SKULifecycleSankey({ 
  data, 
  height = 500,
  compact = false,
  className 
}: SKULifecycleSankeyProps) {
  const [selectedView, setSelectedView] = useState<string>('flow')
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedTransition, setSelectedTransition] = useState<SKULifecycleTransition | null>(null)

  // Process lifecycle data for visualization
  const lifecycleMetrics = useMemo(() => {
    if (!data) return null

    const { stages, transitions, summary } = data
    
    // Calculate transition rates
    const transitionRates = transitions.map(t => ({
      ...t,
      rate: (t.value / summary.stageDistribution[t.source]) * 100
    }))

    // Calculate stage health metrics
    const stageMetrics = stages.map(stage => {
      const incomingTransitions = transitions.filter(t => t.target === stage)
      const outgoingTransitions = transitions.filter(t => t.source === stage)
      
      const incomingValue = incomingTransitions.reduce((sum, t) => sum + t.value, 0)
      const outgoingValue = outgoingTransitions.reduce((sum, t) => sum + t.value, 0)
      
      const netFlow = incomingValue - outgoingValue
      const currentProducts = summary.stageDistribution[stage]
      
      return {
        stage,
        currentProducts,
        incomingValue,
        outgoingValue,
        netFlow,
        healthScore: calculateStageHealth(stage, netFlow, currentProducts),
        trend: netFlow > 0 ? 'growing' : netFlow < 0 ? 'shrinking' : 'stable'
      }
    })

    // Identify key transitions
    const criticalTransitions = transitionRates
      .filter(t => t.rate > 10) // Transitions affecting >10% of products
      .sort((a, b) => b.rate - a.rate)

    return {
      transitionRates,
      stageMetrics,
      criticalTransitions,
      totalProducts: summary.totalProducts
    }
  }, [data])

  const chartConfig = {
    value: {
      label: 'Product Flow',
      color: 'hsl(var(--primary))',
    },
  } satisfies ChartConfig

  if (!data || !data.stages.length) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <div className="text-center space-y-2">
            <ArrowRight className="h-12 w-12 mx-auto opacity-50" />
            <p className="text-lg font-medium">No lifecycle data available</p>
            <p className="text-sm">Sankey flow diagram will appear when data is loaded</p>
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
              <ArrowRight className="h-5 w-5" />
              <CardTitle>SKU Lifecycle Flow Analysis</CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {lifecycleMetrics?.totalProducts.toLocaleString()} SKUs
              </Badge>
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent>
        <Tabs value={selectedView} onValueChange={setSelectedView} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="flow">Lifecycle Flow</TabsTrigger>
            <TabsTrigger value="stages">Stage Analysis</TabsTrigger>
            <TabsTrigger value="transitions">Transition Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="flow" className="space-y-4">
            <ChartContainer config={chartConfig} className="w-full" style={{ height }}>
              <div className="sankey-diagram p-6">
                {/* Stage Nodes */}
                <div className="grid grid-cols-4 gap-8 mb-8">
                  {data.stages.map((stage, index) => {
                    const StageIcon = stageIcons[stage as keyof typeof stageIcons]
                    const stageData = lifecycleMetrics?.stageMetrics.find(s => s.stage === stage)
                    const isHovered = hoveredNode === stage
                    
                    return (
                      <div
                        key={stage}
                        className={`
                          relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
                          ${isHovered ? 'border-primary shadow-lg scale-105' : 'border-border hover:border-primary/50'}
                        `}
                        style={{ backgroundColor: `${stageColors[stage as keyof typeof stageColors]}15` }}
                        onMouseEnter={() => setHoveredNode(stage)}
                        onMouseLeave={() => setHoveredNode(null)}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <StageIcon 
                            className="h-5 w-5" 
                            style={{ color: stageColors[stage as keyof typeof stageColors] }}
                          />
                          <h3 className="font-semibold text-sm">{stage}</h3>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-lg font-bold">
                            {data.summary.stageDistribution[stage]?.toLocaleString()}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {((data.summary.stageDistribution[stage] / data.summary.totalProducts) * 100).toFixed(1)}% of SKUs
                          </div>
                          
                          {stageData && (
                            <div className="flex items-center space-x-1 mt-2">
                              {stageData.trend === 'growing' ? (
                                <ArrowUp className="h-3 w-3 text-green-500" />
                              ) : stageData.trend === 'shrinking' ? (
                                <ArrowDown className="h-3 w-3 text-red-500" />
                              ) : (
                                <ArrowRight className="h-3 w-3 text-neutral-400" />
                              )}
                              <span className="text-xs">
                                {stageData.trend}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Health indicator */}
                        {stageData && (
                          <div className="absolute top-2 right-2">
                            <div 
                              className={`w-3 h-3 rounded-full ${
                                stageData.healthScore >= 0.7 ? 'bg-green-500' :
                                stageData.healthScore >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              title={`Health Score: ${(stageData.healthScore * 100).toFixed(0)}%`}
                            />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Flow Arrows */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-sm">Lifecycle Transitions</h4>
                    <div className="text-xs text-neutral-500">
                      {data.transitions.length} transitions • Click to view details
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {data.transitions.map((transition, index) => {
                    const sourceIndex = data.stages.indexOf(transition.source)
                    const targetIndex = data.stages.indexOf(transition.target)
                    const isSelected = selectedTransition?.source === transition.source && 
                                     selectedTransition?.target === transition.target
                    
                    return (
                      <div
                        key={`${transition.source}-${transition.target}`}
                        className={`
                          flex items-center justify-between p-3 rounded-lg border cursor-pointer
                          transition-all duration-200 hover:border-primary hover:shadow-md
                          ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}
                        `}
                        onClick={() => setSelectedTransition(isSelected ? null : transition)}
                      >
                        <div className="flex items-center min-w-0 flex-1">
                          <div className="flex items-center space-x-1 min-w-0">
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: stageColors[transition.source as keyof typeof stageColors] }}
                            />
                            <span className="text-xs font-medium truncate">{transition.source}</span>
                          </div>
                          
                          <ArrowRight className="h-3 w-3 text-muted-foreground mx-1 flex-shrink-0" />
                          
                          <div className="flex items-center space-x-1 min-w-0">
                            <div 
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: stageColors[transition.target as keyof typeof stageColors] }}
                            />
                            <span className="text-xs font-medium truncate">{transition.target}</span>
                          </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-sm font-bold">{transition.products.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">
                            {((transition.value / data.summary.totalProducts) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                </div>

                {/* Selected Transition Details */}
                {selectedTransition && (
                  <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-primary">Transition Details</h4>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setSelectedTransition(null)}
                        className="text-xs px-2 py-1 h-auto"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Close
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <span className="text-sm text-neutral-600">Products Moving:</span>
                        <div className="text-lg font-mono font-bold text-neutral-900 break-words">
                          {selectedTransition.products.toLocaleString()}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-sm text-neutral-600">Transition Rate:</span>
                        <div className="text-lg font-mono font-bold text-neutral-900 break-words">
                          {((selectedTransition.value / data.summary.stageDistribution[selectedTransition.source]) * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                        <span className="text-sm text-neutral-600">Impact:</span>
                        <div className="text-lg font-mono font-bold text-neutral-900 break-words">
                          {((selectedTransition.value / data.summary.totalProducts) * 100).toFixed(1)}% of total
                        </div>
                      </div>
                    </div>
                    
                    {/* Additional context */}
                    <div className="mt-4 pt-3 border-t border-primary/10">
                      <div className="text-xs text-neutral-500 flex flex-wrap items-center gap-1">
                        <span>Transition from</span>
                        <span className="font-medium text-primary px-1 py-0.5 bg-primary/10 rounded">
                          {selectedTransition.source}
                        </span>
                        <span>to</span>
                        <span className="font-medium text-primary px-1 py-0.5 bg-primary/10 rounded">
                          {selectedTransition.target}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ChartContainer>
          </TabsContent>

          <TabsContent value="stages" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lifecycleMetrics?.stageMetrics.map(stageData => {
                const StageIcon = stageIcons[stageData.stage as keyof typeof stageIcons]
                
                return (
                  <Card key={stageData.stage}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-2">
                        <StageIcon 
                          className="h-5 w-5" 
                          style={{ color: stageColors[stageData.stage as keyof typeof stageColors] }}
                        />
                        <CardTitle className="text-lg">{stageData.stage}</CardTitle>
                        <Badge variant={stageData.trend === 'growing' ? 'default' : 
                                      stageData.trend === 'shrinking' ? 'destructive' : 'secondary'}>
                          {stageData.trend}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-600">Current Products:</span>
                          <span className="font-mono font-bold">{stageData.currentProducts.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-600">Incoming Flow:</span>
                          <span className="font-mono">{stageData.incomingValue.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-600">Outgoing Flow:</span>
                          <span className="font-mono">{stageData.outgoingValue.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2">
                          <span className="text-sm text-neutral-600">Net Flow:</span>
                          <span className={`font-mono font-bold ${
                            stageData.netFlow > 0 ? 'text-green-600' : 
                            stageData.netFlow < 0 ? 'text-error' : 'text-neutral-600'
                          }`}>
                            {stageData.netFlow > 0 ? '+' : ''}{stageData.netFlow.toFixed(1)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-neutral-600">Health Score:</span>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono">{(stageData.healthScore * 100).toFixed(0)}%</span>
                            <div className={`w-3 h-3 rounded-full ${
                              stageData.healthScore >= 0.7 ? 'bg-green-500' :
                              stageData.healthScore >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
                            }`} />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="transitions" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Critical Transitions</h3>
              {lifecycleMetrics?.criticalTransitions.map(transition => (
                <Card key={`${transition.source}-${transition.target}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: stageColors[transition.source as keyof typeof stageColors] }}
                          />
                          <span className="font-medium">{transition.source}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-neutral-400" />
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: stageColors[transition.target as keyof typeof stageColors] }}
                          />
                          <span className="font-medium">{transition.target}</span>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold">{transition.rate.toFixed(1)}%</div>
                        <div className="text-sm text-neutral-500">
                          {transition.products.toLocaleString()} products
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Helper function to calculate stage health score
function calculateStageHealth(stage: string, netFlow: number, currentProducts: number): number {
  // Health score based on stage type and flow dynamics
  const baseScore = 0.5
  
  switch (stage) {
    case 'Introduction':
      // Healthy if products are flowing in (positive growth)
      return Math.min(1, baseScore + (netFlow > 0 ? 0.3 : -0.2))
    
    case 'Growth':
      // Healthy with positive net flow, but too much outflow is concerning
      return Math.min(1, baseScore + (netFlow > 0 ? 0.4 : netFlow < -10 ? -0.3 : 0.1))
    
    case 'Maturity':
      // Stable is healthy, too much outflow to decline is concerning
      return Math.min(1, baseScore + (Math.abs(netFlow) < 5 ? 0.3 : netFlow < -15 ? -0.4 : 0.1))
    
    case 'Decline':
      // Expected to have outflow, but total emptying is concerning
      return Math.min(1, baseScore + (netFlow < 0 && currentProducts > 20 ? 0.2 : 
                                     currentProducts < 10 ? -0.3 : 0))
    
    default:
      return baseScore
  }
}