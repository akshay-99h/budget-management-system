// IndexedDB wrapper for offline storage
const DB_NAME = "Budget2025"
const DB_VERSION = 2

export interface OfflineRecord {
  id: string
  data: any
  version: number // Incremented on each update
  lastModified: number // Timestamp
  synced: boolean // Whether this record has been synced to server
  syncStatus: "pending" | "syncing" | "synced" | "error"
  userId: string
  type: "transaction" | "budget" | "loan"
}

class IndexedDBManager {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const transaction = (event.target as IDBOpenDBRequest).transaction
        const oldVersion = event.oldVersion

        // Migration from version 1 to 2: rename plural stores to singular
        if (oldVersion < 2 && oldVersion > 0) {
          const oldToNewMapping = [
            { old: "transactions", new: "transaction" },
            { old: "budgets", new: "budget" },
            { old: "loans", new: "loan" }
          ]

          oldToNewMapping.forEach(({ old: oldName, new: newName }) => {
            // If old store exists, migrate data using cursor (synchronous)
            if (db.objectStoreNames.contains(oldName)) {
              const oldStore = transaction!.objectStore(oldName)

              // Create new store with singular name
              const newStore = db.createObjectStore(newName, { keyPath: "id" })
              newStore.createIndex("userId", "userId", { unique: false })
              newStore.createIndex("synced", "synced", { unique: false })
              newStore.createIndex("lastModified", "lastModified", { unique: false })
              newStore.createIndex("version", "version", { unique: false })

              // Migrate data using cursor (synchronous within transaction)
              const cursorRequest = oldStore.openCursor()
              cursorRequest.onsuccess = (e) => {
                const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result
                if (cursor) {
                  newStore.put(cursor.value)
                  cursor.continue()
                }
              }

              // Delete old store after migration setup
              db.deleteObjectStore(oldName)
            }
          })
        }

        // Create object stores for each data type (singular names to match code)
        const stores = ["transaction", "budget", "loan"]

        stores.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: "id" })
            store.createIndex("userId", "userId", { unique: false })
            store.createIndex("synced", "synced", { unique: false })
            store.createIndex("lastModified", "lastModified", { unique: false })
            store.createIndex("version", "version", { unique: false })
          }
        })

        // Create sync queue store
        if (!db.objectStoreNames.contains("syncQueue")) {
          const queueStore = db.createObjectStore("syncQueue", {
            keyPath: "id",
            autoIncrement: true,
          })
          queueStore.createIndex("timestamp", "timestamp", { unique: false })
          queueStore.createIndex("type", "type", { unique: false })
        }
      }
    })
  }

  private getStore(storeName: string, mode: IDBTransactionMode = "readwrite") {
    if (!this.db) {
      console.error("[IndexedDB] getStore called but DB not initialized")
      throw new Error("Database not initialized")
    }

    console.log(`[IndexedDB] Creating transaction for store: ${storeName}, mode: ${mode}`)
    console.log("[IndexedDB] Available stores:", Array.from(this.db.objectStoreNames))

    try {
      const transaction = this.db.transaction(storeName, mode)
      const store = transaction.objectStore(storeName)
      console.log(`[IndexedDB] Successfully got store: ${storeName}`)
      return store
    } catch (error) {
      console.error(`[IndexedDB] Error getting store ${storeName}:`, error)
      throw error
    }
  }

  // Save a record offline
  async save<T>(
    type: "transaction" | "budget" | "loan",
    userId: string,
    record: T & { id: string }
  ): Promise<void> {
    try {
      console.log(`[IndexedDB] Attempting to save ${type}:`, record.id)
      console.log("[IndexedDB] DB initialized:", !!this.db)

      if (!this.db) {
        console.error("[IndexedDB] Database not initialized, attempting to initialize...")
        await this.init()
      }

      // Get existing record BEFORE creating the write transaction
      const existing = await this.get(type, record.id)
      console.log("[IndexedDB] Existing record:", existing ? "found" : "not found")

      const offlineRecord: OfflineRecord = {
        id: record.id,
        data: record,
        version: existing ? existing.version + 1 : 1,
        lastModified: Date.now(),
        synced: false,
        syncStatus: "pending",
        userId,
        type,
      }

      console.log("[IndexedDB] Saving offline record:", offlineRecord)

      // Now create the write transaction and save
      const store = this.getStore(type)
      console.log("[IndexedDB] Got store:", type)

      return new Promise((resolve, reject) => {
        const request = store.put(offlineRecord)
        request.onsuccess = () => {
          console.log(`[IndexedDB] Successfully saved ${type}:`, record.id)
          resolve()
        }
        request.onerror = () => {
          console.error(`[IndexedDB] Error saving ${type}:`, request.error)
          reject(request.error)
        }
      })
    } catch (error) {
      console.error("[IndexedDB] Exception in save:", error)
      throw error
    }
  }

  // Get a record
  async get<T>(
    type: "transaction" | "budget" | "loan",
    id: string
  ): Promise<OfflineRecord | null> {
    const store = this.getStore(type, "readonly")
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(request.error)
    })
  }

  // Get all records for a user
  async getAll<T>(
    type: "transaction" | "budget" | "loan",
    userId: string
  ): Promise<T[]> {
    const store = this.getStore(type, "readonly")
    const index = store.index("userId")

    return new Promise((resolve, reject) => {
      const request = index.getAll(userId)
      request.onsuccess = () => {
        const records = request.result as OfflineRecord[]
        resolve(records.map((r) => r.data as T))
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Get all unsynced records
  async getUnsynced(
    type: "transaction" | "budget" | "loan",
    userId: string
  ): Promise<OfflineRecord[]> {
    const store = this.getStore(type, "readonly")
    const index = store.index("userId")

    return new Promise((resolve, reject) => {
      const request = index.getAll(userId)
      request.onsuccess = () => {
        const records = request.result as OfflineRecord[]
        resolve(records.filter((r) => !r.synced))
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Mark record as synced
  async markSynced(
    type: "transaction" | "budget" | "loan",
    id: string
  ): Promise<void> {
    const record = await this.get(type, id)
    if (!record) return

    record.synced = true
    record.syncStatus = "synced"

    const store = this.getStore(type)
    return new Promise((resolve, reject) => {
      const request = store.put(record)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Delete a record
  async delete(
    type: "transaction" | "budget" | "loan",
    id: string
  ): Promise<void> {
    const store = this.getStore(type)
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Add to sync queue
  async addToSyncQueue(
    action: "create" | "update" | "delete",
    type: "transaction" | "budget" | "loan",
    userId: string,
    data: any
  ): Promise<void> {
    const store = this.getStore("syncQueue")
    const queueItem = {
      action,
      type,
      userId,
      data,
      timestamp: Date.now(),
      retries: 0,
    }

    return new Promise((resolve, reject) => {
      const request = store.add(queueItem)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Get sync queue items
  async getSyncQueue(limit: number = 50): Promise<any[]> {
    const store = this.getStore("syncQueue", "readonly")
    const index = store.index("timestamp")

    return new Promise((resolve, reject) => {
      const request = index.getAll()
      request.onsuccess = () => {
        const items = request.result
        resolve(items.slice(0, limit))
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Remove from sync queue
  async removeFromSyncQueue(id: number): Promise<void> {
    const store = this.getStore("syncQueue")
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  // Clear all data for a user (for logout)
  async clearUserData(userId: string): Promise<void> {
    const types: ("transaction" | "budget" | "loan")[] = [
      "transaction",
      "budget",
      "loan",
    ]

    for (const type of types) {
      const store = this.getStore(type)
      const index = store.index("userId")

      await new Promise<void>((resolve, reject) => {
        const request = index.openKeyCursor(IDBKeyRange.only(userId))
        request.onsuccess = (e) => {
          const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result
          if (cursor) {
            store.delete(cursor.primaryKey)
            cursor.continue()
          } else {
            resolve()
          }
        }
        request.onerror = () => reject(request.error)
      })
    }
  }

  // Completely reset the database (for troubleshooting)
  async resetDatabase(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
    }

    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase(DB_NAME)
      deleteRequest.onsuccess = () => {
        console.log("[IndexedDB] Database deleted successfully")
        resolve()
      }
      deleteRequest.onerror = () => reject(deleteRequest.error)
      deleteRequest.onblocked = () => {
        console.warn("[IndexedDB] Delete blocked. Close all tabs and try again.")
      }
    })
  }
}

export const dbManager = new IndexedDBManager()

