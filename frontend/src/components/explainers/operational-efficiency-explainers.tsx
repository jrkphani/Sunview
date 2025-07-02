import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calculator, TrendingUp, Package, Users } from 'lucide-react';

interface ExplainerCardProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  methodology: string;
  calculation: string;
  example: string;
  insights: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

const ExplainerCard: React.FC<ExplainerCardProps> = ({
  title,
  icon,
  description,
  methodology,
  calculation,
  example,
  insights,
  difficulty
}) => {
  const difficultyColors = {
    beginner: 'bg-green-100 text-green-800',
    intermediate: 'bg-yellow-100 text-yellow-800',
    advanced: 'bg-red-100 text-red-800'
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-lg">{title}</CardTitle>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[difficulty]}`}>
            {difficulty}
          </span>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold text-sm mb-2">Methodology</h4>
          <p className="text-sm text-muted-foreground">{methodology}</p>
        </div>
        
        <div>
          <h4 className="font-semibold text-sm mb-2">Calculation</h4>
          <code className="block p-3 bg-muted rounded-md text-xs">
            {calculation}
          </code>
        </div>
        
        <div>
          <h4 className="font-semibold text-sm mb-2">Example</h4>
          <p className="text-sm text-muted-foreground italic">{example}</p>
        </div>
        
        <div>
          <h4 className="font-semibold text-sm mb-2">Key Insights</h4>
          <ul className="list-disc list-inside space-y-1">
            {insights.map((insight, index) => (
              <li key={index} className="text-sm text-muted-foreground">{insight}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export const OperationalEfficiencyExplainers: React.FC = () => {
  const explainers = [
    {
      title: "Throughput Accuracy",
      icon: <Calculator className="h-5 w-5 text-blue-600" />,
      description: "Measures the precision of actual vs. planned throughput across production lines and facilities.",
      methodology: "We calculate throughput accuracy by comparing actual production output against planned targets over specific time periods. The metric accounts for both overproduction and underproduction, weighted by their respective business impacts.",
      calculation: `Throughput Accuracy = 1 - |Actual Output - Planned Output| / Planned Output
                    
Weighted Score = Σ(Accuracy × Production Value × Time Weight) / Σ(Production Value × Time Weight)

Where:
- Time Weight = Recent periods weighted higher (exponential decay)
- Production Value = Revenue potential of the production line`,
      example: "If a production line planned to produce 1,000 units but actually produced 950 units, the throughput accuracy would be 95%. This is then weighted by the production value ($100K) and time weight (0.9 for recent week) to calculate overall facility score.",
      insights: [
        "Accuracy below 90% indicates significant planning or execution issues",
        "Consistent overproduction (>105%) suggests conservative planning or waste",
        "Best-in-class facilities maintain 95-98% accuracy consistently",
        "Seasonal products show natural accuracy variations requiring adjusted targets"
      ],
      difficulty: 'intermediate'
    },
    {
      title: "Labor Efficiency Optimization",
      icon: <Users className="h-5 w-5 text-green-600" />,
      description: "Optimizes workforce allocation using advanced algorithms to maximize productivity while minimizing costs.",
      methodology: "Our labor optimization algorithm uses mixed-integer linear programming (MILP) to solve the workforce scheduling problem. It considers skill matrices, shift constraints, labor laws, and demand forecasts to create optimal schedules.",
      calculation: `Objective Function:
Minimize: Σ(Labor Cost × Hours) + Σ(Overtime Premium × OT Hours) + Σ(Idle Time Cost)

Subject to:
- Σ(Workers × Skills) ≥ Demand for each period
- Worker Hours ≤ Max Regular Hours + Max OT Hours
- Consecutive Days ≤ Labor Law Limits
- Skill Coverage ≥ Minimum Requirements

Efficiency Score = (Standard Hours Required / Actual Hours Used) × 100%`,
      example: "For a facility requiring 500 standard hours of work, if the optimization algorithm schedules workers to complete it in 450 actual hours (accounting for skill levels and parallel tasks), the labor efficiency would be 111%.",
      insights: [
        "Cross-training increases efficiency by 15-20% on average",
        "Optimal shift patterns can reduce overtime costs by 25-30%",
        "Skill-based routing improves productivity by 10-15%",
        "Predictive scheduling reduces idle time by up to 40%"
      ],
      difficulty: 'advanced'
    },
    {
      title: "Processing Efficiency Metrics",
      icon: <TrendingUp className="h-5 w-5 text-purple-600" />,
      description: "Comprehensive metrics tracking the efficiency of processing operations from intake to dispatch.",
      methodology: "Processing efficiency is measured using a composite score that includes cycle time, quality rates, equipment effectiveness, and resource utilization. We use statistical process control (SPC) to identify variations and improvement opportunities.",
      calculation: `Overall Processing Efficiency (OPE) = Availability × Performance × Quality × Utilization

Where:
- Availability = (Planned Time - Downtime) / Planned Time
- Performance = (Ideal Cycle Time × Actual Output) / Operating Time
- Quality = Good Units / Total Units Produced
- Utilization = Value-Added Time / Total Cycle Time

Efficiency Index = OPE × Process Complexity Factor`,
      example: "A processing line with 95% availability, 88% performance, 99% quality, and 75% utilization would have an OPE of 62.4%. With a complexity factor of 1.2 for handling multiple SKUs, the efficiency index would be 74.9%.",
      insights: [
        "World-class OPE targets range from 65-85% depending on industry",
        "Performance losses often account for 40-50% of inefficiency",
        "Quality rates above 99.5% indicate robust process control",
        "Utilization below 70% suggests opportunity for consolidation"
      ],
      difficulty: 'intermediate'
    },
    {
      title: "Consolidation Savings Calculator",
      icon: <Package className="h-5 w-5 text-orange-600" />,
      description: "Calculates potential savings from consolidating shipments, facilities, or suppliers using advanced optimization.",
      methodology: "The consolidation algorithm uses network optimization and clustering techniques to identify consolidation opportunities. It evaluates transportation costs, facility fixed costs, service level impacts, and implementation costs to recommend optimal consolidation strategies.",
      calculation: `Consolidation Savings = Current State Costs - Optimized State Costs - Transition Costs

Current State Costs = Σ(Facility Costs) + Σ(Transportation Costs) + Σ(Inventory Costs)
Optimized State = minimize(Total Costs) subject to Service Level Constraints

Net Present Value (NPV) = Σ(Annual Savings / (1 + Discount Rate)^t) - Initial Investment

Where:
- Facility Costs include fixed and variable components
- Transportation uses actual lane rates and volumes
- Service levels maintained at 95%+ for key customers`,
      example: "Consolidating from 5 distribution centers to 3 optimally located facilities could save $2.5M in facility costs and $800K in inventory, but increase transportation by $500K, yielding net savings of $2.8M annually with $1.5M implementation cost.",
      insights: [
        "Optimal consolidation typically reduces nodes by 30-40%",
        "Transportation cost increases of 10-15% are often offset by facility savings",
        "Inventory reductions of 20-25% are achievable through pooling",
        "Implementation takes 6-12 months with 18-24 month payback"
      ],
      difficulty: 'advanced'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Operational Efficiency Insights</h2>
          <p className="text-muted-foreground">Understanding the algorithms and methodologies behind operational metrics</p>
        </div>
        <Button variant="outline" size="sm">
          <ExternalLink className="h-4 w-4 mr-2" />
          View Documentation
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {explainers.map((explainer, index) => (
          <ExplainerCard key={index} {...explainer} />
        ))}
      </div>
      
      <Card className="mt-6 bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-lg">Using Operational Efficiency Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            These metrics work together to provide a comprehensive view of operational performance:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li><strong>Start with Throughput Accuracy</strong> to identify planning gaps and execution issues</li>
            <li><strong>Use Labor Efficiency Optimization</strong> to address workforce-related bottlenecks</li>
            <li><strong>Monitor Processing Efficiency</strong> to track improvement initiatives and identify new opportunities</li>
            <li><strong>Apply Consolidation Analysis</strong> for strategic cost reduction and network optimization</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Regular monitoring and optimization of these metrics typically yields 15-25% improvement in overall operational efficiency within 12-18 months.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};