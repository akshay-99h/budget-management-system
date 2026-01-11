"use client"

import { Transaction, BankAccount } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Edit, Trash2, TrendingUp, TrendingDown, ArrowRight, Wallet } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { TransactionForm } from "./transaction-form"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { transactionSchema, type TransactionInput } from "@/lib/validations"
import { cn } from "@/lib/utils"

interface TransactionListProps {
  transactions: Transaction[]
  bankAccounts: BankAccount[]
  onUpdate: () => void
}

export function TransactionList({ transactions, bankAccounts, onUpdate }: TransactionListProps) {
  const { toast } = useToast()
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)

  // Calculate overall balance after each transaction
  // This works by reversing transactions chronologically to get historical balances
  const calculateOverallBalances = (): Map<string, number> => {
    const balanceMap = new Map<string, number>()

    // Create a map of current account balances
    const accountBalances = new Map<string, number>()
    bankAccounts.forEach(acc => {
      accountBalances.set(acc.id, acc.balance)
    })

    // Sort transactions chronologically (oldest first) to reverse them
    const sortedTransactions = [...transactions].sort((a, b) => {
      const dateTimeA = a.time ? `${a.date}T${a.time}` : `${a.date}T00:00`
      const dateTimeB = b.time ? `${b.date}T${b.time}` : `${b.date}T00:00`
      return new Date(dateTimeA).getTime() - new Date(dateTimeB).getTime()
    })

    // Work backwards from current balances
    // For each transaction (in reverse chronological order), reverse its effect
    for (let i = sortedTransactions.length - 1; i >= 0; i--) {
      const transaction = sortedTransactions[i]

      // Calculate total balance at this point
      let totalBalance = 0
      accountBalances.forEach(balance => {
        totalBalance += balance
      })
      balanceMap.set(transaction.id, totalBalance)

      // Reverse this transaction's effect to get historical balance
      if (transaction.accountBalanceAfter !== undefined) {
        const currentBalance = accountBalances.get(transaction.bankAccountId) || 0
        const balanceChange = transaction.type === "income" ? transaction.amount : -transaction.amount
        const historicalBalance = currentBalance - balanceChange
        accountBalances.set(transaction.bankAccountId, historicalBalance)
      }
    }

    return balanceMap
  }

  const overallBalances = calculateOverallBalances()

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsDialogOpen(true)
  }

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setIsDetailDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return

    try {
      const response = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete transaction")

      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      })
      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      })
    }
  }

  const handleSubmit = async (data: TransactionInput) => {
    try {
      const url = editingTransaction
        ? `/api/transactions/${editingTransaction.id}`
        : "/api/transactions"
      const method = editingTransaction ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to save transaction")

      toast({
        title: "Success",
        description: `Transaction ${editingTransaction ? "updated" : "added"} successfully`,
      })

      setIsDialogOpen(false)
      setEditingTransaction(null)
      onUpdate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save transaction",
        variant: "destructive",
      })
    }
  }

  if (transactions.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <CardContent className="py-16 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
              <TrendingDown className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-lg font-semibold">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Add your first transaction to get started!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {transactions.map((transaction) => (
          <Card
            key={transaction.id}
            className="border-2 hover:shadow-md transition-all hover:border-primary/50 group cursor-pointer"
            onClick={() => handleViewDetails(transaction)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div
                    className={cn(
                      "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center shrink-0",
                      transaction.type === "income"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    )}
                  >
                    {transaction.type === "income" ? (
                      <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-base sm:text-lg truncate">{transaction.category}</p>
                    <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground">
                      <span>{formatDate(transaction.date)}</span>
                      {transaction.time && (
                        <>
                          <span>•</span>
                          <span>{transaction.time}</span>
                        </>
                      )}
                      {transaction.description && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="truncate hidden sm:inline">{transaction.description}</span>
                        </>
                      )}
                    </div>
                    {transaction.accountBalanceAfter !== undefined && (
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Wallet className="h-3 w-3" />
                          <span>
                            {bankAccounts.find(acc => acc.id === transaction.bankAccountId)?.name || 'Account'}: {formatCurrency(transaction.accountBalanceAfter)}
                          </span>
                        </div>
                        {overallBalances.has(transaction.id) && (
                          <div className="flex items-center gap-1 ml-4">
                            <span className="text-xs">Total: {formatCurrency(overallBalances.get(transaction.id)!)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                    <div
                      className={cn(
                        "text-lg sm:text-xl font-bold",
                        transaction.type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div className="flex items-center gap-1 opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleEdit(transaction)
                        }}
                        className="h-8 w-8 sm:h-9 sm:w-9 touch-manipulation opacity-100 hover:bg-accent"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDelete(transaction.id)
                        }}
                        className="h-8 w-8 sm:h-9 sm:w-9 text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation opacity-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingTransaction ? "Edit Transaction" : "Add Transaction"}
            </DialogTitle>
            <DialogDescription>
              {editingTransaction
                ? "Update the transaction details below."
                : "Enter the details for your new transaction."}
            </DialogDescription>
          </DialogHeader>
          <TransactionForm
            transaction={editingTransaction || undefined}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDialogOpen(false)
              setEditingTransaction(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Transaction Details</DialogTitle>
            <DialogDescription>
              View complete information about this transaction
            </DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-6">
              {/* Transaction Type & Amount */}
              <div className="flex items-center justify-between p-4 rounded-lg border-2 bg-muted/30">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-14 w-14 rounded-full flex items-center justify-center",
                      selectedTransaction.type === "income"
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-red-100 dark:bg-red-900/30"
                    )}
                  >
                    {selectedTransaction.type === "income" ? (
                      <TrendingUp className="h-7 w-7 text-green-600 dark:text-green-400" />
                    ) : (
                      <TrendingDown className="h-7 w-7 text-red-600 dark:text-red-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground capitalize">
                      {selectedTransaction.type}
                    </p>
                    <p
                      className={cn(
                        "text-3xl font-bold",
                        selectedTransaction.type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      )}
                    >
                      {selectedTransaction.type === "income" ? "+" : "-"}
                      {formatCurrency(selectedTransaction.amount)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Category</p>
                    <p className="text-base font-semibold">{selectedTransaction.category}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Date & Time</p>
                    <p className="text-base font-semibold">
                      {formatDate(selectedTransaction.date)}
                      {selectedTransaction.time && ` • ${selectedTransaction.time}`}
                    </p>
                  </div>
                </div>

                {selectedTransaction.accountBalanceAfter !== undefined && (
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border-2 bg-muted/20">
                      <div className="flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-muted-foreground">
                            {bankAccounts.find(acc => acc.id === selectedTransaction.bankAccountId)?.name || 'Account'} Balance After
                          </p>
                          <p className="text-lg font-bold">
                            {formatCurrency(selectedTransaction.accountBalanceAfter)}
                          </p>
                        </div>
                      </div>
                    </div>
                    {overallBalances.has(selectedTransaction.id) && (
                      <div className="p-3 rounded-lg border-2 bg-muted/20">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-muted-foreground">
                              Total Balance After
                            </p>
                            <p className="text-lg font-bold">
                              {formatCurrency(overallBalances.get(selectedTransaction.id)!)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedTransaction.description && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-base">{selectedTransaction.description}</p>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">Transaction ID</p>
                  <p className="text-xs font-mono bg-muted px-2 py-1 rounded">
                    {selectedTransaction.id}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={() => {
                    setIsDetailDialogOpen(false)
                    handleEdit(selectedTransaction)
                  }}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2 text-destructive hover:text-destructive"
                  onClick={() => {
                    setIsDetailDialogOpen(false)
                    handleDelete(selectedTransaction.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
