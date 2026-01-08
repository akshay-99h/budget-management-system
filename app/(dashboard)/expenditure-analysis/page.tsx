"use client"

import { useEffect, useState } from "react"
import { Transaction } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { TrendingUp, TrendingDown, BarChart3, Calendar, Sparkles, AlertTriangle, MessageSquare } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

interface DeviationExplanation {
  month: string
  year: number
  deviation: number
  explanation: string
  timestamp: string
}

export default function ExpenditureAnalysisPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deviations, setDeviations] = useState<DeviationExplanation[]>([])
  const [showDeviationDialog, setShowDeviationDialog] = useState(false)
  const [currentDeviation, setCurrentDeviation] = useState<{
    month: string
    year: number
    deviation: number
    average: number
    actual: number
  } | null>(null)
  const [explanation, setExplanation] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/transactions")
        if (!response.ok) throw new Error("Failed to fetch transactions")
        const data = await response.json()
        setTransactions(data)
      } catch (error) {
        console.error("Error fetching transactions:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()

    // Load saved explanations from localStorage
    const saved = localStorage.getItem("expenditure-deviations")
    if (saved) {
      setDeviations(JSON.parse(saved))
    }
  }, [])

  const saveExplanation = () => {
    if (!currentDeviation || !explanation.trim()) return

    const newDeviation: DeviationExplanation = {
      month: currentDeviation.month,
      year: currentDeviation.year,
      deviation: currentDeviation.deviation,
      explanation: explanation.trim(),
      timestamp: new Date().toISOString(),
    }

    const updated = [...deviations.filter(
      d => !(d.month === newDeviation.month && d.year === newDeviation.year)
    ), newDeviation]

    setDeviations(updated)
    localStorage.setItem("expenditure-deviations", JSON.stringify(updated))
    setShowDeviationDialog(false)
    setExplanation("")
    setCurrentDeviation(null)
  }

  const getExplanation = (month: string, year: number) => {
    return deviations.find(d => d.month === month && d.year === year)
  }

  // Calculate monthly average expenditure for last 12 months
  const getMonthlyExpenditureData = () => {
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = subMonths(new Date(), 11 - i)
      return format(date, "yyyy-MM")
    })

    const data = last12Months.map((month) => {
      const monthTransactions = transactions.filter(
        (t) => t.type === "expense" && t.date.startsWith(month)
      )
      const total = monthTransactions.reduce((sum, t) => sum + t.amount, 0)
      const average = monthTransactions.length > 0 ? total / monthTransactions.length : 0

      return {
        month: format(new Date(month + "-01"), "MMM yy"),
        rawMonth: month,
        total,
        average,
        count: monthTransactions.length,
      }
    })

    // Calculate overall average for deviation detection
    const overallAverage = data.reduce((sum, m) => sum + m.total, 0) / data.length

    // Flag deviations > 25% from average
    return data.map(d => {
      const deviation = overallAverage > 0 ? ((d.total - overallAverage) / overallAverage) * 100 : 0
      const hasDeviation = Math.abs(deviation) > 25
      const year = parseInt(d.rawMonth.split('-')[0])
      const existingExplanation = getExplanation(d.month, year)

      return {
        ...d,
        deviation,
        hasDeviation,
        needsExplanation: hasDeviation && !existingExplanation,
        explanation: existingExplanation,
      }
    })
  }

  // Calculate yearly expenditure data
  const getYearlyExpenditureData = () => {
    const years = Array.from(
      new Set(transactions.map((t) => new Date(t.date).getFullYear()))
    ).sort()

    return years.map((year) => {
      const yearTransactions = transactions.filter(
        (t) => t.type === "expense" && new Date(t.date).getFullYear() === year
      )
      const total = yearTransactions.reduce((sum, t) => sum + t.amount, 0)
      const monthlyAverage = total / 12
      const count = yearTransactions.length

      return {
        year: year.toString(),
        total,
        monthlyAverage,
        count,
      }
    })
  }

  // Calculate category-wise trends over last 6 months
  const getCategoryTrendsData = () => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = subMonths(new Date(), 5 - i)
      return format(date, "yyyy-MM")
    })

    // Get all unique expense categories
    const categories = Array.from(
      new Set(
        transactions
          .filter((t) => t.type === "expense")
          .map((t) => t.category)
      )
    ).slice(0, 5) // Top 5 categories

    return last6Months.map((month) => {
      const monthData: any = {
        month: format(new Date(month + "-01"), "MMM yy"),
      }

      categories.forEach((category) => {
        const categoryTotal = transactions
          .filter(
            (t) =>
              t.type === "expense" &&
              t.date.startsWith(month) &&
              t.category === category
          )
          .reduce((sum, t) => sum + t.amount, 0)

        monthData[category] = categoryTotal
      })

      return monthData
    })
  }

  // Calculate statistics
  const calculateStatistics = () => {
    const expenses = transactions.filter((t) => t.type === "expense")
    if (expenses.length === 0) {
      return {
        totalExpenses: 0,
        averagePerTransaction: 0,
        averageMonthly: 0,
        highestMonth: { month: "", amount: 0 },
        lowestMonth: { month: "", amount: 0 },
        trend: "neutral" as "up" | "down" | "neutral",
      }
    }

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0)
    const averagePerTransaction = totalExpenses / expenses.length

    // Calculate monthly averages
    const monthlyData = getMonthlyExpenditureData()
    const averageMonthly =
      monthlyData.reduce((sum, m) => sum + m.total, 0) / monthlyData.length

    const sortedMonths = [...monthlyData].sort((a, b) => b.total - a.total)
    const highestMonth = sortedMonths[0] || { month: "", total: 0 }
    const lowestMonth = sortedMonths[sortedMonths.length - 1] || {
      month: "",
      total: 0,
    }

    // Calculate trend (comparing last 3 months to previous 3 months)
    const last3Months = monthlyData.slice(-3).reduce((sum, m) => sum + m.total, 0)
    const previous3Months = monthlyData
      .slice(-6, -3)
      .reduce((sum, m) => sum + m.total, 0)
    let trend: "up" | "down" | "neutral" = "neutral"
    if (last3Months > previous3Months * 1.1) trend = "up"
    else if (last3Months < previous3Months * 0.9) trend = "down"

    return {
      totalExpenses,
      averagePerTransaction,
      averageMonthly,
      highestMonth: { month: highestMonth.month, amount: highestMonth.total },
      lowestMonth: { month: lowestMonth.month, amount: lowestMonth.total },
      trend,
    }
  }

  const monthlyData = getMonthlyExpenditureData()
  const yearlyData = getYearlyExpenditureData()
  const categoryTrends = getCategoryTrendsData()
  const statistics = calculateStatistics()

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"]

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
          <BarChart3 className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
          Expenditure Analysis
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base md:text-lg">
          Comprehensive analysis of your spending patterns and trends
        </p>
      </div>

      {/* Key Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(statistics.totalExpenses)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Average</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(statistics.averageMonthly)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 12 months</p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Transaction</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(statistics.averagePerTransaction)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overall</p>
          </CardContent>
        </Card>

        <Card
          className={`border-2 hover:shadow-lg transition-shadow ${
            statistics.trend === "up"
              ? "bg-red-50 dark:bg-red-950/20"
              : statistics.trend === "down"
              ? "bg-green-50 dark:bg-green-950/20"
              : ""
          }`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Spending Trend</CardTitle>
            {statistics.trend === "up" ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : statistics.trend === "down" ? (
              <TrendingDown className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            )}
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                statistics.trend === "up"
                  ? "text-red-600"
                  : statistics.trend === "down"
                  ? "text-green-600"
                  : ""
              }`}
            >
              {statistics.trend === "up"
                ? "Increasing"
                : statistics.trend === "down"
                ? "Decreasing"
                : "Stable"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 3 vs previous 3 months</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs defaultValue="monthly" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monthly">Monthly Trends</TabsTrigger>
          <TabsTrigger value="yearly">Yearly Analysis</TabsTrigger>
          <TabsTrigger value="category">Category Trends</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Monthly Trends Tab */}
        <TabsContent value="monthly" className="space-y-4">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Monthly Expenditure Trends</CardTitle>
              <CardDescription>Last 12 months spending analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorTotal)"
                    name="Total Expenditure"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Average Expenditure per Transaction</CardTitle>
              <CardDescription>Monthly average spending per transaction</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="average"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Avg per Transaction"
                    dot={{ fill: "#10b981", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Flagged Deviations */}
          {monthlyData.some(m => m.hasDeviation) && (
            <Card className="border-2 border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Flagged Deviations
                </CardTitle>
                <CardDescription>
                  Months with expenditure deviating more than 25% from average
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {monthlyData.filter(m => m.hasDeviation).map((month) => {
                    const year = parseInt(month.rawMonth.split('-')[0])
                    const overallAvg = monthlyData.reduce((sum, m) => sum + m.total, 0) / monthlyData.length

                    return (
                      <div
                        key={month.month}
                        className="flex items-start justify-between p-4 rounded-lg border bg-card"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{month.month}</span>
                            <Badge variant={month.deviation > 0 ? "destructive" : "default"}>
                              {month.deviation > 0 ? "+" : ""}
                              {month.deviation.toFixed(1)}% deviation
                            </Badge>
                            {month.needsExplanation && (
                              <Badge variant="outline" className="text-amber-600 border-amber-600">
                                Needs explanation
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <p>Actual: {formatCurrency(month.total)} | Average: {formatCurrency(overallAvg)}</p>
                          </div>
                          {month.explanation && (
                            <div className="mt-2 p-3 rounded-md bg-muted/50 border">
                              <div className="flex items-start gap-2">
                                <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium mb-1">Explanation:</p>
                                  <p className="text-sm text-muted-foreground">{month.explanation.explanation}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Added {format(new Date(month.explanation.timestamp), "MMM d, yyyy")}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <Button
                            size="sm"
                            variant={month.needsExplanation ? "default" : "outline"}
                            onClick={() => {
                              setCurrentDeviation({
                                month: month.month,
                                year,
                                deviation: month.deviation,
                                average: overallAvg,
                                actual: month.total,
                              })
                              setExplanation(month.explanation?.explanation || "")
                              setShowDeviationDialog(true)
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
                            {month.explanation ? "Edit" : "Explain"}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Yearly Analysis Tab */}
        <TabsContent value="yearly" className="space-y-4">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Yearly Total Expenditure</CardTitle>
              <CardDescription>Year-over-year spending comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="year" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="#3b82f6" name="Total Expenditure" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Monthly Average by Year</CardTitle>
              <CardDescription>Average monthly spending for each year</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="year" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="monthlyAverage"
                    fill="#10b981"
                    name="Monthly Average"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Year-over-year breakdown table */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Year-over-Year Breakdown</CardTitle>
              <CardDescription>Detailed yearly statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {yearlyData.map((year, index) => {
                  const previousYear = yearlyData[index - 1]
                  const change = previousYear
                    ? ((year.total - previousYear.total) / previousYear.total) * 100
                    : 0

                  return (
                    <div
                      key={year.year}
                      className="flex items-center justify-between p-4 rounded-lg border bg-card"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-lg">{year.year}</p>
                        <p className="text-sm text-muted-foreground">
                          {year.count} transactions
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <p className="font-bold text-lg">{formatCurrency(year.total)}</p>
                        <p className="text-sm text-muted-foreground">
                          Avg: {formatCurrency(year.monthlyAverage)}/month
                        </p>
                        {previousYear && (
                          <p
                            className={`text-xs font-medium ${
                              change > 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {change > 0 ? "+" : ""}
                            {change.toFixed(1)}% vs {previousYear.year}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Category Trends Tab */}
        <TabsContent value="category" className="space-y-4">
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Category-wise Spending Trends</CardTitle>
              <CardDescription>Top 5 categories over last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={categoryTrends}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  {Object.keys(categoryTrends[0] || {})
                    .filter((key) => key !== "month")
                    .map((category, index) => (
                      <Line
                        key={category}
                        type="monotone"
                        dataKey={category}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 4 }}
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Category Comparison</CardTitle>
              <CardDescription>Stacked view of category spending</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={categoryTrends}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  {Object.keys(categoryTrends[0] || {})
                    .filter((key) => key !== "month")
                    .map((category, index) => (
                      <Bar
                        key={category}
                        dataKey={category}
                        stackId="a"
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="border-2">
              <CardHeader>
                <CardTitle>Highest Spending Month</CardTitle>
                <CardDescription>Peak expenditure period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  {statistics.highestMonth.month}
                </div>
                <p className="text-2xl font-semibold mt-2">
                  {formatCurrency(statistics.highestMonth.amount)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Lowest Spending Month</CardTitle>
                <CardDescription>Most frugal period</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {statistics.lowestMonth.month}
                </div>
                <p className="text-2xl font-semibold mt-2">
                  {formatCurrency(statistics.lowestMonth.amount)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-2">
            <CardHeader>
              <CardTitle>Transaction Count Trends</CardTitle>
              <CardDescription>Number of transactions per month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#8b5cf6" name="Transactions" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-2 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/20 dark:to-blue-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                Key Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border">
                  <p className="text-sm">
                    📊 Your average monthly expenditure is{" "}
                    <span className="font-bold">{formatCurrency(statistics.averageMonthly)}</span>
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border">
                  <p className="text-sm">
                    💰 On average, each transaction costs{" "}
                    <span className="font-bold">
                      {formatCurrency(statistics.averagePerTransaction)}
                    </span>
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border">
                  <p className="text-sm">
                    {statistics.trend === "up" && "📈 Your spending is trending upward"}
                    {statistics.trend === "down" && "📉 Your spending is trending downward"}
                    {statistics.trend === "neutral" && "➡️ Your spending is relatively stable"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white dark:bg-gray-900 border">
                  <p className="text-sm">
                    🎯 The difference between your highest and lowest spending months is{" "}
                    <span className="font-bold">
                      {formatCurrency(
                        statistics.highestMonth.amount - statistics.lowestMonth.amount
                      )}
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Deviation Explanation Dialog */}
      <Dialog open={showDeviationDialog} onOpenChange={setShowDeviationDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Explain Expenditure Deviation
            </DialogTitle>
            <DialogDescription>
              {currentDeviation && (
                <>
                  <span className="font-semibold">{currentDeviation.month}</span> deviated{" "}
                  <span
                    className={`font-bold ${
                      currentDeviation.deviation > 0 ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    {currentDeviation.deviation > 0 ? "+" : ""}
                    {currentDeviation.deviation.toFixed(1)}%
                  </span>{" "}
                  from your monthly average.
                  <div className="mt-2 p-3 rounded-md bg-muted text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Monthly Average:</span>
                      <span className="font-semibold">
                        {formatCurrency(currentDeviation.average)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Actual Spending:</span>
                      <span className="font-semibold">
                        {formatCurrency(currentDeviation.actual)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1">
                      <span className="text-muted-foreground">Difference:</span>
                      <span
                        className={`font-bold ${
                          currentDeviation.deviation > 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {formatCurrency(Math.abs(currentDeviation.actual - currentDeviation.average))}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Explanation <span className="text-destructive">*</span>
              </label>
              <Textarea
                placeholder="Explain the reason for this deviation (e.g., emergency medical expense, vacation, festival shopping, home renovation, etc.)"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This will help you understand your spending patterns better
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeviationDialog(false)
                setExplanation("")
                setCurrentDeviation(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveExplanation} disabled={!explanation.trim()}>
              Save Explanation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
