import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';
import { Activity, TrendingUp, AlertTriangle, Target, BarChart3, Settings } from 'lucide-react';

interface ConfidenceDataPoint {
  date: string;
  timestamp: number;
  forecast: number;
  actual?: number;
  lower_95: number;
  upper_95: number;
  lower_80: number;
  upper_80: number;
  lower_50: number;
  upper_50: number;
  confidence_score: number;
  prediction_interval_width: number;
  model_uncertainty: number;
}

interface ConfidenceIntervalChartProps {
  timeHorizon: string;
  model: string;
}

const ConfidenceIntervalChart: React.FC<ConfidenceIntervalChartProps> = ({ timeHorizon, model }) => {
  const [selectedSKU, setSelectedSKU] = useState('SKU-001');
  const [confidenceLevel, setConfidenceLevel] = useState<50 | 80 | 95>(80);
  const [showActual, setShowActual] = useState(true);
  const [highlightOutliers, setHighlightOutliers] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  // Generate mock confidence interval data
  const confidenceData = useMemo((): ConfidenceDataPoint[] => {
    const data: ConfidenceDataPoint[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);
    
    for (let i = 0; i < 90; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const baseValue = 1000 + Math.sin(i / 7) * 200 + Math.sin(i / 30) * 100;
      const uncertainty = 50 + Math.random() * 100;
      
      const forecast = baseValue + (Math.random() - 0.5) * 50;
      const actual = i < 60 ? baseValue + (Math.random() - 0.5) * 80 : undefined;
      
      // Generate confidence intervals
      const lower_50 = forecast - uncertainty * 0.5;
      const upper_50 = forecast + uncertainty * 0.5;
      const lower_80 = forecast - uncertainty * 0.8;
      const upper_80 = forecast + uncertainty * 0.8;
      const lower_95 = forecast - uncertainty * 1.2;
      const upper_95 = forecast + uncertainty * 1.2;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: date.getTime(),
        forecast,
        actual,
        lower_95,
        upper_95,
        lower_80,
        upper_80,
        lower_50,
        upper_50,
        confidence_score: 0.6 + Math.random() * 0.4,
        prediction_interval_width: upper_95 - lower_95,
        model_uncertainty: uncertainty
      });
    }
    
    return data;
  }, [selectedSKU]);

  // Filter data based on date range
  const filteredData = useMemo(() => {
    const days = parseInt(dateRange.replace('d', ''));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return confidenceData.filter(d => d.timestamp >= cutoffDate.getTime());
  }, [confidenceData, dateRange]);

  // Calculate confidence interval statistics
  const confidenceStats = useMemo(() => {
    const historicalData = filteredData.filter(d => d.actual !== undefined);
    
    const coverage_50 = historicalData.filter(d => 
      d.actual! >= d.lower_50 && d.actual! <= d.upper_50
    ).length / historicalData.length * 100;
    
    const coverage_80 = historicalData.filter(d => 
      d.actual! >= d.lower_80 && d.actual! <= d.upper_80
    ).length / historicalData.length * 100;
    
    const coverage_95 = historicalData.filter(d => 
      d.actual! >= d.lower_95 && d.actual! <= d.upper_95
    ).length / historicalData.length * 100;
    
    const avgWidth = filteredData.reduce((sum, d) => sum + d.prediction_interval_width, 0) / filteredData.length;
    const avgConfidence = filteredData.reduce((sum, d) => sum + d.confidence_score, 0) / filteredData.length;
    const outliers = historicalData.filter(d => 
      d.actual! < d.lower_95 || d.actual! > d.upper_95
    ).length;
    
    return {
      coverage_50,
      coverage_80,
      coverage_95,
      avgWidth,
      avgConfidence,
      outliers,
      totalPoints: historicalData.length
    };
  }, [filteredData]);

  // Prepare chart data with confidence bands
  const chartData = useMemo(() => {
    return filteredData.map(d => ({
      ...d,
      // Create bands for area chart
      band_95: [d.lower_95, d.upper_95],
      band_80: [d.lower_80, d.upper_80],
      band_50: [d.lower_50, d.upper_50],
      // Check if actual is outside confidence interval
      isOutlier: d.actual && (d.actual < d.lower_95 || d.actual > d.upper_95)
    }));
  }, [filteredData]);

  const getConfidenceColor = (level: number) => {
    switch (level) {
      case 50: return '#3b82f6';
      case 80: return '#10b981';
      case 95: return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getCoverageColor = (coverage: number, expected: number) => {
    const diff = Math.abs(coverage - expected);
    if (diff <= 5) return 'text-green-600';
    if (diff <= 10) return 'text-yellow-600';
    return 'text-red-600';
  };

  // SKU options (mock)
  const skuOptions = Array.from({ length: 20 }, (_, i) => `SKU-${(i + 1).toString().padStart(3, '0')}`);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <select
            value={selectedSKU}
            onChange={(e) => setSelectedSKU(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            {skuOptions.map(sku => (
              <option key={sku} value={sku}>{sku}</option>
            ))}
          </select>
          
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="14d">Last 14 days</option>
            <option value="30d">Last 30 days</option>
            <option value="60d">Last 60 days</option>
            <option value="90d">Last 90 days</option>
          </select>
          
          <select
            value={confidenceLevel}
            onChange={(e) => setConfidenceLevel(Number(e.target.value) as any)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value={50}>50% Confidence</option>
            <option value={80}>80% Confidence</option>
            <option value={95}>95% Confidence</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showActual}
              onChange={(e) => setShowActual(e.target.checked)}
              className="rounded"
            />
            <span>Show Actual</span>
          </label>
          
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={highlightOutliers}
              onChange={(e) => setHighlightOutliers(e.target.checked)}
              className="rounded"
            />
            <span>Highlight Outliers</span>
          </label>
        </div>
      </div>

      {/* Confidence Statistics */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">50% Coverage</p>
              <p className={`text-2xl font-bold ${getCoverageColor(confidenceStats.coverage_50, 50)}`}>
                {confidenceStats.coverage_50.toFixed(1)}%
              </p>
            </div>
            <Target className="h-6 w-6 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">80% Coverage</p>
              <p className={`text-2xl font-bold ${getCoverageColor(confidenceStats.coverage_80, 80)}`}>
                {confidenceStats.coverage_80.toFixed(1)}%
              </p>
            </div>
            <Activity className="h-6 w-6 text-green-500" />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">95% Coverage</p>
              <p className={`text-2xl font-bold ${getCoverageColor(confidenceStats.coverage_95, 95)}`}>
                {confidenceStats.coverage_95.toFixed(1)}%
              </p>
            </div>
            <BarChart3 className="h-6 w-6 text-yellow-500" />
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-600">Avg Confidence</p>
              <p className="text-2xl font-bold text-purple-700">
                {(confidenceStats.avgConfidence * 100).toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="h-6 w-6 text-purple-500" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Outliers</p>
              <p className="text-2xl font-bold text-red-700">{confidenceStats.outliers}</p>
              <p className="text-xs text-red-500">
                {((confidenceStats.outliers / confidenceStats.totalPoints) * 100).toFixed(1)}%
              </p>
            </div>
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">
            Confidence Intervals - {selectedSKU} ({confidenceLevel}% Level)
          </h4>
          <div className="text-sm text-gray-600">
            Prediction Interval Width: {confidenceStats.avgWidth.toFixed(0)} units
          </div>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              
              {/* Define gradients for confidence bands */}
              <defs>
                <linearGradient id="confidence50" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="confidence80" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                </linearGradient>
                <linearGradient id="confidence95" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.03}/>
                </linearGradient>
              </defs>

              <Tooltip 
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toFixed(0) : value,
                  name === 'forecast' ? 'Forecast' :
                  name === 'actual' ? 'Actual' : name
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              
              {/* Confidence interval areas - drawn from bottom to top */}
              {confidenceLevel >= 95 && (
                <>
                  <Area
                    type="monotone"
                    dataKey={() => null}
                    fill="url(#confidence95)"
                    stroke="none"
                    fillOpacity={1}
                  />
                  <Line
                    type="monotone"
                    dataKey="upper_95"
                    stroke="#f59e0b"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    dot={false}
                    name="95% Upper"
                  />
                  <Line
                    type="monotone"
                    dataKey="lower_95"
                    stroke="#f59e0b"
                    strokeWidth={1}
                    strokeDasharray="2 2"
                    dot={false}
                    name="95% Lower"
                  />
                </>
              )}
              
              {confidenceLevel >= 80 && (
                <>
                  <Line
                    type="monotone"
                    dataKey="upper_80"
                    stroke="#10b981"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                    name="80% Upper"
                  />
                  <Line
                    type="monotone"
                    dataKey="lower_80"
                    stroke="#10b981"
                    strokeWidth={1}
                    strokeDasharray="3 3"
                    dot={false}
                    name="80% Lower"
                  />
                </>
              )}
              
              {confidenceLevel >= 50 && (
                <>
                  <Line
                    type="monotone"
                    dataKey="upper_50"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    name="50% Upper"
                  />
                  <Line
                    type="monotone"
                    dataKey="lower_50"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={false}
                    name="50% Lower"
                  />
                </>
              )}
              
              {/* Forecast line */}
              <Line
                type="monotone"
                dataKey="forecast"
                stroke="#000000"
                strokeWidth={2}
                dot={false}
                name="Forecast"
              />
              
              {/* Actual values */}
              {showActual && (
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#dc2626"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#dc2626' }}
                  connectNulls={false}
                  name="Actual"
                />
              )}
              
              {/* Historical data cutoff line */}
              <ReferenceLine 
                x={chartData.find(d => !d.actual)?.date} 
                stroke="#666666" 
                strokeDasharray="5 5"
                label="Forecast Start"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-3 gap-6">
        {/* Interval Performance */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">Interval Performance</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">50% Expected:</span>
              <span className="font-medium">50%</span>
              <span className={`text-sm ${getCoverageColor(confidenceStats.coverage_50, 50)}`}>
                {confidenceStats.coverage_50.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">80% Expected:</span>
              <span className="font-medium">80%</span>
              <span className={`text-sm ${getCoverageColor(confidenceStats.coverage_80, 80)}`}>
                {confidenceStats.coverage_80.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">95% Expected:</span>
              <span className="font-medium">95%</span>
              <span className={`text-sm ${getCoverageColor(confidenceStats.coverage_95, 95)}`}>
                {confidenceStats.coverage_95.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>

        {/* Prediction Quality */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">Prediction Quality</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Interval Width:</span>
              <span className="font-medium">{confidenceStats.avgWidth.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Relative Width:</span>
              <span className="font-medium">
                {((confidenceStats.avgWidth / (filteredData.reduce((sum, d) => sum + d.forecast, 0) / filteredData.length)) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Model Confidence:</span>
              <span className="font-medium">{(confidenceStats.avgConfidence * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Calibration Score:</span>
              <span className="font-medium text-green-600">Good</span>
            </div>
          </div>
        </div>

        {/* Outlier Analysis */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">Outlier Analysis</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Outliers:</span>
              <span className="font-medium text-red-600">{confidenceStats.outliers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Outlier Rate:</span>
              <span className="font-medium">
                {((confidenceStats.outliers / confidenceStats.totalPoints) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expected Rate:</span>
              <span className="font-medium">5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Deviation:</span>
              <span className={`font-medium ${
                Math.abs(((confidenceStats.outliers / confidenceStats.totalPoints) * 100) - 5) <= 2 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(((confidenceStats.outliers / confidenceStats.totalPoints) * 100) - 5).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Outlier Details */}
      {highlightOutliers && confidenceStats.outliers > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium mb-3 text-red-800">Outlier Details</h4>
          <div className="space-y-2">
            {chartData
              .filter(d => d.isOutlier)
              .slice(0, 5)
              .map((outlier, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                  <span>{outlier.date}</span>
                  <span>Actual: {outlier.actual?.toFixed(0)}</span>
                  <span>Forecast: {outlier.forecast.toFixed(0)}</span>
                  <span className="text-red-600">
                    {outlier.actual! > outlier.upper_95 ? 'Above' : 'Below'} 95% CI
                  </span>
                </div>
              ))}
            {chartData.filter(d => d.isOutlier).length > 5 && (
              <div className="text-sm text-gray-600 text-center">
                ... and {chartData.filter(d => d.isOutlier).length - 5} more outliers
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confidence Insights */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-3">Confidence Interval Insights</h4>
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div>
            <h5 className="font-medium mb-2">Calibration Assessment</h5>
            <div className="space-y-1">
              <p className={`${getCoverageColor(confidenceStats.coverage_80, 80)}`}>
                • 80% intervals: {confidenceStats.coverage_80 >= 75 && confidenceStats.coverage_80 <= 85 ? 'Well calibrated' : 'Needs adjustment'}
              </p>
              <p className={`${getCoverageColor(confidenceStats.coverage_95, 95)}`}>
                • 95% intervals: {confidenceStats.coverage_95 >= 90 && confidenceStats.coverage_95 <= 98 ? 'Well calibrated' : 'Needs adjustment'}
              </p>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium mb-2">Interval Width Analysis</h5>
            <div className="space-y-1">
              <p>• Average width: {confidenceStats.avgWidth.toFixed(0)} units</p>
              <p>• Relative to forecast: {((confidenceStats.avgWidth / (filteredData.reduce((sum, d) => sum + d.forecast, 0) / filteredData.length)) * 100).toFixed(1)}%</p>
              <p>• Uncertainty level: {confidenceStats.avgWidth > 200 ? 'High' : confidenceStats.avgWidth > 100 ? 'Moderate' : 'Low'}</p>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium mb-2">Recommendations</h5>
            <div className="space-y-1 text-gray-600">
              <p>• {confidenceStats.coverage_80 < 75 ? 'Widen confidence intervals' : 'Confidence intervals are appropriate'}</p>
              <p>• {confidenceStats.outliers > confidenceStats.totalPoints * 0.1 ? 'Investigate outlier patterns' : 'Outlier rate is acceptable'}</p>
              <p>• {confidenceStats.avgConfidence < 0.7 ? 'Consider model improvements' : 'Model confidence is good'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceIntervalChart;