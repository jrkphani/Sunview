import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ComposedChart, Line, LineChart } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, Search, Filter } from 'lucide-react';

interface BufferCoverageData {
  sku: string;
  category: string;
  currentStock: number;
  safetyStock: number;
  maxStock: number;
  daysOnHand: number;
  velocity: number;
  riskLevel: 'critical' | 'warning' | 'good';
  trend: 'up' | 'down' | 'stable';
  supplier: string;
  leadTime: number;
}

interface BufferCoverageBulletChartProps {
  compact?: boolean;
}

const BufferCoverageBulletChart: React.FC<BufferCoverageBulletChartProps> = ({ compact = false }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('riskLevel');

  // Generate mock buffer coverage data
  const bufferData = useMemo((): BufferCoverageData[] => {
    const categories = ['Electronics', 'Apparel', 'Home & Garden', 'Sports', 'Beauty'];
    const suppliers = ['Supplier A', 'Supplier B', 'Supplier C', 'Supplier D', 'Supplier E'];
    const riskLevels = ['critical', 'warning', 'good'] as const;
    const trends = ['up', 'down', 'stable'] as const;
    
    return Array.from({ length: 50 }, (_, i) => {
      const safetyStock = Math.floor(Math.random() * 100) + 20;
      const maxStock = safetyStock + Math.floor(Math.random() * 200) + 50;
      const currentStock = Math.floor(Math.random() * maxStock);
      const velocity = Math.floor(Math.random() * 20) + 1;
      const daysOnHand = Math.floor(currentStock / velocity);
      
      let riskLevel: 'critical' | 'warning' | 'good';
      if (currentStock < safetyStock * 0.5) riskLevel = 'critical';
      else if (currentStock < safetyStock) riskLevel = 'warning';
      else riskLevel = 'good';
      
      return {
        sku: `SKU-${(i + 1).toString().padStart(3, '0')}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        currentStock,
        safetyStock,
        maxStock,
        daysOnHand,
        velocity,
        riskLevel,
        trend: trends[Math.floor(Math.random() * trends.length)],
        supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
        leadTime: Math.floor(Math.random() * 14) + 1
      };
    });
  }, []);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = bufferData.filter(item => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (selectedRiskLevel !== 'all' && item.riskLevel !== selectedRiskLevel) return false;
      if (searchTerm && !item.sku.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'riskLevel':
          const riskOrder = { critical: 0, warning: 1, good: 2 };
          return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
        case 'daysOnHand':
          return a.daysOnHand - b.daysOnHand;
        case 'sku':
          return a.sku.localeCompare(b.sku);
        default:
          return 0;
      }
    });
  }, [bufferData, selectedCategory, selectedRiskLevel, searchTerm, sortBy]);

  // Summary statistics
  const summary = useMemo(() => {
    const total = filteredData.length;
    const critical = filteredData.filter(d => d.riskLevel === 'critical').length;
    const warning = filteredData.filter(d => d.riskLevel === 'warning').length;
    const good = filteredData.filter(d => d.riskLevel === 'good').length;
    const avgDaysOnHand = filteredData.reduce((sum, d) => sum + d.daysOnHand, 0) / total || 0;
    
    return { total, critical, warning, good, avgDaysOnHand };
  }, [filteredData]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'good': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getRiskBgColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-50';
      case 'warning': return 'bg-yellow-50';
      case 'good': return 'bg-green-50';
      default: return 'bg-gray-50';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <div className="h-4 w-4 bg-gray-300 rounded-full" />;
    }
  };

  if (compact) {
    const topRiskSKUs = filteredData.filter(d => d.riskLevel === 'critical').slice(0, 5);
    
    return (
      <div className="space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-50 p-3 rounded">
            <div className="text-sm text-red-600">Critical</div>
            <div className="text-xl font-bold text-red-700">{summary.critical}</div>
          </div>
          <div className="bg-yellow-50 p-3 rounded">
            <div className="text-sm text-yellow-600">Warning</div>
            <div className="text-xl font-bold text-yellow-700">{summary.warning}</div>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <div className="text-sm text-green-600">Good</div>
            <div className="text-xl font-bold text-green-700">{summary.good}</div>
          </div>
        </div>

        {/* Top Risk SKUs */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Critical Buffer SKUs</h4>
          {topRiskSKUs.map(item => (
            <div key={item.sku} className="flex items-center justify-between p-2 bg-red-50 rounded">
              <div>
                <div className="text-sm font-medium">{item.sku}</div>
                <div className="text-xs text-gray-500">{item.category}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium">{item.daysOnHand}d</div>
                <div className="text-xs text-gray-500">DOH</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Summary */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Buffer Coverage Analysis</h3>
          <p className="text-sm text-gray-600">
            Monitoring {summary.total} SKUs - Avg DOH: {summary.avgDaysOnHand.toFixed(1)} days
          </p>
        </div>
        
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
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Apparel">Apparel</option>
            <option value="Home & Garden">Home & Garden</option>
            <option value="Sports">Sports</option>
            <option value="Beauty">Beauty</option>
          </select>
          
          <select
            value={selectedRiskLevel}
            onChange={(e) => setSelectedRiskLevel(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="good">Good</option>
          </select>
        </div>
      </div>

      {/* Summary Dashboard */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Critical Risk</p>
              <p className="text-2xl font-bold text-red-700">{summary.critical}</p>
              <p className="text-xs text-red-500">{((summary.critical / summary.total) * 100).toFixed(1)}% of total</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">Warning</p>
              <p className="text-2xl font-bold text-yellow-700">{summary.warning}</p>
              <p className="text-xs text-yellow-500">{((summary.warning / summary.total) * 100).toFixed(1)}% of total</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-600">Good</p>
              <p className="text-2xl font-bold text-green-700">{summary.good}</p>
              <p className="text-xs text-green-500">{((summary.good / summary.total) * 100).toFixed(1)}% of total</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Avg Days on Hand</p>
              <p className="text-2xl font-bold text-blue-700">{summary.avgDaysOnHand.toFixed(1)}</p>
              <p className="text-xs text-blue-500">days</p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Bullet Chart Visualization */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Buffer Coverage by SKU</h4>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="riskLevel">Sort by Risk Level</option>
            <option value="daysOnHand">Sort by Days on Hand</option>
            <option value="sku">Sort by SKU</option>
          </select>
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2">
          {filteredData.slice(0, 20).map(item => {
            const stockPercentage = (item.currentStock / item.maxStock) * 100;
            const safetyPercentage = (item.safetyStock / item.maxStock) * 100;
            
            return (
              <div key={item.sku} className={`p-4 border rounded-lg ${getRiskBgColor(item.riskLevel)}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{item.sku}</span>
                    <span className="text-sm text-gray-500">{item.category}</span>
                    {getTrendIcon(item.trend)}
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span>DOH: {item.daysOnHand}d</span>
                    <span>Velocity: {item.velocity}/day</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                      item.riskLevel === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.riskLevel}
                    </span>
                  </div>
                </div>
                
                {/* Bullet Chart */}
                <div className="relative">
                  {/* Background bar (max stock) */}
                  <div className="w-full h-6 bg-gray-200 rounded">
                    {/* Safety stock threshold */}
                    <div 
                      className="absolute h-6 bg-gray-300 rounded-l"
                      style={{ width: `${safetyPercentage}%` }}
                    />
                    {/* Current stock */}
                    <div 
                      className="absolute h-6 rounded-l"
                      style={{ 
                        width: `${stockPercentage}%`,
                        backgroundColor: getRiskColor(item.riskLevel)
                      }}
                    />
                    {/* Safety stock line */}
                    <div 
                      className="absolute h-6 w-0.5 bg-red-600"
                      style={{ left: `${safetyPercentage}%` }}
                    />
                  </div>
                  
                  {/* Labels */}
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>0</span>
                    <span>Safety: {item.safetyStock}</span>
                    <span>Current: {item.currentStock}</span>
                    <span>Max: {item.maxStock}</span>
                  </div>
                </div>
                
                {/* Additional Info */}
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>Supplier: {item.supplier}</span>
                  <span>Lead Time: {item.leadTime} days</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Distribution Chart */}
      <div className="space-y-4">
        <h4 className="font-medium">Days on Hand Distribution</h4>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={[
              { range: '0-5', count: filteredData.filter(d => d.daysOnHand <= 5).length, color: '#ef4444' },
              { range: '6-10', count: filteredData.filter(d => d.daysOnHand > 5 && d.daysOnHand <= 10).length, color: '#f59e0b' },
              { range: '11-20', count: filteredData.filter(d => d.daysOnHand > 10 && d.daysOnHand <= 20).length, color: '#10b981' },
              { range: '21-30', count: filteredData.filter(d => d.daysOnHand > 20 && d.daysOnHand <= 30).length, color: '#3b82f6' },
              { range: '30+', count: filteredData.filter(d => d.daysOnHand > 30).length, color: '#6366f1' }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count">
                {[
                  { range: '0-5', count: filteredData.filter(d => d.daysOnHand <= 5).length, color: '#ef4444' },
                  { range: '6-10', count: filteredData.filter(d => d.daysOnHand > 5 && d.daysOnHand <= 10).length, color: '#f59e0b' },
                  { range: '11-20', count: filteredData.filter(d => d.daysOnHand > 10 && d.daysOnHand <= 20).length, color: '#10b981' },
                  { range: '21-30', count: filteredData.filter(d => d.daysOnHand > 20 && d.daysOnHand <= 30).length, color: '#3b82f6' },
                  { range: '30+', count: filteredData.filter(d => d.daysOnHand > 30).length, color: '#6366f1' }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BufferCoverageBulletChart;