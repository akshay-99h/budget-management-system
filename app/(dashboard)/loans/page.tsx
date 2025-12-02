"use client"

import { useEffect, useState } from "react"
import { Loan } from "@/lib/types"
import { LoanCard } from "@/components/loans/loan-card"
import { LoanForm } from "@/components/loans/loan-form"
import { Button } from "@/components/ui/button"
import { Plus, HandCoins, Filter } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { loanSchema, type LoanInput, type LoanPaymentInput } from "@/lib/validations"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const { toast } = useToast()

  const fetchLoans = async () => {
    try {
      const response = await fetch("/api/loans")
      if (!response.ok) throw new Error("Failed to fetch loans")
      const data = await response.json()
      setLoans(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load loans",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLoans()
  }, [])

  const handleSubmit = async (data: LoanInput) => {
    try {
      const url = editingLoan ? `/api/loans/${editingLoan.id}` : "/api/loans"
      const method = editingLoan ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error("Failed to save loan")

      toast({
        title: "Success",
        description: `Loan ${editingLoan ? "updated" : "added"} successfully`,
      })

      setIsDialogOpen(false)
      setEditingLoan(null)
      fetchLoans()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save loan",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this loan?")) return

    try {
      const response = await fetch(`/api/loans/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete loan")

      toast({
        title: "Success",
        description: "Loan deleted successfully",
      })

      fetchLoans()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete loan",
        variant: "destructive",
      })
    }
  }

  const handlePayment = async (loanId: string, payment: LoanPaymentInput) => {
    try {
      const response = await fetch(`/api/loans/${loanId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payment),
      })

      if (!response.ok) throw new Error("Failed to record payment")

      fetchLoans()
    } catch (error) {
      throw error
    }
  }

  const filteredLoans = loans.filter((l) => {
    if (filterStatus === "all") return true
    return l.status === filterStatus
  })

  const totalOutstanding = loans
    .filter((l) => l.status !== "paid")
    .reduce((sum, l) => {
      const totalPaid = l.payments.reduce((pSum, p) => pSum + p.amount, 0)
      return sum + (l.amount - totalPaid)
    }, 0)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-6 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-64" />
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
            <HandCoins className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-primary" />
            Loans
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base md:text-lg">
            Track money you've lent to others
          </p>
        </div>
        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open)
            if (!open) setEditingLoan(null)
          }}
        >
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2 w-full sm:w-auto">
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">Add Loan</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">
                {editingLoan ? "Edit Loan" : "Add Loan"}
              </DialogTitle>
              <DialogDescription>
                {editingLoan
                  ? "Update the loan details below."
                  : "Enter the details for a new loan."}
              </DialogDescription>
            </DialogHeader>
            <LoanForm
              loan={editingLoan || undefined}
              onSubmit={handleSubmit}
              onCancel={() => {
                setIsDialogOpen(false)
                setEditingLoan(null)
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary and Filters */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="border-2 bg-linear-to-br from-yellow-50 to-yellow-100/50 dark:from-yellow-950/20 dark:to-yellow-900/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                  Total Outstanding
                </p>
                <p className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
                  {formatCurrency(totalOutstanding)}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <HandCoins className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>
      </div>

      {/* Loan Cards */}
      {filteredLoans.length === 0 ? (
        <Card className="border-2 border-dashed">
          <CardContent className="py-16 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                <HandCoins className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-semibold">No loans found</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add your first loan to get started!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLoans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              onEdit={(l) => {
                setEditingLoan(l)
                setIsDialogOpen(true)
              }}
              onDelete={handleDelete}
              onPayment={handlePayment}
            />
          ))}
        </div>
      )}
    </div>
  )
}
