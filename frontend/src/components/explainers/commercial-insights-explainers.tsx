import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertTriangle, DollarSign, Users2, TrendingDown } from 'lucide-react';

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

export const CommercialInsightsExplainers: React.FC = () => {
  const explainers = [
    {
      title: "Margin Leakage Detection",
      icon: <TrendingDown className="h-5 w-5 text-red-600" />,
      description: "AI-powered detection of margin erosion across products, customers, and channels using pattern recognition.",
      methodology: "Our margin leakage detection uses ensemble machine learning models including isolation forests, LSTM networks, and gradient boosting to identify anomalous patterns in margin performance. The algorithm analyzes pricing trends, cost variations, customer behavior, and competitive dynamics.",
      calculation: `Leakage Score = Weighted Combination of:
- Price Variance: |Actual Price - Expected Price| / Expected Price
- Volume Impact: (Volume Change × Margin Impact) / Base Revenue
- Cost Drift: (Actual Costs - Standard Costs) / Standard Costs
- Competitive Pressure: Market Share Loss × Price Sensitivity

Final Score = Σ(Component Score × Business Impact Weight)

Where Business Impact = Customer Value × Product Strategic Importance`,
      example: "Product X shows a leakage score of 0.75 (high) due to 3% price variance, 15% volume decline, and 8% cost increases. With high business impact (weight 1.2), the weighted score becomes 0.90, triggering immediate review and corrective action.",
      insights: [
        "Early detection can prevent 2-5% revenue loss annually",
        "Customer-specific leakage often indicates relationship issues",
        "Product portfolio leakage may signal competitive threats",
        "Channel leakage frequently reveals operational inefficiencies"
      ],
      difficulty: 'advanced'
    },
    {
      title: "Pricing Optimization Methodology",
      icon: <DollarSign className="h-5 w-5 text-green-600" />,
      description: "Dynamic pricing algorithms that optimize revenue and margin based on demand elasticity, competition, and market conditions.",
      methodology: "Our pricing optimization employs advanced econometric models including conjoint analysis, demand modeling, and game theory. The system continuously learns from market responses and adjusts pricing strategies using reinforcement learning algorithms.",
      calculation: `Optimal Price = arg max(π) where π = (P - C) × Q(P)

Where:
- P = Price
- C = Cost (including overhead allocation)
- Q(P) = Demand function based on price elasticity

Demand Function: Q(P) = α × P^(-β) × Seasonality × Competition × Customer Factors

Price Elasticity (β) = (% Change in Quantity) / (% Change in Price)

Revenue Impact = (New Price × New Quantity) - (Old Price × Old Quantity)`,
      example: "For a product with price elasticity of -1.5, increasing price from $100 to $110 (10% increase) would decrease demand by 15%. If cost is $60, revenue changes from $4000 to $3740, suggesting price reduction would be optimal.",
      insights: [
        "Price elasticity varies significantly by customer segment",
        "Optimal pricing often increases overall profitability by 2-7%",
        "Dynamic pricing requires rapid market feedback loops",
        "Bundle pricing can overcome individual product elasticity constraints"
      ],
      difficulty: 'advanced'
    },
    {
      title: "Client Volatility Scoring",
      icon: <Users2 className="h-5 w-5 text-purple-600" />,
      description: "Predictive scoring model that assesses customer relationship stability and potential revenue risk.",
      methodology: "Client volatility scoring combines behavioral analytics, transactional patterns, and external market indicators to predict customer stability. The model uses time-series analysis, survival models, and machine learning to generate risk scores.",
      calculation: `Volatility Score = Risk Weight × (Behavioral Risk + Financial Risk + Market Risk)

Behavioral Risk = Σ(Order Pattern Changes × Interaction Frequency × Support Tickets)
Financial Risk = (Payment Delays + Credit Changes + Budget Constraints) / Baseline
Market Risk = Industry Volatility × Competitive Pressure × Economic Indicators

Final Score Range: 0-100 (Higher = More Volatile)

Confidence Interval = ±(Standard Error × Critical Value)`,
      example: "Client ABC has a volatility score of 72 (high risk) due to erratic ordering patterns (score: 25), delayed payments (score: 30), and industry downturn (score: 17). The model suggests 65% probability of 20%+ revenue decline within 6 months.",
      insights: [
        "Early intervention can retain 40-60% of at-risk customers",
        "Volatility scores above 70 require immediate account management",
        "Financial risk indicators are most predictive (65% accuracy)",
        "Proactive communication reduces volatility by 15-25%"
      ],
      difficulty: 'intermediate'
    },
    {
      title: "Revenue Impact Calculations",
      icon: <AlertTriangle className="h-5 w-5 text-orange-600" />,
      description: "Comprehensive methodology for calculating and forecasting revenue impacts from various business decisions and market changes.",
      methodology: "Revenue impact calculations use causal inference methods including difference-in-differences, instrumental variables, and propensity score matching to isolate true impact from confounding factors. Monte Carlo simulations provide confidence intervals.",
      calculation: `Total Revenue Impact = Direct Impact + Indirect Impact + Long-term Impact

Direct Impact = ΔPrice × Current Volume + ΔVolume × Current Price
Indirect Impact = Cross-selling Changes + Customer Lifetime Value Changes
Long-term Impact = Market Share Changes × Future Growth × Competitive Response

Confidence Interval = Mean ± (Z-score × Standard Deviation / √Sample Size)

Attribution = (Observed Change - Expected Change without Intervention) / Observed Change`,
      example: "A 5% price increase on Product Y generates +$500K direct revenue, -$200K from volume loss, +$100K from customer mix improvement, and -$150K from competitive response, resulting in net +$250K impact with 90% confidence interval of ±$75K.",
      insights: [
        "Indirect impacts often represent 30-50% of total revenue effect",
        "Customer lifetime value changes amplify short-term impacts",
        "Competitive responses typically occur within 30-90 days",
        "Portfolio effects can offset individual product impacts"
      ],
      difficulty: 'advanced'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Commercial Insights Methodology</h2>
          <p className="text-muted-foreground">Understanding the algorithms behind revenue optimization and customer analytics</p>
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
      
      <Card className="mt-6 bg-green-50 border-green-200">
        <CardHeader>
          <CardTitle className="text-lg">Commercial Intelligence Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            These commercial insights work together to maximize revenue and profitability:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li><strong>Monitor Margin Leakage</strong> continuously to identify revenue threats early</li>
            <li><strong>Apply Pricing Optimization</strong> to maximize profitability while maintaining market position</li>
            <li><strong>Track Client Volatility</strong> to proactively manage relationship risks</li>
            <li><strong>Calculate Revenue Impact</strong> to validate commercial decisions and strategies</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Organizations using these integrated commercial insights typically see 3-8% improvement in revenue and 15-25% improvement in customer retention within the first year.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};