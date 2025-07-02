import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import DashboardLayout from './components/layout/DashboardLayout'
import HeroPage from './pages/HeroPage'
// Dashboard section pages
import ExecutiveSummaryPage from './pages/ExecutiveSummaryPage'
import OperationalEfficiencyPage from './pages/OperationalEfficiencyPage'
import StrategicPlanningPage from './pages/StrategicPlanningPage'
import CommercialInsightsPage from './pages/CommercialInsightsPage'
import RiskResiliencePage from './pages/RiskResiliencePage'
import ForecastExplorerPage from './pages/ForecastExplorerPage'
import './App.css'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HeroPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          {/* Executive Summary is now the default landing page */}
          <Route index element={<ExecutiveSummaryPage />} />
          
          {/* Dashboard sections */}
          <Route path="executive-summary" element={<ExecutiveSummaryPage />} />
          <Route path="operational-efficiency" element={<OperationalEfficiencyPage />} />
          <Route path="strategic-planning" element={<StrategicPlanningPage />} />
          <Route path="commercial-insights" element={<CommercialInsightsPage />} />
          <Route path="risk-resilience" element={<RiskResiliencePage />} />
          <Route path="forecast-explorer" element={<ForecastExplorerPage />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}

export default App