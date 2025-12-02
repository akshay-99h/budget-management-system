"use client"

import { useEffect, useState } from "react"
import { Transaction, Budget, Loan } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import {
  getMonthlyIncome,
  getMonthlyExpenses,
  getMonthlySpending,
  getBudgetStatus,
} from "@/lib/data/analytics"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  exportToCSV,
  formatTransactionsForExport,
  formatBudgetsForExport,
  formatLoansForExport,
} from "@/lib/utils/export"
import { useToast } from "@/hooks/use-toast"

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"))
  const { toast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transactionsRes, budgetsRes, loansRes] = await Promise.all([
          fetch("/api/transactions"),
          fetch("/api/budgets"),
          fetch("/api/loans"),
        ])

        if (!transactionsRes.ok || !budgetsRes.ok || !loansRes.ok) {
          throw new Error("Failed to fetch data")
        }

        const transactionsData = await transactionsRes.json()
        const budgetsData = await budgetsRes.json()
        const loansData = await loansRes.json()

        setTransactions(transactionsData)
        setBudgets(budgetsData)
        setLoans(loansData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleExport = async (type: "transactions" | "budgets" | "loans" | "all") => {
    try {
      const response = await fetch(`/api/data/export?type=${type}`)
      if (!response.ok) throw new Error("Failed to export data")

      const data = await response.json()

      if (type === "transactions" || type === "all") {
        if (data.transactions && data.transactions.length > 0) {
          exportToCSV(
            formatTransactionsForExport(data.transactions),
            `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`
          )
        }
      }

      if (type === "budgets" || type === "all") {
        if (data.budgets && data.budgets.length > 0) {
          exportToCSV(
            formatBudgetsForExport(data.budgets),
            `budgets-${format(new Date(), "yyyy-MM-dd")}.csv`
          )
        }
      }

      if (type === "loans" || type === "all") {
        if (data.loans && data.loans.length > 0) {
          exportToCSV(
            formatLoansForExport(data.loans),
            `loans-${format(new Date(), "yyyy-MM-dd")}.csv`
          )
        }
      }

      toast({
        title: "Success",
        description: "Data exported successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  const monthlyIncome = getMonthlyIncome(transactions, selectedMonth)
  const monthlyExpenses = getMonthlyExpenses(transactions, selectedMonth)
  const spendingByCategory = getMonthlySpending(transactions, selectedMonth)
  const monthlyBudgets = budgets.filter((b) => b.month === selectedMonth)
  const budgetStatuses = getBudgetStatus(monthlyBudgets, spendingByCategory)

  const monthlyTransactions = transactions.filter((t) => {
    const transactionMonth = format(new Date(t.date), "yyyy-MM")
    return transactionMonth === selectedMonth
  })

  const categoryBreakdown = Object.entries(spendingByCategory)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            View and export your financial data
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 sm:space-x-0">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date()
                date.setMonth(date.getMonth() - i)
                const monthStr = format(date, "yyyy-MM")
                return (
                  <SelectItem key={monthStr} value={monthStr}>
                    {format(date, "MMMM yyyy")}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <Button onClick={() => handleExport("all")} className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export All</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Summary</CardTitle>
            <CardDescription>{format(new Date(selectedMonth + "-01"), "MMMM yyyy")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Income</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(monthlyIncome)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expenses</span>
              <span className="font-semibold text-red-600">
                {formatCurrency(monthlyExpenses)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="font-medium">Net</span>
              <span
                className={`font-bold ${
                  monthlyIncome - monthlyExpenses >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {formatCurrency(monthlyIncome - monthlyExpenses)}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Budget Performance</CardTitle>
            <CardDescription>Current month budgets</CardDescription>
          </CardHeader>
          <CardContent>
            {budgetStatuses.length > 0 ? (
              <div className="space-y-2">
                {budgetStatuses.map(({ budget, spent, percentage, status }) => (
                  <div key={budget.id} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{budget.category}</span>
                      <span
                        className={
                          status === "over"
                            ? "text-destructive"
                            : status === "warning"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }
                      >
                        {percentage.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          status === "over"
                            ? "bg-destructive"
                            : status === "warning"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No budgets for this month</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Export Data</CardTitle>
            <CardDescription>Download your data as CSV</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport("transactions")}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Transactions
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport("budgets")}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Budgets
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleExport("loans")}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Loans
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
          <CardDescription>Spending by category for {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}</CardDescription>
        </CardHeader>
        <CardContent>
          {categoryBreakdown.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Percentage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categoryBreakdown.map(({ category, amount }) => {
                  const percentage = (amount / monthlyExpenses) * 100
                  return (
                    <TableRow key={category}>
                      <TableCell>{category}</TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(amount)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {percentage.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No expenses for this month</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Transactions</CardTitle>
          <CardDescription>
            All transactions for {format(new Date(selectedMonth + "-01"), "MMMM yyyy")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyTransactions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>{formatDate(transaction.date)}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          transaction.type === "income"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </TableCell>
                    <TableCell>{transaction.category}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {transaction.description || "-"}
                    </TableCell>
                    <TableCell
                      className={`text-right font-semibold ${
                        transaction.type === "income"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No transactions for this month</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

