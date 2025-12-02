import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { updateTransaction, deleteTransaction, getTransactions } from "@/lib/data/storage"
import { transactionSchema } from "@/lib/validations"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const validated = transactionSchema.parse(body)
    const { id } = await params

    await updateTransaction(user.id, id, validated)
    const transactions = await getTransactions(user.id)
    const updated = transactions.find((t) => t.id === id)

    return NextResponse.json(updated)
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

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    await deleteTransaction(user.id, id)
    return NextResponse.json({ message: "Transaction deleted" })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

