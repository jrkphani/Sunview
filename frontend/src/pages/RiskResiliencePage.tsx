import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Home } from 'lucide-react'
import { RiskResilienceSection } from '@/components/risk'

export default function RiskResiliencePage() {
  return (
    <main className="flex-1" style={{ gap: 'var(--spacing-6)', padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column' }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Risk & Resilience</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Risk & Resilience</h1>
          <p className="text-muted-foreground">
            Comprehensive risk management and supply chain resilience monitoring
          </p>
        </div>
      </header>

      {/* Risk & Resilience Content */}
      <RiskResilienceSection />
    </main>
  )
}