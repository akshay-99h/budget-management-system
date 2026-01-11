import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import {
  getSIPs,
  updateSIP,
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
    const sips = await getSIPs(user.id)

    const today = new Date().toISOString().split("T")[0]
    const executed: string[] = []
    const errors: { id: string; error: string }[] = []

    for (const sip of sips) {
      // Skip inactive SIPs
      if (!sip.isActive) continue

      // Skip if not due yet
      if (sip.nextExecutionDate > today) continue

      // Skip if ended
      if (sip.endDate && sip.endDate < today) {
        // Deactivate ended SIPs
        await updateSIP(user.id, sip.id, { isActive: false })
        continue
      }

      try {
        // Get bank account
        const bankAccount = await getBankAccountById(user.id, sip.bankAccountId)
        if (!bankAccount) {
          errors.push({ id: sip.id, error: "Bank account not found" })
          continue
        }

        // Calculate new balance
        const newBalance = bankAccount.balance - sip.amount

        // Create expense transaction (investment outflow)
        const transaction = {
          id: uuidv4(),
          type: "expense" as const,
          amount: sip.amount,
          category: sip.category,
          date: today,
          time: new Date().toTimeString().slice(0, 5),
          description: `${sip.name} - SIP Investment`,
          bankAccountId: sip.bankAccountId,
          accountBalanceAfter: newBalance,
          userId: user.id,
          createdAt: new Date().toISOString(),
        }

        await saveTransaction(user.id, transaction)

        // Update bank account balance
        await updateBankAccount(user.id, sip.bankAccountId, { balance: newBalance })

        // Calculate next execution date
        const nextExecutionDate = calculateNextExecutionDate(
          sip.nextExecutionDate,
          sip.frequency
        )

        // Update SIP
        await updateSIP(user.id, sip.id, {
          lastExecuted: today,
          nextExecutionDate,
        })

        executed.push(sip.id)
      } catch (error: any) {
        errors.push({ id: sip.id, error: error.message })
      }
    }

    return NextResponse.json({
      success: true,
      executed: executed.length,
      sipIds: executed,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
