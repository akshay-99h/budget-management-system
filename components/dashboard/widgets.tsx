"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Heart,
  Sparkles,
  Repeat,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Target,
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Transaction, Budget, Loan, BankAccount, Wishlist } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"

interface SIP {
  id: string
  name: string
  amount: number
  frequency: "daily" | "weekly" | "monthly" | "yearly"
  nextExecutionDate?: string
  isActive: boolean
  category: string
}

interface WidgetProps {
  transactions: Transaction[]
  budgets: Budget[]
  loans: Loan[]
  bankAccounts: BankAccount[]
  wishlistItems: Wishlist[]
  sips: SIP[]
  currentMonth: string
  monthlyIncome: number
  monthlyExpenses: number
  spendingByCategory: Record<string, number>
}

// 1. SIP Investments Widget
export function SIPInvestmentsWidget({ sips }: Pick<WidgetProps, "sips">) {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
  const activeSIPs = sips.filter((s) => s.isActive)
  const monthlyCommitment = activeSIPs
    .filter((s) => s.frequency === "monthly")
    .reduce((sum, s) => sum + s.amount, 0)

  const nextSIP = activeSIPs
    .filter((s) => {
      if (!s.nextExecutionDate) return false
      const executionDate = new Date(s.nextExecutionDate)
      executionDate.setHours(0, 0, 0, 0)
      return executionDate >= today
    })
    .sort((a, b) => new Date(a.nextExecutionDate!).getTime() - new Date(b.nextExecutionDate!).getTime())[0]

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow bg-linear-to-br from-purple-50 to-purple-100/50 dark:from-purple-950/20 dark:to-purple-900/10">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">
          SIP Investments
        </CardTitle>
        <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Repeat className="h-5 w-5 text-purple-600 dark:text-purple-400" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-purple-700 dark:text-purple-400">
          {formatCurrency(monthlyCommitment)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {activeSIPs.length} active {activeSIPs.length === 1 ? "SIP" : "SIPs"}
        </p>
        {nextSIP && (
          <p className="text-xs text-muted-foreground mt-2">
            Next: {nextSIP.name} on {formatDate(nextSIP.nextExecutionDate!)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

// 2. Financial Health Score Widget
export function FinancialHealthWidget({
  monthlyIncome,
  monthlyExpenses,
  budgets,
  spendingByCategory,
  loans,
  bankAccounts,
}: Pick<WidgetProps, "monthlyIncome" | "monthlyExpenses" | "budgets" | "spendingByCategory" | "loans" | "bankAccounts">) {
  // Calculate health score (0-100)
  let score = 0
  const factors = []

  // Factor 1: Savings Rate (30 points)
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0
  const savingsPoints = Math.min(30, Math.max(0, (savingsRate / 20) * 30))
  score += savingsPoints
  factors.push({ name: "Savings Rate", value: savingsRate, points: savingsPoints, max: 30 })

  // Factor 2: Budget Adherence (25 points)
  const budgetAdherence =
    budgets.length > 0
      ? (budgets.filter((b) => (spendingByCategory[b.category] || 0) <= b.limit).length / budgets.length) * 100
      : 100
  const budgetPoints = (budgetAdherence / 100) * 25
  score += budgetPoints
  factors.push({ name: "Budget Control", value: budgetAdherence, points: budgetPoints, max: 25 })

  // Factor 3: Debt-to-Income (25 points)
  const outstandingDebt = loans
    .filter((l) => l.status !== "paid")
    .reduce((sum, l) => {
      const paid = l.payments.reduce((pSum, p) => pSum + p.amount, 0)
      return sum + (l.amount - paid)
    }, 0)
  const debtRatio = monthlyIncome > 0 ? (outstandingDebt / monthlyIncome) * 100 : 0
  const debtPoints = Math.max(0, 25 - (debtRatio / 100) * 25)
  score += debtPoints
  factors.push({ name: "Debt Level", value: 100 - Math.min(100, debtRatio), points: debtPoints, max: 25 })

  // Factor 4: Emergency Fund (20 points)
  const totalBalance = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0)
  const monthsOfExpenses = monthlyExpenses > 0 ? totalBalance / monthlyExpenses : 0
  const emergencyPoints = Math.min(20, (monthsOfExpenses / 6) * 20)
  score += emergencyPoints
  factors.push({ name: "Emergency Fund", value: monthsOfExpenses * 100, points: emergencyPoints, max: 20 })

  const finalScore = Math.round(score)
  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-green-700 dark:text-green-400"
    if (s >= 60) return "text-blue-700 dark:text-blue-400"
    if (s >= 40) return "text-yellow-700 dark:text-yellow-400"
    return "text-red-700 dark:text-red-400"
  }

  const getScoreBg = (s: number) => {
    if (s >= 80) return "from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10"
    if (s >= 60) return "from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10"
    if (s >= 40) return "from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/10"
    return "from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10"
  }

  return (
    <Card className={cn("border-2 hover:shadow-lg transition-shadow bg-linear-to-br", getScoreBg(finalScore))}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn("text-sm font-medium", getScoreColor(finalScore))}>
          Financial Health
        </CardTitle>
        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center",
          finalScore >= 80 ? "bg-green-500/20" :
          finalScore >= 60 ? "bg-blue-500/20" :
          finalScore >= 40 ? "bg-yellow-500/20" : "bg-red-500/20")}>
          <Activity className={cn("h-5 w-5", getScoreColor(finalScore))} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-bold", getScoreColor(finalScore))}>{finalScore}/100</div>
        <div className="mt-3">
          <Progress value={finalScore} className="h-2" />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {finalScore >= 80 && "Excellent financial health!"}
          {finalScore >= 60 && finalScore < 80 && "Good, room for improvement"}
          {finalScore >= 40 && finalScore < 60 && "Fair, needs attention"}
          {finalScore < 40 && "Needs improvement"}
        </p>
      </CardContent>
    </Card>
  )
}

// 3. Spending Trends Widget (6 months)
export function SpendingTrendsWidget({ transactions }: Pick<WidgetProps, "transactions">) {
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const date = subMonths(new Date(), 5 - i)
    return format(date, "yyyy-MM")
  })

  const trendData = last6Months.map((month) => {
    const monthTransactions = transactions.filter((t) => t.date.startsWith(month))
    const income = monthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0)
    const expenses = monthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      month: format(new Date(month + "-01"), "MMM"),
      income,
      expenses,
    }
  })

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow col-span-full md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          Spending Trends
        </CardTitle>
        <CardDescription>Income vs Expenses - Last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={2}
              name="Income"
              dot={{ fill: "#10b981", r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="expenses"
              stroke="#ef4444"
              strokeWidth={2}
              name="Expenses"
              dot={{ fill: "#ef4444", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

// 4. Top Spending Categories Widget
export function TopCategoriesWidget({ spendingByCategory }: Pick<WidgetProps, "spendingByCategory">) {
  const sortedCategories = Object.entries(spendingByCategory)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  const total = Object.values(spendingByCategory).reduce((sum, val) => sum + val, 0)

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          Top Spending
        </CardTitle>
        <CardDescription>Your biggest expense categories</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedCategories.length > 0 ? (
            sortedCategories.map(([category, amount], index) => {
              const percentage = total > 0 ? (amount / total) * 100 : 0
              const colors = ["bg-blue-500", "bg-green-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500"]
              return (
                <div key={category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{category}</span>
                    <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={percentage} className="h-2" />
                    <span className="text-sm font-bold min-w-[80px] text-right">
                      {formatCurrency(amount)}
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No spending data yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 5. Cash Flow Timeline Widget
export function CashFlowWidget({ loans, sips }: Pick<WidgetProps, "loans" | "sips">) {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Reset time to start of day for accurate comparison
  const upcomingEvents: Array<{ date: Date; type: string; description: string; amount: number }> = []

  // Add upcoming loan payments
  loans
    .filter((l) => {
      if (l.status === "paid" || !l.dueDate) return false
      const dueDate = new Date(l.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate >= today
    })
    .forEach((loan) => {
      upcomingEvents.push({
        date: new Date(loan.dueDate!),
        type: "loan",
        description: `Loan: ${loan.borrowerName}`,
        amount: loan.amount - loan.payments.reduce((sum, p) => sum + p.amount, 0),
      })
    })

  // Add upcoming SIP executions
  sips
    .filter((s) => {
      if (!s.isActive || !s.nextExecutionDate) return false
      const executionDate = new Date(s.nextExecutionDate)
      executionDate.setHours(0, 0, 0, 0)
      return executionDate >= today
    })
    .forEach((sip) => {
      upcomingEvents.push({
        date: new Date(sip.nextExecutionDate!),
        type: "sip",
        description: `SIP: ${sip.name}`,
        amount: sip.amount,
      })
    })

  const sortedEvents = upcomingEvents.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5)

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          Cash Flow Timeline
        </CardTitle>
        <CardDescription>Upcoming payments and investments</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedEvents.length > 0 ? (
            sortedEvents.map((event, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      event.type === "loan" ? "bg-yellow-100 dark:bg-yellow-900/30" : "bg-purple-100 dark:bg-purple-900/30"
                    )}
                  >
                    <Calendar
                      className={cn(
                        "h-5 w-5",
                        event.type === "loan" ? "text-yellow-600 dark:text-yellow-400" : "text-purple-600 dark:text-purple-400"
                      )}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{event.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(event.date.toISOString())}</p>
                  </div>
                </div>
                <div className={cn("font-bold", event.type === "loan" ? "text-yellow-600" : "text-purple-600")}>
                  {formatCurrency(event.amount)}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming events</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 6. Savings Rate Widget
export function SavingsRateWidget({ monthlyIncome, monthlyExpenses }: Pick<WidgetProps, "monthlyIncome" | "monthlyExpenses">) {
  const savingsAmount = monthlyIncome - monthlyExpenses
  const savingsRate = monthlyIncome > 0 ? (savingsAmount / monthlyIncome) * 100 : 0

  const getColor = (rate: number) => {
    if (rate >= 20) return { text: "text-green-700 dark:text-green-400", bg: "from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10", icon: "bg-green-500/20" }
    if (rate >= 10) return { text: "text-blue-700 dark:text-blue-400", bg: "from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10", icon: "bg-blue-500/20" }
    if (rate >= 0) return { text: "text-yellow-700 dark:text-yellow-400", bg: "from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/10", icon: "bg-yellow-500/20" }
    return { text: "text-red-700 dark:text-red-400", bg: "from-red-50 to-red-100/50 dark:from-red-950/20 dark:to-red-900/10", icon: "bg-red-500/20" }
  }

  const colors = getColor(savingsRate)

  return (
    <Card className={cn("border-2 hover:shadow-lg transition-shadow bg-linear-to-br", colors.bg)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn("text-sm font-medium", colors.text)}>Savings Rate</CardTitle>
        <div className={cn("h-10 w-10 rounded-full flex items-center justify-center", colors.icon)}>
          <TrendingUp className={cn("h-5 w-5", colors.text)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-bold", colors.text)}>{savingsRate.toFixed(1)}%</div>
        <p className="text-xs text-muted-foreground mt-1">
          Saving {formatCurrency(savingsAmount)} this month
        </p>
        <div className="mt-3">
          <Progress value={Math.min(100, savingsRate * 5)} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}

// 7. Account Balance Distribution Widget
export function AccountDistributionWidget({ bankAccounts }: Pick<WidgetProps, "bankAccounts">) {
  const distributionData = bankAccounts.reduce(
    (acc, account) => {
      acc[account.accountType] = (acc[account.accountType] || 0) + account.balance
      return acc
    },
    {} as Record<string, number>
  )

  const chartData = Object.entries(distributionData).map(([type, balance]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: balance,
  }))

  const COLORS = {
    Checking: "#3b82f6",
    Savings: "#10b981",
    Credit: "#8b5cf6",
    Cash: "#f59e0b",
  }

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          Account Distribution
        </CardTitle>
        <CardDescription>Balance across account types</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || "#888"} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-12">No accounts yet</p>
        )}
      </CardContent>
    </Card>
  )
}

// 8. Wishlist Progress Widget
export function WishlistProgressWidget({ wishlistItems, budgets, spendingByCategory }: Pick<WidgetProps, "wishlistItems" | "budgets" | "spendingByCategory">) {
  const wishlistBudget = budgets.find((b) =>
    b.category.toLowerCase().includes("wishlist") || b.category.toLowerCase().includes("savings")
  )

  const budgetAmount = wishlistBudget?.limit || 0
  const spent = wishlistBudget ? (spendingByCategory[wishlistBudget.category] || 0) : 0
  const available = budgetAmount - spent

  const topItems = wishlistItems
    .filter((item) => !item.isPurchased)
    .sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })
    .slice(0, 3)

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          Wishlist Progress
        </CardTitle>
        <CardDescription>Top priority items and affordability</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topItems.length > 0 ? (
            topItems.map((item) => {
              const affordable = item.estimatedPrice <= available
              const progress = available > 0 ? Math.min(100, (available / item.estimatedPrice) * 100) : 0

              return (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart
                        className={cn(
                          "h-4 w-4",
                          item.priority === "high"
                            ? "text-red-500 fill-red-500"
                            : item.priority === "medium"
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-500 fill-gray-500"
                        )}
                      />
                      <span className="text-sm font-medium truncate max-w-[150px]">{item.itemName}</span>
                    </div>
                    {affordable && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Goal: {formatCurrency(item.estimatedPrice)}</span>
                      <span>{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No wishlist items yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 9. Month-over-Month Comparison Widget
export function MonthComparisonWidget({ transactions, currentMonth }: Pick<WidgetProps, "transactions" | "currentMonth">) {
  const lastMonth = format(subMonths(new Date(currentMonth + "-01"), 1), "yyyy-MM")

  const getCurrentMonthData = (month: string, type: "income" | "expense") => {
    return transactions
      .filter((t) => t.date.startsWith(month) && t.type === type)
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const currentIncome = getCurrentMonthData(currentMonth, "income")
  const currentExpenses = getCurrentMonthData(currentMonth, "expense")
  const lastIncome = getCurrentMonthData(lastMonth, "income")
  const lastExpenses = getCurrentMonthData(lastMonth, "expense")

  const incomeChange = lastIncome > 0 ? ((currentIncome - lastIncome) / lastIncome) * 100 : 0
  const expenseChange = lastExpenses > 0 ? ((currentExpenses - lastExpenses) / lastExpenses) * 100 : 0

  const ComparisonRow = ({
    label,
    current,
    change,
    isExpense,
  }: {
    label: string
    current: number
    change: number
    isExpense?: boolean
  }) => {
    const isIncrease = change > 0
    const isGood = isExpense ? !isIncrease : isIncrease
    const Icon = isIncrease ? ArrowUpRight : ArrowDownRight

    return (
      <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{formatCurrency(current)}</p>
        </div>
        <div className={cn("flex items-center gap-1", isGood ? "text-green-600" : "text-red-600")}>
          <Icon className="h-4 w-4" />
          <span className="font-semibold">{Math.abs(change).toFixed(1)}%</span>
        </div>
      </div>
    )
  }

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          Month Comparison
        </CardTitle>
        <CardDescription>vs last month</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <ComparisonRow label="Income" current={currentIncome} change={incomeChange} />
        <ComparisonRow label="Expenses" current={currentExpenses} change={expenseChange} isExpense />
      </CardContent>
    </Card>
  )
}

// 10. Budget Alerts Widget
export function BudgetAlertsWidget({ budgets, spendingByCategory }: Pick<WidgetProps, "budgets" | "spendingByCategory">) {
  const alerts = budgets
    .map((budget) => {
      const spent = spendingByCategory[budget.category] || 0
      const percentage = (spent / budget.limit) * 100
      return { budget, spent, percentage }
    })
    .filter((a) => a.percentage >= 80)
    .sort((a, b) => b.percentage - a.percentage)

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-500" />
          Budget Alerts
        </CardTitle>
        <CardDescription>Budgets needing attention</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {alerts.length > 0 ? (
            alerts.map(({ budget, spent, percentage }) => (
              <div
                key={budget.id}
                className={cn(
                  "p-3 rounded-lg border",
                  percentage >= 100 ? "bg-red-50 dark:bg-red-950/20 border-red-200" : "bg-amber-50 dark:bg-amber-950/20 border-amber-200"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm">{budget.category}</span>
                  <Badge variant={percentage >= 100 ? "destructive" : "secondary"}>
                    {percentage.toFixed(0)}%
                  </Badge>
                </div>
                <div className="space-y-1">
                  <Progress value={Math.min(100, percentage)} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(spent)}</span>
                    <span>{formatCurrency(budget.limit)}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium">All budgets on track!</p>
              <p className="text-xs text-muted-foreground">Keep up the good work</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 11. Quick Insights Widget
export function QuickInsightsWidget({
  transactions,
  budgets,
  spendingByCategory,
  loans,
  currentMonth,
  monthlyIncome,
  monthlyExpenses,
}: Pick<WidgetProps, "transactions" | "budgets" | "spendingByCategory" | "loans" | "currentMonth" | "monthlyIncome" | "monthlyExpenses">) {
  const insights: Array<{ icon: any; text: string; type: "success" | "warning" | "info" }> = []

  // Insight 1: Top spending category
  const topCategory = Object.entries(spendingByCategory).sort(([, a], [, b]) => b - a)[0]
  if (topCategory) {
    const lastMonth = format(subMonths(new Date(currentMonth + "-01"), 1), "yyyy-MM")
    const lastMonthSpending = transactions
      .filter((t) => t.date.startsWith(lastMonth) && t.category === topCategory[0])
      .reduce((sum, t) => sum + t.amount, 0)

    if (lastMonthSpending > 0) {
      const change = ((topCategory[1] - lastMonthSpending) / lastMonthSpending) * 100
      if (Math.abs(change) > 20) {
        insights.push({
          icon: change > 0 ? TrendingUp : TrendingDown,
          text: `${change > 0 ? "↑" : "↓"} ${Math.abs(change).toFixed(0)}% ${change > 0 ? "more" : "less"} on ${topCategory[0]} vs last month`,
          type: change > 0 ? "warning" : "success",
        })
      }
    }
  }

  // Insight 2: Savings projection
  const savings = monthlyIncome - monthlyExpenses
  if (savings > 0) {
    insights.push({
      icon: Sparkles,
      text: `On track to save ${formatCurrency(savings)} this month`,
      type: "success",
    })
  }

  // Insight 3: Loan due dates
  const upcomingLoans = loans.filter((l) => {
    if (l.status === "paid" || !l.dueDate) return false
    const daysUntil = Math.ceil((new Date(l.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil <= 7 && daysUntil >= 0
  })

  if (upcomingLoans.length > 0) {
    insights.push({
      icon: Calendar,
      text: `${upcomingLoans.length} loan payment${upcomingLoans.length > 1 ? "s" : ""} due this week`,
      type: "warning",
    })
  }

  // Insight 4: Budget performance
  const budgetsOnTrack = budgets.filter((b) => (spendingByCategory[b.category] || 0) <= b.limit).length
  if (budgets.length > 0) {
    const percentage = (budgetsOnTrack / budgets.length) * 100
    if (percentage === 100) {
      insights.push({
        icon: Target,
        text: `All ${budgets.length} budgets are on track!`,
        type: "success",
      })
    }
  }

  // Insight 5: No spending in categories
  if (Object.keys(spendingByCategory).length === 0 && monthlyExpenses === 0) {
    insights.push({
      icon: Info,
      text: "No expenses recorded this month yet",
      type: "info",
    })
  }

  return (
    <Card className="border-2 hover:shadow-lg transition-shadow col-span-full md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Quick Insights
        </CardTitle>
        <CardDescription>AI-powered financial insights</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.length > 0 ? (
            insights.map((insight, index) => {
              const Icon = insight.icon
              return (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border",
                    insight.type === "success" && "bg-green-50 dark:bg-green-950/20 border-green-200",
                    insight.type === "warning" && "bg-amber-50 dark:bg-amber-950/20 border-amber-200",
                    insight.type === "info" && "bg-blue-50 dark:bg-blue-950/20 border-blue-200"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 mt-0.5 shrink-0",
                      insight.type === "success" && "text-green-600",
                      insight.type === "warning" && "text-amber-600",
                      insight.type === "info" && "text-blue-600"
                    )}
                  />
                  <p className="text-sm font-medium">{insight.text}</p>
                </div>
              )
            })
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Not enough data for insights yet</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 12. Net Worth Widget
export function NetWorthWidget({ bankAccounts, loans }: Pick<WidgetProps, "bankAccounts" | "loans">) {
  const totalAssets = bankAccounts.reduce((sum, acc) => sum + acc.balance, 0)
  const totalLiabilities = loans
    .filter((l) => l.status !== "paid")
    .reduce((sum, l) => {
      const paid = l.payments.reduce((pSum, p) => pSum + p.amount, 0)
      return sum + (l.amount - paid)
    }, 0)

  const netWorth = totalAssets - totalLiabilities
  const isPositive = netWorth >= 0

  return (
    <Card
      className={cn(
        "border-2 hover:shadow-lg transition-shadow bg-linear-to-br",
        isPositive
          ? "from-emerald-50 to-emerald-100/50 dark:from-emerald-950/20 dark:to-emerald-900/10"
          : "from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle
          className={cn("text-sm font-medium", isPositive ? "text-emerald-700 dark:text-emerald-400" : "text-orange-700 dark:text-orange-400")}
        >
          Net Worth
        </CardTitle>
        <div
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center",
            isPositive ? "bg-emerald-500/20" : "bg-orange-500/20"
          )}
        >
          <Wallet className={cn("h-5 w-5", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-orange-600 dark:text-orange-400")} />
        </div>
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-bold", isPositive ? "text-emerald-700 dark:text-emerald-400" : "text-orange-700 dark:text-orange-400")}>
          {formatCurrency(netWorth)}
        </div>
        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>Assets:</span>
            <span className="font-medium">{formatCurrency(totalAssets)}</span>
          </div>
          <div className="flex justify-between">
            <span>Liabilities:</span>
            <span className="font-medium">{formatCurrency(totalLiabilities)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
