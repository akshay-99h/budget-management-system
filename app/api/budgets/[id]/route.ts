import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { deleteBudget } from "@/lib/data/storage"

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    await deleteBudget(user.id, id)
    return NextResponse.json({ message: "Budget deleted" })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

