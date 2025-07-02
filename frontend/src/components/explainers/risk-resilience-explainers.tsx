import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Shield, AlertCircle, Activity, TrendingUp } from 'lucide-react';

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

export const RiskResilienceExplainers: React.FC = () => {
  const explainers = [
    {
      title: "Risk Score Calculation",
      icon: <Shield className="h-5 w-5 text-red-600" />,
      description: "Comprehensive risk assessment methodology combining operational, financial, and strategic risk factors with probabilistic modeling.",
      methodology: "Our risk scoring model uses Monte Carlo simulations and Bayesian networks to combine multiple risk factors. Each risk category is weighted based on business impact and likelihood, with dynamic adjustments based on current market conditions and historical patterns.",
      calculation: `Risk Score = Σ(Risk Category Weight × Probability × Impact × Time Decay)

Risk Categories:
- Operational Risk = Equipment Failure + Process Variance + Quality Issues
- Financial Risk = Cash Flow + Credit Exposure + Currency Fluctuation  
- Strategic Risk = Market Position + Competitive Threats + Technology Disruption
- Supply Chain Risk = Supplier Stability + Geographic Concentration + Lead Time Variance

Overall Score = √(Σ(Category Score²)) × Confidence Factor

Where Confidence Factor = 1 - (Data Quality Issues / Total Data Points)`,
      example: "A business unit with high operational risk (score: 7.2), moderate financial risk (score: 4.8), low strategic risk (score: 2.1), and high supply chain risk (score: 8.3) would have an overall risk score of 6.9, placing it in the 'High Risk' category requiring immediate attention.",
      insights: [
        "Risk scores above 7.0 require immediate mitigation planning",
        "Supply chain risks typically show highest volatility",
        "Operational risks are most predictable and manageable",
        "Combined risks can amplify individual category impacts by 30-50%"
      ],
      difficulty: 'advanced'
    },
    {
      title: "Anomaly Detection Algorithms",
      icon: <AlertCircle className="h-5 w-5 text-orange-600" />,
      description: "Machine learning-based anomaly detection using multiple algorithms to identify unusual patterns and potential risks.",
      methodology: "We employ ensemble anomaly detection combining statistical methods (Z-score, IQR), unsupervised learning (Isolation Forest, DBSCAN), and deep learning (Autoencoders, LSTM). The system learns normal patterns and flags deviations beyond defined thresholds.",
      calculation: `Anomaly Score = Weighted Average of:

Statistical Anomaly = |Value - Mean| / Standard Deviation
Isolation Forest Score = Average Path Length to Isolate Point
DBSCAN Clustering = Distance to Nearest Dense Region
Autoencoder Error = |Input - Reconstructed Input|
LSTM Prediction Error = |Actual - Predicted|

Final Score = Σ(Algorithm Score × Algorithm Weight × Confidence)

Threshold = μ + (k × σ) where k = sensitivity parameter (typically 2-3)`,
      example: "A production line showing 15% efficiency drop (Z-score: 2.8), unusual maintenance patterns (Isolation: 0.72), and prediction errors (LSTM: 0.85) generates an anomaly score of 0.78, exceeding the 0.65 threshold and triggering investigation protocols.",
      insights: [
        "Ensemble methods reduce false positives by 40-60%",
        "Real-time detection enables prevention vs. reaction",
        "Historical baselines must adjust for seasonal patterns",
        "Domain expertise improves algorithm tuning by 25-35%"
      ],
      difficulty: 'advanced'
    },
    {
      title: "Buffer Coverage Optimization",
      icon: <Activity className="h-5 w-5 text-blue-600" />,
      description: "Optimization algorithms that determine optimal buffer levels across inventory, capacity, and financial reserves to balance cost and risk.",
      methodology: "Buffer optimization uses stochastic programming and simulation to model demand uncertainty, supply variability, and capacity constraints. The algorithm minimizes total cost (holding + shortage + opportunity) while maintaining specified service levels.",
      calculation: `Optimal Buffer = Service Level^(-1)(Target Fill Rate) × √(Lead Time × Demand Variance)

Total Cost = Holding Cost + Shortage Cost + Opportunity Cost

Where:
- Holding Cost = Buffer Level × Unit Cost × Carrying Rate
- Shortage Cost = Stockout Probability × Shortage Impact × Recovery Cost  
- Opportunity Cost = Excess Capacity × Alternative Return Rate

Service Level Constraint: P(Demand ≤ Buffer + Expected Supply) ≥ Target%

Safety Stock = Z-score × √(Lead Time Variance × Average Demand² + Average Lead Time × Demand Variance)`,
      example: "For a product with average demand of 100 units/week, demand std dev of 25, lead time of 2 weeks with std dev of 0.5, and 95% service level target, optimal safety stock would be 1.65 × √(0.25 × 10000 + 2 × 625) = 73 units.",
      insights: [
        "Optimal buffers reduce total costs by 15-25% vs. rule-of-thumb approaches",
        "Service level improvements above 98% show exponential cost increases",
        "Demand correlation across products enables portfolio optimization",
        "Dynamic buffering adapts to changing risk profiles automatically"
      ],
      difficulty: 'intermediate'
    },
    {
      title: "Supplier Risk Assessment",
      icon: <TrendingUp className="h-5 w-5 text-purple-600" />,
      description: "Comprehensive supplier risk evaluation using financial analysis, operational metrics, and external risk factors with predictive modeling.",
      methodology: "Supplier risk assessment combines quantitative financial analysis (credit scores, ratios, cash flow) with qualitative factors (management quality, market position, regulatory compliance). Machine learning models predict failure probability and impact scenarios.",
      calculation: `Supplier Risk Index = Financial Risk × Operational Risk × Strategic Risk × External Risk

Financial Risk = (Altman Z-Score + Liquidity Ratios + Profitability Trends) / 3
Operational Risk = (Quality Issues + Delivery Performance + Capacity Utilization) / 3  
Strategic Risk = (Market Share + Competitive Position + Technology Alignment) / 3
External Risk = (Geographic + Regulatory + Economic + Natural Disaster) / 4

Failure Probability = 1 / (1 + e^(-β₀ + β₁×Financial + β₂×Operational + β₃×Strategic))

Impact Score = (Revenue at Risk × Switching Cost × Recovery Time) / Total Revenue`,
      example: "Supplier XYZ with poor financial metrics (Z-score: 1.2), good operational performance (95% delivery), moderate strategic alignment, and high geographic risk receives a risk index of 6.8/10 with 12% failure probability, warranting backup supplier development.",
      insights: [
        "Financial distress precedes operational failure by 6-18 months",
        "Single-source suppliers require risk scores below 4.0",
        "Geographic diversification reduces systemic risk by 30-40%",
        "Supplier development programs can improve scores by 1-2 points annually"
      ],
      difficulty: 'intermediate'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Risk & Resilience Analytics</h2>
          <p className="text-muted-foreground">Understanding the methodologies behind risk assessment and resilience planning</p>
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
      
      <Card className="mt-6 bg-orange-50 border-orange-200">
        <CardHeader>
          <CardTitle className="text-lg">Risk Management Framework</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            These risk and resilience tools work together to create a comprehensive risk management system:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li><strong>Calculate Risk Scores</strong> to quantify and prioritize risk exposure across all business areas</li>
            <li><strong>Deploy Anomaly Detection</strong> for early warning systems and proactive risk identification</li>
            <li><strong>Optimize Buffer Coverage</strong> to balance protection costs with service level requirements</li>
            <li><strong>Assess Supplier Risk</strong> to ensure supply chain stability and develop contingency plans</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Organizations implementing comprehensive risk management typically reduce business disruption by 35-50% and improve crisis response time by 60-80%.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};