"use client"

import { Transaction, Loan } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { TrendingUp, TrendingDown, HandCoins, ArrowRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ActivityItem {
  id: string
  type: "transaction" | "loan"
  date: string
  category: string
  description: string
  amount: number
  transactionType?: "income" | "expense"
  loanStatus?: string
  borrower?: string
}

interface ActivityListProps {
  transactions: Transaction[]
  loans: Loan[]
  limit?: number
}

export function ActivityList({ transactions, loans, limit }: ActivityListProps) {
  // Combine transactions and loans into a single activity list
  const activities: ActivityItem[] = [
    ...transactions.map((t) => ({
      id: t.id,
      type: "transaction" as const,
      date: t.date,
      category: t.category,
      description: t.description || "",
      amount: t.amount,
      transactionType: t.type,
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

  // Sort by date (most recent first)
  const sortedActivities = activities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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
                      {activity.description && ` • ${activity.description}`}
                    </p>
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
