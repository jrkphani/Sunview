import React, { useState, useMemo } from 'react';
import { AlertTriangle, AlertCircle, Info, X, Eye, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Scatter, ScatterChart, Cell } from 'recharts';

interface AnomalyEvent {
  id: string;
  timestamp: Date;
  type: 'critical' | 'warning' | 'info';
  category: 'demand' | 'supply' | 'quality' | 'delivery';
  title: string;
  description: string;
  impact: number;
  sku?: string;
  supplier?: string;
  mlConfidence: number;
  resolved: boolean;
}

interface AnomalyTimelineChartProps {
  compact?: boolean;
}

const AnomalyTimelineChart: React.FC<AnomalyTimelineChartProps> = ({ compact = false }) => {
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyEvent | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [showResolved, setShowResolved] = useState(false);

  // Generate mock anomaly data
  const anomalies = useMemo((): AnomalyEvent[] => {
    const events: AnomalyEvent[] = [];
    const categories = ['demand', 'supply', 'quality', 'delivery'] as const;
    const types = ['critical', 'warning', 'info'] as const;
    
    for (let i = 0; i < 25; i++) {
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 30));
      
      events.push({
        id: `anomaly-${i}`,
        timestamp: date,
        type: types[Math.floor(Math.random() * types.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        title: `Anomaly ${i + 1}`,
        description: `Detected unusual pattern in ${categories[Math.floor(Math.random() * categories.length)]} metrics`,
        impact: Math.floor(Math.random() * 100),
        sku: Math.random() > 0.5 ? `SKU-${Math.floor(Math.random() * 1000)}` : undefined,
        supplier: Math.random() > 0.5 ? `Supplier-${Math.floor(Math.random() * 50)}` : undefined,
        mlConfidence: 0.6 + Math.random() * 0.4,
        resolved: Math.random() > 0.3
      });
    }
    
    return events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, []);

  // Filter anomalies
  const filteredAnomalies = useMemo(() => {
    return anomalies.filter(anomaly => {
      if (filterCategory !== 'all' && anomaly.category !== filterCategory) return false;
      if (filterSeverity !== 'all' && anomaly.type !== filterSeverity) return false;
      if (!showResolved && anomaly.resolved) return false;
      return true;
    });
  }, [anomalies, filterCategory, filterSeverity, showResolved]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dayAnomalies = filteredAnomalies.filter(a => 
        a.timestamp.toDateString() === date.toDateString()
      );
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        timestamp: date.getTime(),
        total: dayAnomalies.length,
        critical: dayAnomalies.filter(a => a.type === 'critical').length,
        warning: dayAnomalies.filter(a => a.type === 'warning').length,
        info: dayAnomalies.filter(a => a.type === 'info').length,
        anomalies: dayAnomalies
      });
    }
    
    return data;
  }, [filteredAnomalies]);

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getAnomalyColor = (type: string) => {
    switch (type) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      default: return '#3b82f6';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'demand': return '#8b5cf6';
      case 'supply': return '#10b981';
      case 'quality': return '#f59e0b';
      case 'delivery': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} />
              <Line type="monotone" dataKey="warning" stroke="#f59e0b" strokeWidth={2} />
              <Line type="monotone" dataKey="info" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="space-y-2">
          {filteredAnomalies.slice(0, 3).map(anomaly => (
            <div key={anomaly.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
              {getAnomalyIcon(anomaly.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{anomaly.title}</p>
                <p className="text-xs text-gray-500">{anomaly.timestamp.toLocaleDateString()}</p>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                anomaly.type === 'critical' ? 'bg-red-100 text-red-800' :
                anomaly.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {anomaly.category}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Anomaly Detection Timeline</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="all">All Categories</option>
              <option value="demand">Demand</option>
              <option value="supply">Supply</option>
              <option value="quality">Quality</option>
              <option value="delivery">Delivery</option>
            </select>
          </div>
          
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
          
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showResolved}
              onChange={(e) => setShowResolved(e.target.checked)}
              className="rounded"
            />
            <span>Show Resolved</span>
          </label>
        </div>
      </div>

      {/* Timeline Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip 
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border rounded shadow-lg">
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-red-600">Critical: {data.critical}</p>
                      <p className="text-sm text-yellow-600">Warning: {data.warning}</p>
                      <p className="text-sm text-blue-600">Info: {data.info}</p>
                      <p className="text-sm font-medium">Total: {data.total}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} name="Critical" />
            <Line type="monotone" dataKey="warning" stroke="#f59e0b" strokeWidth={2} name="Warning" />
            <Line type="monotone" dataKey="info" stroke="#3b82f6" strokeWidth={2} name="Info" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Anomaly List */}
      <div className="space-y-4">
        <h4 className="font-medium">Recent Anomalies ({filteredAnomalies.length})</h4>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredAnomalies.map(anomaly => (
            <div 
              key={anomaly.id} 
              className="flex items-center justify-between p-4 border rounded hover:bg-gray-50 cursor-pointer"
              onClick={() => setSelectedAnomaly(anomaly)}
            >
              <div className="flex items-center space-x-4">
                {getAnomalyIcon(anomaly.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900">{anomaly.title}</p>
                    {anomaly.resolved && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                        Resolved
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{anomaly.description}</p>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-xs text-gray-400">
                      {anomaly.timestamp.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-400">
                      ML Confidence: {(anomaly.mlConfidence * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span 
                  className="px-2 py-1 text-xs rounded-full"
                  style={{ 
                    backgroundColor: `${getCategoryColor(anomaly.category)}20`,
                    color: getCategoryColor(anomaly.category)
                  }}
                >
                  {anomaly.category}
                </span>
                <div className="text-right">
                  <p className="text-sm font-medium">Impact: {anomaly.impact}%</p>
                </div>
                <Eye className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anomaly Detail Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getAnomalyIcon(selectedAnomaly.type)}
                <h3 className="text-lg font-semibold">{selectedAnomaly.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedAnomaly(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-gray-700">Timestamp</p>
                  <p>{selectedAnomaly.timestamp.toLocaleString()}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Category</p>
                  <p className="capitalize">{selectedAnomaly.category}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Severity</p>
                  <p className="capitalize">{selectedAnomaly.type}</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Impact Score</p>
                  <p>{selectedAnomaly.impact}%</p>
                </div>
                {selectedAnomaly.sku && (
                  <div>
                    <p className="font-medium text-gray-700">SKU</p>
                    <p>{selectedAnomaly.sku}</p>
                  </div>
                )}
                {selectedAnomaly.supplier && (
                  <div>
                    <p className="font-medium text-gray-700">Supplier</p>
                    <p>{selectedAnomaly.supplier}</p>
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-700">ML Confidence</p>
                  <p>{(selectedAnomaly.mlConfidence * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Status</p>
                  <p>{selectedAnomaly.resolved ? 'Resolved' : 'Active'}</p>
                </div>
              </div>
              
              <div>
                <p className="font-medium text-gray-700 mb-2">Description</p>
                <p className="text-gray-600">{selectedAnomaly.description}</p>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4 border-t">
                {!selectedAnomaly.resolved && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                    Mark as Resolved
                  </button>
                )}
                <button 
                  onClick={() => setSelectedAnomaly(null)}
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

export default AnomalyTimelineChart;