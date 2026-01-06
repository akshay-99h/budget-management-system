// Sync manager for handling online/offline sync with chunking
import { dbManager } from "./db"
import { logger } from "@/lib/utils/logger"

const SYNC_CHUNK_SIZE = 10 // Number of records to sync at once
const SYNC_DELAY = 1000 // Delay between chunks (ms)

export interface SyncResult {
  success: boolean
  synced: number
  failed: number
  errors: string[]
}

class SyncManager {
  private isOnline: boolean = typeof window !== "undefined" ? navigator.onLine : false
  private isSyncing: boolean = false
  private syncListeners: Set<(syncing: boolean) => void> = new Set()

  constructor() {
    // Only initialize on client side
    if (typeof window === "undefined") return

    // Listen for online/offline events
    window.addEventListener("online", () => {
      this.isOnline = true
      this.startSync()
    })
    window.addEventListener("offline", () => {
      this.isOnline = false
    })

    // Initialize IndexedDB
    dbManager.init().catch((error) => logger.error("Failed to initialize IndexedDB", error))

    // Start sync if online
    if (this.isOnline) {
      setTimeout(() => this.startSync(), 2000) // Wait 2s after page load
    }
  }

  // Subscribe to sync status changes
  onSyncStatusChange(callback: (syncing: boolean) => void) {
    this.syncListeners.add(callback)
    return () => this.syncListeners.delete(callback)
  }

  private notifySyncStatus(syncing: boolean) {
    this.syncListeners.forEach((cb) => cb(syncing))
  }

  // Check if online
  getOnlineStatus(): boolean {
    return this.isOnline
  }

  // Start sync process
  async startSync(userId?: string): Promise<SyncResult> {
    console.log("[SyncManager] startSync called, online:", this.isOnline, "syncing:", this.isSyncing)
    if (!this.isOnline || this.isSyncing) {
      console.log("[SyncManager] Not syncing - online:", this.isOnline, "isSyncing:", this.isSyncing)
      return { success: false, synced: 0, failed: 0, errors: [] }
    }

    this.isSyncing = true
    this.notifySyncStatus(true)

    try {
      const resolvedUserId = userId || (await this.getUserId())
      console.log("[SyncManager] Resolved userId:", resolvedUserId)
      if (!resolvedUserId) {
        console.error("[SyncManager] No userId found")
        return {
          success: false,
          synced: 0,
          failed: 0,
          errors: ["User not authenticated"],
        }
      }
      console.log("[SyncManager] Starting syncAll for user:", resolvedUserId)
      const result = await this.syncAll(resolvedUserId)
      console.log("[SyncManager] Sync completed:", result)
      return result
    } finally {
      this.isSyncing = false
      this.notifySyncStatus(false)
    }
  }

  // Sync all data types
  private async syncAll(userId: string): Promise<SyncResult> {
    console.log("[SyncManager] syncAll starting for userId:", userId)
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    }

    // Sync each data type
    const types: ("transaction" | "budget" | "loan")[] = [
      "transaction",
      "budget",
      "loan",
    ]

    for (const type of types) {
      try {
        console.log(`[SyncManager] Syncing ${type}...`)
        const typeResult = await this.syncType(type, userId)
        console.log(`[SyncManager] ${type} sync result:`, typeResult)
        result.synced += typeResult.synced
        result.failed += typeResult.failed
        result.errors.push(...typeResult.errors)
      } catch (error: any) {
        console.error(`[SyncManager] Error syncing ${type}:`, error)
        result.failed++
        result.errors.push(`Failed to sync ${type}: ${error.message}`)
      }
    }

    result.success = result.failed === 0
    console.log("[SyncManager] syncAll completed:", result)
    return result
  }

  // Sync a specific data type in chunks
  private async syncType(
    type: "transaction" | "budget" | "loan",
    userId: string
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    }

    // Get all unsynced records
    console.log(`[SyncManager] Getting unsynced ${type} records for user:`, userId)
    const unsynced = await dbManager.getUnsynced(type, userId)
    console.log(`[SyncManager] Found ${unsynced.length} unsynced ${type} records`)

    if (unsynced.length === 0) {
      console.log(`[SyncManager] No unsynced ${type} records to sync`)
      return result
    }

    // Process in chunks
    for (let i = 0; i < unsynced.length; i += SYNC_CHUNK_SIZE) {
      const chunk = unsynced.slice(i, i + SYNC_CHUNK_SIZE)

      try {
        // Wait before processing chunk (except first)
        if (i > 0) {
          await this.delay(SYNC_DELAY)
        }

        const chunkResult = await this.syncChunk(type, chunk)
        result.synced += chunkResult.synced
        result.failed += chunkResult.failed
        result.errors.push(...chunkResult.errors)
      } catch (error: any) {
        result.failed += chunk.length
        result.errors.push(`Chunk sync failed: ${error.message}`)
      }
    }

    return result
  }

  // Sync a chunk of records
  private async syncChunk(
    type: "transaction" | "budget" | "loan",
    records: any[]
  ): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: [],
    }

    // Prepare bulk data
    const bulkData = records.map((r) => ({
      ...r.data,
      _version: r.version,
      _lastModified: r.lastModified,
    }))

    console.log(`[SyncManager] Prepared bulk data for ${type}:`, bulkData)

    try {
      // Call bulk API endpoint - pluralize the type for the API path
      const apiPath = type === "transaction" ? "transactions" : type === "budget" ? "budgets" : "loans"
      console.log(`[SyncManager] Calling /api/sync/${apiPath}/bulk with ${bulkData.length} records`)
      const response = await fetch(`/api/sync/${apiPath}/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: bulkData }),
      })

      console.log(`[SyncManager] Bulk sync response status:`, response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`[SyncManager] Bulk sync failed with status ${response.status}:`, errorText)
        let errorData
        try {
          errorData = JSON.parse(errorText)
        } catch {
          errorData = { error: errorText }
        }
        throw new Error(errorData.error || `Bulk sync failed with status ${response.status}`)
      }

      const responseData = await response.json()
      console.log(`[SyncManager] Bulk sync response:`, responseData)

      // Mark records as synced
      for (const record of records) {
        if (responseData.synced?.includes(record.id)) {
          await dbManager.markSynced(type, record.id)
          result.synced++
        } else {
          result.failed++
          const errorDetail = responseData.errors?.find((e: any) => e.id === record.id)
          const errorMsg = errorDetail?.error || "Not in response"
          console.error(`[SyncManager] Failed to sync ${type} ${record.id}:`, errorMsg)
          result.errors.push(
            `Failed to sync ${type} ${record.id}: ${errorMsg}`
          )
        }
      }
    } catch (error: any) {
      // Mark all as failed
      console.error(`[SyncManager] Chunk sync exception:`, error)
      result.failed += records.length
      result.errors.push(`Chunk sync error: ${error.message}`)
    }

    return result
  }

  // Get user ID from session
  private async getUserId(): Promise<string | null> {
    try {
      // Try NextAuth v5 session endpoint
      const response = await fetch("/api/auth/session", {
        credentials: "include",
      })
      if (!response.ok) return null
      const session = await response.json()
      return session?.user?.id || null
    } catch {
      // Fallback: try to get from localStorage or other storage
      // This is a fallback for when the API is not available
      return null
    }
  }

  // Delay helper
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // Force sync (manual trigger)
  async forceSync(userId?: string): Promise<SyncResult> {
    return this.startSync(userId)
  }
}

export const syncManager = new SyncManager()

