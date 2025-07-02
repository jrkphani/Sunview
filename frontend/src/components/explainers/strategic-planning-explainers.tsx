import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, TrendingUp, Zap, Package2, BarChart2 } from 'lucide-react';

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

export const StrategicPlanningExplainers: React.FC = () => {
  const explainers = [
    {
      title: "Seasonality Pattern Detection",
      icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
      description: "Advanced time series analysis to identify, quantify, and model seasonal patterns for strategic planning and resource allocation.",
      methodology: "Seasonality detection employs multiple statistical techniques including X-13-ARIMA-SEATS decomposition, STL (Seasonal and Trend decomposition using Loess), and spectral analysis. Machine learning clustering identifies similar seasonal patterns across products and regions.",
      calculation: `STL Decomposition: Y_t = T_t + S_t + R_t

Where:
- T_t = Trend component  
- S_t = Seasonal component
- R_t = Remainder component

Seasonal Strength = 1 - Var(R_t) / Var(S_t + R_t)

Peak-to-Trough Ratio = max(S_t) / min(S_t)

Seasonal Index = (Seasonal Component / Detrended Average) × 100

Consistency Score = 1 - CV(Seasonal Indices across years)

Pattern Similarity = cosine_similarity(Season_A, Season_B)`,
      example: "Product ABC shows strong seasonality (strength: 0.84) with peak in December (index: 145) and trough in February (index: 67). Peak-to-trough ratio of 2.16 indicates high seasonal variation requiring strategic inventory and capacity planning.",
      insights: [
        "Seasonal strength >0.6 requires dedicated seasonal planning strategies",
        "Peak-to-trough ratios >2.0 indicate high resource volatility",
        "Similar seasonal patterns enable portfolio optimization",
        "Early season indicators predict full-season performance"
      ],
      difficulty: 'intermediate'
    },
    {
      title: "Forecast Bias Calculation",
      icon: <Zap className="h-5 w-5 text-red-600" />,
      description: "Systematic measurement and correction of forecast bias to improve planning accuracy and resource allocation decisions.",
      methodology: "Forecast bias analysis uses multiple statistical measures to identify systematic over- or under-forecasting patterns. The methodology includes trend analysis, seasonal bias patterns, and machine learning to predict and correct future bias.",
      calculation: `Bias = Mean(Forecast - Actual)

Percentage Bias = (Σ(Forecast - Actual) / Σ(Actual)) × 100%

Mean Bias Deviation = Σ(Forecast - Actual) / n

Tracking Signal = Running Sum of Errors / Mean Absolute Deviation

Theil's U Statistic = √(MSE_forecast) / √(MSE_naive)

Bias Trend = β₁ from regression: Bias_t = β₀ + β₁×Time + ε

Where MSE = Mean Squared Error

Bias Significance Test: t = Bias / (σ_bias / √n)`,
      example: "Monthly forecasts show +8% systematic bias (consistent over-forecasting) with tracking signal of +4.2, exceeding control limits. Trend analysis reveals increasing bias over time (β₁ = +0.3% per month), requiring model recalibration.",
      insights: [
        "Bias >±5% indicates systematic forecasting issues",
        "Tracking signals beyond ±4 trigger forecast model review",
        "Positive bias leads to excess inventory and capacity",
        "Bias patterns often correlate with business cycles"
      ],
      difficulty: 'intermediate'
    },
    {
      title: "Product Lifecycle Classification",
      icon: <Package2 className="h-5 w-5 text-green-600" />,
      description: "Automated classification of products into lifecycle stages using sales patterns, growth rates, and market indicators for strategic planning.",
      methodology: "Product lifecycle classification uses machine learning clustering on multiple indicators including sales velocity, growth trends, market share, profitability, and customer adoption patterns. The system automatically assigns products to Introduction, Growth, Maturity, or Decline stages.",
      calculation: `Growth Rate = (Current Period Sales / Previous Period Sales) - 1

Sales Velocity Trend = β₁ from regression: Sales_t = β₀ + β₁×Time + ε

Market Share Momentum = Δ(Market Share) / Market Share_{t-1}

Profitability Trend = β₁ from regression: Margin_t = β₀ + β₁×Time + ε

Classification Score = w₁×Growth + w₂×Velocity + w₃×Share + w₄×Profit

Lifecycle Stages:
- Introduction: Growth >20%, Low Volume, High Investment
- Growth: Growth >10%, Accelerating Sales, Improving Margins  
- Maturity: Growth <10%, Stable Sales, Stable Margins
- Decline: Growth <0%, Declining Sales, Margin Pressure`,
      example: "Product XYZ shows 15% growth rate, positive velocity trend (β₁ = +50 units/month), 2% market share gain, and improving margins (+3% annually). Classification score of 0.78 places it in 'Growth' stage, indicating investment and expansion opportunities.",
      insights: [
        "Growth stage products require aggressive capacity expansion",
        "Mature products benefit from efficiency optimization",
        "Declining products need harvest or divestiture strategies",
        "Portfolio balance across stages ensures sustainable growth"
      ],
      difficulty: 'intermediate'
    },
    {
      title: "Stability Index Calculations",
      icon: <BarChart2 className="h-5 w-5 text-purple-600" />,
      description: "Comprehensive stability metrics measuring business resilience, predictability, and risk across multiple dimensions for strategic assessment.",
      methodology: "Stability index combines multiple measures including revenue volatility, demand predictability, supply chain resilience, and market position stability. Advanced statistical techniques measure both short-term fluctuations and long-term stability trends.",
      calculation: `Revenue Stability = 1 - (σ_revenue / μ_revenue)

Demand Predictability = 1 - (Forecast Error / Mean Demand)

Supply Chain Resilience = (1 - Disruption Impact) × (1 - Recovery Time)

Market Position Stability = 1 - |Δ Market Share| / Market Share

Overall Stability Index = Σ(w_i × Stability_i) / Σ(w_i)

Where weights (w_i) reflect business importance:
- Revenue: 0.4
- Demand: 0.3  
- Supply: 0.2
- Market: 0.1

Confidence Interval = Index ± (t_{α/2} × σ_index / √n)`,
      example: "Business unit shows revenue stability of 0.82 (low volatility), demand predictability of 0.75 (good forecasting), supply resilience of 0.68 (moderate risk), and market stability of 0.90 (strong position). Overall stability index of 0.78 indicates strong but improvable stability.",
      insights: [
        "Stability indices >0.8 indicate highly predictable businesses",
        "Supply chain typically shows lowest stability scores",
        "Market position stability correlates with pricing power",
        "Stability improvement requires 12-18 months of focused effort"
      ],
      difficulty: 'advanced'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Strategic Planning Analytics</h2>
          <p className="text-muted-foreground">Advanced methodologies for long-term planning and strategic decision making</p>
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
      
      <Card className="mt-6 bg-purple-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-lg">Strategic Planning Framework</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            These strategic planning tools provide the analytical foundation for long-term business decisions:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li><strong>Analyze Seasonality Patterns</strong> to optimize resource allocation and capacity planning</li>
            <li><strong>Monitor Forecast Bias</strong> to improve planning accuracy and decision quality</li>
            <li><strong>Classify Product Lifecycles</strong> to align strategies with product maturity stages</li>
            <li><strong>Track Stability Indices</strong> to assess business resilience and identify improvement areas</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Strategic planning implementations using these methodologies typically improve forecast accuracy by 20-35%, reduce planning cycle time by 30-50%, and increase strategic initiative success rates by 25-40%.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};