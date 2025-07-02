import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Brain, BarChart3, Clock, Target } from 'lucide-react';

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

export const ForecastExplorerExplainers: React.FC = () => {
  const explainers = [
    {
      title: "Forecasting Model Algorithms",
      icon: <Brain className="h-5 w-5 text-blue-600" />,
      description: "Advanced ensemble forecasting using ARIMA, LSTM neural networks, and Prophet models for different time series patterns.",
      methodology: "Our forecasting system uses ensemble learning combining multiple algorithms. ARIMA handles linear trends and seasonality, LSTM captures complex non-linear patterns, and Prophet manages holidays and regime changes. Model selection and weighting are automated based on historical performance.",
      calculation: `ARIMA Model: ARIMA(p,d,q) = φ₁Y_{t-1} + ... + φₚY_{t-p} + θ₁ε_{t-1} + ... + θₑε_{t-q} + ε_t

LSTM Model: 
h_t = tanh(W_h × h_{t-1} + W_x × x_t + b_h)
y_t = W_y × h_t + b_y

Prophet Model: y(t) = g(t) + s(t) + h(t) + ε_t
Where: g(t) = trend, s(t) = seasonality, h(t) = holidays

Ensemble Forecast = Σ(w_i × f_i) where w_i = accuracy_weight_i / Σ(accuracy_weights)

Model Weights Updated: w_{t+1} = w_t × exp(-α × error_t)`,
      example: "For monthly sales data, ARIMA(2,1,1) captures 65% accuracy, LSTM achieves 72%, and Prophet gets 68%. The ensemble with weights [0.25, 0.45, 0.30] achieves 75% accuracy, outperforming any single model by combining their strengths.",
      insights: [
        "Ensemble models typically improve accuracy by 8-15% over single models",
        "LSTM excels with complex patterns but requires more data (36+ periods)",
        "Prophet handles holidays and events better than traditional models",
        "Model selection should consider data availability and business context"
      ],
      difficulty: 'advanced'
    },
    {
      title: "Accuracy Metric Calculations",
      icon: <Target className="h-5 w-5 text-green-600" />,
      description: "Comprehensive accuracy measurement using multiple metrics including MAPE, RMSE, MAE, and directional accuracy for holistic evaluation.",
      methodology: "We calculate multiple accuracy metrics to provide comprehensive model evaluation. Each metric captures different aspects of forecast quality, from magnitude errors to directional accuracy. Weighted combinations consider business impact and forecast horizon.",
      calculation: `Mean Absolute Percentage Error (MAPE) = (1/n) × Σ|((Actual - Forecast) / Actual)| × 100%

Root Mean Square Error (RMSE) = √((1/n) × Σ(Actual - Forecast)²)

Mean Absolute Error (MAE) = (1/n) × Σ|Actual - Forecast|

Symmetric MAPE (sMAPE) = (1/n) × Σ(2 × |Actual - Forecast| / (|Actual| + |Forecast|)) × 100%

Directional Accuracy = (Correct Direction Predictions / Total Predictions) × 100%

Composite Accuracy Score = w₁×(1-MAPE) + w₂×(1-nRMSE) + w₃×DirectionalAccuracy

Where nRMSE = RMSE / mean(Actual)`,
      example: "A forecast with MAPE of 12%, RMSE of 150 units, MAE of 120 units, and 78% directional accuracy gets a composite score of 0.73 using weights [0.4, 0.3, 0.3]. This indicates good overall performance with room for improvement in magnitude precision.",
      insights: [
        "MAPE can be misleading with low-volume or intermittent demand",
        "RMSE penalizes large errors more heavily than MAE",
        "Directional accuracy is critical for inventory and capacity planning",
        "Accuracy typically degrades 5-10% per forecast period ahead"
      ],
      difficulty: 'intermediate'
    },
    {
      title: "Seasonal Pattern Detection",
      icon: <Clock className="h-5 w-5 text-purple-600" />,
      description: "Automated detection and modeling of seasonal patterns using spectral analysis, autocorrelation, and machine learning techniques.",
      methodology: "Seasonal pattern detection combines multiple approaches: Fast Fourier Transform (FFT) for frequency analysis, autocorrelation for lag identification, and X-13-ARIMA-SEATS for official seasonal adjustment. Machine learning validates patterns and detects regime changes.",
      calculation: `Autocorrelation Function: r_k = Σ(x_t - x̄)(x_{t+k} - x̄) / Σ(x_t - x̄)²

Seasonal Strength = 1 - Var(Remainder) / Var(Seasonal + Remainder)

FFT Periodogram: P(f) = |Σ(x_t × e^{-2πift})|² / n

Peak Detection: Find f where P(f) > threshold and f corresponds to business cycles

X-13 Seasonal Factors: S_t = Observed_t / (Trend_t × Irregular_t)

Seasonal Index = (Period Average / Overall Average) × Number of Periods

Strength Score = max(ACF) × (1 - CV) × Consistency Factor`,
      example: "Weekly sales data shows strong autocorrelation at lag 52 (r=0.85), significant FFT peaks at frequencies 1/52 and 2/52, and seasonal strength of 0.78. This confirms annual seasonality with semi-annual components, warranting seasonal decomposition.",
      insights: [
        "Multiple seasonality (daily, weekly, monthly) requires hierarchical modeling",
        "Seasonal patterns can evolve over time requiring adaptive detection",
        "Strong seasonality (>0.6) enables more accurate long-term forecasts",
        "Holiday effects often create irregular seasonal patterns"
      ],
      difficulty: 'intermediate'
    },
    {
      title: "Confidence Interval Methodology",
      icon: <BarChart3 className="h-5 w-5 text-orange-600" />,
      description: "Probabilistic confidence intervals using bootstrap methods, quantile regression, and Bayesian approaches for forecast uncertainty.",
      methodology: "We generate confidence intervals using multiple approaches: parametric intervals from model residuals, non-parametric bootstrap resampling, quantile regression for asymmetric distributions, and Bayesian posterior sampling. The approach is selected based on data characteristics and model type.",
      calculation: `Parametric Intervals: Forecast ± (t_{α/2} × σ × √(1 + h/n))

Where:
- t_{α/2} = critical t-value for confidence level
- σ = standard error of residuals  
- h = forecast horizon
- n = sample size

Bootstrap Intervals: 
1. Resample residuals B times
2. Generate B forecasts: f*_b = f̂ + ε*_b
3. Calculate percentiles: [P_{α/2}, P_{1-α/2}]

Quantile Regression: Q_τ(Y|X) = X'β_τ

Bayesian Credible Intervals: P(θ_L ≤ θ ≤ θ_U | data) = 1-α

Ensemble Uncertainty: σ²_ensemble = σ²_model + σ²_selection`,
      example: "A 12-week forecast of 1,000 units with model standard error of 80 units yields 95% confidence interval of [850, 1,150]. Bootstrap resampling refines this to [840, 1,165], accounting for non-normal residual distribution.",
      insights: [
        "Confidence intervals should widen with forecast horizon",
        "Bootstrap methods handle non-normal errors better than parametric",
        "Ensemble uncertainty captures model selection risk",
        "Prediction intervals are wider than confidence intervals"
      ],
      difficulty: 'advanced'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Forecast Explorer Methodology</h2>
          <p className="text-muted-foreground">Understanding the advanced algorithms behind demand forecasting and prediction</p>
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
          <CardTitle className="text-lg">Forecasting Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            These forecasting methodologies work together to provide accurate and reliable predictions:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            <li><strong>Use Ensemble Models</strong> to combine strengths of different algorithms and improve overall accuracy</li>
            <li><strong>Monitor Multiple Accuracy Metrics</strong> to understand different aspects of forecast performance</li>
            <li><strong>Detect Seasonal Patterns</strong> automatically to improve model specification and accuracy</li>
            <li><strong>Generate Confidence Intervals</strong> to quantify uncertainty and support risk-based decision making</li>
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Advanced forecasting implementations typically achieve 15-30% improvement in accuracy compared to simple methods, leading to 10-20% reduction in inventory costs and 5-15% improvement in service levels.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};