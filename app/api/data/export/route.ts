import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getTransactions, getBudgets, getLoans } from "@/lib/data/storage"

export async function GET(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "all"

    const data: any = {}

    if (type === "all" || type === "transactions") {
      data.transactions = await getTransactions(user.id)
    }

    if (type === "all" || type === "budgets") {
      data.budgets = await getBudgets(user.id)
    }

    if (type === "all" || type === "loans") {
      data.loans = await getLoans(user.id)
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

