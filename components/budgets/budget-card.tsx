"use client"

import { Budget } from "@/lib/types"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Trash2, AlertCircle, CheckCircle2, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface BudgetCardProps {
  budget: Budget
  spent: number
  onDelete: (id: string) => void
}

export function BudgetCard({ budget, spent, onDelete }: BudgetCardProps) {
  const percentage = (spent / budget.limit) * 100
  const remaining = budget.limit - spent
  const isOver = percentage >= 100
  const isWarning = percentage >= 80 && percentage < 100

  return (
    <Card className="border-2 hover:shadow-lg transition-all hover:border-primary/50 group">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center shrink-0",
              isOver 
                ? "bg-red-100 dark:bg-red-900/30" 
                : isWarning 
                ? "bg-yellow-100 dark:bg-yellow-900/30"
                : "bg-green-100 dark:bg-green-900/30"
            )}>
              <Target className={cn(
                "h-6 w-6",
                isOver 
                  ? "text-red-600 dark:text-red-400" 
                  : isWarning 
                  ? "text-yellow-600 dark:text-yellow-400"
                  : "text-green-600 dark:text-green-400"
              )} />
            </div>
            <div>
              <CardTitle className="text-lg">{budget.category}</CardTitle>
              <CardDescription className="text-sm">
                Limit: {formatCurrency(budget.limit)}
              </CardDescription>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(budget.id)}
            className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Spent</span>
            <span className={cn(
              "text-lg font-bold",
              isOver && "text-red-600 dark:text-red-400",
              isWarning && "text-yellow-600 dark:text-yellow-400",
              !isOver && !isWarning && "text-green-600 dark:text-green-400"
            )}>
              {formatCurrency(spent)}
            </span>
          </div>
          <Progress
            value={Math.min(percentage, 100)}
            className={cn(
              "h-3",
              isOver && "[&>div]:bg-red-500",
              isWarning && "[&>div]:bg-yellow-500",
              !isOver && !isWarning && "[&>div]:bg-green-500"
            )}
          />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Remaining</span>
            <span className={cn(
              "text-lg font-bold",
              remaining < 0 && "text-red-600 dark:text-red-400",
              remaining >= 0 && !isWarning && "text-green-600 dark:text-green-400",
              remaining >= 0 && isWarning && "text-yellow-600 dark:text-yellow-400"
            )}>
              {formatCurrency(Math.max(0, remaining))}
            </span>
          </div>
        </div>
        <div className={cn(
          "flex items-center gap-2 p-3 rounded-lg text-sm font-medium",
          isOver && "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400",
          isWarning && !isOver && "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-700 dark:text-yellow-400",
          !isOver && !isWarning && "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
        )}>
          {isOver ? (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>Budget exceeded by {formatCurrency(Math.abs(remaining))}</span>
            </>
          ) : isWarning ? (
            <>
              <AlertCircle className="h-4 w-4" />
              <span>Approaching limit ({percentage.toFixed(0)}%)</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              <span>On track ({percentage.toFixed(0)}% used)</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
