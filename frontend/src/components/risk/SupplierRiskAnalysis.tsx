import React, { useState, useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ScatterChart, Scatter } from 'recharts';
import { AlertTriangle, Users, Package, TrendingUp, Search, Filter, Eye, MapPin } from 'lucide-react';

interface SupplierRiskData {
  id: string;
  name: string;
  country: string;
  region: string;
  skuCount: number;
  criticalSKUs: string[];
  riskScore: number;
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  categories: string[];
  leadTime: number;
  reliability: number;
  diversification: number;
  totalValue: number;
  lastAssessment: Date;
  issues: string[];
}

interface SupplierRiskAnalysisProps {}

const SupplierRiskAnalysis: React.FC<SupplierRiskAnalysisProps> = () => {
  const [viewMode, setViewMode] = useState<'pie' | 'table' | 'matrix'>('pie');
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierRiskData | null>(null);
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterRiskLevel, setFilterRiskLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Generate mock supplier risk data
  const supplierData = useMemo((): SupplierRiskData[] => {
    const countries = ['China', 'India', 'Vietnam', 'Mexico', 'Brazil', 'Turkey', 'Bangladesh', 'Thailand'];
    const regions = ['Asia', 'North America', 'South America', 'Europe'];
    const categories = ['Electronics', 'Apparel', 'Home & Garden', 'Sports', 'Beauty'];
    
    return Array.from({ length: 25 }, (_, i) => {
      const skuCount = Math.floor(Math.random() * 50) + 5;
      const riskScore = Math.floor(Math.random() * 100);
      let riskLevel: 'critical' | 'high' | 'medium' | 'low';
      
      if (riskScore >= 80) riskLevel = 'critical';
      else if (riskScore >= 60) riskLevel = 'high';
      else if (riskScore >= 40) riskLevel = 'medium';
      else riskLevel = 'low';
      
      const country = countries[Math.floor(Math.random() * countries.length)];
      let region = 'Asia';
      if (country === 'Mexico') region = 'North America';
      else if (country === 'Brazil') region = 'South America';
      else if (country === 'Turkey') region = 'Europe';
      
      return {
        id: `SUP-${(i + 1).toString().padStart(3, '0')}`,
        name: `Supplier ${String.fromCharCode(65 + i)}`,
        country,
        region,
        skuCount,
        criticalSKUs: Array.from({ length: Math.floor(Math.random() * 5) }, (_, j) => `SKU-${Math.floor(Math.random() * 1000)}`),
        riskScore,
        riskLevel,
        categories: categories.slice(0, Math.floor(Math.random() * 3) + 1),
        leadTime: Math.floor(Math.random() * 30) + 7,
        reliability: Math.floor(Math.random() * 40) + 60,
        diversification: Math.floor(Math.random() * 100),
        totalValue: Math.floor(Math.random() * 10000000) + 100000,
        lastAssessment: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
        issues: [
          'Single source dependency',
          'Geopolitical risk',
          'Quality concerns',
          'Delivery delays',
          'Financial instability'
        ].filter(() => Math.random() > 0.7)
      };
    });
  }, []);

  // Single-supplier SKU analysis
  const singleSupplierAnalysis = useMemo(() => {
    const singleSupplierSKUs = supplierData.filter(s => s.skuCount === 1);
    const totalSKUs = supplierData.reduce((sum, s) => sum + s.skuCount, 0);
    const singleSupplierCount = singleSupplierSKUs.length;
    
    const riskDistribution = [
      { name: 'Critical Risk', value: singleSupplierSKUs.filter(s => s.riskLevel === 'critical').length, color: '#ef4444' },
      { name: 'High Risk', value: singleSupplierSKUs.filter(s => s.riskLevel === 'high').length, color: '#f59e0b' },
      { name: 'Medium Risk', value: singleSupplierSKUs.filter(s => s.riskLevel === 'medium').length, color: '#10b981' },
      { name: 'Low Risk', value: singleSupplierSKUs.filter(s => s.riskLevel === 'low').length, color: '#3b82f6' }
    ];
    
    return { singleSupplierCount, totalSKUs, riskDistribution, singleSupplierSKUs };
  }, [supplierData]);

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    return supplierData.filter(supplier => {
      if (filterRegion !== 'all' && supplier.region !== filterRegion) return false;
      if (filterRiskLevel !== 'all' && supplier.riskLevel !== filterRiskLevel) return false;
      if (searchTerm && !supplier.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });
  }, [supplierData, filterRegion, filterRiskLevel, searchTerm]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#10b981';
      case 'low': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getRiskBgColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-50';
      case 'high': return 'bg-yellow-50';
      case 'medium': return 'bg-green-50';
      case 'low': return 'bg-blue-50';
      default: return 'bg-gray-50';
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Supplier Risk Analysis</h3>
          <p className="text-sm text-gray-600">
            Analyzing {filteredSuppliers.length} suppliers across {new Set(filteredSuppliers.map(s => s.region)).size} regions
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-1 border rounded text-sm w-40"
            />
          </div>
          
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">All Regions</option>
            <option value="Asia">Asia</option>
            <option value="North America">North America</option>
            <option value="South America">South America</option>
            <option value="Europe">Europe</option>
          </select>
          
          <select
            value={filterRiskLevel}
            onChange={(e) => setFilterRiskLevel(e.target.value)}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">All Risk Levels</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <div className="flex border rounded">
            <button
              onClick={() => setViewMode('pie')}
              className={`px-3 py-1 text-sm ${viewMode === 'pie' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              Chart
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 text-sm ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              className={`px-3 py-1 text-sm ${viewMode === 'matrix' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
            >
              Matrix
            </button>
          </div>
        </div>
      </div>

      {/* Risk Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-600">Critical Risk</p>
              <p className="text-2xl font-bold text-red-700">
                {filteredSuppliers.filter(s => s.riskLevel === 'critical').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-600">High Risk</p>
              <p className="text-2xl font-bold text-yellow-700">
                {filteredSuppliers.filter(s => s.riskLevel === 'high').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-600">Single-Supplier SKUs</p>
              <p className="text-2xl font-bold text-blue-700">{singleSupplierAnalysis.singleSupplierCount}</p>
              <p className="text-xs text-blue-500">
                {((singleSupplierAnalysis.singleSupplierCount / singleSupplierAnalysis.totalSKUs) * 100).toFixed(1)}% of total
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Suppliers</p>
              <p className="text-2xl font-bold text-gray-700">{filteredSuppliers.length}</p>
            </div>
            <Users className="h-8 w-8 text-gray-500" />
          </div>
        </div>
      </div>

      {/* Main Content Based on View Mode */}
      {viewMode === 'pie' && (
        <div className="grid grid-cols-2 gap-6">
          {/* Risk Distribution Pie Chart */}
          <div className="bg-white border rounded-lg p-6">
            <h4 className="font-medium mb-4">Risk Level Distribution</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Critical', value: filteredSuppliers.filter(s => s.riskLevel === 'critical').length, color: '#ef4444' },
                      { name: 'High', value: filteredSuppliers.filter(s => s.riskLevel === 'high').length, color: '#f59e0b' },
                      { name: 'Medium', value: filteredSuppliers.filter(s => s.riskLevel === 'medium').length, color: '#10b981' },
                      { name: 'Low', value: filteredSuppliers.filter(s => s.riskLevel === 'low').length, color: '#3b82f6' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {[
                      { name: 'Critical', value: filteredSuppliers.filter(s => s.riskLevel === 'critical').length, color: '#ef4444' },
                      { name: 'High', value: filteredSuppliers.filter(s => s.riskLevel === 'high').length, color: '#f59e0b' },
                      { name: 'Medium', value: filteredSuppliers.filter(s => s.riskLevel === 'medium').length, color: '#10b981' },
                      { name: 'Low', value: filteredSuppliers.filter(s => s.riskLevel === 'low').length, color: '#3b82f6' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Single-Supplier SKU Risk */}
          <div className="bg-white border rounded-lg p-6">
            <h4 className="font-medium mb-4">Single-Supplier SKU Risk</h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={singleSupplierAnalysis.riskDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {singleSupplierAnalysis.riskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'matrix' && (
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-medium mb-4">Risk vs. Value Matrix</h4>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart>
                <CartesianGrid />
                <XAxis 
                  dataKey="riskScore" 
                  type="number" 
                  domain={[0, 100]}
                  name="Risk Score"
                />
                <YAxis 
                  dataKey="totalValue" 
                  type="number" 
                  name="Total Value"
                  tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                />
                <Tooltip 
                  formatter={(value, name, props) => [
                    name === 'riskScore' ? value : formatCurrency(value as number),
                    name === 'riskScore' ? 'Risk Score' : 'Total Value'
                  ]}
                  labelFormatter={(label, payload) => payload?.[0]?.payload?.name || ''}
                />
                <Scatter data={filteredSuppliers}>
                  {filteredSuppliers.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getRiskColor(entry.riskLevel)} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {viewMode === 'table' && (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Risk Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SKU Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Region
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {supplier.country}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        supplier.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                        supplier.riskLevel === 'high' ? 'bg-yellow-100 text-yellow-800' :
                        supplier.riskLevel === 'medium' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {supplier.riskLevel}
                      </span>
                      <div className="text-xs text-gray-500 mt-1">Score: {supplier.riskScore}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.skuCount}
                      {supplier.criticalSKUs.length > 0 && (
                        <div className="text-xs text-red-600">
                          {supplier.criticalSKUs.length} critical
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.region}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(supplier.totalValue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {supplier.leadTime} days
                      <div className="text-xs text-gray-500">
                        {supplier.reliability}% reliable
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedSupplier(supplier)}
                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                      >
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Supplier Detail Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{selectedSupplier.name}</h3>
              <button 
                onClick={() => setSelectedSupplier(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span>{selectedSupplier.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Country:</span>
                      <span>{selectedSupplier.country}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Region:</span>
                      <span>{selectedSupplier.region}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Categories:</span>
                      <span>{selectedSupplier.categories.join(', ')}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Performance Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Lead Time:</span>
                      <span>{selectedSupplier.leadTime} days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reliability:</span>
                      <span>{selectedSupplier.reliability}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Diversification:</span>
                      <span>{selectedSupplier.diversification}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Value:</span>
                      <span>{formatCurrency(selectedSupplier.totalValue)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Risk Assessment</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Risk Score:</span>
                      <span className="text-lg font-bold" style={{ color: getRiskColor(selectedSupplier.riskLevel) }}>
                        {selectedSupplier.riskScore}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Risk Level:</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedSupplier.riskLevel === 'critical' ? 'bg-red-100 text-red-800' :
                        selectedSupplier.riskLevel === 'high' ? 'bg-yellow-100 text-yellow-800' :
                        selectedSupplier.riskLevel === 'medium' ? 'bg-green-100 text-green-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedSupplier.riskLevel}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Last Assessment: {selectedSupplier.lastAssessment.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">SKU Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total SKUs:</span>
                      <span>{selectedSupplier.skuCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Critical SKUs:</span>
                      <span className="text-red-600">{selectedSupplier.criticalSKUs.length}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Risk Issues</h4>
                  <div className="space-y-1">
                    {selectedSupplier.issues.length > 0 ? (
                      selectedSupplier.issues.map((issue, index) => (
                        <div key={index} className="flex items-center space-x-2 text-sm">
                          <AlertTriangle className="h-3 w-3 text-yellow-500" />
                          <span>{issue}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-500">No current issues</div>
                    )}
                  </div>
                </div>
                
                {selectedSupplier.criticalSKUs.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Critical SKUs</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedSupplier.criticalSKUs.map((sku, index) => (
                        <div key={index} className="text-sm text-gray-600 flex items-center space-x-2">
                          <Package className="h-3 w-3" />
                          <span>{sku}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupplierRiskAnalysis;