import { Transaction, Budget } from "@/lib/types"
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns"

// Helper function to identify SIP transactions
function isSIPTransaction(transaction: Transaction): boolean {
  // SIP transactions can be identified by:
  // 1. Description pattern: "SIP Name - SIP Investment" (from automated SIP execution)
  // 2. Category: "SIP" (for manually added SIP transactions)
  return (
    transaction.description?.includes(" - SIP Investment") ?? false
  ) || transaction.category === "SIP"
}

export function getMonthlySpending(
  transactions: Transaction[],
  month: string,
  excludeSIPs: boolean = false
): Record<string, number> {
  const [year, monthNum] = month.split("-").map(Number)
  const start = startOfMonth(new Date(year, monthNum - 1))
  const end = endOfMonth(new Date(year, monthNum - 1))

  const monthlyTransactions = transactions.filter((t) => {
    if (t.type !== "expense") return false
    const date = parseISO(t.date)
    return isWithinInterval(date, { start, end })
  })

  const spendingByCategory: Record<string, number> = {}
  monthlyTransactions.forEach((t) => {
    // If excludeSIPs is true, skip SIP transactions
    if (excludeSIPs && isSIPTransaction(t)) {
      return
    }
    spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount
  })

  return spendingByCategory
}

// Get spending for SIP transactions only
export function getMonthlySIPSpending(
  transactions: Transaction[],
  month: string
): Record<string, number> {
  const [year, monthNum] = month.split("-").map(Number)
  const start = startOfMonth(new Date(year, monthNum - 1))
  const end = endOfMonth(new Date(year, monthNum - 1))

  const monthlyTransactions = transactions.filter((t) => {
    if (t.type !== "expense") return false
    const date = parseISO(t.date)
    return isWithinInterval(date, { start, end })
  })

  const spendingByCategory: Record<string, number> = {}
  monthlyTransactions.forEach((t) => {
    // Only include SIP transactions
    if (isSIPTransaction(t)) {
      spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount
    }
  })

  return spendingByCategory
}

export function getBudgetStatus(
  budgets: Budget[],
  spendingByCategory: Record<string, number>,
  sipSpendingByCategory?: Record<string, number>
): Array<{
  budget: Budget
  spent: number
  remaining: number
  percentage: number
  status: "under" | "warning" | "over"
}> {
  return budgets.map((budget) => {
    // For SIP budgets, use SIP spending; for regular budgets, use regular spending (which excludes SIPs)
    const spendingSource = budget.isSIPBudget ? (sipSpendingByCategory || {}) : spendingByCategory
    const spent = spendingSource[budget.category] || 0
    const remaining = budget.limit - spent
    const percentage = (spent / budget.limit) * 100
    let status: "under" | "warning" | "over" = "under"
    if (percentage >= 100) status = "over"
    else if (percentage >= 80) status = "warning"

    return {
      budget,
      spent,
      remaining,
      percentage,
      status,
    }
  })
}

export function getMonthlyIncome(transactions: Transaction[], month: string): number {
  const [year, monthNum] = month.split("-").map(Number)
  const start = startOfMonth(new Date(year, monthNum - 1))
  const end = endOfMonth(new Date(year, monthNum - 1))

  return transactions
    .filter((t) => {
      if (t.type !== "income") return false
      const date = parseISO(t.date)
      return isWithinInterval(date, { start, end })
    })
    .reduce((sum, t) => sum + t.amount, 0)
}

export function getMonthlyExpenses(transactions: Transaction[], month: string): number {
  const [year, monthNum] = month.split("-").map(Number)
  const start = startOfMonth(new Date(year, monthNum - 1))
  const end = endOfMonth(new Date(year, monthNum - 1))

  return transactions
    .filter((t) => {
      if (t.type !== "expense") return false
      const date = parseISO(t.date)
      return isWithinInterval(date, { start, end })
    })
    .reduce((sum, t) => sum + t.amount, 0)
}

