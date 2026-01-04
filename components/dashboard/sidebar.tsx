"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard,
  Receipt,
  Target,
  HandCoins,
  BarChart3,
  Settings,
  LogOut,
  Wallet,
  Menu,
  TrendingUp,
  Sparkles,
  Building2,
  Heart,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

const navItems = [
  {
    section: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
    ],
  },
  {
    section: "Management",
    items: [
      { href: "/transactions", label: "Transactions", icon: Receipt, badge: null },
      { href: "/budgets", label: "Budgets", icon: Target, badge: null },
      { href: "/loans", label: "Loans", icon: HandCoins, badge: null },
      { href: "/bank-accounts", label: "Accounts", icon: Building2, badge: null },
    ],
  },
  {
    section: "Planning",
    items: [
      { href: "/wishlist", label: "Wishlist", icon: Heart, badge: null },
    ],
  },
  {
    section: "Analytics",
    items: [
      { href: "/reports", label: "Reports", icon: BarChart3, badge: null },
    ],
  },
  {
    section: "Settings",
    items: [
      { href: "/settings", label: "Settings", icon: Settings, badge: null },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const getInitials = (name?: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="flex h-full w-full flex-col bg-sidebar">
      {/* Logo Section - Enhanced */}
      <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-6 shrink-0">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20">
          <Wallet className="h-6 w-6" />
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-sidebar shadow-sm" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            Budget 2025
          </h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground font-medium">Personal Finance</p>
          </div>
        </div>
      </div>

      {/* Navigation - Enhanced with sections */}
      <nav className="flex-1 space-y-6 px-4 py-6 overflow-y-auto min-h-0 scrollbar-thin">
        {navItems.map((section, sectionIdx) => (
          <div key={section.section} className={cn("space-y-1", sectionIdx > 0 && "pt-2")}>
            {navItems.length > 1 && (
              <div className="px-3 mb-2">
                <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider">
                  {section.section}
                </p>
              </div>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link key={item.href} href={item.href} className="block">
                    <div
                      className={cn(
                        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
                        "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        "touch-manipulation min-h-[44px]",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                          : "text-sidebar-foreground/80"
                      )}
                    >
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-primary-foreground/30" />
                      )}
                      <div
                        className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-sidebar-accent/50 text-sidebar-foreground/70 group-hover:bg-sidebar-accent group-hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <Icon className={cn("h-4 w-4 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
                      </div>
                      <span className="flex-1 font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="flex h-5 items-center rounded-full bg-primary px-2 text-xs font-semibold text-primary-foreground">
                          {item.badge}
                        </span>
                      )}
                      {/* Hover glow effect */}
                      <div
                        className={cn(
                          "absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200",
                          "bg-gradient-to-r from-primary/5 to-transparent",
                          isActive && "opacity-100"
                        )}
                      />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User Section - Enhanced */}
      <div className="border-t border-sidebar-border bg-sidebar-accent/30 px-4 py-4 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-3 h-auto hover:bg-sidebar-accent rounded-xl transition-all duration-200 touch-manipulation min-h-[64px] group"
            >
              <div className="relative">
                <Avatar className="h-11 w-11 ring-2 ring-sidebar-border group-hover:ring-primary/50 transition-all duration-200">
                  <AvatarFallback className="bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground font-semibold text-sm shadow-md">
                    {getInitials(session?.user?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-sidebar shadow-sm" />
              </div>
              <div className="flex flex-col items-start flex-1 min-w-0">
                <span className="text-sm font-semibold truncate w-full text-sidebar-foreground">
                  {session?.user?.name || "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate w-full">
                  {session?.user?.email}
                </span>
              </div>
              <Settings className="h-4 w-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" sideOffset={8}>
            <DropdownMenuLabel className="flex items-center gap-2">
              <div className="flex flex-col">
                <span className="font-semibold">My Account</span>
                <span className="text-xs text-muted-foreground font-normal">
                  {session?.user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-destructive cursor-pointer focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function SidebarTrigger() {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="lg:hidden hover:bg-accent transition-colors"
      aria-label="Toggle sidebar"
    >
      <Menu className="h-5 w-5" />
    </Button>
  )
}
