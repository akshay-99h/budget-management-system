import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { updateTransaction, deleteTransaction, getTransactions, getBankAccountById, updateBankAccount } from "@/lib/data/storage"
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

    // Get existing transaction to reverse its balance change
    const transactions = await getTransactions(user.id)
    const existing = transactions.find((t) => t.id === id)
    if (!existing) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    // Reverse the old transaction's balance change
    const oldBankAccount = await getBankAccountById(user.id, existing.bankAccountId)
    if (oldBankAccount) {
      const oldBalanceChange = existing.type === "income" ? -existing.amount : existing.amount
      const oldNewBalance = oldBankAccount.balance + oldBalanceChange
      await updateBankAccount(user.id, existing.bankAccountId, { balance: oldNewBalance })
    }

    // Get the new bank account
    const newBankAccount = await getBankAccountById(user.id, validated.bankAccountId)
    if (!newBankAccount) {
      return NextResponse.json(
        { error: "Bank account not found" },
        { status: 404 }
      )
    }

    await updateTransaction(user.id, id, validated)

    // Apply the new transaction's balance change
    const newBalanceChange = validated.type === "income" ? validated.amount : -validated.amount
    const newNewBalance = newBankAccount.balance + newBalanceChange
    await updateBankAccount(user.id, validated.bankAccountId, { balance: newNewBalance })

    const updatedTransactions = await getTransactions(user.id)
    const updated = updatedTransactions.find((t) => t.id === id)

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

    // Get transaction to reverse its balance change
    const transactions = await getTransactions(user.id)
    const transaction = transactions.find((t) => t.id === id)
    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      )
    }

    // Reverse the transaction's balance change
    const bankAccount = await getBankAccountById(user.id, transaction.bankAccountId)
    if (bankAccount) {
      const balanceChange = transaction.type === "income" ? -transaction.amount : transaction.amount
      const newBalance = bankAccount.balance + balanceChange
      await updateBankAccount(user.id, transaction.bankAccountId, { balance: newBalance })
    }

    await deleteTransaction(user.id, id)
    return NextResponse.json({ message: "Transaction deleted" })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

