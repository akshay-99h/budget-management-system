"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { OfflineStorage } from "@/lib/offline/client"
import { Transaction, Budget, Loan } from "@/lib/types"

export function useOffline() {
  const { data: session } = useSession()
  const [storage, setStorage] = useState<OfflineStorage | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      const offlineStorage = new OfflineStorage(session.user.id)
      setStorage(offlineStorage)
      setIsOnline(offlineStorage.isOnline())

      // Subscribe to sync status
      const unsubscribe = offlineStorage.onSyncStatusChange((syncing) => {
        setIsSyncing(syncing)
      })

      return () => {
        unsubscribe()
      }
    }
  }, [session])

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const saveTransaction = useCallback(
    async (transaction: Transaction) => {
      if (!storage) throw new Error("Storage not initialized")
      await storage.saveTransaction(transaction)
    },
    [storage]
  )

  const getTransactions = useCallback(async (): Promise<Transaction[]> => {
    if (!storage) return []
    return storage.getTransactions()
  }, [storage])

  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      if (!storage) throw new Error("Storage not initialized")
      await storage.updateTransaction(id, updates)
    },
    [storage]
  )

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!storage) throw new Error("Storage not initialized")
      await storage.deleteTransaction(id)
    },
    [storage]
  )

  const saveBudget = useCallback(
    async (budget: Budget) => {
      if (!storage) throw new Error("Storage not initialized")
      await storage.saveBudget(budget)
    },
    [storage]
  )

  const getBudgets = useCallback(async (): Promise<Budget[]> => {
    if (!storage) return []
    return storage.getBudgets()
  }, [storage])

  const deleteBudget = useCallback(
    async (id: string) => {
      if (!storage) throw new Error("Storage not initialized")
      await storage.deleteBudget(id)
    },
    [storage]
  )

  const saveLoan = useCallback(
    async (loan: Loan) => {
      if (!storage) throw new Error("Storage not initialized")
      await storage.saveLoan(loan)
    },
    [storage]
  )

  const getLoans = useCallback(async (): Promise<Loan[]> => {
    if (!storage) return []
    return storage.getLoans()
  }, [storage])

  const updateLoan = useCallback(
    async (id: string, updates: Partial<Loan>) => {
      if (!storage) throw new Error("Storage not initialized")
      await storage.updateLoan(id, updates)
    },
    [storage]
  )

  const deleteLoan = useCallback(
    async (id: string) => {
      if (!storage) throw new Error("Storage not initialized")
      await storage.deleteLoan(id)
    },
    [storage]
  )

  const sync = useCallback(async () => {
    if (!storage) return
    await storage.sync()
  }, [storage])

  return {
    storage,
    isOnline,
    isSyncing,
    saveTransaction,
    getTransactions,
    updateTransaction,
    deleteTransaction,
    saveBudget,
    getBudgets,
    deleteBudget,
    saveLoan,
    getLoans,
    updateLoan,
    deleteLoan,
    sync,
  }
}

