import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import {
  saveTransaction,
  updateTransaction,
  getTransactions,
  getBankAccountById,
  updateBankAccount,
} from "@/lib/data/storage"
import { transactionSchema } from "@/lib/validations"
import { Transaction } from "@/lib/types"

interface BulkSyncRecord extends Transaction {
  _version?: number
  _lastModified?: number
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { records } = body as { records: BulkSyncRecord[] }

    if (!Array.isArray(records)) {
      return NextResponse.json(
        { error: "Records must be an array" },
        { status: 400 }
      )
    }

    const synced: string[] = []
    const errors: Array<{ id: string; error: string }> = []

    // Process records in batches to avoid overloading
    const BATCH_SIZE = 10
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map(async (record) => {
          try {
            // Validate the record
            const validated = transactionSchema.parse({
              type: record.type,
              amount: record.amount,
              category: record.category,
              date: record.date,
              description: record.description,
              bankAccountId: record.bankAccountId,
            })

            // Check if transaction exists
            const existing = await getTransactions(user.id)
            const existingRecord = existing.find((t) => t.id === record.id)

            if (existingRecord) {
              // Update if server version is older or doesn't exist
              const serverVersion = (existingRecord as any)._version || 0
              const clientVersion = record._version || 0

              if (clientVersion > serverVersion) {
                await updateTransaction(user.id, record.id, {
                  ...validated,
                  createdAt: record.createdAt || new Date().toISOString(),
                })
              }
            } else {
              // Create new transaction
              const newTransaction = {
                id: record.id,
                ...validated,
                userId: user.id,
                createdAt: record.createdAt || new Date().toISOString(),
              }

              console.log("[BulkSync] Creating new transaction:", newTransaction.id)
              await saveTransaction(user.id, newTransaction)
              console.log("[BulkSync] Transaction saved successfully")

              // Update bank account balance
              const bankAccount = await getBankAccountById(user.id, validated.bankAccountId)
              if (bankAccount) {
                console.log("[BulkSync] Updating bank account balance for:", validated.bankAccountId)
                const balanceChange = validated.type === "income" ? validated.amount : -validated.amount
                const newBalance = bankAccount.balance + balanceChange
                await updateBankAccount(user.id, validated.bankAccountId, { balance: newBalance })
                console.log("[BulkSync] Bank account balance updated to:", newBalance)
              } else {
                console.error("[BulkSync] Bank account not found:", validated.bankAccountId)
                throw new Error(`Bank account not found: ${validated.bankAccountId}`)
              }
            }

            synced.push(record.id)
            console.log("[BulkSync] Transaction synced successfully:", record.id)
          } catch (error: any) {
            console.error("[BulkSync] Error syncing transaction:", record.id, error)
            errors.push({
              id: record.id,
              error: error.message || "Failed to sync transaction",
            })
          }
        })
      )

      // Small delay between batches to prevent DB overload
      if (i + BATCH_SIZE < records.length) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    return NextResponse.json({
      success: errors.length === 0,
      synced,
      errors,
      total: records.length,
      syncedCount: synced.length,
      errorCount: errors.length,
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

