import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { updateBankAccount, deleteBankAccount, getBankAccountById } from "@/lib/data/storage"
import { bankAccountSchema } from "@/lib/validations"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const account = await getBankAccountById(user.id, id)

    if (!account) {
      return NextResponse.json({ error: "Bank account not found" }, { status: 404 })
    }

    return NextResponse.json(account)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const validated = bankAccountSchema.partial().parse(body)

    await updateBankAccount(user.id, id, validated)
    const updated = await getBankAccountById(user.id, id)
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
    await deleteBankAccount(user.id, id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
