import { NavLink, NavLinkRenderProps } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  TrendingUp, 
  Lightbulb, 
  BarChart3,
  FileText,
  Settings,
  Crown,
  Cog,
  Target,
  DollarSign,
  Shield,
  Search
} from 'lucide-react'

const navigation = [
  { name: 'Executive Summary', href: '/dashboard', icon: Crown },
  { name: 'Operational Efficiency', href: '/dashboard/operational-efficiency', icon: Cog },
  { name: 'Strategic Planning', href: '/dashboard/strategic-planning', icon: Target },
  { name: 'Commercial Insights', href: '/dashboard/commercial-insights', icon: DollarSign },
  { name: 'Risk & Resilience', href: '/dashboard/risk-resilience', icon: Shield },
  { name: 'Forecast Explorer', href: '/dashboard/forecast-explorer', icon: Search },
]


const secondaryNavigation = [
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export default function Sidebar() {
  return (
    <aside className="flex h-full w-64 flex-col bg-white border-r" role="navigation" aria-label="Main navigation">
      <nav className="flex-1 gap-1 px-4 pt-4 pb-6">
        <div className="flex flex-col gap-1">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }: NavLinkRenderProps) =>
                cn(
                  'group flex items-center text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted/50'
                )
              }
              className="p-3"
            >
              <item.icon className="h-5 w-5 flex-shrink-0 mr-3" aria-hidden="true" />
              {item.name}
            </NavLink>
          ))}
        </div>
        
        <div className="pt-6">
          <div className="px-3 pt-3 pb-2">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tools
            </h2>
          </div>
          <div className="flex flex-col gap-1">
            {secondaryNavigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }: NavLinkRenderProps) =>
                  cn(
                    'group flex items-center text-sm font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted/50'
                  )
                }
                className="p-3"
                >
                <item.icon className="h-5 w-5 flex-shrink-0 mr-3" aria-hidden="true" />
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
      
      <footer className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          <p>Data Source: S3 + Amazon Forecast</p>
          <p>Last Updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </footer>
    </aside>
  )
}