import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { updateSubscription, deleteSubscription } from "@/lib/data/storage"
import { subscriptionSchema } from "@/lib/validations"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const validated = subscriptionSchema.parse(body)
    const { id } = await params

    await updateSubscription(user.id, id, validated)
    return NextResponse.json({ message: "Subscription updated successfully" })
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

    await deleteSubscription(user.id, id)
    return NextResponse.json({ message: "Subscription deleted successfully" })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
