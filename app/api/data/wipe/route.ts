import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import {
  deleteTransactionsByMonth,
  deleteTransactionsByYear,
  deleteBudgetsByMonth,
  deleteBudgetsByYear,
  deleteAllTransactions,
  deleteAllBudgets,
  deleteAllLoans,
  deleteUser
} from "@/lib/data/storage"

export async function DELETE(request: Request) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") // "month", "year", "all"
    const month = searchParams.get("month") // "yyyy-MM"
    const year = searchParams.get("year") // "yyyy"

    if (type === "month" && month) {
      // Delete all data for a specific month
      await Promise.all([
        deleteTransactionsByMonth(user.id, month),
        deleteBudgetsByMonth(user.id, month),
      ])

      return NextResponse.json({
        message: `Data for ${month} deleted successfully`
      })
    }

    if (type === "year" && year) {
      // Delete all data for a specific year
      await Promise.all([
        deleteTransactionsByYear(user.id, year),
        deleteBudgetsByYear(user.id, year),
      ])

      return NextResponse.json({
        message: `Data for ${year} deleted successfully`
      })
    }

    if (type === "all") {
      // Delete all user data
      await Promise.all([
        deleteAllTransactions(user.id),
        deleteAllBudgets(user.id),
        deleteAllLoans(user.id),
      ])

      return NextResponse.json({
        message: "All data deleted successfully"
      })
    }

    if (type === "account") {
      // Delete user account and all associated data
      await deleteUser(user.id)

      return NextResponse.json({
        message: "Account deleted successfully"
      })
    }

    return NextResponse.json(
      { error: "Invalid wipe type" },
      { status: 400 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
