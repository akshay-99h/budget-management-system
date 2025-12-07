// IndexedDB wrapper for offline storage
const DB_NAME = "Budget2025"
const DB_VERSION = 1

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

        // Create object stores for each data type
        const stores = ["transactions", "budgets", "loans", "syncQueue"]

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
    if (!this.db) throw new Error("Database not initialized")
    return this.db.transaction(storeName, mode).objectStore(storeName)
  }

  // Save a record offline
  async save<T>(
    type: "transaction" | "budget" | "loan",
    userId: string,
    record: T & { id: string }
  ): Promise<void> {
    const store = this.getStore(type)
    const existing = await this.get(type, record.id)

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

    return new Promise((resolve, reject) => {
      const request = store.put(offlineRecord)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
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
}

export const dbManager = new IndexedDBManager()

