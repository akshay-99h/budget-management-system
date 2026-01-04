import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getTransactions, saveTransaction, getBankAccountById, updateBankAccount } from "@/lib/data/storage"
import { transactionSchema } from "@/lib/validations"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  try {
    const user = await requireAuth()
    const transactions = await getTransactions(user.id)
    return NextResponse.json(transactions)
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
    const validated = transactionSchema.parse(body)

    // Get the bank account
    const bankAccount = await getBankAccountById(user.id, validated.bankAccountId)
    if (!bankAccount) {
      return NextResponse.json(
        { error: "Bank account not found" },
        { status: 404 }
      )
    }

    const transaction = {
      id: uuidv4(),
      ...validated,
      userId: user.id,
      createdAt: new Date().toISOString(),
    }

    await saveTransaction(user.id, transaction)

    // Update bank account balance
    const balanceChange = validated.type === "income" ? validated.amount : -validated.amount
    const newBalance = bankAccount.balance + balanceChange
    await updateBankAccount(user.id, validated.bankAccountId, { balance: newBalance })

    return NextResponse.json(transaction, { status: 201 })
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

