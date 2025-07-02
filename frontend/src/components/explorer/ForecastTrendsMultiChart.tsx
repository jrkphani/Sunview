import React, { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, ReferenceLine } from 'recharts';
import { Layers, Search, Filter, ZoomIn, ZoomOut, Download, RotateCcw } from 'lucide-react';

interface ForecastDataPoint {
  date: string;
  timestamp: number;
  actual?: number;
  forecast_1d: number;
  forecast_7d: number;
  forecast_14d: number;
  forecast_28d: number;
  arima?: number;
  lstm?: number;
  prophet?: number;
  ensemble?: number;
}

interface ForecastTrendsMultiChartProps {
  timeHorizon: string;
  model: string;
}

const ForecastTrendsMultiChart: React.FC<ForecastTrendsMultiChartProps> = ({ timeHorizon, model }) => {
  const [selectedSKU, setSelectedSKU] = useState('SKU-001');
  const [dateRange, setDateRange] = useState('30d');
  const [showActual, setShowActual] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Generate mock forecast data
  const forecastData = useMemo((): ForecastDataPoint[] => {
    const data: ForecastDataPoint[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);
    
    for (let i = 0; i < 90; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const baseValue = 1000 + Math.sin(i / 7) * 200 + Math.sin(i / 30) * 100;
      const noise = (Math.random() - 0.5) * 100;
      
      const actual = i < 60 ? baseValue + noise : undefined;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: date.getTime(),
        actual,
        forecast_1d: baseValue + noise * 0.5,
        forecast_7d: baseValue + noise * 0.3,
        forecast_14d: baseValue + noise * 0.2,
        forecast_28d: baseValue + noise * 0.1,
        arima: baseValue + noise * 0.6 + (Math.random() - 0.5) * 50,
        lstm: baseValue + noise * 0.4 + (Math.random() - 0.5) * 30,
        prophet: baseValue + noise * 0.5 + (Math.random() - 0.5) * 40,
        ensemble: baseValue + noise * 0.3 + (Math.random() - 0.5) * 20
      });
    }
    
    return data;
  }, [selectedSKU]);

  // Filter data based on date range
  const filteredData = useMemo(() => {
    const days = parseInt(dateRange.replace('d', ''));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return forecastData.filter(d => d.timestamp >= cutoffDate.getTime());
  }, [forecastData, dateRange]);

  // SKU options (mock)
  const skuOptions = useMemo(() => 
    Array.from({ length: 50 }, (_, i) => `SKU-${(i + 1).toString().padStart(3, '0')}`)
      .filter(sku => sku.toLowerCase().includes(searchTerm.toLowerCase()))
  , [searchTerm]);

  const getModelColor = (modelName: string) => {
    const colors: { [key: string]: string } = {
      actual: '#000000',
      forecast_1d: '#ef4444',
      forecast_7d: '#f59e0b',
      forecast_14d: '#10b981',
      forecast_28d: '#3b82f6',
      arima: '#8b5cf6',
      lstm: '#06b6d4',
      prophet: '#84cc16',
      ensemble: '#f97316'
    };
    return colors[modelName] || '#6b7280';
  };

  const getModelName = (key: string) => {
    const names: { [key: string]: string } = {
      actual: 'Actual',
      forecast_1d: '1-Day Forecast',
      forecast_7d: '7-Day Forecast',
      forecast_14d: '14-Day Forecast',
      forecast_28d: '28-Day Forecast',
      arima: 'ARIMA',
      lstm: 'LSTM',
      prophet: 'Prophet',
      ensemble: 'Ensemble'
    };
    return names[key] || key;
  };

  const getVisibleLines = () => {
    const lines = [];
    
    if (showActual) {
      lines.push('actual');
    }
    
    if (model === 'all') {
      if (compareMode) {
        lines.push('arima', 'lstm', 'prophet', 'ensemble');
      } else {
        lines.push(`forecast_${timeHorizon}`);
      }
    } else if (model !== 'all') {
      lines.push(model);
    }
    
    return lines;
  };

  const calculateAccuracy = (actualData: number[], forecastData: number[]) => {
    if (actualData.length === 0 || forecastData.length === 0) return 0;
    
    const errors = actualData.map((actual, i) => 
      Math.abs(actual - (forecastData[i] || 0)) / actual
    );
    
    const mape = errors.reduce((sum, error) => sum + error, 0) / errors.length;
    return Math.max(0, (1 - mape) * 100);
  };

  const resetZoom = () => {
    setZoomLevel(1);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border rounded text-sm w-32"
            />
          </div>
          
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
            <option value="7d">Last 7 days</option>
            <option value="14d">Last 14 days</option>
            <option value="30d">Last 30 days</option>
            <option value="60d">Last 60 days</option>
            <option value="90d">Last 90 days</option>
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
              checked={compareMode}
              onChange={(e) => setCompareMode(e.target.checked)}
              className="rounded"
            />
            <span>Compare Models</span>
          </label>
          
          <div className="flex border rounded">
            <button
              onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.5))}
              className="p-1 hover:bg-gray-50"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => setZoomLevel(Math.min(3, zoomLevel + 0.5))}
              className="p-1 hover:bg-gray-50"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button onClick={resetZoom} className="p-1 hover:bg-gray-50">
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
          
          <button className="p-1 border rounded hover:bg-gray-50">
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Forecast Accuracy Summary */}
      <div className="grid grid-cols-4 gap-4">
        {['1d', '7d', '14d', '28d'].map(horizon => {
          const actualValues = filteredData.filter(d => d.actual !== undefined).map(d => d.actual!);
          const forecastValues = filteredData.map(d => {
            const value = d[`forecast_${horizon}` as keyof ForecastDataPoint];
            return typeof value === 'number' ? value : 0;
          });
          const accuracy = calculateAccuracy(actualValues, forecastValues);
          
          return (
            <div key={horizon} className="bg-gray-50 rounded p-3">
              <div className="text-sm text-gray-600">{horizon.toUpperCase()} Forecast</div>
              <div className="text-lg font-bold">{accuracy.toFixed(1)}%</div>
              <div className="text-xs text-gray-500">accuracy</div>
            </div>
          );
        })}
      </div>

      {/* Main Chart */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">
            Forecast Trends - {selectedSKU}
            {compareMode && ' (Model Comparison)'}
          </h4>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Layers className="h-4 w-4" />
            <span>{getVisibleLines().length} series displayed</span>
          </div>
        </div>
        
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value, name) => [
                  typeof value === 'number' ? value.toFixed(0) : value,
                  getModelName(name as string)
                ]}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              
              {/* Historical data cutoff line */}
              <ReferenceLine 
                x={filteredData.find(d => !d.actual)?.date} 
                stroke="#ff0000" 
                strokeDasharray="5 5"
                label="Forecast Start"
              />
              
              {getVisibleLines().map(lineKey => (
                <Line
                  key={lineKey}
                  type="monotone"
                  dataKey={lineKey}
                  stroke={getModelColor(lineKey)}
                  strokeWidth={lineKey === 'actual' ? 3 : 2}
                  strokeDasharray={lineKey === 'actual' ? '0' : '5 5'}
                  dot={lineKey === 'actual' ? { r: 3 } : false}
                  name={getModelName(lineKey)}
                  connectNulls={false}
                />
              ))}
              
              <Brush 
                dataKey="date" 
                height={30} 
                stroke="#8884d8"
                tickFormatter={() => ''}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Model Performance Comparison */}
      {compareMode && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-3">Model Performance Comparison</h4>
          <div className="grid grid-cols-4 gap-4">
            {['arima', 'lstm', 'prophet', 'ensemble'].map(modelKey => {
              const actualValues = filteredData.filter(d => d.actual !== undefined).map(d => d.actual!);
              const modelValues = filteredData.map(d => {
                const value = d[modelKey as keyof ForecastDataPoint];
                return typeof value === 'number' ? value : 0;
              });
              const accuracy = calculateAccuracy(actualValues, modelValues);
              
              return (
                <div key={modelKey} className="bg-white rounded p-3 border">
                  <div className="flex items-center space-x-2 mb-2">
                    <div 
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: getModelColor(modelKey) }}
                    />
                    <span className="font-medium text-sm">{getModelName(modelKey)}</span>
                  </div>
                  <div className="text-lg font-bold">{accuracy.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500">accuracy</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Statistical Analysis */}
      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">Forecast Statistics</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Mean Forecast:</span>
              <span className="font-medium">
                {(filteredData.reduce((sum, d) => {
                  const value = d[`forecast_${timeHorizon}` as keyof ForecastDataPoint];
                  return sum + (typeof value === 'number' ? value : 0);
                }, 0) / filteredData.length).toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Std Deviation:</span>
              <span className="font-medium">156.3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Coefficient of Variation:</span>
              <span className="font-medium">15.6%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Trend Direction:</span>
              <span className="font-medium text-green-600">Increasing</span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">Seasonal Patterns</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Weekly Seasonality:</span>
              <span className="font-medium">Strong</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Monthly Seasonality:</span>
              <span className="font-medium">Moderate</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Peak Day:</span>
              <span className="font-medium">Friday</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Low Day:</span>
              <span className="font-medium">Sunday</span>
            </div>
          </div>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium mb-3">Data Quality</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Data Completeness:</span>
              <span className="font-medium text-green-600">98.5%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Outliers Detected:</span>
              <span className="font-medium">3</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Missing Days:</span>
              <span className="font-medium">2</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Data Freshness:</span>
              <span className="font-medium text-green-600">Current</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastTrendsMultiChart;