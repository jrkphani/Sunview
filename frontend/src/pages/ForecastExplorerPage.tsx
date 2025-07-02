import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Home } from 'lucide-react'
import { ForecastExplorerSection } from '@/components/explorer'

export default function ForecastExplorerPage() {
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
            <BreadcrumbPage>Forecast Explorer</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forecast Explorer</h1>
          <p className="text-muted-foreground">
            Advanced forecast analytics and exploration tools for detailed analysis
          </p>
        </div>
      </header>

      {/* Forecast Explorer Content */}
      <ForecastExplorerSection />
    </main>
  )
}