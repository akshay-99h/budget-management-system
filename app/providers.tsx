"use client"

import { SessionProvider } from "next-auth/react"
import { TourProvider } from "@/contexts/TourContext"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TourProvider>{children}</TourProvider>
    </SessionProvider>
  )
}

