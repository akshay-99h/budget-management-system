"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { usePathname } from "next/navigation"

interface TourContextType {
  runTour: boolean
  startTour: (tourName: string) => void
  stopTour: () => void
  resetAllTours: () => void
  isTourCompleted: (tourName: string) => boolean
  currentTour: string | null
}

const TourContext = createContext<TourContextType | undefined>(undefined)

export function TourProvider({ children }: { children: ReactNode }) {
  const [runTour, setRunTour] = useState(false)
  const [currentTour, setCurrentTour] = useState<string | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    // Stop tour when route changes
    setRunTour(false)
    setCurrentTour(null)
  }, [pathname])

  const isTourCompleted = (tourName: string): boolean => {
    if (typeof window === "undefined") return false
    const completed = localStorage.getItem(`tour_completed_${tourName}`)
    return completed === "true"
  }

  const startTour = (tourName: string) => {
    setCurrentTour(tourName)
    setRunTour(true)
  }

  const stopTour = () => {
    if (currentTour) {
      localStorage.setItem(`tour_completed_${currentTour}`, "true")
    }
    setRunTour(false)
    setCurrentTour(null)
  }

  const resetAllTours = () => {
    if (typeof window === "undefined") return
    const keys = Object.keys(localStorage)
    keys.forEach((key) => {
      if (key.startsWith("tour_completed_")) {
        localStorage.removeItem(key)
      }
    })
  }

  return (
    <TourContext.Provider
      value={{
        runTour,
        startTour,
        stopTour,
        resetAllTours,
        isTourCompleted,
        currentTour,
      }}
    >
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider")
  }
  return context
}
