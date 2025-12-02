import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getBudgets, saveBudget } from "@/lib/data/storage"
import { budgetSchema } from "@/lib/validations"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  try {
    const user = await requireAuth()
    const budgets = await getBudgets(user.id)
    return NextResponse.json(budgets)
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
    const validated = budgetSchema.parse(body)

    const budget = {
      id: uuidv4(),
      ...validated,
      userId: user.id,
    }

    await saveBudget(user.id, budget)
    return NextResponse.json(budget, { status: 201 })
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

