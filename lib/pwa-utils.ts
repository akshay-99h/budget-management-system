"use client"

export function isPWA(): boolean {
  if (typeof window === "undefined") return false

  // Check if running in standalone mode (installed PWA)
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
  const isIOSStandalone = (window.navigator as any).standalone === true
  const isAndroidStandalone = window.matchMedia("(display-mode: standalone)").matches

  return isStandalone || isIOSStandalone || isAndroidStandalone
}

export function usePWA() {
  if (typeof window === "undefined") return false
  return isPWA()
}
