import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { 
  Calculator, 
  TrendingUp,
  BarChart3,
  PieChart,
  Settings,
  RefreshCw,
  CheckCircle
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Bar, BarChart, Cell } from 'recharts'

interface ScenarioParameters {
  priceIncrease: number
  volumeImpact: number
  costReduction: number
  newServiceAdoption: number
  clientRetention: number
  marketExpansion: number
  timeframe: number
}

interface RevenueScenario {
  name: string
  description: string
  parameters: ScenarioParameters
  confidence: number
  risk: 'low' | 'medium' | 'high'
}

interface RevenueImpactCalculatorProps {
  className?: string
}

const predefinedScenarios: RevenueScenario[] = [
  {
    name: 'Conservative Growth',
    description: 'Low-risk approach with modest improvements across all metrics',
    parameters: {
      priceIncrease: 5,
      volumeImpact: -2,
      costReduction: 3,
      newServiceAdoption: 15,
      clientRetention: 92,
      marketExpansion: 8,
      timeframe: 12
    },
    confidence: 85,
    risk: 'low'
  },
  {
    name: 'Aggressive Optimization',
    description: 'High-impact strategy with significant pricing and service changes',
    parameters: {
      priceIncrease: 15,
      volumeImpact: -8,
      costReduction: 12,
      newServiceAdoption: 35,
      clientRetention: 88,
      marketExpansion: 25,
      timeframe: 18
    },
    confidence: 68,
    risk: 'high'
  },
  {
    name: 'Premium Focus',
    description: 'Focus on premium services and high-value client segments',
    parameters: {
      priceIncrease: 22,
      volumeImpact: -12,
      costReduction: 8,
      newServiceAdoption: 45,
      clientRetention: 85,
      marketExpansion: 18,
      timeframe: 15
    },
    confidence: 74,
    risk: 'medium'
  }
]

export default function RevenueImpactCalculator({ className }: RevenueImpactCalculatorProps) {
  const [selectedScenario, setSelectedScenario] = useState<string>('conservative')
  const [customParameters, setCustomParameters] = useState<ScenarioParameters>({
    priceIncrease: 8,
    volumeImpact: -3,
    costReduction: 5,
    newServiceAdoption: 25,
    clientRetention: 90,
    marketExpansion: 12,
    timeframe: 12
  })

  const baselineMetrics = {
    currentRevenue: 24500000,
    currentCosts: 18800000,
    currentMargin: 23.3,
    clientCount: 450,
    averageRevenuePerClient: 54444,
    currentGrowthRate: 8.3
  }

  const getActiveParameters = (): ScenarioParameters => {
    if (selectedScenario === 'custom') {
      return customParameters
    }
    const scenario = predefinedScenarios.find(s => s.name.toLowerCase().includes(selectedScenario))
    return scenario?.parameters || customParameters
  }

  const calculateImpact = (params: ScenarioParameters) => {
    const currentRevenue = baselineMetrics.currentRevenue
    const currentCosts = baselineMetrics.currentCosts
    
    // Revenue impact from price changes
    const priceImpact = currentRevenue * (params.priceIncrease / 100)
    
    // Volume impact from price elasticity
    const volumeAdjustment = 1 + (params.volumeImpact / 100)
    const adjustedRevenue = (currentRevenue + priceImpact) * volumeAdjustment
    
    // New service revenue
    const newServiceRevenue = currentRevenue * (params.newServiceAdoption / 100) * 0.3 // Assuming 30% margin from new services
    
    // Market expansion impact
    const marketExpansionRevenue = currentRevenue * (params.marketExpansion / 100)
    
    // Total new revenue
    const totalNewRevenue = adjustedRevenue + newServiceRevenue + marketExpansionRevenue
    
    // Cost savings
    const costSavings = currentCosts * (params.costReduction / 100)
    const adjustedCosts = currentCosts - costSavings
    
    // Client retention impact
    const retentionImpact = (params.clientRetention / 100) - 0.85 // Assuming baseline 85% retention
    const retentionRevenueImpact = currentRevenue * retentionImpact * 0.2
    
    const finalRevenue = totalNewRevenue + retentionRevenueImpact
    const finalMargin = ((finalRevenue - adjustedCosts) / finalRevenue) * 100
    
    return {
      revenueIncrease: finalRevenue - currentRevenue,
      marginImprovement: finalMargin - baselineMetrics.currentMargin,
      newRevenue: finalRevenue,
      newMargin: finalMargin,
      costSavings: costSavings,
      breakdown: {
        priceImpact,
        volumeImpact: (adjustedRevenue - currentRevenue - priceImpact),
        newServiceImpact: newServiceRevenue,
        marketExpansionImpact: marketExpansionRevenue,
        retentionImpact: retentionRevenueImpact
      }
    }
  }

  const activeParams = getActiveParameters()
  const impact = calculateImpact(activeParams)

  const monthlyProjection = Array.from({ length: activeParams.timeframe }, (_, i) => {
    const month = i + 1
    const progressFactor = Math.min(month / activeParams.timeframe, 1)
    const rampUpFactor = 0.3 + (0.7 * progressFactor) // 30% immediate, 70% ramped
    
    return {
      month: `Month ${month}`,
      revenue: baselineMetrics.currentRevenue + (impact.revenueIncrease * rampUpFactor),
      costs: baselineMetrics.currentCosts - (impact.costSavings * rampUpFactor),
      margin: baselineMetrics.currentMargin + (impact.marginImprovement * rampUpFactor)
    }
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercent = (value: number, decimals = 1) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(decimals)}%`
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-100 border-green-300'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-300'
      case 'high': return 'text-red-600 bg-red-100 border-red-300'
      default: return 'text-gray-600 bg-gray-100 border-gray-300'
    }
  }

  const breakdownData = [
    { name: 'Price Impact', value: impact.breakdown.priceImpact, color: '#22c55e' },
    { name: 'Volume Impact', value: Math.abs(impact.breakdown.volumeImpact), color: '#ef4444' },
    { name: 'New Services', value: impact.breakdown.newServiceImpact, color: '#3b82f6' },
    { name: 'Market Expansion', value: impact.breakdown.marketExpansionImpact, color: '#8b5cf6' },
    { name: 'Retention Impact', value: Math.abs(impact.breakdown.retentionImpact), color: '#f59e0b' }
  ]

  return (
    <div className={cn("space-y-6", className)}>
      <Tabs defaultValue="calculator" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="calculator">Calculator</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="projection">Projection</TabsTrigger>
        </TabsList>

        <TabsContent value="calculator" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Parameter Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Impact Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Scenario Type</Label>
                  <Select value={selectedScenario} onValueChange={setSelectedScenario}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="conservative">Conservative Growth</SelectItem>
                      <SelectItem value="aggressive">Aggressive Optimization</SelectItem>
                      <SelectItem value="premium">Premium Focus</SelectItem>
                      <SelectItem value="custom">Custom Parameters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {selectedScenario === 'custom' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Price Increase (%): {customParameters.priceIncrease}%</Label>
                      <Slider
                        value={[customParameters.priceIncrease]}
                        onValueChange={(value) => setCustomParameters(prev => ({ ...prev, priceIncrease: value[0] }))}
                        min={0}
                        max={30}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Volume Impact (%): {customParameters.volumeImpact}%</Label>
                      <Slider
                        value={[customParameters.volumeImpact]}
                        onValueChange={(value) => setCustomParameters(prev => ({ ...prev, volumeImpact: value[0] }))}
                        min={-20}
                        max={5}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Cost Reduction (%): {customParameters.costReduction}%</Label>
                      <Slider
                        value={[customParameters.costReduction]}
                        onValueChange={(value) => setCustomParameters(prev => ({ ...prev, costReduction: value[0] }))}
                        min={0}
                        max={20}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>New Service Adoption (%): {customParameters.newServiceAdoption}%</Label>
                      <Slider
                        value={[customParameters.newServiceAdoption]}
                        onValueChange={(value) => setCustomParameters(prev => ({ ...prev, newServiceAdoption: value[0] }))}
                        min={0}
                        max={50}
                        step={5}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Client Retention (%): {customParameters.clientRetention}%</Label>
                      <Slider
                        value={[customParameters.clientRetention]}
                        onValueChange={(value) => setCustomParameters(prev => ({ ...prev, clientRetention: value[0] }))}
                        min={75}
                        max={98}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Market Expansion (%): {customParameters.marketExpansion}%</Label>
                      <Slider
                        value={[customParameters.marketExpansion]}
                        onValueChange={(value) => setCustomParameters(prev => ({ ...prev, marketExpansion: value[0] }))}
                        min={0}
                        max={40}
                        step={2}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Timeframe (months): {customParameters.timeframe} months</Label>
                      <Slider
                        value={[customParameters.timeframe]}
                        onValueChange={(value) => setCustomParameters(prev => ({ ...prev, timeframe: value[0] }))}
                        min={6}
                        max={36}
                        step={3}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}

                <Button className="w-full" variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset Parameters
                </Button>
              </CardContent>
            </Card>

            {/* Results Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Impact Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-success/10 rounded-lg border border-success/30">
                    <div className="text-sm text-neutral-600">Revenue Increase</div>
                    <div className="text-xl font-bold text-success">{formatCurrency(impact.revenueIncrease)}</div>
                    <div className="text-xs text-neutral-600">
                      {formatPercent((impact.revenueIncrease / baselineMetrics.currentRevenue) * 100)} growth
                    </div>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded-lg border border-primary/30">
                    <div className="text-sm text-neutral-600">Margin Improvement</div>
                    <div className="text-xl font-bold text-primary">{formatPercent(impact.marginImprovement)}</div>
                    <div className="text-xs text-neutral-600">
                      From {baselineMetrics.currentMargin.toFixed(1)}% to {impact.newMargin.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Baseline vs Projected */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Current vs Projected</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Annual Revenue:</span>
                      <div className="text-right">
                        <div>{formatCurrency(baselineMetrics.currentRevenue)} → {formatCurrency(impact.newRevenue)}</div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Profit Margin:</span>
                      <div className="text-right">
                        <div>{baselineMetrics.currentMargin.toFixed(1)}% → {impact.newMargin.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Cost Savings:</span>
                      <div className="text-right">
                        <div className="text-green-600 font-semibold">{formatCurrency(impact.costSavings)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Risk Assessment */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Risk Assessment</h4>
                  <div className="flex items-center gap-2">
                    {selectedScenario !== 'custom' ? (
                      <>
                        <Badge 
                          variant="outline" 
                          className={cn("text-xs", getRiskColor(predefinedScenarios.find(s => s.name.toLowerCase().includes(selectedScenario))?.risk || 'medium'))}
                        >
                          {predefinedScenarios.find(s => s.name.toLowerCase().includes(selectedScenario))?.risk.toUpperCase()} RISK
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {predefinedScenarios.find(s => s.name.toLowerCase().includes(selectedScenario))?.confidence}% confidence
                        </span>
                      </>
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        CUSTOM SCENARIO
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save Scenario
                  </Button>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm">
                      <PieChart className="h-3 w-3 mr-1" />
                      Breakdown
                    </Button>
                    <Button variant="outline" size="sm">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Compare
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Impact Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdownData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `$${(value/1000).toFixed(0)}K`}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {breakdownData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {predefinedScenarios.map((scenario, index) => {
              const scenarioImpact = calculateImpact(scenario.parameters)
              return (
                <Card key={index} className={cn("cursor-pointer hover:shadow-md transition-shadow", {
                  'ring-2 ring-primary': selectedScenario === scenario.name.toLowerCase().split(' ')[0]
                })}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">{scenario.name}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={cn("text-xs", getRiskColor(scenario.risk))}
                      >
                        {scenario.risk.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{scenario.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Revenue Impact:</span>
                        <div className="font-semibold text-green-600">{formatCurrency(scenarioImpact.revenueIncrease)}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Confidence:</span>
                        <div className="font-semibold">{scenario.confidence}%</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span>Price Increase:</span>
                        <span>{formatPercent(scenario.parameters.priceIncrease, 0)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>New Services:</span>
                        <span>{scenario.parameters.newServiceAdoption}%</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Market Expansion:</span>
                        <span>{scenario.parameters.marketExpansion}%</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant={selectedScenario === scenario.name.toLowerCase().split(' ')[0] ? 'default' : 'outline'} 
                      className="w-full"
                      onClick={() => setSelectedScenario(scenario.name.toLowerCase().split(' ')[0])}
                    >
                      {selectedScenario === scenario.name.toLowerCase().split(' ')[0] ? 'Selected' : 'Select Scenario'}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="projection" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {activeParams.timeframe}-Month Revenue Projection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyProjection}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                    <XAxis 
                      dataKey="month" 
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `$${(value/1000000).toFixed(1)}M`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#22c55e" 
                      strokeWidth={3}
                      dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}