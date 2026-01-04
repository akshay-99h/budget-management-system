/**
 * Simple logger utility for the application
 * In production, logs are minimized. In development, full logging is enabled.
 */

const isDevelopment = process.env.NODE_ENV === "development"

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  },

  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(`[INFO] ${message}`, ...args)
    }
  },

  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] ${message}`, ...args)
  },

  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error)
  },

  // Silent logger that does nothing in production
  silent: {
    log: (...args: any[]) => {
      if (isDevelopment) {
        console.log(...args)
      }
    },
    error: (...args: any[]) => {
      if (isDevelopment) {
        console.error(...args)
      }
    },
    warn: (...args: any[]) => {
      if (isDevelopment) {
        console.warn(...args)
      }
    },
  },
}
