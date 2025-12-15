import type { UserRole } from "./types"

export interface NavItem {
  name: string
  href: string
  icon: string
  roles: UserRole[]
}

export const navigationItems: NavItem[] = [
  {
    name: "Overview",
    href: "/",
    icon: "LayoutDashboard",
    roles: ["admin", "sales_manager", "sales_rep", "qa_supervisor", "compliance_officer", "operations"],
  },
  { name: "Campaigns", href: "/campaigns", icon: "Megaphone", roles: ["admin", "sales_manager", "operations"] },
  {
    name: "Conversations",
    href: "/conversations",
    icon: "MessageSquare",
    roles: ["admin", "sales_manager", "sales_rep", "qa_supervisor"],
  },
  {
    name: "Live Monitor",
    href: "/conversations/live",
    icon: "Radio",
    roles: ["admin", "sales_manager", "sales_rep"],
  },
  {
    name: "Handoff Packages",
    href: "/handoffs",
    icon: "UserPlus",
    roles: ["admin", "sales_manager", "sales_rep"],
  },
  { name: "Properties", href: "/properties", icon: "Building", roles: ["admin", "sales_manager", "sales_rep"] },
  { name: "Appointments", href: "/appointments", icon: "Calendar", roles: ["admin", "sales_manager", "sales_rep"] },
  { name: "Analytics", href: "/analytics", icon: "BarChart3", roles: ["admin", "sales_manager"] },
  { name: "Integrations", href: "/integrations", icon: "Plug", roles: ["admin", "operations"] },
  { name: "Compliance Center", href: "/compliance", icon: "Shield", roles: ["admin", "compliance_officer"] },
  { name: "QA Review", href: "/qa-review", icon: "ClipboardCheck", roles: ["admin", "qa_supervisor"] },
  { name: "System Health", href: "/system-health", icon: "Activity", roles: ["admin", "operations"] },
  { name: "User Management", href: "/users", icon: "Users", roles: ["admin"] },
  { name: "Settings", href: "/settings", icon: "Settings", roles: ["admin", "sales_manager", "operations"] },
]

export function getNavigationForRole(role: UserRole): NavItem[] {
  return navigationItems.filter((item) => item.roles.includes(role))
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    admin: "Administrator",
    sales_manager: "Sales Manager",
    sales_rep: "Sales Representative",
    qa_supervisor: "QA Supervisor",
    compliance_officer: "Compliance Officer",
    operations: "Operations Engineer",
  }
  return labels[role]
}
