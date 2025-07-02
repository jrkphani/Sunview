import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Home } from 'lucide-react'
import { StrategicPlanningSection } from '@/components/strategic'

export default function StrategicPlanningPage() {
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
            <BreadcrumbPage>Strategic Planning</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Strategic Planning</h1>
          <p className="text-muted-foreground">
            Advanced analytics for strategic decision-making and long-term planning
          </p>
        </div>
      </header>

      {/* Strategic Planning Content */}
      <StrategicPlanningSection />
    </main>
  )
}