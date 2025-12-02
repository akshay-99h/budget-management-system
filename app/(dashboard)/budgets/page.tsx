"use client"

import { useEffect, useState } from "react"
import { Budget, Transaction } from "@/lib/types"
import { BudgetCard } from "@/components/budgets/budget-card"
import { BudgetForm } from "@/components/budgets/budget-form"
import { Button } from "@/components/ui/button"
import { Plus, Target, Calendar } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { budgetSchema, type BudgetInput } from "@/lib/validations"
import { getMonthlySpending, getBudgetStatus } from "@/lib/data/analytics"
import { format } from "date-fns"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), "yyyy-MM"))
  const { toast } = useToast()

  const fetchData = async () => {
    try {
      const [budgetsRes, transactionsRes] = await Promise.all([
        fetch("/api/budgets"),
        fetch("/api/transactions"),
      ])

      if (!budgetsRes.ok || !transactionsRes.ok) {
        throw new Error("Failed to fetch data")
      }

      const budgetsData = await budgetsRes.json()
      const transactionsData = await transactionsRes.json()

      setBudgets(budgetsData)
      setTransactions(transactionsData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load budgets",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (data: BudgetInput) => {
    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to save budget")

      toast({
        title: "Success",
        description: "Budget created successfully",
      })

      setIsDialogOpen(false)
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save budget",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) return

    try {
      const response = await fetch(`/api/budgets/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete budget")

      toast({
        title: "Success",
        description: "Budget deleted successfully",
      })

      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete budget",
        variant: "destructive",
      })
    }
  }

  const monthlyBudgets = budgets.filter((b) => b.month === selectedMonth)
  const spendingByCategory = getMonthlySpending(transactions, selectedMonth)
  const budgetStatuses = getBudgetStatus(monthlyBudgets, spendingByCategory)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-2 sm:gap-3">
            <Target className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
            Budgets
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base md:text-lg">
            Set and track your monthly spending limits
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 sm:space-x-0">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
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
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">Create Budget</span>
                <span className="sm:hidden">Create</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl">Create Budget</DialogTitle>
                <DialogDescription>
                  Set a monthly spending limit for a category.
                </DialogDescription>
              </DialogHeader>
              <BudgetForm
                onSubmit={handleSubmit}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {budgetStatuses.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold">No budgets set for this month</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Create one to start tracking your spending!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgetStatuses.map(({ budget, spent }) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              spent={spent}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
