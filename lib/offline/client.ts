// Client-side offline storage wrapper
"use client"

import { dbManager } from "./db"
import { syncManager } from "./sync"
import { Transaction, Budget, Loan } from "@/lib/types"
import { logger } from "@/lib/utils/logger"

// Initialize on client side
if (typeof window !== "undefined") {
  dbManager.init().catch((error) => logger.error("Failed to initialize offline storage", error))
}

export class OfflineStorage {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  // Transaction operations
  async saveTransaction(transaction: Transaction): Promise<void> {
    const transactionWithUserId = { ...transaction, userId: this.userId }

    // If online, save directly to server
    if (syncManager.getOnlineStatus()) {
      console.log("[OfflineStorage] Online - saving directly to server")
      try {
        const response = await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transactionWithUserId),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to save transaction")
        }

        const savedTransaction = await response.json()
        console.log("[OfflineStorage] Transaction saved to server successfully:", savedTransaction)

        // Also save to IndexedDB for caching
        await dbManager.save("transaction", this.userId, savedTransaction)
        await dbManager.markSynced("transaction", savedTransaction.id)
      } catch (error) {
        console.error("[OfflineStorage] Failed to save to server, falling back to offline mode:", error)
        // Fall back to offline mode - save to IndexedDB for later sync
        await dbManager.save("transaction", this.userId, transactionWithUserId)
        console.log("[OfflineStorage] Transaction saved offline due to server error, will sync when available")
        // Re-throw so the UI knows there was an issue
        throw new Error("Could not reach server. Transaction saved offline and will sync later.")
      }
    } else {
      // Offline mode - save to IndexedDB for later sync
      console.log("[OfflineStorage] Offline mode - saving to IndexedDB")
      await dbManager.save("transaction", this.userId, transactionWithUserId)
      console.log("[OfflineStorage] Transaction saved offline, will sync when online")
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    // If online, fetch from server (source of truth)
    if (syncManager.getOnlineStatus()) {
      try {
        console.log("[OfflineStorage] Online - fetching from server...")
        const response = await fetch("/api/transactions")
        if (response.ok) {
          const transactions = await response.json()
          console.log("[OfflineStorage] Fetched", transactions.length, "transactions from server")
          return transactions
        } else {
          console.error("[OfflineStorage] Server fetch failed with status:", response.status)
        }
      } catch (error) {
        console.error("[OfflineStorage] Failed to fetch from server, falling back to cache:", error)
      }
    }

    // Offline or server failed - use IndexedDB cache
    console.log("[OfflineStorage] Offline mode - fetching from IndexedDB cache")
    const cached = await dbManager.getAll<Transaction>("transaction", this.userId)
    console.log("[OfflineStorage] Found", cached.length, "transactions in cache")
    return cached
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    // If online, try to update on server
    if (syncManager.getOnlineStatus()) {
      try {
        const response = await fetch(`/api/transactions/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        })

        if (!response.ok) {
          // If 404, transaction doesn't exist on server yet (offline transaction not synced)
          if (response.status === 404) {
            console.log("[OfflineStorage] Transaction not found on server (offline transaction), updating locally")
            const existing = await dbManager.get("transaction", id)
            if (!existing) throw new Error("Transaction not found")

            const updated = { ...existing.data, ...updates }
            await dbManager.save("transaction", this.userId, updated)
            return
          }

          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to update transaction")
        }

        const updated = await response.json()
        // Update cache
        await dbManager.save("transaction", this.userId, updated)
        await dbManager.markSynced("transaction", id)
      } catch (error) {
        console.error("[OfflineStorage] Failed to update on server:", error)
        throw error
      }
    } else {
      // Offline - update in IndexedDB
      const existing = await dbManager.get("transaction", id)
      if (!existing) throw new Error("Transaction not found")

      const updated = { ...existing.data, ...updates }
      await dbManager.save("transaction", this.userId, updated)
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    // If online, try to delete on server
    if (syncManager.getOnlineStatus()) {
      try {
        const response = await fetch(`/api/transactions/${id}`, { method: "DELETE" })

        if (!response.ok) {
          // If 404, transaction doesn't exist on server yet (offline transaction not synced)
          if (response.status === 404) {
            console.log("[OfflineStorage] Transaction not found on server (offline transaction), deleting locally")
            await dbManager.delete("transaction", id)
            return
          }

          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || "Failed to delete transaction")
        }

        // Also remove from cache
        await dbManager.delete("transaction", id)
      } catch (error) {
        console.error("[OfflineStorage] Failed to delete on server:", error)
        throw error
      }
    } else {
      // Offline - delete from IndexedDB (won't need to sync if never reached server)
      await dbManager.delete("transaction", id)
    }
  }

  // Budget operations
  async saveBudget(budget: Budget): Promise<void> {
    const budgetWithUserId = { ...budget, userId: this.userId }
    await dbManager.save("budget", this.userId, budgetWithUserId)
    if (syncManager.getOnlineStatus()) {
      syncManager.startSync(this.userId).catch((error) => logger.silent.error("Sync failed", error))
    }
  }

  async getBudgets(): Promise<Budget[]> {
    const offline = await dbManager.getAll<Budget>("budget", this.userId)

    if (syncManager.getOnlineStatus()) {
      try {
        const response = await fetch("/api/budgets")
        if (response.ok) {
          const server = await response.json()
          const merged = new Map<string, Budget>()
          offline.forEach((b) => merged.set(b.id, b))
          server.forEach((b: Budget) => {
            if (!merged.has(b.id)) merged.set(b.id, b)
          })
          return Array.from(merged.values())
        }
      } catch (error) {
        logger.silent.error("Failed to fetch budgets from server", error)
      }
    }

    return offline
  }

  async deleteBudget(id: string): Promise<void> {
    await dbManager.delete("budget", id)
    if (syncManager.getOnlineStatus()) {
      try {
        await fetch(`/api/budgets/${id}`, { method: "DELETE" })
      } catch (error) {
        logger.silent.error("Failed to delete budget on server", error)
      }
    }
  }

  // Loan operations
  async saveLoan(loan: Loan): Promise<void> {
    const loanWithUserId = { ...loan, userId: this.userId }
    await dbManager.save("loan", this.userId, loanWithUserId)
    if (syncManager.getOnlineStatus()) {
      syncManager.startSync(this.userId).catch((error) => logger.silent.error("Sync failed", error))
    }
  }

  async getLoans(): Promise<Loan[]> {
    const offline = await dbManager.getAll<Loan>("loan", this.userId)

    if (syncManager.getOnlineStatus()) {
      try {
        const response = await fetch("/api/loans")
        if (response.ok) {
          const server = await response.json()
          const merged = new Map<string, Loan>()
          offline.forEach((l) => merged.set(l.id, l))
          server.forEach((l: Loan) => {
            if (!merged.has(l.id)) merged.set(l.id, l)
          })
          return Array.from(merged.values())
        }
      } catch (error) {
        logger.silent.error("Failed to fetch loans from server", error)
      }
    }

    return offline
  }

  async updateLoan(id: string, updates: Partial<Loan>): Promise<void> {
    const existing = await dbManager.get("loan", id)
    if (!existing) throw new Error("Loan not found")

    const updated = { ...existing.data, ...updates }
    await dbManager.save("loan", this.userId, updated)

    if (syncManager.getOnlineStatus()) {
      syncManager.startSync().catch((error) => logger.silent.error("Sync failed", error))
    }
  }

  async deleteLoan(id: string): Promise<void> {
    await dbManager.delete("loan", id)
    if (syncManager.getOnlineStatus()) {
      try {
        await fetch(`/api/loans/${id}`, { method: "DELETE" })
      } catch (error) {
        logger.silent.error("Failed to delete loan on server", error)
      }
    }
  }

  // Sync operations
  async sync(): Promise<void> {
    await syncManager.forceSync(this.userId)
  }

  isOnline(): boolean {
    return syncManager.getOnlineStatus()
  }

  onSyncStatusChange(callback: (syncing: boolean) => void) {
    return syncManager.onSyncStatusChange(callback)
  }
}

