import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getSubscriptions, saveSubscription } from "@/lib/data/storage"
import { subscriptionSchema } from "@/lib/validations"
import { v4 as uuidv4 } from "uuid"
import { addDays, addWeeks, addMonths, addYears } from "date-fns"

function calculateNextExecutionDate(
  startDate: string,
  frequency: "daily" | "weekly" | "monthly" | "yearly"
): string {
  const start = new Date(startDate)
  const now = new Date()

  if (start > now) {
    return startDate
  }

  let nextDate = new Date(start)

  while (nextDate <= now) {
    switch (frequency) {
      case "daily":
        nextDate = addDays(nextDate, 1)
        break
      case "weekly":
        nextDate = addWeeks(nextDate, 1)
        break
      case "monthly":
        nextDate = addMonths(nextDate, 1)
        break
      case "yearly":
        nextDate = addYears(nextDate, 1)
        break
    }
  }

  return nextDate.toISOString().split("T")[0]
}

export async function GET() {
  try {
    const user = await requireAuth()
    const subscriptions = await getSubscriptions(user.id)
    return NextResponse.json(subscriptions)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const validated = subscriptionSchema.parse(body)

    const nextExecutionDate = calculateNextExecutionDate(
      validated.startDate,
      validated.frequency
    )

    const subscription = {
      id: uuidv4(),
      ...validated,
      isActive: validated.isActive ?? true,
      nextExecutionDate,
      reminderEnabled: validated.reminderEnabled ?? true,
      reminderDaysBefore: validated.reminderDaysBefore ?? 3,
      userId: user.id,
      createdAt: new Date().toISOString(),
    }

    await saveSubscription(user.id, subscription)
    return NextResponse.json(subscription, { status: 201 })
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
