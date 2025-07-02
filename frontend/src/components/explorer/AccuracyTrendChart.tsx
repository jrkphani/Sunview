import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, ComposedChart } from 'recharts';
import { Target, TrendingUp, TrendingDown, Calendar, BarChart3, PieChart } from 'lucide-react';

interface AccuracyDataPoint {
  date: string;
  timestamp: number;
  accuracy_1d: number;
  accuracy_7d: number;
  accuracy_14d: number;
  accuracy_28d: number;
  mae_1d: number;
  mae_7d: number;
  mae_14d: number;
  mae_28d: number;
  mape_1d: number;
  mape_7d: number;
  mape_14d: number;
  mape_28d: number;
  bias_1d: number;
  bias_7d: number;
  bias_14d: number;
  bias_28d: number;
}

interface SKUAccuracy {
  sku: string;
  category: string;
  accuracy: number;
  mae: number;
  mape: number;
  bias: number;
  dataPoints: number;
  trend: 'improving' | 'declining' | 'stable';
}

interface AccuracyTrendChartProps {
  timeHorizon: string;
  model: string;
}

const AccuracyTrendChart: React.FC<AccuracyTrendChartProps> = ({ timeHorizon, model }) => {
  const [viewMode, setViewMode] = useState<'trend' | 'sku' | 'category' | 'metrics'>('trend');
  const [selectedMetric, setSelectedMetric] = useState<'accuracy' | 'mae' | 'mape' | 'bias'>('accuracy');
  const [groupBy, setGroupBy] = useState<'horizon' | 'category' | 'model'>('horizon');

  // Generate mock accuracy trend data
  const accuracyData = useMemo((): AccuracyDataPoint[] => {
    const data: AccuracyDataPoint[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);
    
    for (let i = 0; i < 60; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Simulate accuracy degradation over longer horizons
      const baseAccuracy = 95 - (Math.random() * 10);
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: date.getTime(),
        accuracy_1d: Math.max(70, baseAccuracy - (Math.random() * 5)),
        accuracy_7d: Math.max(65, baseAccuracy - (Math.random() * 8) - 5),
        accuracy_14d: Math.max(60, baseAccuracy - (Math.random() * 10) - 10),
        accuracy_28d: Math.max(55, baseAccuracy - (Math.random() * 12) - 15),
        mae_1d: 50 + (Math.random() * 30),
        mae_7d: 80 + (Math.random() * 40),
        mae_14d: 120 + (Math.random() * 50),
        mae_28d: 180 + (Math.random() * 60),
        mape_1d: 5 + (Math.random() * 8),
        mape_7d: 8 + (Math.random() * 10),
        mape_14d: 12 + (Math.random() * 12),
        mape_28d: 18 + (Math.random() * 15),
        bias_1d: (Math.random() - 0.5) * 10,
        bias_7d: (Math.random() - 0.5) * 12,
        bias_14d: (Math.random() - 0.5) * 15,
        bias_28d: (Math.random() - 0.5) * 20
      });
    }
    
    return data;
  }, []);

  // Generate SKU-level accuracy data
  const skuAccuracyData = useMemo((): SKUAccuracy[] => {
    const categories = ['Electronics', 'Apparel', 'Home & Garden', 'Sports', 'Beauty'];
    const trends = ['improving', 'declining', 'stable'] as const;
    
    return Array.from({ length: 25 }, (_, i) => {
      const accuracy = 60 + Math.random() * 35;
      const mae = 50 + Math.random() * 150;
      const mape = 5 + Math.random() * 25;
      const bias = (Math.random() - 0.5) * 20;
      
      return {
        sku: `SKU-${(i + 1).toString().padStart(3, '0')}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        accuracy,
        mae,
        mape,
        bias,
        dataPoints: Math.floor(Math.random() * 50) + 10,
        trend: trends[Math.floor(Math.random() * trends.length)]
      };
    });
  }, []);

  // Calculate category-level aggregates
  const categoryAccuracy = useMemo(() => {
    const categories = skuAccuracyData.reduce((acc, sku) => {
      if (!acc[sku.category]) {
        acc[sku.category] = {
          category: sku.category,
          skus: [],
          totalAccuracy: 0,
          totalMAE: 0,
          totalMAPE: 0,
          totalBias: 0,
          count: 0
        };
      }
      
      acc[sku.category].skus.push(sku);
      acc[sku.category].totalAccuracy += sku.accuracy;
      acc[sku.category].totalMAE += sku.mae;
      acc[sku.category].totalMAPE += sku.mape;
      acc[sku.category].totalBias += Math.abs(sku.bias);
      acc[sku.category].count += 1;
      
      return acc;
    }, {} as any);
    
    return Object.values(categories).map((cat: any) => ({
      category: cat.category,
      avgAccuracy: cat.totalAccuracy / cat.count,
      avgMAE: cat.totalMAE / cat.count,
      avgMAPE: cat.totalMAPE / cat.count,
      avgBias: cat.totalBias / cat.count,
      skuCount: cat.count
    }));
  }, [skuAccuracyData]);

  // Get current metrics for selected time horizon
  const currentMetrics = useMemo(() => {
    const recent = accuracyData.slice(-10);
    const horizon = timeHorizon.replace('d', '');
    
    const accuracy = recent.reduce((sum, d) => {
      const value = d[`accuracy_${horizon}d` as keyof AccuracyDataPoint];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0) / recent.length;
    
    const mae = recent.reduce((sum, d) => {
      const value = d[`mae_${horizon}d` as keyof AccuracyDataPoint];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0) / recent.length;
    
    const mape = recent.reduce((sum, d) => {
      const value = d[`mape_${horizon}d` as keyof AccuracyDataPoint];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0) / recent.length;
    
    const bias = recent.reduce((sum, d) => {
      const value = d[`bias_${horizon}d` as keyof AccuracyDataPoint];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0) / recent.length;
    
    // Calculate trend
    const firstHalf = recent.slice(0, 5);
    const secondHalf = recent.slice(5);
    
    const firstAvg = firstHalf.reduce((sum, d) => {
      const value = d[`accuracy_${horizon}d` as keyof AccuracyDataPoint];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0) / firstHalf.length;
    
    const secondAvg = secondHalf.reduce((sum, d) => {
      const value = d[`accuracy_${horizon}d` as keyof AccuracyDataPoint];
      return sum + (typeof value === 'number' ? value : 0);
    }, 0) / secondHalf.length;
    const trend = secondAvg > firstAvg ? 'improving' : secondAvg < firstAvg ? 'declining' : 'stable';
    
    return { accuracy, mae, mape, bias, trend };
  }, [accuracyData, timeHorizon]);

  const getMetricColor = (metric: string, value: number) => {
    switch (metric) {
      case 'accuracy':
        if (value >= 90) return '#10b981';
        if (value >= 80) return '#f59e0b';
        return '#ef4444';
      case 'mae':
        if (value <= 50) return '#10b981';
        if (value <= 100) return '#f59e0b';
        return '#ef4444';
      case 'mape':
        if (value <= 10) return '#10b981';
        if (value <= 20) return '#f59e0b';
        return '#ef4444';
      case 'bias':
        if (Math.abs(value) <= 5) return '#10b981';
        if (Math.abs(value) <= 10) return '#f59e0b';
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="w-4 h-1 bg-gray-400 rounded" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Historical Accuracy Trends</h3>
          <p className="text-sm text-gray-600">
            Forecast accuracy analysis across time horizons and models
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="accuracy">Accuracy</option>
            <option value="mae">Mean Absolute Error</option>
            <option value="mape">MAPE</option>
            <option value="bias">Bias</option>
          </select>
          
          <div className="flex border rounded">
            <button
              onClick={() => setViewMode('trend')}
              className={`px-3 py-1 text-sm ${viewMode === 'trend' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              Trend
            </button>
            <button
              onClick={() => setViewMode('sku')}
              className={`px-3 py-1 text-sm ${viewMode === 'sku' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              SKU
            </button>
            <button
              onClick={() => setViewMode('category')}
              className={`px-3 py-1 text-sm ${viewMode === 'category' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              Category
            </button>
            <button
              onClick={() => setViewMode('metrics')}
              className={`px-3 py-1 text-sm ${viewMode === 'metrics' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              Metrics
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Current Accuracy</p>
              <p className="text-2xl font-bold" style={{ color: getMetricColor('accuracy', currentMetrics.accuracy) }}>
                {currentMetrics.accuracy.toFixed(1)}%
              </p>
            </div>
            <div className="flex items-center space-x-1">
              {getTrendIcon(currentMetrics.trend)}
              <Target className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Mean Abs Error</p>
              <p className="text-2xl font-bold" style={{ color: getMetricColor('mae', currentMetrics.mae) }}>
                {currentMetrics.mae.toFixed(0)}
              </p>
            </div>
            <BarChart3 className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">MAPE</p>
              <p className="text-2xl font-bold" style={{ color: getMetricColor('mape', currentMetrics.mape) }}>
                {currentMetrics.mape.toFixed(1)}%
              </p>
            </div>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bias</p>
              <p className="text-2xl font-bold" style={{ color: getMetricColor('bias', currentMetrics.bias) }}>
                {currentMetrics.bias > 0 ? '+' : ''}{currentMetrics.bias.toFixed(1)}%
              </p>
            </div>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      {viewMode === 'trend' && (
        <div className="space-y-4">
          <h4 className="font-medium">Accuracy Trends by Time Horizon</h4>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value, name) => [
                    `${(value as number).toFixed(1)}${selectedMetric === 'accuracy' ? '%' : selectedMetric === 'bias' ? '%' : ''}`,
                    name
                  ]}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey={`${selectedMetric}_1d`} 
                  stroke="#ef4444" 
                  strokeWidth={2}
                  name="1 Day"
                />
                <Line 
                  type="monotone" 
                  dataKey={`${selectedMetric}_7d`} 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  name="7 Days"
                />
                <Line 
                  type="monotone" 
                  dataKey={`${selectedMetric}_14d`} 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="14 Days"
                />
                <Line 
                  type="monotone" 
                  dataKey={`${selectedMetric}_28d`} 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="28 Days"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {viewMode === 'sku' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">SKU-Level Accuracy Analysis</h4>
            <select
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as any)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="accuracy">Sort by Accuracy</option>
              <option value="category">Group by Category</option>
              <option value="trend">Group by Trend</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
            {skuAccuracyData
              .sort((a, b) => b[selectedMetric] - a[selectedMetric])
              .slice(0, 20)
              .map((sku, index) => (
                <div key={sku.sku} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{sku.sku}</div>
                      <div className="text-sm text-gray-500">{sku.category}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Accuracy</div>
                      <div className="font-medium" style={{ color: getMetricColor('accuracy', sku.accuracy) }}>
                        {sku.accuracy.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">MAE</div>
                      <div className="font-medium">{sku.mae.toFixed(0)}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Trend</div>
                      <div className="flex items-center justify-end">
                        {getTrendIcon(sku.trend)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {viewMode === 'category' && (
        <div className="space-y-4">
          <h4 className="font-medium">Category-Level Performance</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryAccuracy}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar 
                  dataKey={selectedMetric === 'accuracy' ? 'avgAccuracy' : 
                           selectedMetric === 'mae' ? 'avgMAE' :
                           selectedMetric === 'mape' ? 'avgMAPE' : 'avgBias'}
                  fill="#3b82f6"
                  name={selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {viewMode === 'metrics' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Accuracy Distribution */}
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium mb-3">Accuracy Distribution</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { range: '90-100%', count: skuAccuracyData.filter(s => s.accuracy >= 90).length },
                  { range: '80-90%', count: skuAccuracyData.filter(s => s.accuracy >= 80 && s.accuracy < 90).length },
                  { range: '70-80%', count: skuAccuracyData.filter(s => s.accuracy >= 70 && s.accuracy < 80).length },
                  { range: '60-70%', count: skuAccuracyData.filter(s => s.accuracy >= 60 && s.accuracy < 70).length },
                  { range: '<60%', count: skuAccuracyData.filter(s => s.accuracy < 60).length }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Performance by Time Horizon */}
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium mb-3">Performance by Time Horizon</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { horizon: '1 Day', accuracy: accuracyData[accuracyData.length - 1].accuracy_1d },
                  { horizon: '7 Days', accuracy: accuracyData[accuracyData.length - 1].accuracy_7d },
                  { horizon: '14 Days', accuracy: accuracyData[accuracyData.length - 1].accuracy_14d },
                  { horizon: '28 Days', accuracy: accuracyData[accuracyData.length - 1].accuracy_28d }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="horizon" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Insights and Recommendations */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-3">Key Insights</h4>
        <div className="grid grid-cols-3 gap-6 text-sm">
          <div>
            <h5 className="font-medium mb-2">Performance Summary</h5>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Best Performing:</span>
                <span className="font-medium">1-Day forecasts</span>
              </div>
              <div className="flex justify-between">
                <span>Most Challenging:</span>
                <span className="font-medium">28-Day forecasts</span>
              </div>
              <div className="flex justify-between">
                <span>Overall Trend:</span>
                <span className={`font-medium ${currentMetrics.trend === 'improving' ? 'text-green-600' : 'text-red-600'}`}>
                  {currentMetrics.trend}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h5 className="font-medium mb-2">Category Performance</h5>
            <div className="space-y-1">
              {categoryAccuracy
                .sort((a, b) => b.avgAccuracy - a.avgAccuracy)
                .slice(0, 3)
                .map((cat, index) => (
                  <div key={cat.category} className="flex justify-between">
                    <span>{index + 1}. {cat.category}:</span>
                    <span className="font-medium">{cat.avgAccuracy.toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          </div>
          
          <div>
            <h5 className="font-medium mb-2">Recommendations</h5>
            <div className="space-y-1 text-gray-600">
              <p>• Focus on improving long-horizon accuracy</p>
              <p>• Investigate bias patterns in forecasts</p>
              <p>• Consider ensemble models for better performance</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccuracyTrendChart;