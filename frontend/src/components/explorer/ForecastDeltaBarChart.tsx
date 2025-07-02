import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, LineChart, Line, ComposedChart } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Filter, Download, Eye } from 'lucide-react';

interface ForecastVariance {
  date: string;
  sku: string;
  category: string;
  actual: number;
  forecast: number;
  variance: number;
  variancePercent: number;
  absVariance: number;
  model: string;
  confidence: number;
}

interface ForecastDeltaBarChartProps {
  timeHorizon: string;
  model: string;
}

const ForecastDeltaBarChart: React.FC<ForecastDeltaBarChartProps> = ({ timeHorizon, model }) => {
  const [viewMode, setViewMode] = useState<'daily' | 'sku' | 'category'>('daily');
  const [sortBy, setSortBy] = useState<'variance' | 'date' | 'magnitude'>('variance');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showOnlyLarge, setShowOnlyLarge] = useState(false);
  const [selectedVariance, setSelectedVariance] = useState<ForecastVariance | null>(null);

  // Generate mock variance data
  const varianceData = useMemo((): ForecastVariance[] => {
    const data: ForecastVariance[] = [];
    const categories = ['Electronics', 'Apparel', 'Home & Garden', 'Sports', 'Beauty'];
    const models = ['ARIMA', 'LSTM', 'Prophet', 'Ensemble'];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      for (let j = 0; j < 5; j++) {
        const actual = Math.floor(Math.random() * 1000) + 500;
        const forecast = actual + (Math.random() - 0.5) * 400;
        const variance = forecast - actual;
        const variancePercent = (variance / actual) * 100;
        
        data.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sku: `SKU-${(j + 1).toString().padStart(3, '0')}`,
          category: categories[j],
          actual,
          forecast,
          variance,
          variancePercent,
          absVariance: Math.abs(variance),
          model: models[Math.floor(Math.random() * models.length)],
          confidence: 0.7 + Math.random() * 0.3
        });
      }
    }
    
    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, []);

  // Filter and aggregate data
  const processedData = useMemo(() => {
    let filtered = varianceData;
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(d => d.category === filterCategory);
    }
    
    if (showOnlyLarge) {
      filtered = filtered.filter(d => Math.abs(d.variancePercent) > 20);
    }
    
    // Aggregate based on view mode
    let aggregated: any[] = [];
    
    if (viewMode === 'daily') {
      const dailyData = filtered.reduce((acc, item) => {
        const key = item.date;
        if (!acc[key]) {
          acc[key] = {
            date: key,
            totalVariance: 0,
            avgVariancePercent: 0,
            count: 0,
            overPredictions: 0,
            underPredictions: 0,
            maxVariance: 0,
            minVariance: 0
          };
        }
        
        acc[key].totalVariance += item.variance;
        acc[key].avgVariancePercent += item.variancePercent;
        acc[key].count += 1;
        
        if (item.variance > 0) acc[key].overPredictions += 1;
        else acc[key].underPredictions += 1;
        
        acc[key].maxVariance = Math.max(acc[key].maxVariance, item.variance);
        acc[key].minVariance = Math.min(acc[key].minVariance, item.variance);
        
        return acc;
      }, {} as any);
      
      aggregated = Object.values(dailyData).map((d: any) => ({
        ...d,
        avgVariancePercent: d.avgVariancePercent / d.count,
        avgVariance: d.totalVariance / d.count
      }));
    } else if (viewMode === 'sku') {
      const skuData = filtered.reduce((acc, item) => {
        const key = item.sku;
        if (!acc[key]) {
          acc[key] = {
            sku: key,
            category: item.category,
            totalVariance: 0,
            avgVariancePercent: 0,
            count: 0,
            accuracy: 0
          };
        }
        
        acc[key].totalVariance += Math.abs(item.variance);
        acc[key].avgVariancePercent += Math.abs(item.variancePercent);
        acc[key].count += 1;
        
        return acc;
      }, {} as any);
      
      aggregated = Object.values(skuData).map((d: any) => ({
        ...d,
        avgVariancePercent: d.avgVariancePercent / d.count,
        avgVariance: d.totalVariance / d.count,
        accuracy: Math.max(0, 100 - d.avgVariancePercent / d.count)
      }));
    } else {
      const categoryData = filtered.reduce((acc, item) => {
        const key = item.category;
        if (!acc[key]) {
          acc[key] = {
            category: key,
            totalVariance: 0,
            avgVariancePercent: 0,
            count: 0,
            skuCount: new Set()
          };
        }
        
        acc[key].totalVariance += Math.abs(item.variance);
        acc[key].avgVariancePercent += Math.abs(item.variancePercent);
        acc[key].count += 1;
        acc[key].skuCount.add(item.sku);
        
        return acc;
      }, {} as any);
      
      aggregated = Object.values(categoryData).map((d: any) => ({
        ...d,
        avgVariancePercent: d.avgVariancePercent / d.count,
        avgVariance: d.totalVariance / d.count,
        skuCount: d.skuCount.size
      }));
    }
    
    // Sort data
    return aggregated.sort((a, b) => {
      switch (sortBy) {
        case 'variance':
          return Math.abs(b.avgVariancePercent || b.totalVariance) - Math.abs(a.avgVariancePercent || a.totalVariance);
        case 'magnitude':
          return (b.totalVariance || b.avgVariance || 0) - (a.totalVariance || a.avgVariance || 0);
        case 'date':
          return viewMode === 'daily' ? new Date(b.date).getTime() - new Date(a.date).getTime() : 0;
        default:
          return 0;
      }
    });
  }, [varianceData, viewMode, sortBy, filterCategory, showOnlyLarge]);

  // Summary statistics
  const summary = useMemo(() => {
    const recentData = varianceData.slice(0, 50); // Last 50 data points
    const totalVariances = recentData.map(d => d.variancePercent);
    
    const meanVariance = totalVariances.reduce((sum, v) => sum + v, 0) / totalVariances.length;
    const meanAbsVariance = totalVariances.reduce((sum, v) => sum + Math.abs(v), 0) / totalVariances.length;
    const overPredictions = recentData.filter(d => d.variance > 0).length;
    const underPredictions = recentData.filter(d => d.variance < 0).length;
    const largeVariances = recentData.filter(d => Math.abs(d.variancePercent) > 20).length;
    
    return {
      meanVariance,
      meanAbsVariance,
      overPredictions,
      underPredictions,
      largeVariances,
      accuracy: Math.max(0, 100 - meanAbsVariance)
    };
  }, [varianceData]);

  const getVarianceColor = (variance: number) => {
    if (Math.abs(variance) > 30) return '#ef4444';
    if (Math.abs(variance) > 15) return '#f59e0b';
    if (Math.abs(variance) > 5) return '#3b82f6';
    return '#10b981';
  };

  const getVarianceBgColor = (variance: number) => {
    if (Math.abs(variance) > 30) return 'bg-red-50';
    if (Math.abs(variance) > 15) return 'bg-yellow-50';
    if (Math.abs(variance) > 5) return 'bg-blue-50';
    return 'bg-green-50';
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Forecast vs Actual Variance Analysis</h3>
          <p className="text-sm text-gray-600">
            Analyzing prediction accuracy and identifying major deviations
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Apparel">Apparel</option>
            <option value="Home & Garden">Home & Garden</option>
            <option value="Sports">Sports</option>
            <option value="Beauty">Beauty</option>
          </select>
          
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showOnlyLarge}
              onChange={(e) => setShowOnlyLarge(e.target.checked)}
              className="rounded"
            />
            <span>Large Variances Only</span>
          </label>
          
          <div className="flex border rounded">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-3 py-1 text-sm ${viewMode === 'daily' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              Daily
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
          </div>
          
          <button className="p-1 border rounded hover:bg-gray-50">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Mean Abs Variance</p>
              <p className="text-2xl font-bold text-blue-700">{summary.meanAbsVariance.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-6 w-6 text-blue-500" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Forecast Accuracy</p>
              <p className="text-2xl font-bold text-green-700">{summary.accuracy.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-6 w-6 text-green-500" />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Over-Predictions</p>
              <p className="text-2xl font-bold text-yellow-700">{summary.overPredictions}</p>
            </div>
            <TrendingUp className="h-6 w-6 text-yellow-500" />
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Under-Predictions</p>
              <p className="text-2xl font-bold text-red-700">{summary.underPredictions}</p>
            </div>
            <TrendingDown className="h-6 w-6 text-red-500" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Large Variances</p>
              <p className="text-2xl font-bold text-gray-700">{summary.largeVariances}</p>
            </div>
            <AlertTriangle className="h-6 w-6 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">
            Variance Analysis - {viewMode.charAt(0).toUpperCase() + viewMode.slice(1)} View
          </h4>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="variance">Sort by Variance</option>
            <option value="magnitude">Sort by Magnitude</option>
            {viewMode === 'daily' && <option value="date">Sort by Date</option>}
          </select>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={processedData.slice(0, 20)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey={viewMode === 'daily' ? 'date' : viewMode === 'sku' ? 'sku' : 'category'}
                tick={{ fontSize: 12 }}
                angle={viewMode === 'sku' ? -45 : 0}
                textAnchor={viewMode === 'sku' ? 'end' : 'middle'}
                height={viewMode === 'sku' ? 80 : 60}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [
                  typeof value === 'number' ? `${value.toFixed(1)}%` : value,
                  name === 'avgVariancePercent' ? 'Avg Variance %' : 
                  name === 'totalVariance' ? 'Total Variance' : name
                ]}
              />
              <Legend />
              
              <Bar 
                dataKey={viewMode === 'daily' ? 'avgVariancePercent' : 'avgVariancePercent'}
                name="Variance %"
              >
                {processedData.slice(0, 20).map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={getVarianceColor(entry.avgVariancePercent || entry.totalVariance)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-2 gap-6">
        {/* Top Variances Table */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">Largest Variances</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {varianceData
              .sort((a, b) => Math.abs(b.variancePercent) - Math.abs(a.variancePercent))
              .slice(0, 10)
              .map((item, index) => (
                <div 
                  key={index}
                  className={`p-3 rounded cursor-pointer hover:bg-gray-50 ${getVarianceBgColor(item.variancePercent)}`}
                  onClick={() => setSelectedVariance(item)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{item.sku}</div>
                      <div className="text-xs text-gray-500">{item.date} - {item.category}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${item.variancePercent > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {item.variancePercent > 0 ? '+' : ''}{item.variancePercent.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.variance > 0 ? 'Over' : 'Under'}: {Math.abs(item.variance).toFixed(0)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Variance Distribution */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">Variance Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { range: '< -30%', count: varianceData.filter(d => d.variancePercent < -30).length, color: '#dc2626' },
                { range: '-30% to -15%', count: varianceData.filter(d => d.variancePercent >= -30 && d.variancePercent < -15).length, color: '#ea580c' },
                { range: '-15% to -5%', count: varianceData.filter(d => d.variancePercent >= -15 && d.variancePercent < -5).length, color: '#2563eb' },
                { range: '-5% to 5%', count: varianceData.filter(d => d.variancePercent >= -5 && d.variancePercent <= 5).length, color: '#059669' },
                { range: '5% to 15%', count: varianceData.filter(d => d.variancePercent > 5 && d.variancePercent <= 15).length, color: '#2563eb' },
                { range: '15% to 30%', count: varianceData.filter(d => d.variancePercent > 15 && d.variancePercent <= 30).length, color: '#ea580c' },
                { range: '> 30%', count: varianceData.filter(d => d.variancePercent > 30).length, color: '#dc2626' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count">
                  {[
                    { range: '< -30%', count: varianceData.filter(d => d.variancePercent < -30).length, color: '#dc2626' },
                    { range: '-30% to -15%', count: varianceData.filter(d => d.variancePercent >= -30 && d.variancePercent < -15).length, color: '#ea580c' },
                    { range: '-15% to -5%', count: varianceData.filter(d => d.variancePercent >= -15 && d.variancePercent < -5).length, color: '#2563eb' },
                    { range: '-5% to 5%', count: varianceData.filter(d => d.variancePercent >= -5 && d.variancePercent <= 5).length, color: '#059669' },
                    { range: '5% to 15%', count: varianceData.filter(d => d.variancePercent > 5 && d.variancePercent <= 15).length, color: '#2563eb' },
                    { range: '15% to 30%', count: varianceData.filter(d => d.variancePercent > 15 && d.variancePercent <= 30).length, color: '#ea580c' },
                    { range: '> 30%', count: varianceData.filter(d => d.variancePercent > 30).length, color: '#dc2626' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Variance Detail Modal */}
      {selectedVariance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Variance Detail</h3>
              <button 
                onClick={() => setSelectedVariance(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">SKU</p>
                  <p>{selectedVariance.sku}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Date</p>
                  <p>{selectedVariance.date}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Category</p>
                  <p>{selectedVariance.category}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Model</p>
                  <p>{selectedVariance.model}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Actual</p>
                  <p>{selectedVariance.actual.toFixed(0)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Forecast</p>
                  <p>{selectedVariance.forecast.toFixed(0)}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Variance</p>
                  <p className={selectedVariance.variance > 0 ? 'text-red-600' : 'text-blue-600'}>
                    {selectedVariance.variance > 0 ? '+' : ''}{selectedVariance.variance.toFixed(0)}
                  </p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Variance %</p>
                  <p className={selectedVariance.variancePercent > 0 ? 'text-red-600' : 'text-blue-600'}>
                    {selectedVariance.variancePercent > 0 ? '+' : ''}{selectedVariance.variancePercent.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <p className="text-sm text-gray-600">
                  {selectedVariance.variance > 0 ? 'Over-prediction' : 'Under-prediction'} by{' '}
                  <span className="font-medium">{Math.abs(selectedVariance.variance).toFixed(0)}</span> units
                  ({Math.abs(selectedVariance.variancePercent).toFixed(1)}%).
                </p>
              </div>
              
              <div className="flex justify-end pt-4 border-t">
                <button 
                  onClick={() => setSelectedVariance(null)}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForecastDeltaBarChart;