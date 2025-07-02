import React, { useState } from 'react';
import { TrendingUp, BarChart3, Target, Activity, Calendar, Filter, RefreshCw } from 'lucide-react';
import { MockDataIndicator, useDataSourceStatus } from '@/components/ui/mock-data-indicator';
import ForecastTrendsMultiChart from './ForecastTrendsMultiChart';
import ForecastDeltaBarChart from './ForecastDeltaBarChart';
import AccuracyTrendChart from './AccuracyTrendChart';
import ConfidenceIntervalChart from './ConfidenceIntervalChart';

const ForecastExplorerSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('trends');
  const [selectedTimeHorizon, setSelectedTimeHorizon] = useState('7d');
  const [selectedModel, setSelectedModel] = useState('all');
  const [selectedSKU, setSelectedSKU] = useState('all');
  
  // Data source status for MockDataIndicator
  const { isApiConnected, isLoading, isMockData } = useDataSourceStatus();

  const forecastMetrics = {
    accuracy: 87.3,
    bias: -2.1,
    mae: 145.2,
    mape: 12.4
  };

  const tabs = [
    { id: 'trends', label: 'Forecast Trends', icon: TrendingUp },
    { id: 'accuracy', label: 'Accuracy Analysis', icon: Target },
    { id: 'variance', label: 'Forecast vs Actual', icon: BarChart3 },
    { id: 'confidence', label: 'Confidence Intervals', icon: Activity }
  ];

  const timeHorizons = [
    { value: '1d', label: '1 Day' },
    { value: '7d', label: '7 Days' },
    { value: '14d', label: '14 Days' },
    { value: '28d', label: '28 Days' }
  ];

  const models = [
    { value: 'all', label: 'All Models' },
    { value: 'arima', label: 'ARIMA' },
    { value: 'lstm', label: 'LSTM' },
    { value: 'prophet', label: 'Prophet' },
    { value: 'ensemble', label: 'Ensemble' }
  ];

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 90) return 'text-green-600 bg-green-50';
    if (accuracy >= 80) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="space-y-6">
      {/* Header with Metrics */}
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <MockDataIndicator 
              isLoading={isLoading} 
              isMockData={isMockData} 
              dataSource={isApiConnected ? 'api' : 'mock'} 
              variant="badge" 
              showDetails={true}
            />
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={selectedTimeHorizon}
              onChange={(e) => setSelectedTimeHorizon(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {timeHorizons.map(horizon => (
                <option key={horizon.value} value={horizon.value}>
                  {horizon.label}
                </option>
              ))}
            </select>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              {models.map(model => (
                <option key={model.value} value={model.value}>
                  {model.label}
                </option>
              ))}
            </select>
            <button className="p-2 border rounded-md hover:bg-gray-50">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Forecast Metrics Dashboard */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Forecast Accuracy</p>
                <p className={`text-2xl font-bold ${getAccuracyColor(forecastMetrics.accuracy).split(' ')[0]}`}>
                  {forecastMetrics.accuracy}%
                </p>
              </div>
              <div className={`p-2 rounded-full ${getAccuracyColor(forecastMetrics.accuracy)}`}>
                <Target className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Forecast Bias</p>
                <p className={`text-2xl font-bold ${forecastMetrics.bias < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {forecastMetrics.bias}%
                </p>
              </div>
              <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Mean Absolute Error</p>
                <p className="text-2xl font-bold text-gray-700">{forecastMetrics.mae}</p>
              </div>
              <div className="p-2 rounded-full bg-gray-200 text-gray-600">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">MAPE</p>
                <p className="text-2xl font-bold text-gray-700">{forecastMetrics.mape}%</p>
              </div>
              <div className="p-2 rounded-full bg-purple-50 text-purple-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow-sm border">
        {activeTab === 'trends' && (
          <div className="p-6">
            <ForecastTrendsMultiChart timeHorizon={selectedTimeHorizon} model={selectedModel} />
          </div>
        )}

        {activeTab === 'accuracy' && (
          <div className="p-6">
            <AccuracyTrendChart timeHorizon={selectedTimeHorizon} model={selectedModel} />
          </div>
        )}

        {activeTab === 'variance' && (
          <div className="p-6">
            <ForecastDeltaBarChart timeHorizon={selectedTimeHorizon} model={selectedModel} />
          </div>
        )}

        {activeTab === 'confidence' && (
          <div className="p-6">
            <ConfidenceIntervalChart timeHorizon={selectedTimeHorizon} model={selectedModel} />
          </div>
        )}
      </div>

      {/* Additional Insights Panel */}
      <div className="bg-card rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold mb-4">Forecast Insights</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Model Performance</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Best Model:</span>
                <span className="font-medium">Ensemble</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Worst Model:</span>
                <span className="font-medium">ARIMA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Improvement:</span>
                <span className="font-medium text-green-600">+15.3%</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Seasonal Patterns</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Weekly Pattern:</span>
                <span className="font-medium">Strong</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Monthly Trend:</span>
                <span className="font-medium">Increasing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Volatility:</span>
                <span className="font-medium text-yellow-600">Moderate</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Recommendations</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p>• Use ensemble model for critical SKUs</p>
              <p>• Increase forecast frequency for high-volatility items</p>
              <p>• Review seasonal adjustments for Q4</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForecastExplorerSection;