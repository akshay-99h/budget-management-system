import { NextResponse } from "next/server"
import { getUsers } from "@/lib/data/storage"
import {
  getSubscriptions,
  updateSubscription,
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
    // Optional: Add authentication header check for security
    const authHeader = request.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const users = await getUsers()
    const today = new Date().toISOString().split("T")[0]

    let totalSubscriptionsExecuted = 0
    let totalSIPsExecuted = 0
    const errors: any[] = []

    // Process each user
    for (const user of users) {
      try {
        // Execute Subscriptions
        const subscriptions = await getSubscriptions(user.id)

        for (const subscription of subscriptions) {
          if (!subscription.isActive) continue
          if (subscription.nextExecutionDate > today) continue
          if (subscription.endDate && subscription.endDate < today) {
            await updateSubscription(user.id, subscription.id, { isActive: false })
            continue
          }

          try {
            const bankAccount = await getBankAccountById(user.id, subscription.bankAccountId)
            if (!bankAccount) continue

            // Create transaction
            const transaction = {
              id: uuidv4(),
              type: "expense" as const,
              amount: subscription.amount,
              category: subscription.category,
              date: today,
              time: new Date().toTimeString().slice(0, 5),
              description: `${subscription.name} - Subscription payment`,
              bankAccountId: subscription.bankAccountId,
              userId: user.id,
              createdAt: new Date().toISOString(),
            }

            await saveTransaction(user.id, transaction)
            await updateBankAccount(user.id, subscription.bankAccountId, {
              balance: bankAccount.balance - subscription.amount
            })

            const nextExecutionDate = calculateNextExecutionDate(
              subscription.nextExecutionDate,
              subscription.frequency
            )

            await updateSubscription(user.id, subscription.id, {
              lastExecuted: today,
              nextExecutionDate,
            })

            totalSubscriptionsExecuted++
          } catch (error: any) {
            errors.push({
              type: "subscription",
              id: subscription.id,
              userId: user.id,
              error: error.message
            })
          }
        }

        // Execute SIPs
        const sips = await getSIPs(user.id)

        for (const sip of sips) {
          if (!sip.isActive) continue
          if (sip.nextExecutionDate > today) continue
          if (sip.endDate && sip.endDate < today) {
            await updateSIP(user.id, sip.id, { isActive: false })
            continue
          }

          try {
            const bankAccount = await getBankAccountById(user.id, sip.bankAccountId)
            if (!bankAccount) continue

            // Create transaction
            const transaction = {
              id: uuidv4(),
              type: "expense" as const,
              amount: sip.amount,
              category: sip.category,
              date: today,
              time: new Date().toTimeString().slice(0, 5),
              description: `${sip.name} - SIP Investment`,
              bankAccountId: sip.bankAccountId,
              userId: user.id,
              createdAt: new Date().toISOString(),
            }

            await saveTransaction(user.id, transaction)
            await updateBankAccount(user.id, sip.bankAccountId, {
              balance: bankAccount.balance - sip.amount
            })

            const nextExecutionDate = calculateNextExecutionDate(
              sip.nextExecutionDate,
              sip.frequency
            )

            await updateSIP(user.id, sip.id, {
              lastExecuted: today,
              nextExecutionDate,
            })

            totalSIPsExecuted++
          } catch (error: any) {
            errors.push({
              type: "sip",
              id: sip.id,
              userId: user.id,
              error: error.message
            })
          }
        }
      } catch (error: any) {
        errors.push({
          type: "user",
          userId: user.id,
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      executedAt: new Date().toISOString(),
      subscriptionsExecuted: totalSubscriptionsExecuted,
      sipsExecuted: totalSIPsExecuted,
      totalUsers: users.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

// Allow GET for testing (remove in production or add auth)
export async function GET(request: Request) {
  return POST(request)
}
