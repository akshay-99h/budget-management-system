"use client"

import { useEffect, useState } from "react"
import { Transaction, Budget, Loan } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  getMonthlyIncome,
  getMonthlyExpenses,
  getMonthlySpending,
  getBudgetStatus,
} from "@/lib/data/analytics"
import { format, startOfMonth, endOfMonth } from "date-fns"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, HandCoins, ArrowUpRight, Sparkles, Target } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { isPWA } from "@/lib/pwa-utils"
import Link from "next/link"
import Joyride, { CallBackProps, STATUS } from "react-joyride"
import { useTour } from "@/contexts/TourContext"
import { dashboardTour, getDesktopStyles, getMobileStyles } from "@/lib/tours"

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"]

export default function DashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMobileApp, setIsMobileApp] = useState(false)
  const { runTour, stopTour, startTour, isTourCompleted } = useTour()

  const currentMonth = format(new Date(), "yyyy-MM")
  const monthStart = startOfMonth(new Date())
  const monthEnd = endOfMonth(new Date())

  useEffect(() => {
    setIsMobileApp(isPWA())
  }, [])

  useEffect(() => {
    // Auto-start tour for first-time users after data loads
    if (!isLoading && !isTourCompleted("dashboard")) {
      const timer = setTimeout(() => {
        startTour("dashboard")
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

  const monthlyIncome = getMonthlyIncome(transactions, currentMonth)
  const monthlyExpenses = getMonthlyExpenses(transactions, currentMonth)
  const netIncome = monthlyIncome - monthlyExpenses
  const spendingByCategory = getMonthlySpending(transactions, currentMonth)
  const monthlyBudgets = budgets.filter((b) => b.month === currentMonth)
  const budgetStatuses = getBudgetStatus(monthlyBudgets, spendingByCategory)

  const totalOutstandingLoans = loans
    .filter((l) => l.status !== "paid")
    .reduce((sum, l) => {
      const totalPaid = l.payments.reduce((pSum, p) => pSum + p.amount, 0)
      return sum + (l.amount - totalPaid)
    }, 0)

  const recentTransactions = transactions
    .filter((t) => {
      const date = new Date(t.date)
      return date >= monthStart && date <= monthEnd
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)

  const categoryChartData = Object.entries(spendingByCategory).map(([name, value]) => ({
    name,
    value,
  }))

  const budgetChartData = budgetStatuses.map(({ budget, spent, percentage }) => ({
    name: budget.category,
    limit: budget.limit,
    spent,
    percentage: Math.min(percentage, 100),
  }))

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <Joyride
        steps={dashboardTour}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={isMobileApp ? getMobileStyles() : getDesktopStyles()}
        locale={{
          back: "Back",
          close: "Close",
          last: "Finish",
          next: "Next",
          skip: "Skip",
        }}
      />

      <div className="space-y-8 animate-in fade-in-50 duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
              <Sparkles className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base md:text-lg">
              Welcome back! Here's your financial overview for {format(new Date(), "MMMM yyyy")}
            </p>
          </div>
        </div>

        {/* Quick Actions for Mobile App */}
        {isMobileApp && (
          <div className="grid grid-cols-2 gap-3">
            <Link href="/budgets">
              <Button variant="outline" className="w-full gap-2 h-14">
                <Target className="h-5 w-5" />
                Set Budget
              </Button>
            </Link>
            <Link href="/loans">
              <Button variant="outline" className="w-full gap-2 h-14">
                <HandCoins className="h-5 w-5" />
                Add Loan
              </Button>
            </Link>
          </div>
        )}

        {/* Stats Cards */}
        <div data-tour="stats-cards" className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 hover:shadow-lg transition-shadow bg-linear-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">
              Total Income
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-700 dark:text-green-400">
              {formatCurrency(monthlyIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow bg-linear-to-br from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">
              Total Expenses
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700 dark:text-red-400">
              {formatCurrency(monthlyExpenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month
            </p>
          </CardContent>
        </Card>

        <Card className={`border-2 hover:shadow-lg transition-shadow bg-linear-to-br ${
          netIncome >= 0 
            ? "from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10" 
            : "from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10"
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${
              netIncome >= 0 
                ? "text-blue-700 dark:text-blue-400" 
                : "text-orange-700 dark:text-orange-400"
            }`}>
              Net Income
            </CardTitle>
            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
              netIncome >= 0 
                ? "bg-blue-500/20" 
                : "bg-orange-500/20"
            }`}>
              <DollarSign className={`h-5 w-5 ${
                netIncome >= 0 
                  ? "text-blue-600 dark:text-blue-400" 
                  : "text-orange-600 dark:text-orange-400"
              }`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              netIncome >= 0 
                ? "text-blue-700 dark:text-blue-400" 
                : "text-orange-700 dark:text-orange-400"
            }`}>
              {formatCurrency(netIncome)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {netIncome >= 0 ? "In the green!" : "Over budget"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow bg-linear-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
              Outstanding Loans
            </CardTitle>
            <div className="h-10 w-10 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <HandCoins className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
              {formatCurrency(totalOutstandingLoans)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting repayment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div data-tour="charts" className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2">
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              Spending by Category
            </CardTitle>
            <CardDescription>Expenses breakdown for this month</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg font-medium">No expenses yet</p>
                  <p className="text-sm">Add transactions to see your spending breakdown</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              Budget Performance
            </CardTitle>
            <CardDescription>Current month budget tracking</CardDescription>
          </CardHeader>
          <CardContent>
            {budgetChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgetChartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end" 
                    height={100}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                  />
                  <Legend />
                  <Bar dataKey="limit" fill="#94a3b8" name="Budget Limit" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="spent" fill="#3b82f6" name="Spent" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                <div className="text-center">
                  <p className="text-lg font-medium">No budgets set</p>
                  <p className="text-sm">Create budgets to track your spending</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card data-tour="recent-transactions" className="border-2 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            Recent Transactions
          </CardTitle>
          <CardDescription>Latest activity for this month</CardDescription>
        </CardHeader>
        <CardContent>
          {recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div
                      className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center shrink-0 ${
                        transaction.type === "income"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-red-100 dark:bg-red-900/30"
                      }`}
                    >
                      {transaction.type === "income" ? (
                        <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 dark:text-green-400" />
                      ) : (
                        <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base truncate">{transaction.category}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        {formatDate(transaction.date)}
                        {transaction.description && (
                          <span className="hidden sm:inline"> • {transaction.description}</span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={`text-base sm:text-lg font-bold ${
                        transaction.type === "income"
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {transaction.type === "income" ? "+" : "-"}
                      {formatCurrency(transaction.amount)}
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-lg font-medium">No transactions this month</p>
              <p className="text-sm">Start tracking your finances by adding a transaction</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  </>
  )
}
