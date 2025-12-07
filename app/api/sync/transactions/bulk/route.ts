import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import {
  saveTransaction,
  updateTransaction,
  getTransactions,
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
              await saveTransaction(user.id, {
                id: record.id,
                ...validated,
                userId: user.id,
                createdAt: record.createdAt || new Date().toISOString(),
              })
            }

            synced.push(record.id)
          } catch (error: any) {
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

