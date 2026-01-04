"use client";

import { useState, useEffect } from "react";

export function isPWA(): boolean {
  if (typeof window === "undefined") return false;

  // Check if running in standalone mode (installed PWA)
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
  const isIOSStandalone = (window.navigator as any).standalone === true;
  const isFullscreen = window.matchMedia("(display-mode: fullscreen)").matches;
  const isMinimalUI = window.matchMedia("(display-mode: minimal-ui)").matches;

  return isStandalone || isIOSStandalone || isFullscreen || isMinimalUI;
}

export function usePWA() {
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  useEffect(() => {
    setIsPWAInstalled(isPWA());
  }, []);

  return isPWAInstalled;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setIsInstallable(false);
      return true;
    }

    return false;
  };

  return { install, isInstallable };
}
