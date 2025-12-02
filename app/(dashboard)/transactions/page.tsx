"use client"

import { useEffect, useState } from "react"
import { Transaction } from "@/lib/types"
import { TransactionList } from "@/components/transactions/transaction-list"
import { Button } from "@/components/ui/button"
import { Plus, Receipt, Filter } from "lucide-react"
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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [filterType, setFilterType] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const { toast } = useToast()

  const fetchTransactions = async () => {
    try {
      const response = await fetch("/api/transactions")
      if (!response.ok) throw new Error("Failed to fetch transactions")
      const data = await response.json()
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

  useEffect(() => {
    fetchTransactions()
  }, [])

  const handleSubmit = async (data: TransactionInput) => {
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to save transaction")

      toast({
        title: "Success",
        description: "Transaction added successfully",
      })

      setIsDialogOpen(false)
      fetchTransactions()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save transaction",
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

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
            <Receipt className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
            Transactions
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base md:text-lg">
            Manage your income and expenses
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 w-full sm:w-auto">
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
      <Card className="p-4 border-2">
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
      <TransactionList
        transactions={filteredTransactions}
        onUpdate={fetchTransactions}
      />
    </div>
  )
}
