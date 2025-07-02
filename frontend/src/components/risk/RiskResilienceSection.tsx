import React, { useState } from 'react';
import { AlertTriangle, TrendingUp, Shield, Activity, Settings, RefreshCw } from 'lucide-react';
import { MockDataIndicator, useDataSourceStatus } from '@/components/ui/mock-data-indicator';
import AnomalyTimelineChart from './AnomalyTimelineChart';
import BufferCoverageBulletChart from './BufferCoverageBulletChart';
import SupplierRiskAnalysis from './SupplierRiskAnalysis';
import ScenarioPlanner from './ScenarioPlanner';

const RiskResilienceSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [riskThreshold, setRiskThreshold] = useState('medium');
  
  // Data source status for MockDataIndicator
  const { isApiConnected, isLoading, isMockData } = useDataSourceStatus();

  const riskMetrics = {
    criticalAnomalies: 3,
    bufferCritical: 12,
    singleSupplierSKUs: 156,
    overallRiskScore: 72
  };

  const tabs = [
    { id: 'overview', label: 'Risk Overview', icon: Shield },
    { id: 'anomalies', label: 'Anomaly Detection', icon: AlertTriangle },
    { id: 'buffers', label: 'Buffer Coverage', icon: TrendingUp },
    { id: 'suppliers', label: 'Supplier Risk', icon: Activity },
    { id: 'scenarios', label: 'Scenario Planner', icon: Settings }
  ];

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="space-y-6">
      {/* Header with Risk Score */}
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
              value={selectedTimeRange}
              onChange={(e) => setSelectedTimeRange(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
            <button className="p-2 border rounded-md hover:bg-gray-50">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Risk Metrics Dashboard */}
        <div className="grid grid-cols-4 gap-6 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overall Risk Score</p>
                <p className={`text-2xl font-bold ${getRiskColor(riskMetrics.overallRiskScore).split(' ')[0]}`}>
                  {riskMetrics.overallRiskScore}
                </p>
              </div>
              <div className={`p-2 rounded-full ${getRiskColor(riskMetrics.overallRiskScore)}`}>
                <Shield className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Anomalies</p>
                <p className="text-2xl font-bold text-red-600">{riskMetrics.criticalAnomalies}</p>
              </div>
              <div className="p-2 rounded-full bg-red-50 text-red-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Critical Buffer SKUs</p>
                <p className="text-2xl font-bold text-yellow-600">{riskMetrics.bufferCritical}</p>
              </div>
              <div className="p-2 rounded-full bg-yellow-50 text-yellow-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Single-Supplier SKUs</p>
                <p className="text-2xl font-bold text-blue-600">{riskMetrics.singleSupplierSKUs}</p>
              </div>
              <div className="p-2 rounded-full bg-blue-50 text-blue-600">
                <Activity className="h-5 w-5" />
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
        {activeTab === 'overview' && (
          <div className="p-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Recent Anomalies</h3>
                <AnomalyTimelineChart compact={true} />
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Buffer Status</h3>
                <BufferCoverageBulletChart compact={true} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'anomalies' && (
          <div className="p-6">
            <AnomalyTimelineChart />
          </div>
        )}

        {activeTab === 'buffers' && (
          <div className="p-6">
            <BufferCoverageBulletChart />
          </div>
        )}

        {activeTab === 'suppliers' && (
          <div className="p-6">
            <SupplierRiskAnalysis />
          </div>
        )}

        {activeTab === 'scenarios' && (
          <div className="p-6">
            <ScenarioPlanner />
          </div>
        )}
      </div>
    </div>
  );
};

export default RiskResilienceSection;