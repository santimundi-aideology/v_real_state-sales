"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Phone,
  MessageSquare,
  Building,
  Calendar,
  BarChart3,
  Plug,
  Shield,
  ClipboardCheck,
  Activity,
  Users,
  Settings,
  Search,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Radio,
  UserPlus,
  Megaphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { UserRole } from "@/lib/types"
import { getNavigationForRole, getRoleLabel } from "@/lib/role-permissions"
import { cn } from "@/lib/utils"
import { useUser } from "@/lib/hooks/use-user"
import { useRouter } from "next/navigation"
import { VoiceAgentSelector } from "@/components/voice-agent-selector"

const iconMap = {
  LayoutDashboard,
  Phone,
  MessageSquare,
  Building,
  Calendar,
  BarChart3,
  Plug,
  Shield,
  ClipboardCheck,
  Activity,
  Users,
  Settings,
  Radio,
  UserPlus,
  Megaphone,
}

interface AppShellProps {
  children: React.ReactNode
  defaultRole?: UserRole
}

export function AppShell({ children, defaultRole = "sales_manager" }: AppShellProps) {
  const { user, loading: userLoading } = useUser()
  const router = useRouter()
  const [currentRole, setCurrentRole] = React.useState<UserRole>(defaultRole)
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const pathname = usePathname()

  React.useEffect(() => {
    setMounted(true)
    // Load role from localStorage after mount to avoid hydration mismatch
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("fph-current-role")
      if (stored) {
        setCurrentRole(stored as UserRole)
      }
      
    }
  }, [])

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role)
    if (typeof window !== "undefined") {
      localStorage.setItem("fph-current-role", role)
    }
  }

  // Get user initials for avatar - memoized
  const userInitials = React.useMemo(() => {
    if (!user) return "U"
    const name = user.user_metadata?.name || user.email || "U"
    const parts = name.split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }, [user])

  const userName = React.useMemo(() => {
    if (!user) return "Guest"
    return user.user_metadata?.name || user.email?.split("@")[0] || "User"
  }, [user])

  const userEmail = React.useMemo(() => {
    if (!user) return ""
    return user.email || ""
  }, [user])

  const navigation = React.useMemo(
    () => getNavigationForRole(currentRole),
    [currentRole]
  )

  return (
    <div className="relative min-h-screen">
      {/* Top Bar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 glass-panel border-b">
        <div className="flex h-full items-center justify-between px-4 lg:px-6">
          {/* Left: Logo + Product Name */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-accent rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <Link href="/" className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center gold-glow">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div className="hidden sm:block">
                <div className="text-xs text-muted-foreground uppercase tracking-wider">First Projects Holding</div>
                <div className="text-sm font-serif font-semibold text-foreground">Agentic Sales OS</div>
              </div>
            </Link>
          </div>

          {/* Center: Search */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search prospects, properties..." className="pl-9 bg-background/50 border-border/50" />
            </div>
          </div>

          {/* Right: Environment, Role, User */}
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:flex gap-1.5 border-primary/30 text-primary">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              Sandbox
            </Badge>

            {/* Role Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  {getRoleLabel(currentRole)}
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleRoleChange("admin")}>Administrator</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange("sales_manager")}>Sales Manager</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange("sales_rep")}>Sales Representative</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange("qa_supervisor")}>QA Supervisor</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange("compliance_officer")}>
                  Compliance Officer
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRoleChange("operations")}>Operations Engineer</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            {!userLoading && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col gap-1">
                      <div className="text-sm font-medium">{userName}</div>
                      <div className="text-xs text-muted-foreground">{userEmail}</div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings')}>
                    Preferences
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-16 bottom-0 z-40 w-64 glass-panel border-r transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <nav className="flex flex-col h-full p-4 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = iconMap[item.icon as keyof typeof iconMap]
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    isActive
                      ? "bg-primary/10 text-primary border border-primary/20 gold-glow"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16">
        <div className="relative z-10">{children}</div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Voice Agent Selector - Chat Bubble */}
      {mounted && <VoiceAgentSelector />}
    </div>
  )
}
