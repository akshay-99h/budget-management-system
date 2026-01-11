import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import {
  getSubscriptions,
  updateSubscription,
  saveTransaction,
  getBankAccountById,
  updateBankAccount
} from "@/lib/data/storage"
import { addDays, addWeeks, addMonths, addYears } from "date-fns"
import { v4 as uuidv4 } from "uuid"

function calculateNextExecutionDate(
  currentDate: string,
  frequency: "daily" | "weekly" | "monthly" | "yearly"
): string {
  const current = new Date(currentDate)
  let nextDate: Date

  switch (frequency) {
    case "daily":
      nextDate = addDays(current, 1)
      break
    case "weekly":
      nextDate = addWeeks(current, 1)
      break
    case "monthly":
      nextDate = addMonths(current, 1)
      break
    case "yearly":
      nextDate = addYears(current, 1)
      break
  }

  return nextDate.toISOString().split("T")[0]
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const subscriptions = await getSubscriptions(user.id)

    const today = new Date().toISOString().split("T")[0]
    const executed: string[] = []
    const errors: { id: string; error: string }[] = []

    for (const subscription of subscriptions) {
      // Skip inactive subscriptions
      if (!subscription.isActive) continue

      // Skip if not due yet
      if (subscription.nextExecutionDate > today) continue

      // Skip if ended
      if (subscription.endDate && subscription.endDate < today) {
        // Deactivate ended subscriptions
        await updateSubscription(user.id, subscription.id, { isActive: false })
        continue
      }

      try {
        // Get bank account
        const bankAccount = await getBankAccountById(user.id, subscription.bankAccountId)
        if (!bankAccount) {
          errors.push({ id: subscription.id, error: "Bank account not found" })
          continue
        }

        // Calculate new balance
        const newBalance = bankAccount.balance - subscription.amount

        // Create expense transaction
        const transaction = {
          id: uuidv4(),
          type: "expense" as const,
          amount: subscription.amount,
          category: subscription.category,
          date: today,
          time: new Date().toTimeString().slice(0, 5),
          description: `${subscription.name} - Subscription payment`,
          bankAccountId: subscription.bankAccountId,
          accountBalanceAfter: newBalance,
          userId: user.id,
          createdAt: new Date().toISOString(),
        }

        await saveTransaction(user.id, transaction)

        // Update bank account balance
        await updateBankAccount(user.id, subscription.bankAccountId, { balance: newBalance })

        // Calculate next execution date
        const nextExecutionDate = calculateNextExecutionDate(
          subscription.nextExecutionDate,
          subscription.frequency
        )

        // Update subscription
        await updateSubscription(user.id, subscription.id, {
          lastExecuted: today,
          nextExecutionDate,
        })

        executed.push(subscription.id)
      } catch (error: any) {
        errors.push({ id: subscription.id, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      executed: executed.length,
      subscriptionIds: executed,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
