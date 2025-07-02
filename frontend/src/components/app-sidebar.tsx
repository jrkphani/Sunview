import * as React from "react"
import {
  Crown,
  Cog,
  Target,
  DollarSign,
  Shield,
  Search,
  FileText,
  Truck,
  Settings,
  HelpCircle,
  Home,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "GXO Admin",
    email: "admin@gxo.com",
    avatar: "/avatars/gxo-user.jpg",
  },
  navMain: [
    {
      title: "Executive Summary",
      url: "/dashboard",
      icon: Crown,
    },
    {
      title: "Operational Efficiency",
      url: "/dashboard/operational-efficiency",
      icon: Cog,
    },
    {
      title: "Strategic Planning",
      url: "/dashboard/strategic-planning",
      icon: Target,
    },
    {
      title: "Commercial Insights",
      url: "/dashboard/commercial-insights",
      icon: DollarSign,
    },
    {
      title: "Risk & Resilience",
      url: "/dashboard/risk-resilience",
      icon: Shield,
    },
    {
      title: "Forecast Explorer",
      url: "/dashboard/forecast-explorer",
      icon: Search,
    },
  ],
  navSecondary: [
    {
      title: "Hero Overview",
      url: "/",
      icon: Home,
    },
    {
      title: "Documentation",
      url: "#",
      icon: FileText,
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
    },
    {
      title: "Help & Support",
      url: "#",
      icon: HelpCircle,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/">
                <Truck className="h-5 w-5" />
                <span className="text-base font-semibold">GXO Forecasting</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
