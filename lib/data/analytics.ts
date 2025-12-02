import { Transaction, Budget } from "@/lib/types"
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns"

export function getMonthlySpending(
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
    spendingByCategory[t.category] = (spendingByCategory[t.category] || 0) + t.amount
  })

  return spendingByCategory
}

export function getBudgetStatus(
  budgets: Budget[],
  spendingByCategory: Record<string, number>
): Array<{
  budget: Budget
  spent: number
  remaining: number
  percentage: number
  status: "under" | "warning" | "over"
}> {
  return budgets.map((budget) => {
    const spent = spendingByCategory[budget.category] || 0
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

