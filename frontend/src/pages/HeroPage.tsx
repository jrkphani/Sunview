import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, TrendingUp, Truck, BarChart3, Target, Globe } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function HeroPage() {
  const navigate = useNavigate()

  const businessImpacts = [
    { objective: 'Forecast Visibility', impact: '+15% improvement in labor and truck planning accuracy' },
    { objective: 'SLA Performance', impact: '8–12% reduction in unplanned exceptions' },
    { objective: 'Operational Efficiency', impact: '10–20% improvement in site-level throughput planning' },
    { objective: 'New Revenue Streams', impact: 'Forecasting-as-a-Service for GXO enterprise customers' }
  ]

  const kpiGlossary = [
    { abbr: 'MAPE', full: 'Mean Absolute Percentage Error', definition: 'Measures forecast accuracy by averaging the absolute percent error between forecasted and actual demand. Lower is better.' },
    { abbr: 'WAPE', full: 'Weighted Absolute Percentage Error', definition: 'A variation of MAPE that gives more weight to higher-volume SKUs. Often used when product volumes vary widely.' },
    { abbr: 'DOH', full: 'Days of Inventory on Hand', definition: 'Indicates how many days current inventory will last based on historical consumption rates.' },
    { abbr: 'OTIF', full: 'On-Time In-Full', definition: 'The percentage of orders delivered both on time and in the full quantity ordered. A key customer service metric.' },
    { abbr: 'SKU', full: 'Stock Keeping Unit', definition: 'A unique identifier for each product type or variant that is managed and tracked in inventory systems.' },
    { abbr: 'SLA', full: 'Service Level Agreement', definition: 'A formal contract metric defining expected performance (e.g., delivery time, fill rates) between parties.' },
    { abbr: 'FaaS', full: 'Forecasting-as-a-Service', definition: 'A service delivery model where forecasting tools and capabilities are offered as a managed solution to clients.' },
    { abbr: 'LTL', full: 'Less Than Truckload', definition: 'A shipping method for smaller freight that does not require a full truck. Typically more expensive per unit shipped.' },
    { abbr: 'Cycle Time', full: 'Cycle Time', definition: 'The time it takes from receiving an order to delivering it. Can be measured end-to-end or per process step.' },
    { abbr: 'Forecast Bias', full: 'Forecast Bias', definition: 'Indicates whether forecasts consistently over- or under-predict demand. Useful for correcting systemic errors.' },
    { abbr: 'Forecast Consumption Rate', full: 'Forecast Consumption Rate', definition: 'The percentage of forecasted demand that materializes as actual orders.' },
    { abbr: 'Fill Rate', full: 'Fill Rate', definition: 'The percentage of customer demand that is met immediately from available inventory.' },
    { abbr: 'Pick Rate', full: 'Pick Rate', definition: 'The number of order lines or units picked per labor hour. A key warehouse labor efficiency metric.' },
    { abbr: 'Dock-to-Stock', full: 'Dock-to-Stock', definition: 'The time taken from when a product arrives at the warehouse dock to when it is available in storage for picking.' },
    { abbr: 'Throughput', full: 'Throughput', definition: 'The number of units processed (inbound/outbound) over a given period, often per SKU or site.' },
    { abbr: 'Anomaly Detection', full: 'Anomaly Detection', definition: 'The use of statistical or AI models to flag data points or events that deviate from normal patterns.' },
    { abbr: 'Truck Utilization', full: 'Truck Utilization', definition: 'Measures how much of a truck\'s capacity (volume or weight) is used. Impacts cost efficiency.' },
    { abbr: 'Forecast Stability', full: 'Forecast Stability', definition: 'The degree to which forecasts remain consistent over time. High instability can disrupt planning.' },
    { abbr: 'Obsolete Stock', full: 'Obsolete Stock', definition: 'Inventory that is no longer sellable or usable due to expiry, obsolescence, or lack of demand.' },
    { abbr: 'Cold Chain', full: 'Cold Chain', definition: 'A temperature-controlled supply chain used for perishable goods, especially in retail or pharma.' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-semibold text-neutral-900">GXO Forecasting Platform</span>
            </div>
            <Badge variant="secondary" className="bg-neutral-800 text-white">
              Demo by 1CloudHub
            </Badge>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-6">
            <Truck className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium text-blue-600 uppercase tracking-wide">
              Predictive Logistics. Delivered.
            </span>
          </div>
          
          <h1 className="text-5xl font-bold text-neutral-900 mb-6 leading-tight">
            Transforming GXO's Operational Intelligence with<br />
            <span className="text-blue-600">Forecasting-as-a-Service</span>
          </h1>
          
          <p className="text-xl text-neutral-700 max-w-4xl mx-auto mb-8 leading-relaxed">
            1CloudHub's AI-native forecasting platform empowers GXO to move from execution-led operations 
            to predictive, insights-driven logistics. Built on AWS and proven through our Signify pilot, 
            this platform unlocks SKU-level visibility, anomaly detection, and decision-making foresight—across 
            every site, every client, every lane.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/dashboard')}
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
            >
              Explore the Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              onClick={() => navigate('/insight-to-action')}
              size="lg" 
              variant="outline"
              className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-3"
            >
              View Workflow Chains
              <BarChart3 className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* From Pilot to Platform */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              <TrendingUp className="inline h-8 w-8 text-blue-600 mr-3" />
              From Pilot to Platform
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-neutral-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-neutral-900 mb-4">The Opportunity</h3>
                <p className="text-neutral-700 leading-relaxed">
                  GXO's logistics excellence deserves forecasting intelligence to match. Most 3PLs react to orders. 
                  GXO can now anticipate them—by embedding forecast visibility and KPI-driven planning into daily operations.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-neutral-900 mb-4">The Solution</h3>
                <p className="text-neutral-800 mb-4">A centralized forecasting layer that:</p>
                <ul className="space-y-2 text-sm text-neutral-800">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    Learns from historical order patterns
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    Predicts SKU-level demand up to 4 weeks in advance
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    Flags operational anomalies in real time
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                    Surfaces planner-ready KPIs to drive workforce and transport decisions
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-neutral-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-neutral-900 mb-4">The Result</h3>
                <p className="text-neutral-700 leading-relaxed">
                  Fewer missed SLAs. Lower planning effort. Smarter operations. And a scalable platform 
                  GXO can extend to every marquee client.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Business Impact */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              <Target className="inline h-8 w-8 text-blue-600 mr-3" />
              Business Impact
            </h2>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {businessImpacts.map((item, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-neutral-900 mb-2">{item.objective}</h3>
                  <p className="text-sm text-blue-700 font-medium">{item.impact}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow Chains Preview */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              <TrendingUp className="inline h-8 w-8 text-blue-600 mr-3" />
              Automated Workflow Chains
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto mb-8">
              Transform insights into action with our AI-powered workflow automation. 
              From forecast generation to labor planning, every process is optimized.
            </p>
            <Button 
              onClick={() => navigate('/insight-to-action')}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Explore Workflow Chains
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
          
          <div className="grid md:grid-cols-4 gap-6 mt-12">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Forecast to Labor</h4>
                <p className="text-sm text-neutral-600">Optimize workforce schedules</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Truck className="h-10 w-10 text-green-600 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Forecast to Transport</h4>
                <p className="text-sm text-neutral-600">Maximize truck utilization</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <Target className="h-10 w-10 text-orange-600 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Anomaly to Action</h4>
                <p className="text-sm text-neutral-600">Proactive risk mitigation</p>
              </CardContent>
            </Card>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                <h4 className="font-semibold mb-2">Insight to Revenue</h4>
                <p className="text-sm text-neutral-600">Commercial optimization</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why KPIs Matter */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              <BarChart3 className="inline h-8 w-8 text-blue-600 mr-3" />
              Why KPIs Matter
            </h2>
            <p className="text-lg text-neutral-700 max-w-3xl mx-auto">
              Forecasting isn't just about projections—it's about trust, performance, and continuous improvement. 
              Here's how the KPIs we track create real business impact:
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-4">
              <h4 className="font-semibold text-neutral-900 mb-2">MAPE/WAPE</h4>
              <p className="text-sm text-neutral-700">Quantify forecast accuracy, guide model improvement</p>
            </div>
            <div className="text-center p-4">
              <h4 className="font-semibold text-neutral-900 mb-2">Forecast Bias</h4>
              <p className="text-sm text-neutral-700">Detect under/over-forecasting tendencies before they affect operations</p>
            </div>
            <div className="text-center p-4">
              <h4 className="font-semibold text-neutral-900 mb-2">Fill Rate / OTIF</h4>
              <p className="text-sm text-neutral-700">Ensure customer delivery expectations are met consistently</p>
            </div>
            <div className="text-center p-4">
              <h4 className="font-semibold text-neutral-900 mb-2">Dock-to-Stock / Pick Rate</h4>
              <p className="text-sm text-neutral-700">Drive warehouse efficiency with better workload forecasts</p>
            </div>
            <div className="text-center p-4">
              <h4 className="font-semibold text-neutral-900 mb-2">Anomaly Count</h4>
              <p className="text-sm text-neutral-700">Spot unexpected shifts in demand and act early</p>
            </div>
            <div className="text-center p-4">
              <h4 className="font-semibold text-neutral-900 mb-2">Forecast Consumption</h4>
              <p className="text-sm text-neutral-700">Measure how closely plans align with reality</p>
            </div>
          </div>
          
          <div className="bg-blue-50 rounded-lg p-6 text-center">
            <p className="text-neutral-800 italic">
              These metrics turn data into action—and surface the operational truths that help GXO and its clients 
              plan smarter, act faster, and reduce risk.
            </p>
          </div>
        </div>
      </section>

      {/* Glossary */}
      <section className="py-16 bg-neutral-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-neutral-900 mb-4">
              📘 Glossary of KPIs & Terms
            </h2>
          </div>
          
          <div className="grid gap-4 max-w-4xl mx-auto">
            {kpiGlossary.map((item, index) => (
              <Card key={index} className="hover:shadow-sm transition-shadow">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="md:w-20 flex-shrink-0">
                      <Badge variant="outline" className="font-mono font-semibold border-neutral-300 text-neutral-900">
                        {item.abbr}
                      </Badge>
                    </div>
                    <div className="md:w-80 flex-shrink-0">
                      <span className="font-medium text-neutral-900">{item.full}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-neutral-700">{item.definition}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-neutral-900 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">
            <Globe className="inline h-8 w-8 mr-3" />
            Join the Next Phase
          </h2>
          <p className="text-xl mb-8 text-neutral-200">
            Partner with 1CloudHub to activate Forecasting-as-a-Service across APAC and beyond.
          </p>
          <p className="text-lg mb-8 text-neutral-300 italic">
            From PoC to Platform. From Insight to Revenue.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={() => navigate('/dashboard')}
              variant="secondary" 
              size="lg"
              className="bg-white text-neutral-900 hover:bg-neutral-100 font-medium"
            >
              Explore the Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              onClick={() => navigate('/dashboard/forecast-explorer')}
              size="lg"
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-neutral-900 font-medium"
            >
              Explore SKU Analytics
              <BarChart3 className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-300 py-8">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm">
            © 2024 1CloudHub. GXO Forecasting Platform - Strategic Demo Site
          </p>
        </div>
      </footer>
    </div>
  )
}