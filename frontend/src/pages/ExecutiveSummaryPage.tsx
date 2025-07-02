import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Home } from 'lucide-react'
import ExecutiveSummarySection from '@/components/dashboard/ExecutiveSummarySection'

export default function ExecutiveSummaryPage() {
  return (
    <main className="flex-1" style={{ gap: 'var(--spacing-6)', padding: 'var(--spacing-6)', display: 'flex', flexDirection: 'column' }}>
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              Overview
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Executive Summary</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executive Summary</h1>
          <p className="text-muted-foreground">
            High-level business pulse with key performance indicators and strategic insights
          </p>
        </div>
      </header>

      {/* Executive Summary Content */}
      <ExecutiveSummarySection />
    </main>
  )
}