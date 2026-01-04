"use client"

import { useEffect } from "react"

export function RegisterSW() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      process.env.NODE_ENV === "production"
    ) {
      navigator.serviceWorker
        .register("/sw.js", {
          scope: "/",
          updateViaCache: "none", // Always check for updates
        })
        .then((registration) => {
          console.log("Service Worker registered:", registration.scope)

          // Check for updates periodically
          setInterval(() => {
            registration.update()
          }, 60 * 60 * 1000) // Check every hour

          // Handle updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  // New service worker available, prompt user to refresh
                  if (confirm("New version available! Reload to update?")) {
                    window.location.reload()
                  }
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error)
        })

      // Handle service worker updates
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        window.location.reload()
      })
    }
  }, [])

  return null
}

