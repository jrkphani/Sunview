import React from 'react'
import { 
  Target, 
  TrendingUp, 
  Truck, 
  Clock, 
  Package, 
  Calculator,
  Database,
  Lightbulb
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ExplainerSection, ExplainerExample } from '@/components/ui/insight-explainer'

// MAPE/WAPE Explainer Content
export const mapeWapeExplainer = {
  title: "MAPE & WAPE Calculation Methodology",
  description: "Mean Absolute Percentage Error (MAPE) and Weighted Absolute Percentage Error (WAPE) are key metrics for measuring forecast accuracy across different demand patterns.",
  formula: "MAPE = (1/n) × Σ|Actual - Forecast| / |Actual| × 100%\nWAPE = Σ|Actual - Forecast| / Σ|Actual| × 100%",
  methodology: {
    title: "Methodology",
    icon: Lightbulb,
    content: (
      <div className="space-y-4">
        <p>
          Both MAPE and WAPE measure forecast accuracy by comparing predicted values to actual demand. 
          The key difference lies in how they handle variations in demand volume:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm">
          <li><strong>MAPE</strong> treats all SKUs equally regardless of volume, making it sensitive to low-volume items</li>
          <li><strong>WAPE</strong> weights errors by actual demand volume, providing a more balanced view for mixed portfolios</li>
          <li>Lower percentages indicate better forecast accuracy</li>
          <li>We calculate both metrics across rolling 30-day windows for trend analysis</li>
        </ul>
      </div>
    )
  },
  calculation: {
    title: "Calculation Details",
    icon: Calculator,
    content: (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-blue-800 mb-2">MAPE Process</h4>
            <ol className="list-decimal list-inside text-sm space-y-1 text-blue-700">
              <li>Calculate absolute percentage error for each SKU</li>
              <li>Sum all percentage errors</li>
              <li>Divide by number of SKUs</li>
              <li>Result: Average percentage error</li>
            </ol>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-green-800 mb-2">WAPE Process</h4>
            <ol className="list-decimal list-inside text-sm space-y-1 text-green-700">
              <li>Sum absolute forecast errors across all SKUs</li>
              <li>Sum actual demand across all SKUs</li>
              <li>Divide total error by total demand</li>
              <li>Result: Volume-weighted percentage error</li>
            </ol>
          </div>
        </div>
      </div>
    )
  },
  dataSources: {
    title: "Data Sources",
    icon: Database,
    content: (
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>Historical demand data from WMS/ERP systems</li>
        <li>Forecast outputs from demand planning models</li>
        <li>SKU master data for product categorization</li>
        <li>Time-series data aggregated at daily/weekly levels</li>
      </ul>
    )
  },
  examples: [
    {
      title: "High-Volume SKU Example",
      description: "Electronics category with consistent demand",
      calculation: "Actual: 1000 units, Forecast: 950 units\nAbsolute Error: |1000 - 950| = 50\nPercentage Error: 50/1000 × 100% = 5%",
      result: "5% error",
      interpretation: "Low percentage error for high-volume item contributes positively to both MAPE and WAPE"
    },
    {
      title: "Low-Volume SKU Example", 
      description: "Seasonal item with sporadic demand",
      calculation: "Actual: 10 units, Forecast: 15 units\nAbsolute Error: |10 - 15| = 5\nPercentage Error: 5/10 × 100% = 50%",
      result: "50% error",
      interpretation: "High percentage error significantly impacts MAPE but has minimal effect on WAPE due to low volume"
    }
  ],
  grade: 'good' as const,
  difficulty: 'intermediate' as const
}

// Forecast Accuracy Grading System
export const forecastGradingExplainer = {
  title: "Forecast Accuracy Grading System",
  description: "Our proprietary grading system translates MAPE/WAPE percentages into actionable performance categories with specific improvement recommendations.",
  methodology: {
    title: "Grading Methodology",
    icon: Target,
    content: (
      <div className="space-y-4">
        <p>The grading system uses industry benchmarks and internal performance targets to categorize forecast accuracy:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">A+ (Excellent)</Badge>
              <span className="text-sm">MAPE ≤ 15%</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">A (Good)</Badge>
              <span className="text-sm">MAPE 15-25%</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-100 text-yellow-800">B (Fair)</Badge>
              <span className="text-sm">MAPE 25-35%</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-red-100 text-red-800">C (Poor)</Badge>
              <span className="text-sm">MAPE &gt; 35%</span>
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Grade Factors</h4>
            <ul className="text-sm space-y-1">
              <li>• Product category complexity</li>
              <li>• Demand volatility patterns</li>
              <li>• Seasonal variation impact</li>
              <li>• Data quality and availability</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  calculation: {
    title: "Grade Assignment Logic",
    icon: Calculator,
    content: (
      <div className="space-y-4">
        <p className="text-sm">Grades are assigned using a weighted algorithm that considers:</p>
        <div className="bg-slate-50 p-4 rounded-lg border font-mono text-sm">
          <div>if (WAPE ≤ 15% && MAPE ≤ 20%) → Grade A+</div>
          <div>else if (WAPE ≤ 25% && MAPE ≤ 30%) → Grade A</div>
          <div>else if (WAPE ≤ 35% && MAPE ≤ 40%) → Grade B</div>
          <div>else → Grade C</div>
        </div>
        <p className="text-xs text-muted-foreground">
          Algorithm accounts for both volume-weighted and unweighted accuracy to balance portfolio performance
        </p>
      </div>
    )
  },
  examples: [
    {
      title: "A+ Grade Achievement",
      description: "Electronics category during stable demand period",
      calculation: "WAPE: 12%, MAPE: 18%\nBoth metrics below A+ thresholds",
      result: "Grade A+",
      interpretation: "Excellent forecast accuracy indicates mature demand patterns and effective planning processes"
    }
  ],
  grade: 'excellent' as const,
  difficulty: 'beginner' as const
}

// Truck Utilization Optimization
export const truckUtilizationExplainer = {
  title: "Truck Utilization Optimization",
  description: "Truck utilization measures how effectively we're using available vehicle capacity across weight, volume, and route constraints to minimize transportation costs.",
  formula: "Utilization % = (Actual Load / Maximum Capacity) × 100%\nwhere Load = MAX(Weight%, Volume%, Stops%)",
  methodology: {
    title: "Optimization Methodology",
    icon: Truck,
    content: (
      <div className="space-y-4">
        <p>Our truck utilization optimization considers multiple constraint factors:</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-3 rounded-lg border">
            <h4 className="font-semibold text-blue-800 mb-2">Weight Constraints</h4>
            <p className="text-sm text-blue-700">Maximum payload capacity based on vehicle specifications and regulatory limits</p>
          </div>
          <div className="bg-green-50 p-3 rounded-lg border">
            <h4 className="font-semibold text-green-800 mb-2">Volume Constraints</h4>
            <p className="text-sm text-green-700">Cubic capacity limits based on trailer dimensions and stacking requirements</p>
          </div>
          <div className="bg-orange-50 p-3 rounded-lg border">
            <h4 className="font-semibold text-orange-800 mb-2">Route Constraints</h4>
            <p className="text-sm text-orange-700">Maximum stops, driver hours, and delivery time windows</p>
          </div>
        </div>
      </div>
    )
  },
  calculation: {
    title: "Utilization Calculation",
    icon: Calculator,
    content: (
      <div className="space-y-4">
        <p className="text-sm">Utilization is calculated as the maximum constraint utilization:</p>
        <div className="bg-slate-50 p-4 rounded-lg border">
          <div className="space-y-2 font-mono text-sm">
            <div>Weight% = (Actual Weight / Max Weight) × 100%</div>
            <div>Volume% = (Actual Volume / Max Volume) × 100%</div>
            <div>Route% = (Route Time / Max Route Time) × 100%</div>
            <div className="border-t pt-2 mt-2">
              <strong>Final Utilization = MAX(Weight%, Volume%, Route%)</strong>
            </div>
          </div>
        </div>
      </div>
    )
  },
  dataSources: {
    title: "Data Sources",
    icon: Database,
    content: (
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>Transportation Management System (TMS) load data</li>
        <li>Vehicle specifications and capacity limits</li>
        <li>Route optimization algorithms and constraints</li>
        <li>Real-time GPS tracking and delivery confirmations</li>
      </ul>
    )
  },
  examples: [
    {
      title: "Volume-Constrained Load",
      description: "Light but bulky items like pillows or packaging",
      calculation: "Weight: 15,000 lbs / 40,000 lbs = 37.5%\nVolume: 2,800 ft³ / 3,000 ft³ = 93.3%\nRoute: 8 hrs / 10 hrs = 80%",
      result: "93.3% utilization",
      interpretation: "Volume constraint is the limiting factor. Opportunity to combine with denser products."
    },
    {
      title: "Weight-Constrained Load",
      description: "Dense items like metal components or liquids", 
      calculation: "Weight: 39,500 lbs / 40,000 lbs = 98.8%\nVolume: 1,200 ft³ / 3,000 ft³ = 40%\nRoute: 6 hrs / 10 hrs = 60%",
      result: "98.8% utilization",
      interpretation: "Optimal weight utilization. Excess volume could accommodate additional lightweight items."
    }
  ],
  grade: 'good' as const,
  difficulty: 'intermediate' as const
}

// OTIF Performance Calculation
export const otifExplainer = {
  title: "OTIF (On-Time In-Full) Performance Calculation",
  description: "OTIF measures the percentage of orders delivered both on-time and in-full, combining delivery reliability with order completeness for comprehensive service performance.",
  formula: "OTIF% = (Orders delivered On-Time AND In-Full / Total Orders) × 100%",
  methodology: {
    title: "OTIF Methodology",
    icon: Clock,
    content: (
      <div className="space-y-4">
        <p>OTIF performance requires both conditions to be met simultaneously:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-blue-800 mb-2">On-Time Criteria</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Delivered within agreed time window</li>
              <li>• Typically ±4 hours of scheduled time</li>
              <li>• Customer confirmation required</li>
              <li>• Excludes customer-caused delays</li>
            </ul>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-green-800 mb-2">In-Full Criteria</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 100% of ordered quantity delivered</li>
              <li>• All line items included</li>
              <li>• Correct product specifications</li>
              <li>• No damaged or rejected items</li>
            </ul>
          </div>
        </div>
      </div>
    )
  },
  calculation: {
    title: "OTIF Calculation Process",
    icon: Calculator,
    content: (
      <div className="space-y-4">
        <p className="text-sm">OTIF is calculated using boolean logic for each order:</p>
        <div className="bg-slate-50 p-4 rounded-lg border">
          <div className="space-y-2 font-mono text-sm">
            <div>ON_TIME = (Actual_Delivery_Time ≤ Promised_Delivery_Time + Grace_Period)</div>
            <div>IN_FULL = (Delivered_Quantity = Ordered_Quantity) AND (Line_Items_Complete = True)</div>
            <div className="border-t pt-2 mt-2">
              <strong>OTIF_Order = ON_TIME AND IN_FULL</strong>
            </div>
            <div className="border-t pt-2 mt-2">
              <strong>OTIF% = (Sum of OTIF_Orders / Total_Orders) × 100%</strong>
            </div>
          </div>
        </div>
      </div>
    )
  },
  dataSources: {
    title: "Data Sources",
    icon: Database,
    content: (
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>Order Management System (OMS) order details</li>
        <li>Warehouse Management System (WMS) fulfillment data</li>
        <li>Transportation Management System (TMS) delivery confirmations</li>
        <li>Customer feedback and proof of delivery receipts</li>
      </ul>
    )
  },
  examples: [
    {
      title: "Perfect OTIF Order",
      description: "Standard retail order with multiple SKUs",
      calculation: "Promised: 2:00 PM ±4hr window\nDelivered: 1:45 PM ✓ On-Time\nOrdered: 50 units (5 SKUs)\nDelivered: 50 units (5 SKUs) ✓ In-Full",
      result: "OTIF = True",
      interpretation: "Order meets both time and quantity requirements, contributing positively to OTIF percentage"
    },
    {
      title: "Failed OTIF Order",
      description: "Order delivered on-time but with shortage",
      calculation: "Promised: 10:00 AM ±4hr window\nDelivered: 11:30 AM ✓ On-Time\nOrdered: 100 units\nDelivered: 95 units ✗ Short",
      result: "OTIF = False",
      interpretation: "Despite on-time delivery, quantity shortage causes OTIF failure. Order does not count toward OTIF percentage"
    }
  ],
  grade: 'excellent' as const,
  difficulty: 'beginner' as const
}

// Top SKU Error Identification
export const topSkuErrorExplainer = {
  title: "Top SKU Error Identification",
  description: "Identifies SKUs with the highest forecast errors by analyzing absolute and percentage deviations to prioritize improvement efforts and understand demand patterns.",
  methodology: {
    title: "Error Identification Methodology",
    icon: Package,
    content: (
      <div className="space-y-4">
        <p>Our system identifies problematic SKUs using multiple error metrics:</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-red-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-red-800 mb-2">Absolute Error Impact</h4>
            <p className="text-sm text-red-700">
              Measures total units of error, highlighting SKUs that contribute most to overall forecast inaccuracy
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border">
            <h4 className="font-semibold text-orange-800 mb-2">Percentage Error Severity</h4>
            <p className="text-sm text-orange-700">
              Identifies SKUs with highest relative errors, indicating potential demand pattern changes
            </p>
          </div>
        </div>
      </div>
    )
  },
  calculation: {
    title: "Error Ranking Algorithm",
    icon: Calculator,
    content: (
      <div className="space-y-4">
        <p className="text-sm">SKUs are ranked using a composite error score:</p>
        <div className="bg-slate-50 p-4 rounded-lg border">
          <div className="space-y-2 font-mono text-sm">
            <div>Absolute_Error = |Actual_Demand - Forecast_Demand|</div>
            <div>Percentage_Error = (Absolute_Error / Actual_Demand) × 100%</div>
            <div>Volume_Weight = Actual_Demand / Total_Portfolio_Demand</div>
            <div className="border-t pt-2 mt-2">
              <strong>Composite_Score = (Percentage_Error × 0.6) + (Volume_Weight × Absolute_Error × 0.4)</strong>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Weighting favors percentage errors while accounting for volume impact
        </p>
      </div>
    )
  },
  dataSources: {
    title: "Data Sources", 
    icon: Database,
    content: (
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li>Historical demand actuals from sales systems</li>
        <li>Forecast outputs from demand planning models</li>
        <li>SKU master data including product hierarchy</li>
        <li>Inventory levels and stockout indicators</li>
      </ul>
    )
  },
  examples: [
    {
      title: "High-Volume Error SKU",
      description: "Popular electronics item with consistent demand pattern",
      calculation: "Actual: 1,000 units, Forecast: 750 units\nAbsolute Error: 250 units\nPercentage Error: 25%\nVolume Weight: 15% of portfolio",
      result: "High composite score",
      interpretation: "Large absolute error with moderate percentage error. Focus on demand signal analysis and model parameters."
    },
    {
      title: "High-Percentage Error SKU",
      description: "Low-volume seasonal item with sporadic demand",
      calculation: "Actual: 20 units, Forecast: 5 units\nAbsolute Error: 15 units\nPercentage Error: 75%\nVolume Weight: 0.1% of portfolio",
      result: "Moderate composite score",
      interpretation: "Very high percentage error but low volume impact. Consider different forecasting approach for intermittent demand patterns."
    }
  ],
  grade: 'good' as const,
  difficulty: 'advanced' as const
}