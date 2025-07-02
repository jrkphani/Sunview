import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { 
  ArrowRight,
  ArrowDown,
  BarChart3,
  Brain,
  Lightbulb,
  LineChart,
  Package,
  Settings,
  Target,
  TrendingUp,
  Truck,
  Users,
  Zap,
  AlertTriangle,
  ShieldCheck,
  DollarSign,
  Calendar,
  Cpu,
  Database,
  GitBranch,
  Workflow,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  FileText,
  Gauge,
  CheckCircle2,
  XCircle,
  Timer,
  Building2,
  Cloud,
  Shield,
  Activity
} from 'lucide-react'

interface FlowStep {
  id: string
  title: string
  description: string
  icon: React.ElementType
  color: string
  timeEstimate?: string
  role?: string
  issues?: string[]
}

interface WorkflowChain {
  id: string
  name: string
  description: string
  traditionalFlow: FlowStep[]
  aiAugmentedFlow: FlowStep[]
  timeSavings: {
    traditional: string
    aiAugmented: string
    improvement: string
  }
  roleTransformation: {
    from: string
    to: string
    keyChanges: string[]
  }
}

const workflowChains: WorkflowChain[] = [
  {
    id: 'labor-planning',
    name: 'Labor Planning Chain',
    description: 'Transform forecast data into optimized workforce schedules',
    traditionalFlow: [
      {
        id: 'export-data',
        title: 'Export Forecast Data',
        description: 'Manually export data from Blue Yonder',
        icon: FileText,
        color: 'text-gray-500',
        timeEstimate: '30 min',
        role: 'Analyst',
        issues: ['Manual process', 'Version control issues']
      },
      {
        id: 'analyze-excel',
        title: 'Analyze in Excel',
        description: 'Create pivot tables and analyze patterns',
        icon: BarChart3,
        color: 'text-gray-500',
        timeEstimate: '2-3 hours',
        role: 'Analyst',
        issues: ['Limited analysis depth', 'Prone to errors']
      },
      {
        id: 'email-findings',
        title: 'Email Findings',
        description: 'Send analysis via email to managers',
        icon: Mail,
        color: 'text-gray-500',
        timeEstimate: '30 min',
        role: 'Analyst',
        issues: ['Communication delays', 'Lost in inbox']
      },
      {
        id: 'meeting-discussion',
        title: 'Meeting & Discussion',
        description: 'Schedule meeting to discuss findings',
        icon: Users,
        color: 'text-gray-500',
        timeEstimate: '1-2 days',
        role: 'Managers',
        issues: ['Scheduling conflicts', 'Delayed decisions']
      },
      {
        id: 'manual-scheduling',
        title: 'Manual Scheduling',
        description: 'Create schedules in Kronos',
        icon: Calendar,
        color: 'text-gray-500',
        timeEstimate: '2-3 hours',
        role: 'Scheduler',
        issues: ['Suboptimal schedules', 'Reactive planning']
      }
    ],
    aiAugmentedFlow: [
      {
        id: 'auto-ingestion',
        title: 'Automated Data Ingestion',
        description: 'Real-time sync from all systems',
        icon: Database,
        color: 'text-blue-600',
        timeEstimate: 'Real-time',
        role: 'System'
      },
      {
        id: 'ai-analysis',
        title: 'AI-Powered Analysis',
        description: 'Predictive analytics with anomaly detection',
        icon: Brain,
        color: 'text-purple-600',
        timeEstimate: '5 min',
        role: 'AI Agent'
      },
      {
        id: 'smart-alerts',
        title: 'Smart Alerts',
        description: 'Proactive notifications to stakeholders',
        icon: Zap,
        color: 'text-yellow-600',
        timeEstimate: 'Instant',
        role: 'System'
      },
      {
        id: 'optimize-schedules',
        title: 'Optimized Schedules',
        description: 'AI generates optimal workforce plans',
        icon: Calendar,
        color: 'text-green-600',
        timeEstimate: '15 min',
        role: 'AI + Planner'
      },
      {
        id: 'one-click-deploy',
        title: 'One-Click Deploy',
        description: 'Direct integration with Kronos',
        icon: CheckCircle2,
        color: 'text-green-600',
        timeEstimate: '1 min',
        role: 'Planner'
      }
    ],
    timeSavings: {
      traditional: '3-5 days',
      aiAugmented: '3-5 hours',
      improvement: '85% faster'
    },
    roleTransformation: {
      from: 'Reactive Scheduler',
      to: 'Strategic Workforce Planner',
      keyChanges: [
        'From Excel analysis to AI-assisted insights',
        'From manual scheduling to optimization review',
        'From firefighting to proactive planning',
        'From data entry to strategic decision making'
      ]
    }
  },
  {
    id: 'transport-optimization',
    name: 'Transport Optimization Chain',
    description: 'Convert volume forecasts into efficient transport plans',
    traditionalFlow: [
      {
        id: 'volume-emails',
        title: 'Volume Updates via Email',
        description: 'Receive volume forecasts via email',
        icon: Mail,
        color: 'text-gray-500',
        timeEstimate: '1 hour',
        role: 'Transport Planner',
        issues: ['Delayed information', 'Multiple versions']
      },
      {
        id: 'manual-calculation',
        title: 'Manual Calculations',
        description: 'Calculate truck requirements in spreadsheets',
        icon: FileText,
        color: 'text-gray-500',
        timeEstimate: '2-3 hours',
        role: 'Transport Planner',
        issues: ['Error-prone', 'Time-consuming']
      },
      {
        id: 'phone-carriers',
        title: 'Phone Carriers',
        description: 'Call carriers to book capacity',
        icon: Phone,
        color: 'text-gray-500',
        timeEstimate: '2-3 hours',
        role: 'Transport Planner',
        issues: ['Manual coordination', 'No visibility']
      },
      {
        id: 'confirm-bookings',
        title: 'Confirm Bookings',
        description: 'Email confirmations and updates',
        icon: Mail,
        color: 'text-gray-500',
        timeEstimate: '1 hour',
        role: 'Transport Planner',
        issues: ['Tracking issues', 'Communication gaps']
      },
      {
        id: 'update-tms',
        title: 'Update TMS',
        description: 'Manually enter data into TMS',
        icon: Truck,
        color: 'text-gray-500',
        timeEstimate: '1-2 hours',
        role: 'Transport Planner',
        issues: ['Double data entry', 'Sync delays']
      }
    ],
    aiAugmentedFlow: [
      {
        id: 'predictive-volumes',
        title: 'Predictive Volume Forecast',
        description: 'AI predicts volumes by lane and time',
        icon: Brain,
        color: 'text-blue-600',
        timeEstimate: 'Real-time',
        role: 'AI System'
      },
      {
        id: 'capacity-optimization',
        title: 'Capacity Optimization',
        description: 'Optimal truck utilization plans',
        icon: Truck,
        color: 'text-purple-600',
        timeEstimate: '10 min',
        role: 'AI Agent'
      },
      {
        id: 'auto-booking',
        title: 'Automated Booking',
        description: 'System books with preferred carriers',
        icon: Cloud,
        color: 'text-green-600',
        timeEstimate: '5 min',
        role: 'System'
      },
      {
        id: 'real-time-tracking',
        title: 'Real-time Tracking',
        description: 'Live visibility and exception alerts',
        icon: Activity,
        color: 'text-yellow-600',
        timeEstimate: 'Continuous',
        role: 'System'
      },
      {
        id: 'integrated-tms',
        title: 'Integrated TMS',
        description: 'Seamless data flow to all systems',
        icon: GitBranch,
        color: 'text-green-600',
        timeEstimate: 'Instant',
        role: 'System'
      }
    ],
    timeSavings: {
      traditional: '6-8 hours',
      aiAugmented: '30 minutes',
      improvement: '92% faster'
    },
    roleTransformation: {
      from: 'Manual Coordinator',
      to: 'Transport Strategist',
      keyChanges: [
        'From phone calls to system optimization',
        'From reactive booking to proactive planning',
        'From manual tracking to exception management',
        'From data entry to performance analysis'
      ]
    }
  },
  {
    id: 'capacity-planning',
    name: 'Capacity Planning Chain',
    description: 'Align warehouse capacity with predicted demand',
    traditionalFlow: [
      {
        id: 'gather-forecasts',
        title: 'Gather Forecasts',
        description: 'Collect forecasts from multiple sources',
        icon: FileText,
        color: 'text-gray-500',
        timeEstimate: '2 hours',
        role: 'Capacity Planner',
        issues: ['Multiple formats', 'Inconsistent data']
      },
      {
        id: 'excel-modeling',
        title: 'Excel Modeling',
        description: 'Build capacity models in spreadsheets',
        icon: BarChart3,
        color: 'text-gray-500',
        timeEstimate: '4-6 hours',
        role: 'Capacity Planner',
        issues: ['Complex formulas', 'Version control']
      },
      {
        id: 'scenario-planning',
        title: 'Manual Scenarios',
        description: 'Create what-if scenarios manually',
        icon: Settings,
        color: 'text-gray-500',
        timeEstimate: '3-4 hours',
        role: 'Capacity Planner',
        issues: ['Limited scenarios', 'Time-intensive']
      },
      {
        id: 'stakeholder-review',
        title: 'Stakeholder Review',
        description: 'Present findings in meetings',
        icon: Users,
        color: 'text-gray-500',
        timeEstimate: '2-3 days',
        role: 'Management',
        issues: ['Delayed decisions', 'Multiple iterations']
      },
      {
        id: 'implement-changes',
        title: 'Implement Changes',
        description: 'Manual updates to systems',
        icon: Building2,
        color: 'text-gray-500',
        timeEstimate: '1-2 days',
        role: 'Operations',
        issues: ['Slow implementation', 'Change resistance']
      }
    ],
    aiAugmentedFlow: [
      {
        id: 'unified-forecast',
        title: 'Unified Forecast',
        description: 'AI aggregates all demand signals',
        icon: Database,
        color: 'text-blue-600',
        timeEstimate: 'Real-time',
        role: 'AI System'
      },
      {
        id: 'dynamic-modeling',
        title: 'Dynamic Modeling',
        description: 'AI models capacity requirements',
        icon: Brain,
        color: 'text-purple-600',
        timeEstimate: '15 min',
        role: 'AI Agent'
      },
      {
        id: 'auto-scenarios',
        title: 'Auto Scenario Generation',
        description: 'AI generates optimal scenarios',
        icon: Cpu,
        color: 'text-yellow-600',
        timeEstimate: '10 min',
        role: 'AI System'
      },
      {
        id: 'instant-insights',
        title: 'Instant Insights',
        description: 'Real-time dashboards for decisions',
        icon: Gauge,
        color: 'text-green-600',
        timeEstimate: 'Instant',
        role: 'All Stakeholders'
      },
      {
        id: 'auto-adjustments',
        title: 'Automated Adjustments',
        description: 'System implements approved changes',
        icon: Shield,
        color: 'text-green-600',
        timeEstimate: '5 min',
        role: 'System'
      }
    ],
    timeSavings: {
      traditional: '4-5 days',
      aiAugmented: '2-3 hours',
      improvement: '95% faster'
    },
    roleTransformation: {
      from: 'Capacity Analyst',
      to: 'Strategic Capacity Architect',
      keyChanges: [
        'From data gathering to insight generation',
        'From Excel modeling to AI collaboration',
        'From reactive planning to predictive optimization',
        'From manual updates to automated execution'
      ]
    }
  }
]

const systemIntegrations = [
  { name: 'WMS', fullName: 'Warehouse Management System', icon: Package, status: 'Connected' },
  { name: 'Kronos', fullName: 'Labor Management System', icon: Users, status: 'Connected' },
  { name: 'TMS', fullName: 'Transport Management System', icon: Truck, status: 'Connected' },
  { name: 'ERP', fullName: 'Enterprise Resource Planning', icon: Building2, status: 'Connected' },
  { name: 'Communication', fullName: 'Teams, Slack, Email', icon: MessageSquare, status: 'Integrated' }
]

interface InsightToActionFlowProps {
  className?: string
}

export default function InsightToActionFlow({ className }: InsightToActionFlowProps) {
  const [selectedChain, setSelectedChain] = React.useState<WorkflowChain>(workflowChains[0])

  const FlowDiagram = ({ steps, isTraditional }: { steps: FlowStep[], isTraditional: boolean }) => (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div key={step.id} className="relative">
          <div className={cn(
            "flex items-start gap-4 p-4 rounded-lg border-2 transition-all",
            isTraditional 
              ? "border-gray-200 bg-gray-50" 
              : "border-blue-200 bg-blue-50 hover:shadow-md"
          )}>
            <div className={cn(
              "p-3 rounded-lg",
              isTraditional ? "bg-gray-200" : "bg-white"
            )}>
              <step.icon className={cn("h-6 w-6", step.color)} />
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-neutral-900">{step.title}</h4>
                  <p className="text-sm text-neutral-600">{step.description}</p>
                </div>
                
                <div className="flex flex-col items-end gap-1">
                  {step.timeEstimate && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {step.timeEstimate}
                    </Badge>
                  )}
                  {step.role && (
                    <Badge variant="secondary" className="text-xs">
                      {step.role}
                    </Badge>
                  )}
                </div>
              </div>
              
              {step.issues && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {step.issues.map((issue, idx) => (
                    <span key={idx} className="text-xs text-red-600 flex items-center gap-1">
                      <XCircle className="h-3 w-3" />
                      {issue}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {index < steps.length - 1 && (
            <div className="flex justify-center py-2">
              <ArrowDown className={cn(
                "h-5 w-5",
                isTraditional ? "text-gray-400" : "text-blue-400"
              )} />
            </div>
          )}
        </div>
      ))}
    </div>
  )

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header Section */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 mb-2">
          <Workflow className="h-6 w-6 text-blue-600" />
          <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">
            From Insight to Action
          </span>
        </div>
        
        <h1 className="text-4xl font-bold text-neutral-900">
          Breaking the "Broken Telephone" of Traditional Logistics
        </h1>
        
        <p className="text-xl text-neutral-700 max-w-3xl mx-auto">
          Transform fragmented communication chains into seamless AI-powered workflows 
          that compress decision cycles from days to hours
        </p>
      </div>

      {/* Broken Telephone Problem */}
      <Card className="border-2 border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-900">
            <AlertTriangle className="h-5 w-5" />
            The "Broken Telephone" Problem in Traditional Logistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { icon: FileText, label: 'Data Export', issue: 'Manual exports' },
              { icon: Mail, label: 'Email Chains', issue: 'Lost information' },
              { icon: Phone, label: 'Phone Calls', issue: 'No documentation' },
              { icon: MessageSquare, label: 'Chat Messages', issue: 'Fragmented context' },
              { icon: Users, label: 'Meetings', issue: 'Delayed decisions' }
            ].map((item, index) => (
              <div key={index} className="text-center space-y-2">
                <div className="mx-auto p-3 rounded-full bg-red-100 w-fit">
                  <item.icon className="h-6 w-6 text-red-600" />
                </div>
                <p className="font-medium text-sm">{item.label}</p>
                <p className="text-xs text-red-600">{item.issue}</p>
                {index < 4 && (
                  <ArrowRight className="h-4 w-4 text-red-400 mx-auto hidden md:block" />
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-red-100 rounded-lg">
            <p className="text-center text-red-900 font-medium">
              Result: 3-5 days from insight to action, with 40% information loss at each step
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Workflow Chains */}
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">
            AI-Powered Workflow Transformation
          </h2>
          <p className="text-neutral-600">
            See how each operational chain is revolutionized with AI augmentation
          </p>
        </div>

        <Tabs defaultValue={workflowChains[0].id} className="space-y-6">
          <TabsList className="grid grid-cols-1 md:grid-cols-3 h-auto gap-2">
            {workflowChains.map((chain) => (
              <TabsTrigger
                key={chain.id}
                value={chain.id}
                onClick={() => setSelectedChain(chain)}
                className="flex flex-col items-center p-6 h-auto text-center data-[state=active]:bg-blue-50 data-[state=active]:border-blue-600 border-2"
              >
                <h3 className="font-semibold text-lg mb-2">{chain.name}</h3>
                <p className="text-sm text-neutral-600">{chain.description}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Timer className="h-3 w-3 mr-1" />
                    {chain.timeSavings.improvement}
                  </Badge>
                </div>
              </TabsTrigger>
            ))}
          </TabsList>

          {workflowChains.map((chain) => (
            <TabsContent key={chain.id} value={chain.id} className="space-y-6">
              {/* Before/After Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Traditional Flow */}
                <Card className="border-2 border-gray-300">
                  <CardHeader className="bg-gray-100">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      Traditional Flow
                    </CardTitle>
                    <CardDescription>
                      Manual processes, communication delays, reactive decisions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <FlowDiagram steps={chain.traditionalFlow} isTraditional={true} />
                    
                    <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                      <p className="text-center font-medium text-gray-700">
                        Total Time: {chain.timeSavings.traditional}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* AI-Augmented Flow */}
                <Card className="border-2 border-blue-600">
                  <CardHeader className="bg-blue-50">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      AI-Augmented Flow
                    </CardTitle>
                    <CardDescription>
                      Automated insights, proactive alerts, optimized decisions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <FlowDiagram steps={chain.aiAugmentedFlow} isTraditional={false} />
                    
                    <div className="mt-6 p-4 bg-blue-100 rounded-lg">
                      <p className="text-center font-medium text-blue-700">
                        Total Time: {chain.timeSavings.aiAugmented}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Role Transformation */}
              <Card className="border-2 border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Job Role Transformation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Badge variant="outline" className="text-xs">Before</Badge>
                      <h4 className="font-semibold text-lg">{chain.roleTransformation.from}</h4>
                    </div>
                    <div className="space-y-2">
                      <Badge className="text-xs bg-purple-600">After</Badge>
                      <h4 className="font-semibold text-lg">{chain.roleTransformation.to}</h4>
                    </div>
                  </div>
                  
                  <div className="mt-6 space-y-2">
                    <p className="font-medium text-sm text-neutral-700">Key Changes:</p>
                    <ul className="space-y-1">
                      {chain.roleTransformation.keyChanges.map((change, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* System Integration */}
      <Card className="border-2 border-neutral-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Seamless System Integration
          </CardTitle>
          <CardDescription>
            AI platform connects all your existing systems, eliminating data silos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {systemIntegrations.map((system) => (
              <Card key={system.name} className="border hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center space-y-2">
                  <div className="mx-auto p-3 rounded-lg bg-blue-50 w-fit">
                    <system.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h4 className="font-semibold">{system.name}</h4>
                  <p className="text-xs text-neutral-600">{system.fullName}</p>
                  <Badge 
                    variant="outline" 
                    className="text-xs border-green-600 text-green-600"
                  >
                    {system.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Decision Velocity Comparison */}
      <Card className="border-2 border-green-600 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Gauge className="h-5 w-5" />
            Decision Velocity Transformation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-600 mb-2">Traditional Process</p>
                <div className="text-4xl font-bold text-red-600">3-5 Days</div>
                <p className="text-sm text-neutral-600 mt-2">From insight to action</p>
              </div>
              
              <div className="space-y-2">
                {['Data Export', 'Analysis', 'Communication', 'Meetings', 'Implementation'].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-sm">{step}</span>
                    <span className="text-xs text-neutral-500 ml-auto">
                      {idx === 0 ? '2-4 hrs' : idx === 1 ? '4-8 hrs' : idx === 2 ? '8-24 hrs' : idx === 3 ? '24-48 hrs' : '8-16 hrs'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-600 mb-2">AI-Augmented Process</p>
                <div className="text-4xl font-bold text-green-600">3-5 Hours</div>
                <p className="text-sm text-neutral-600 mt-2">From insight to action</p>
              </div>
              
              <div className="space-y-2">
                {['Real-time Data', 'AI Analysis', 'Smart Alerts', 'Instant Review', 'Auto-execution'].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="text-sm">{step}</span>
                    <span className="text-xs text-neutral-500 ml-auto">
                      {idx === 0 ? 'Continuous' : idx === 1 ? '5-15 min' : idx === 2 ? 'Instant' : idx === 3 ? '30-60 min' : '5-10 min'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-center p-6 bg-green-100 rounded-lg">
            <p className="text-2xl font-bold text-green-900 mb-2">
              20x Faster Decision Making
            </p>
            <p className="text-green-700">
              Compress decision cycles from days to hours, enabling true operational agility
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-8 text-center">
        <h3 className="text-2xl font-bold mb-4">
          Ready to Transform Your Operations?
        </h3>
        <p className="text-lg text-neutral-700 mb-6 max-w-2xl mx-auto">
          See how our AI-powered platform can revolutionize your logistics workflows 
          and deliver immediate operational improvements
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Schedule Demo
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button size="lg" variant="outline">
            Download Case Study
          </Button>
        </div>
      </div>
    </div>
  )
}