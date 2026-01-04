import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getBankAccounts, saveBankAccount } from "@/lib/data/storage"
import { bankAccountSchema } from "@/lib/validations"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  try {
    const user = await requireAuth()
    const accounts = await getBankAccounts(user.id)
    return NextResponse.json(accounts)
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
    const validated = bankAccountSchema.parse(body)

    const account = {
      id: uuidv4(),
      ...validated,
      userId: user.id,
      createdAt: new Date().toISOString(),
    }

    await saveBankAccount(user.id, account)
    return NextResponse.json(account, { status: 201 })
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
