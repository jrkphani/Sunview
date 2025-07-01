import { useLocation } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const getPageTitle = (pathname: string) => {
  if (pathname === '/dashboard') return 'Dashboard'
  if (pathname === '/dashboard/forecasts') return 'Forecasts'
  if (pathname === '/dashboard/insights') return 'Insights' 
  if (pathname === '/dashboard/analytics') return 'Analytics'
  return 'GXO Forecasting Platform'
}

export function SiteHeader() {
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-16 flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-xl font-semibold">{pageTitle}</h1>
      </div>
    </header>
  )
}
