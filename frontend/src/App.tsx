import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import DashboardLayout from './components/layout/DashboardLayout'
import HeroPage from './pages/HeroPage'
import DashboardPage from './pages/DashboardPage'
import ForecastsPage from './pages/ForecastsPage'
import InsightsPage from './pages/InsightsPage'
import AnalyticsPage from './pages/AnalyticsPage'
import './App.css'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HeroPage />} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="forecasts" element={<ForecastsPage />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>
      </Routes>
      <Toaster position="top-right" />
    </>
  )
}

export default App