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

          // Check for updates more frequently (every 5 minutes)
          setInterval(() => {
            registration.update()
          }, 5 * 60 * 1000) // Check every 5 minutes

          // Also check on page visibility change
          document.addEventListener("visibilitychange", () => {
            if (document.visibilityState === "visible") {
              registration.update()
            }
          })

          // Handle updates
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing
            console.log("[App] New service worker found, installing...")
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                console.log("[App] Service worker state:", newWorker.state)
                if (newWorker.state === "installed") {
                  if (navigator.serviceWorker.controller) {
                    // New service worker available, prompt user to refresh
                    console.log("[App] New version available")
                    if (confirm("New version available! Reload to update?")) {
                      // Send skip waiting message
                      newWorker.postMessage({ type: "SKIP_WAITING" })
                      window.location.reload()
                    }
                  } else {
                    // First install
                    console.log("[App] Service worker installed for the first time")
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

