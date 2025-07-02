import { Button } from '@/components/ui/button'
import { ArrowLeft, Truck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import InsightToActionFlow from '@/components/hero/InsightToActionFlow'

export default function InsightToActionFlowPage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div className="h-8 w-0.5 bg-neutral-200" />
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-semibold text-neutral-900">GXO Forecasting Platform</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <InsightToActionFlow />
      </main>

      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-300 py-8 mt-24">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm">
            © 2024 1CloudHub. GXO Forecasting Platform - Strategic Demo Site
          </p>
        </div>
      </footer>
    </div>
  )
}