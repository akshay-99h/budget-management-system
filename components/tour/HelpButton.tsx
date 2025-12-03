"use client"

import { useState } from "react"
import { HelpCircle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTour } from "@/contexts/TourContext"
import { usePathname } from "next/navigation"

export function HelpButton() {
  const { startTour, resetAllTours } = useTour()
  const pathname = usePathname()

  const getTourName = () => {
    if (pathname === "/dashboard") return "dashboard"
    if (pathname === "/transactions") return "transactions"
    if (pathname === "/budgets") return "budgets"
    if (pathname === "/loans") return "loans"
    if (pathname === "/reports") return "reports"
    if (pathname === "/settings") return "settings"
    return null
  }

  const handleRestartTour = () => {
    const tourName = getTourName()
    if (tourName) {
      startTour(tourName)
    }
  }

  const handleResetAllTours = () => {
    if (confirm("This will reset all tours and show them again from the beginning. Continue?")) {
      resetAllTours()
      window.location.reload()
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 left-4 z-40 h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all"
          aria-label="Help and Tours"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Help & Tours</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleRestartTour} className="cursor-pointer">
          <HelpCircle className="mr-2 h-4 w-4" />
          Restart Page Tour
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleResetAllTours} className="cursor-pointer text-destructive focus:text-destructive">
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset All Tours
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
