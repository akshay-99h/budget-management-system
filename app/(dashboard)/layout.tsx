"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset, SidebarTrigger, Sidebar } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/dashboard/sidebar"
import { Separator } from "@/components/ui/separator"
import { BottomNav } from "@/components/dashboard/bottom-nav"
import { HelpButton } from "@/components/tour/HelpButton"
import { isPWA } from "@/lib/pwa-utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobileApp, setIsMobileApp] = useState(false)

  useEffect(() => {
    setIsMobileApp(isPWA())
  }, [])

  // Mobile App Layout (PWA with bottom navigation)
  if (isMobileApp) {
    return (
      <div className="flex flex-col h-screen">
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20 pb-20">
          <div className="container mx-auto px-4 py-4 max-w-screen-sm">
            {children}
          </div>
        </main>
        <BottomNav />
        <HelpButton />
      </div>
    )
  }

  // Web Layout (Desktop with sidebar)
  return (
    <SidebarProvider>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-6" />
        </header>
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-muted/20">
          <div className="container mx-auto px-4 py-4 sm:py-6 md:py-8 max-w-7xl">
            {children}
          </div>
        </main>
        <HelpButton />
      </SidebarInset>
    </SidebarProvider>
  )
}
