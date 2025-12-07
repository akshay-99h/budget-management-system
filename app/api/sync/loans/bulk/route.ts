import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { saveLoan, updateLoan, getLoans } from "@/lib/data/storage"
import { loanSchema } from "@/lib/validations"
import { Loan } from "@/lib/types"

interface BulkSyncRecord extends Loan {
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

    const BATCH_SIZE = 10
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map(async (record) => {
          try {
            const validated = loanSchema.parse({
              borrowerName: record.borrowerName,
              amount: record.amount,
              date: record.date,
              dueDate: record.dueDate,
              status: record.status,
              payments: record.payments || [],
              notes: record.notes,
            })

            const existing = await getLoans(user.id)
            const existingRecord = existing.find((l) => l.id === record.id)

            if (existingRecord) {
              const serverVersion = (existingRecord as any)._version || 0
              const clientVersion = record._version || 0

              if (clientVersion > serverVersion) {
                await updateLoan(user.id, record.id, validated)
              }
            } else {
              await saveLoan(user.id, {
                id: record.id,
                ...validated,
                userId: user.id,
              })
            }

            synced.push(record.id)
          } catch (error: any) {
            errors.push({
              id: record.id,
              error: error.message || "Failed to sync loan",
            })
          }
        })
      )

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

