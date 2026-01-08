"use client"

import { SessionProvider } from "next-auth/react"
import { TourProvider } from "@/contexts/TourContext"
import { ThemeProvider } from "@/contexts/ThemeContext"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <TourProvider>{children}</TourProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}

