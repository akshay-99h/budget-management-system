"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loanSchema, type LoanInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loan } from "@/lib/types"
import { format } from "date-fns"

interface LoanFormProps {
  loan?: Loan
  onSubmit: (data: LoanInput) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function LoanForm({
  loan,
  onSubmit,
  onCancel,
  isLoading = false,
}: LoanFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoanInput>({
    resolver: zodResolver(loanSchema),
    defaultValues: loan
      ? {
          borrowerName: loan.borrowerName,
          amount: loan.amount,
          date: loan.date,
          dueDate: loan.dueDate,
          notes: loan.notes,
        }
      : {
          date: format(new Date(), "yyyy-MM-dd"),
        },
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="borrowerName">Borrower Name</Label>
        <Input
          id="borrowerName"
          type="text"
          {...register("borrowerName")}
          disabled={isLoading}
        />
        {errors.borrowerName && (
          <p className="text-sm text-destructive">{errors.borrowerName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Loan Amount</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          {...register("amount", { valueAsNumber: true })}
          disabled={isLoading}
        />
        {errors.amount && (
          <p className="text-sm text-destructive">{errors.amount.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date">Loan Date</Label>
        <Input
          id="date"
          type="date"
          {...register("date")}
          disabled={isLoading}
        />
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="dueDate">Due Date</Label>
        <Input
          id="dueDate"
          type="date"
          {...register("dueDate")}
          disabled={isLoading}
        />
        {errors.dueDate && (
          <p className="text-sm text-destructive">{errors.dueDate.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          {...register("notes")}
          disabled={isLoading}
          rows={3}
        />
        {errors.notes && (
          <p className="text-sm text-destructive">{errors.notes.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : loan ? "Update" : "Add"} Loan
        </Button>
      </div>
    </form>
  )
}

