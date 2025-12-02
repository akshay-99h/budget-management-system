"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { budgetSchema, type BudgetInput } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DEFAULT_CATEGORIES } from "@/lib/constants"
import { Budget } from "@/lib/types"
import { format } from "date-fns"

interface BudgetFormProps {
  budget?: Budget
  onSubmit: (data: BudgetInput) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function BudgetForm({
  budget,
  onSubmit,
  onCancel,
  isLoading = false,
}: BudgetFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: budget
      ? {
          category: budget.category,
          month: budget.month,
          limit: budget.limit,
        }
      : {
          month: format(new Date(), "yyyy-MM"),
        },
  })

  const expenseCategories = DEFAULT_CATEGORIES.filter((c) => c.type === "expense")

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={watch("category")}
          onValueChange={(value) => setValue("category", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {expenseCategories.map((cat) => (
              <SelectItem key={cat.name} value={cat.name}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-destructive">{errors.category.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="month">Month</Label>
        <Input
          id="month"
          type="month"
          {...register("month")}
          disabled={isLoading}
        />
        {errors.month && (
          <p className="text-sm text-destructive">{errors.month.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="limit">Budget Limit</Label>
        <Input
          id="limit"
          type="number"
          step="0.01"
          {...register("limit", { valueAsNumber: true })}
          disabled={isLoading}
        />
        {errors.limit && (
          <p className="text-sm text-destructive">{errors.limit.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : budget ? "Update" : "Create"} Budget
        </Button>
      </div>
    </form>
  )
}

