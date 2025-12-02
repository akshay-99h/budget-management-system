"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { transactionSchema, type TransactionInput } from "@/lib/validations"
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
import { Textarea } from "@/components/ui/textarea"
import { DEFAULT_CATEGORIES } from "@/lib/constants"
import { Transaction } from "@/lib/types"
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react"
import { useState } from "react"

interface TransactionFormProps {
  transaction?: Transaction
  onSubmit: (data: TransactionInput) => Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function TransactionForm({
  transaction,
  onSubmit,
  onCancel,
  isLoading = false,
}: TransactionFormProps) {
  const [selectedType, setSelectedType] = useState<"income" | "expense">(
    transaction?.type || "expense"
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: transaction
      ? {
          type: transaction.type,
          amount: transaction.amount,
          category: transaction.category,
          date: transaction.date,
          description: transaction.description,
        }
      : {
          type: "expense",
          date: new Date().toISOString().split("T")[0],
        },
  })

  const type = watch("type")
  const categories = DEFAULT_CATEGORIES.filter((c) => c.type === type)

  const handleTypeChange = (value: "income" | "expense") => {
    setSelectedType(value)
    setValue("type", value)
    setValue("category", "") // Reset category when type changes
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Type Selection */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">Transaction Type</Label>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => handleTypeChange("expense")}
            className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 sm:p-4 transition-all touch-manipulation ${
              selectedType === "expense"
                ? "border-red-500 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400"
                : "border-border hover:border-red-300 hover:bg-muted active:bg-muted"
            }`}
          >
            <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-medium text-sm sm:text-base">Expense</span>
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange("income")}
            className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 sm:p-4 transition-all touch-manipulation ${
              selectedType === "income"
                ? "border-green-500 bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
                : "border-border hover:border-green-300 hover:bg-muted active:bg-muted"
            }`}
          >
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="font-medium text-sm sm:text-base">Income</span>
          </button>
        </div>
        {errors.type && (
          <p className="text-sm text-destructive">{errors.type.message}</p>
        )}
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <Label htmlFor="amount" className="text-base font-semibold">
          Amount
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            ₹
          </span>
          <Input
            id="amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            className="pl-8 text-lg font-semibold h-12"
            {...register("amount", { valueAsNumber: true })}
            disabled={isLoading}
          />
        </div>
        {errors.amount && (
          <p className="text-sm text-destructive">{errors.amount.message}</p>
        )}
      </div>

      {/* Category */}
      <div className="space-y-2">
        <Label htmlFor="category" className="text-base font-semibold">
          Category
        </Label>
        <Select
          value={watch("category")}
          onValueChange={(value) => setValue("category", value)}
        >
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.name} value={cat.name} className="text-base">
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.category && (
          <p className="text-sm text-destructive">{errors.category.message}</p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date" className="text-base font-semibold">
          Date
        </Label>
        <Input
          id="date"
          type="date"
          className="h-12 text-base"
          {...register("date")}
          disabled={isLoading}
        />
        {errors.date && (
          <p className="text-sm text-destructive">{errors.date.message}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-semibold">
          Description <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="description"
          placeholder="Add a note about this transaction..."
          {...register("description")}
          disabled={isLoading}
          rows={3}
          className="text-base resize-none"
        />
        {errors.description && (
          <p className="text-sm text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="min-w-[100px]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="min-w-[100px] gap-2"
        >
          {isLoading ? (
            "Saving..."
          ) : (
            <>
              {transaction ? "Update" : "Add"} Transaction
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
