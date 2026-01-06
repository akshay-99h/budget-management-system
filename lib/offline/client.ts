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
    try {
      console.log("[OfflineStorage] Saving transaction:", transaction)
      const transactionWithUserId = { ...transaction, userId: this.userId }
      await dbManager.save("transaction", this.userId, transactionWithUserId)
      console.log("[OfflineStorage] Transaction saved successfully")
      // Try to sync immediately if online
      if (syncManager.getOnlineStatus()) {
        syncManager.startSync(this.userId).catch((error) => {
          console.error("[OfflineStorage] Sync failed:", error)
          logger.silent.error("Sync failed", error)
        })
      }
    } catch (error) {
      console.error("[OfflineStorage] Failed to save transaction:", error)
      throw error
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    // First try to get from IndexedDB
    const offline = await dbManager.getAll<Transaction>("transaction", this.userId)

    // If online, also fetch from server and merge
    if (syncManager.getOnlineStatus()) {
      try {
        const response = await fetch("/api/transactions")
        if (response.ok) {
          const server = await response.json()
          // Merge and deduplicate by ID using timestamps
          const merged = new Map<string, Transaction>()

          // Add offline records first
          offline.forEach((t) => merged.set(t.id, t))

          // Add server records, using timestamp-based conflict resolution
          server.forEach((t: Transaction) => {
            const existing = merged.get(t.id)
            if (!existing) {
              // Record only exists on server
              merged.set(t.id, t)
            } else {
              // Record exists in both - use the newer one based on createdAt
              const serverTime = new Date(t.createdAt).getTime()
              const offlineTime = new Date(existing.createdAt).getTime()
              if (serverTime > offlineTime) {
                merged.set(t.id, t)
              }
            }
          })

          return Array.from(merged.values())
        }
      } catch (error) {
        logger.silent.error("Failed to fetch from server", error)
      }
    }

    return offline
  }

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    const existing = await dbManager.get("transaction", id)
    if (!existing) throw new Error("Transaction not found")
    
    const updated = { ...existing.data, ...updates }
    await dbManager.save("transaction", this.userId, updated)

    if (syncManager.getOnlineStatus()) {
      syncManager.startSync().catch((error) => logger.silent.error("Sync failed", error))
    }
  }

  async deleteTransaction(id: string): Promise<void> {
    await dbManager.delete("transaction", id)
    
    // Also delete on server if online
    if (syncManager.getOnlineStatus()) {
      try {
        await fetch(`/api/transactions/${id}`, { method: "DELETE" })
      } catch (error) {
        logger.silent.error("Failed to delete on server", error)
      }
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

