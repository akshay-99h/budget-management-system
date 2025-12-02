"use client"

import { Transaction } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"
import { Edit, Trash2, TrendingUp, TrendingDown, ArrowRight } from "lucide-react"
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
  onUpdate: () => void
}

export function TransactionList({ transactions, onUpdate }: TransactionListProps) {
  const { toast } = useToast()
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction)
    setIsDialogOpen(true)
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
            className="border-2 hover:shadow-md transition-all hover:border-primary/50 group"
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
                        {transaction.description && (
                          <>
                            <span className="hidden sm:inline">•</span>
                            <span className="truncate hidden sm:inline">{transaction.description}</span>
                          </>
                        )}
                      </div>
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
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(transaction)}
                          className="h-8 w-8 sm:h-9 sm:w-9 touch-manipulation"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(transaction.id)}
                          className="h-8 w-8 sm:h-9 sm:w-9 text-destructive hover:text-destructive touch-manipulation"
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
    </>
  )
}
