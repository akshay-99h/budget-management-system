"use client"

import { Loan } from "@/lib/types"
import { formatCurrency, formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus, AlertCircle, CheckCircle2, Clock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loanPaymentSchema, type LoanPaymentInput } from "@/lib/validations"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface LoanCardProps {
  loan: Loan
  onEdit: (loan: Loan) => void
  onDelete: (id: string) => void
  onPayment: (loanId: string, payment: LoanPaymentInput) => Promise<void>
}

export function LoanCard({ loan, onEdit, onDelete, onPayment }: LoanCardProps) {
  const { toast } = useToast()
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false)
  const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0)
  const remaining = loan.amount - totalPaid
  const isFullyPaid = remaining <= 0

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoanPaymentInput>({
    resolver: zodResolver(loanPaymentSchema),
    defaultValues: {
      date: new Date().toISOString().split("T")[0],
    },
  })

  const handlePaymentSubmit = async (data: LoanPaymentInput) => {
    try {
      await onPayment(loan.id, data)
      reset()
      setIsPaymentDialogOpen(false)
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      })
    }
  }

  const getStatusBadge = () => {
    switch (loan.status) {
      case "paid":
        return (
          <Badge className="bg-green-500">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        )
      case "overdue":
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Overdue
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Active
          </Badge>
        )
    }
  }

  return (
    <>
      <Card className="border-2 hover:shadow-lg transition-all hover:border-primary/50 group">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className={cn(
                "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
                loan.status === "paid" 
                  ? "bg-green-100 dark:bg-green-900/30"
                  : loan.status === "overdue"
                  ? "bg-red-100 dark:bg-red-900/30"
                  : "bg-yellow-100 dark:bg-yellow-900/30"
              )}>
                {loan.status === "paid" ? (
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : loan.status === "overdue" ? (
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                ) : (
                  <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-lg truncate">{loan.borrowerName}</CardTitle>
                <CardDescription className="text-sm">
                  {formatDate(loan.date)} • Due: {formatDate(loan.dueDate)}
                </CardDescription>
              </div>
            </div>
            <div className="shrink-0">
              {getStatusBadge()}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Loan Amount</span>
              <span className="text-lg font-bold">{formatCurrency(loan.amount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Total Paid</span>
              <span className="text-lg font-bold text-green-600 dark:text-green-400">
                {formatCurrency(totalPaid)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium text-muted-foreground">Remaining</span>
              <span
                className={cn(
                  "text-lg font-bold",
                  remaining <= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}
              >
                {formatCurrency(Math.max(0, remaining))}
              </span>
            </div>
          </div>

          {loan.payments.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-semibold">Payment History</p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {loan.payments.map((payment, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center text-sm p-2 rounded bg-muted/50"
                  >
                    <span className="text-muted-foreground">{formatDate(payment.date)}</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loan.notes && (
            <p className="text-sm text-muted-foreground">{loan.notes}</p>
          )}

          <div className="flex gap-2 pt-2 border-t">
            {!isFullyPaid && (
              <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 gap-2">
                    <Plus className="h-4 w-4" />
                    Add Payment
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                      Record a payment for this loan.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmit(handlePaymentSubmit)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Payment Amount</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        {...register("amount", { valueAsNumber: true })}
                      />
                      {errors.amount && (
                        <p className="text-sm text-destructive">{errors.amount.message}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Payment Date</Label>
                      <Input id="date" type="date" {...register("date")} />
                      {errors.date && (
                        <p className="text-sm text-destructive">{errors.date.message}</p>
                      )}
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsPaymentDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Record Payment</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(loan)}
              className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(loan.id)}
              className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

