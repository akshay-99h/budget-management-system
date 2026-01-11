"use client"

import { Transaction, Loan, BankAccount } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { TrendingUp, TrendingDown, HandCoins, ArrowRight, Wallet } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ActivityItem {
  id: string
  type: "transaction" | "loan"
  date: string
  time?: string
  category: string
  description: string
  amount: number
  transactionType?: "income" | "expense"
  loanStatus?: string
  borrower?: string
  accountBalanceAfter?: number
  bankAccountId?: string
}

interface ActivityListProps {
  transactions: Transaction[]
  loans: Loan[]
  bankAccounts: BankAccount[]
  limit?: number
}

export function ActivityList({ transactions, loans, bankAccounts, limit }: ActivityListProps) {
  // Calculate overall balance after each transaction
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

  // Combine transactions and loans into a single activity list
  const activities: ActivityItem[] = [
    ...transactions.map((t) => ({
      id: t.id,
      type: "transaction" as const,
      date: t.date,
      time: t.time,
      category: t.category,
      description: t.description || "",
      amount: t.amount,
      transactionType: t.type,
      accountBalanceAfter: t.accountBalanceAfter,
      bankAccountId: t.bankAccountId,
    })),
    ...loans.map((l) => ({
      id: l.id,
      type: "loan" as const,
      date: l.date,
      category: "Loan",
      description: l.notes || "",
      amount: l.amount,
      loanStatus: l.status,
      borrower: l.borrowerName,
    })),
  ]

  // Sort by date and time (most recent first)
  const sortedActivities = activities
    .sort((a, b) => {
      // Combine date and time for accurate sorting
      const dateTimeA = a.time ? `${a.date}T${a.time}` : `${a.date}T00:00`
      const dateTimeB = b.time ? `${b.date}T${b.time}` : `${b.date}T00:00`
      return new Date(dateTimeB).getTime() - new Date(dateTimeA).getTime()
    })
    .slice(0, limit || activities.length)

  if (sortedActivities.length === 0) {
    return (
      <Card className="border-2 border-dashed">
        <div className="py-12 text-center text-muted-foreground">
          <p className="text-lg font-medium">No activity yet</p>
          <p className="text-sm mt-1">Your transactions and loans will appear here</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {sortedActivities.map((activity) => {
        const isTransaction = activity.type === "transaction"
        const isIncome = activity.transactionType === "income"
        const isExpense = activity.transactionType === "expense"
        const isLoan = activity.type === "loan"

        return (
          <Card
            key={`${activity.type}-${activity.id}`}
            className="p-4 hover:bg-accent/50 transition-colors border"
          >
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                  isIncome
                    ? "bg-green-100 dark:bg-green-900/30"
                    : isExpense
                    ? "bg-red-100 dark:bg-red-900/30"
                    : "bg-yellow-100 dark:bg-yellow-900/30"
                }`}
              >
                {isIncome && (
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                )}
                {isExpense && (
                  <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
                {isLoan && (
                  <HandCoins className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">
                      {isLoan ? activity.borrower : activity.category}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {formatDate(activity.date)}
                      {activity.time && ` • ${activity.time}`}
                      {activity.description && ` • ${activity.description}`}
                    </p>
                    {isTransaction && activity.accountBalanceAfter !== undefined && (
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Wallet className="h-3 w-3" />
                          <span>
                            {bankAccounts.find(acc => acc.id === activity.bankAccountId)?.name || 'Account'}: {formatCurrency(activity.accountBalanceAfter)}
                          </span>
                        </div>
                        {overallBalances.has(activity.id) && (
                          <div className="flex items-center gap-1 ml-4">
                            <span className="text-xs">Total: {formatCurrency(overallBalances.get(activity.id)!)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p
                      className={`font-bold text-base ${
                        isIncome
                          ? "text-green-600 dark:text-green-400"
                          : isExpense
                          ? "text-red-600 dark:text-red-400"
                          : "text-yellow-600 dark:text-yellow-400"
                      }`}
                    >
                      {isIncome && "+"}
                      {isExpense && "-"}
                      {formatCurrency(activity.amount)}
                    </p>
                  </div>
                </div>

                {/* Badge for type */}
                <div className="flex items-center gap-2 mt-2">
                  <Badge
                    variant={isLoan ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {isLoan ? "Loan" : activity.transactionType}
                  </Badge>
                  {isLoan && activity.loanStatus && (
                    <Badge
                      variant={
                        activity.loanStatus === "paid"
                          ? "default"
                          : activity.loanStatus === "overdue"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {activity.loanStatus}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
