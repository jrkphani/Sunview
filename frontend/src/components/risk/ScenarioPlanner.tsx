import React, { useState, useMemo } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Play, RotateCcw, Save, Download, Settings, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface ScenarioInput {
  demandChange: number; // percentage change
  supplyDisruption: number; // percentage impact
  leadTimeIncrease: number; // percentage increase
  costInflation: number; // percentage increase
  qualityIssues: number; // percentage impact
  newSupplierTime: number; // weeks to onboard
}

interface ScenarioResult {
  period: number;
  doh: number;
  otif: number;
  cost: number;
  risk: number;
  stockout: number;
  overstock: number;
}

interface ScenarioMetrics {
  avgDOH: number;
  avgOTIF: number;
  totalCost: number;
  riskScore: number;
  stockoutDays: number;
  overstockDays: number;
}

const ScenarioPlanner: React.FC = () => {
  const [scenarioInputs, setScenarioInputs] = useState<ScenarioInput>({
    demandChange: 0,
    supplyDisruption: 0,
    leadTimeIncrease: 0,
    costInflation: 0,
    qualityIssues: 0,
    newSupplierTime: 12
  });

  const [isRunning, setIsRunning] = useState(false);
  const [scenarioName, setScenarioName] = useState('');
  const [savedScenarios, setSavedScenarios] = useState<Array<{name: string, inputs: ScenarioInput, results: ScenarioResult[]}>>([]);
  const [selectedComparison, setSelectedComparison] = useState<string>('');

  // Baseline scenario (no changes)
  const baselineInputs: ScenarioInput = {
    demandChange: 0,
    supplyDisruption: 0,
    leadTimeIncrease: 0,
    costInflation: 0,
    qualityIssues: 0,
    newSupplierTime: 12
  };

  // Calculate scenario results
  const calculateScenario = (inputs: ScenarioInput): ScenarioResult[] => {
    const results: ScenarioResult[] = [];
    
    // Initial baseline values
    let baseDOH = 15;
    let baseOTIF = 95;
    let baseCost = 1000000;
    let baseRisk = 20;
    
    for (let period = 1; period <= 12; period++) {
      // Apply demand impact
      const demandImpact = 1 + (inputs.demandChange / 100);
      
      // Apply supply disruption (reduces effective supply)
      const supplyImpact = Math.max(0.1, 1 - (inputs.supplyDisruption / 100));
      
      // Apply lead time increase
      const leadTimeImpact = 1 + (inputs.leadTimeIncrease / 100);
      
      // Apply cost inflation
      const costImpact = 1 + (inputs.costInflation / 100);
      
      // Apply quality issues
      const qualityImpact = Math.max(0.5, 1 - (inputs.qualityIssues / 100));
      
      // Calculate metrics with impacts
      const doh = Math.max(0, (baseDOH / demandImpact) * supplyImpact / leadTimeImpact);
      const otif = Math.max(0, Math.min(100, baseOTIF * supplyImpact * qualityImpact / leadTimeImpact));
      const cost = baseCost * costImpact * (1 + (inputs.supplyDisruption / 100) * 0.5); // Emergency costs
      const risk = Math.min(100, baseRisk + inputs.supplyDisruption + inputs.qualityIssues + (inputs.leadTimeIncrease / 2));
      
      // Calculate stockout and overstock probabilities
      const stockout = Math.max(0, Math.min(100, (20 - doh) * 2 + (100 - otif) / 2));
      const overstock = Math.max(0, Math.min(100, (doh - 30) * 1.5));
      
      results.push({
        period,
        doh: Math.round(doh * 10) / 10,
        otif: Math.round(otif * 10) / 10,
        cost: Math.round(cost),
        risk: Math.round(risk * 10) / 10,
        stockout: Math.round(stockout * 10) / 10,
        overstock: Math.round(overstock * 10) / 10
      });
    }
    
    return results;
  };

  const currentResults = useMemo(() => calculateScenario(scenarioInputs), [scenarioInputs]);
  const baselineResults = useMemo(() => calculateScenario(baselineInputs), []);

  // Calculate summary metrics
  const calculateMetrics = (results: ScenarioResult[]): ScenarioMetrics => {
    const avgDOH = results.reduce((sum, r) => sum + r.doh, 0) / results.length;
    const avgOTIF = results.reduce((sum, r) => sum + r.otif, 0) / results.length;
    const totalCost = results.reduce((sum, r) => sum + r.cost, 0);
    const riskScore = Math.max(...results.map(r => r.risk));
    const stockoutDays = results.filter(r => r.stockout > 50).length;
    const overstockDays = results.filter(r => r.overstock > 50).length;
    
    return { avgDOH, avgOTIF, totalCost, riskScore, stockoutDays, overstockDays };
  };

  const currentMetrics = useMemo(() => calculateMetrics(currentResults), [currentResults]);
  const baselineMetrics = useMemo(() => calculateMetrics(baselineResults), [baselineResults]);

  const runScenario = () => {
    setIsRunning(true);
    // Simulate calculation time
    setTimeout(() => {
      setIsRunning(false);
    }, 2000);
  };

  const resetScenario = () => {
    setScenarioInputs(baselineInputs);
    setScenarioName('');
  };

  const saveScenario = () => {
    if (!scenarioName.trim()) return;
    
    const newScenario = {
      name: scenarioName,
      inputs: { ...scenarioInputs },
      results: [...currentResults]
    };
    
    setSavedScenarios(prev => [...prev, newScenario]);
    setScenarioName('');
  };

  const loadScenario = (scenario: any) => {
    setScenarioInputs(scenario.inputs);
    setScenarioName(scenario.name);
  };

  const getMetricChange = (current: number, baseline: number) => {
    const change = ((current - baseline) / baseline) * 100;
    return {
      value: change,
      isPositive: change > 0,
      formatted: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`
    };
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
          <h3 className="text-lg font-semibold">Scenario Planner</h3>
          <p className="text-sm text-gray-600">
            Model supply chain impacts and test resilience scenarios
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="Scenario name..."
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            className="px-3 py-2 border rounded text-sm w-40"
          />
          <button
            onClick={saveScenario}
            disabled={!scenarioName.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-1"
          >
            <Save className="h-4 w-4" />
            <span>Save</span>
          </button>
          <button
            onClick={resetScenario}
            className="px-3 py-2 border rounded text-sm hover:bg-gray-50 flex items-center space-x-1"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={runScenario}
            disabled={isRunning}
            className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 flex items-center space-x-1"
          >
            <Play className="h-4 w-4" />
            <span>{isRunning ? 'Running...' : 'Run Scenario'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Input Controls */}
        <div className="bg-white border rounded-lg p-6">
          <h4 className="font-medium mb-4 flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Scenario Inputs</span>
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Demand Change (%)
              </label>
              <input
                type="range"
                min="-50"
                max="100"
                value={scenarioInputs.demandChange}
                onChange={(e) => setScenarioInputs(prev => ({ ...prev, demandChange: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>-50%</span>
                <span className="font-medium">{scenarioInputs.demandChange}%</span>
                <span>+100%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Supply Disruption (%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={scenarioInputs.supplyDisruption}
                onChange={(e) => setScenarioInputs(prev => ({ ...prev, supplyDisruption: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span className="font-medium">{scenarioInputs.supplyDisruption}%</span>
                <span>100%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Time Increase (%)
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={scenarioInputs.leadTimeIncrease}
                onChange={(e) => setScenarioInputs(prev => ({ ...prev, leadTimeIncrease: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span className="font-medium">{scenarioInputs.leadTimeIncrease}%</span>
                <span>200%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cost Inflation (%)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={scenarioInputs.costInflation}
                onChange={(e) => setScenarioInputs(prev => ({ ...prev, costInflation: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span className="font-medium">{scenarioInputs.costInflation}%</span>
                <span>50%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quality Issues (%)
              </label>
              <input
                type="range"
                min="0"
                max="50"
                value={scenarioInputs.qualityIssues}
                onChange={(e) => setScenarioInputs(prev => ({ ...prev, qualityIssues: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>0%</span>
                <span className="font-medium">{scenarioInputs.qualityIssues}%</span>
                <span>50%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Supplier Onboarding (weeks)
              </label>
              <input
                type="range"
                min="4"
                max="52"
                value={scenarioInputs.newSupplierTime}
                onChange={(e) => setScenarioInputs(prev => ({ ...prev, newSupplierTime: Number(e.target.value) }))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>4</span>
                <span className="font-medium">{scenarioInputs.newSupplierTime}</span>
                <span>52</span>
              </div>
            </div>
          </div>

          {/* Saved Scenarios */}
          {savedScenarios.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h5 className="font-medium mb-3">Saved Scenarios</h5>
              <div className="space-y-2">
                {savedScenarios.map((scenario, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm">{scenario.name}</span>
                    <button
                      onClick={() => loadScenario(scenario)}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Load
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results Dashboard */}
        <div className="col-span-2 space-y-6">
          {/* Impact Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Days on Hand</p>
                  <p className="text-2xl font-bold">{currentMetrics.avgDOH.toFixed(1)}</p>
                  <div className="flex items-center space-x-1 text-xs">
                    {getMetricChange(currentMetrics.avgDOH, baselineMetrics.avgDOH).isPositive ? 
                      <TrendingUp className="h-3 w-3 text-green-500" /> : 
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    }
                    <span className={getMetricChange(currentMetrics.avgDOH, baselineMetrics.avgDOH).isPositive ? 'text-green-600' : 'text-red-600'}>
                      {getMetricChange(currentMetrics.avgDOH, baselineMetrics.avgDOH).formatted}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg OTIF</p>
                  <p className="text-2xl font-bold">{currentMetrics.avgOTIF.toFixed(1)}%</p>
                  <div className="flex items-center space-x-1 text-xs">
                    {getMetricChange(currentMetrics.avgOTIF, baselineMetrics.avgOTIF).isPositive ? 
                      <TrendingUp className="h-3 w-3 text-green-500" /> : 
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    }
                    <span className={getMetricChange(currentMetrics.avgOTIF, baselineMetrics.avgOTIF).isPositive ? 'text-green-600' : 'text-red-600'}>
                      {getMetricChange(currentMetrics.avgOTIF, baselineMetrics.avgOTIF).formatted}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Risk Score</p>
                  <p className="text-2xl font-bold text-red-600">{currentMetrics.riskScore.toFixed(1)}</p>
                  <div className="flex items-center space-x-1 text-xs">
                    {getMetricChange(currentMetrics.riskScore, baselineMetrics.riskScore).isPositive ? 
                      <TrendingUp className="h-3 w-3 text-red-500" /> : 
                      <TrendingDown className="h-3 w-3 text-green-500" />
                    }
                    <span className={getMetricChange(currentMetrics.riskScore, baselineMetrics.riskScore).isPositive ? 'text-red-600' : 'text-green-600'}>
                      {getMetricChange(currentMetrics.riskScore, baselineMetrics.riskScore).formatted}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            {/* DOH and OTIF Trends */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium mb-3">DOH & OTIF Trends</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentResults}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="doh" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Days on Hand"
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="otif" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="OTIF %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Risk and Cost */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium mb-3">Risk & Cost Impact</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={currentResults}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip formatter={(value, name) => [
                      name === 'cost' ? formatCurrency(value as number) : value,
                      name === 'cost' ? 'Cost' : 'Risk Score'
                    ]} />
                    <Legend />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="risk" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Risk Score"
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="cost" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Cost"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Stockout/Overstock Risk */}
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium mb-3">Stock Risk Analysis</h4>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={currentResults}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="stockout" 
                    stackId="1"
                    stroke="#ef4444" 
                    fill="#ef4444"
                    name="Stockout Risk %"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="overstock" 
                    stackId="2"
                    stroke="#f59e0b" 
                    fill="#f59e0b"
                    name="Overstock Risk %"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Comparison with Baseline */}
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium mb-3">Impact vs Baseline</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex justify-between py-2 border-b">
                  <span>Total Cost:</span>
                  <span className="font-medium">
                    {formatCurrency(currentMetrics.totalCost)}
                    <span className={`ml-2 ${getMetricChange(currentMetrics.totalCost, baselineMetrics.totalCost).isPositive ? 'text-red-600' : 'text-green-600'}`}>
                      ({getMetricChange(currentMetrics.totalCost, baselineMetrics.totalCost).formatted})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span>Stockout Days:</span>
                  <span className="font-medium">
                    {currentMetrics.stockoutDays}
                    <span className={`ml-2 ${currentMetrics.stockoutDays > baselineMetrics.stockoutDays ? 'text-red-600' : 'text-green-600'}`}>
                      ({currentMetrics.stockoutDays - baselineMetrics.stockoutDays > 0 ? '+' : ''}{currentMetrics.stockoutDays - baselineMetrics.stockoutDays})
                    </span>
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span>Overstock Days:</span>
                  <span className="font-medium">
                    {currentMetrics.overstockDays}
                    <span className={`ml-2 ${currentMetrics.overstockDays > baselineMetrics.overstockDays ? 'text-red-600' : 'text-green-600'}`}>
                      ({currentMetrics.overstockDays - baselineMetrics.overstockDays > 0 ? '+' : ''}{currentMetrics.overstockDays - baselineMetrics.overstockDays})
                    </span>
                  </span>
                </div>
              </div>
              
              <div className="pl-4 border-l">
                <h5 className="font-medium mb-2">Key Insights</h5>
                <div className="space-y-1 text-xs">
                  {currentMetrics.riskScore > 50 && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span>High risk scenario detected</span>
                    </div>
                  )}
                  {currentMetrics.avgDOH < 10 && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Low inventory levels expected</span>
                    </div>
                  )}
                  {currentMetrics.avgOTIF < 90 && (
                    <div className="flex items-center space-x-1 text-yellow-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Service level impact predicted</span>
                    </div>
                  )}
                  {currentMetrics.stockoutDays > 3 && (
                    <div className="flex items-center space-x-1 text-red-600">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Significant stockout risk</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScenarioPlanner;