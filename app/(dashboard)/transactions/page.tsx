"use client"

import { useEffect, useState } from "react"
import { Transaction, Loan } from "@/lib/types"
import { TransactionList } from "@/components/transactions/transaction-list"
import { ActivityList } from "@/components/dashboard/activity-list"
import { Button } from "@/components/ui/button"
import { Plus, Receipt, Filter, Target, HandCoins, Wifi, WifiOff } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TransactionForm } from "@/components/transactions/transaction-form"
import { useToast } from "@/hooks/use-toast"
import { transactionSchema, type TransactionInput } from "@/lib/validations"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { isPWA } from "@/lib/pwa-utils"
import Link from "next/link"
import Joyride, { CallBackProps, STATUS } from "react-joyride"
import { useTour } from "@/contexts/TourContext"
import { transactionsTour, transactionsMobileTour, getDesktopStyles, getMobileStyles } from "@/lib/tours"
import { useOffline } from "@/lib/hooks/use-offline"
import { v4 as uuidv4 } from "uuid"

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [isMobileApp, setIsMobileApp] = useState(false)
  const { toast } = useToast()
  const { runTour, stopTour, startTour, isTourCompleted } = useTour()
  const {
    isOnline,
    isSyncing,
    saveTransaction,
    getTransactions,
    deleteTransaction,
    sync,
  } = useOffline()

  useEffect(() => {
    setIsMobileApp(isPWA())
  }, [])

  useEffect(() => {
    if (!isLoading && !isTourCompleted("transactions")) {
      const timer = setTimeout(() => {
        startTour("transactions")
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [isLoading, isTourCompleted, startTour])

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]
    if (finishedStatuses.includes(status as string)) {
      stopTour()
    }
  }

  const fetchTransactions = async () => {
    try {
      // Use offline storage which handles online/offline automatically
      const data = await getTransactions()
      setTransactions(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchLoans = async () => {
    try {
      const response = await fetch("/api/loans")
      if (!response.ok) throw new Error("Failed to fetch loans")
      const data = await response.json()
      setLoans(data)
    } catch (error) {
      console.error("Failed to load loans:", error)
    }
  }

  useEffect(() => {
    fetchTransactions()
    if (isMobileApp) {
      fetchLoans()
    }
  }, [isMobileApp])

  const handleSubmit = async (data: TransactionInput) => {
    try {
      console.log("[TransactionPage] Starting transaction submission:", data)
      const transaction: Transaction = {
        id: uuidv4(),
        ...data,
        userId: "", // Will be set by offline storage
        createdAt: new Date().toISOString(),
      }

      console.log("[TransactionPage] Created transaction object:", transaction)
      await saveTransaction(transaction)
      console.log("[TransactionPage] Transaction saved successfully")

      setIsDialogOpen(false)

      toast({
        title: "Success",
        description: isOnline
          ? "Transaction added successfully"
          : "Transaction saved offline. Will sync when online.",
      })

      // Refresh transaction list
      await fetchTransactions()
    } catch (error: any) {
      console.error("[TransactionPage] Error saving transaction:", error)
      console.error("[TransactionPage] Error stack:", error.stack)
      console.error("[TransactionPage] Error name:", error.name)
      console.error("[TransactionPage] Error message:", error.message)

      toast({
        title: "Error",
        description: error.message || "Failed to save transaction",
        variant: "destructive",
      })
    }
  }

  const filteredTransactions = transactions.filter((t) => {
    if (filterType !== "all" && t.type !== filterType) return false
    if (filterCategory !== "all" && t.category !== filterCategory) return false
    return true
  })

  const categories = Array.from(new Set(transactions.map((t) => t.category)))

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    )
  }

  // Mobile App View
  if (isMobileApp) {
    return (
      <>
        <Joyride
          steps={transactionsMobileTour}
          run={runTour}
          continuous
          showProgress
          showSkipButton
          callback={handleJoyrideCallback}
          styles={getMobileStyles()}
          locale={{
            back: "Back",
            close: "Close",
            last: "Finish",
            next: "Next",
            skip: "Skip",
          }}
        />

        <div className="space-y-4 animate-in fade-in-50 duration-500">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                  <Receipt className="h-6 w-6 text-primary" />
                  Activity
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Recent transactions and loans
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isSyncing && (
                  <span className="text-xs text-muted-foreground animate-pulse">
                    Syncing...
                  </span>
                )}
                {isOnline ? (
                  <Wifi className="h-4 w-4 text-green-500" />
                ) : (
                  <WifiOff className="h-4 w-4 text-orange-500" />
                )}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div data-tour="quick-actions" className="grid grid-cols-2 gap-2">
            <Link href="/budgets">
              <Button variant="outline" className="w-full gap-2 h-14">
                <Target className="h-5 w-5" />
                Budgets
              </Button>
            </Link>
            <Link href="/loans">
              <Button variant="outline" className="w-full gap-2 h-14">
                <HandCoins className="h-5 w-5" />
                Loans
              </Button>
            </Link>
          </div>

          {/* Unified Activity List */}
          <div data-tour="activity-list">
            <ActivityList transactions={transactions} loans={loans} limit={20} />
          </div>
        </div>

        {/* Floating Action Button */}
        <button
          data-tour="fab"
          onClick={() => setIsDialogOpen(true)}
          className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 flex items-center justify-center"
          aria-label="Add transaction"
        >
          <Plus className="h-6 w-6" />
        </button>

        {/* Transaction Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-[95vw] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl">Add Transaction</DialogTitle>
              <DialogDescription>
                Record a new income or expense
              </DialogDescription>
            </DialogHeader>
            <TransactionForm
              onSubmit={handleSubmit}
              onCancel={() => setIsDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Web View
  return (
    <>
      <Joyride
        steps={transactionsTour}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={getDesktopStyles()}
        locale={{
          back: "Back",
          close: "Close",
          last: "Finish",
          next: "Next",
          skip: "Skip",
        }}
      />

      <div className="space-y-6 animate-in fade-in-50 duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
                <Receipt className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
                Transactions
              </h1>
              <div className="flex items-center gap-2">
                {isSyncing && (
                  <span className="text-xs text-muted-foreground animate-pulse">
                    Syncing...
                  </span>
                )}
                {isOnline ? (
                  <Wifi className="h-5 w-5 text-green-500" />
                ) : (
                  <WifiOff className="h-5 w-5 text-orange-500" />
                )}
              </div>
            </div>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base md:text-lg">
              Manage your income and expenses
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button data-tour="add-transaction" size="lg" className="gap-2 w-full sm:w-auto">
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">Add Transaction</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">Add New Transaction</DialogTitle>
                <DialogDescription>
                  Record a new income or expense entry
                </DialogDescription>
              </DialogHeader>
              <TransactionForm
                onSubmit={handleSubmit}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card data-tour="filters" className="p-4 border-2">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Transaction List */}
        <div data-tour="transaction-list">
          <TransactionList
            transactions={filteredTransactions}
            onUpdate={fetchTransactions}
          />
        </div>
      </div>
    </>
  )
}
