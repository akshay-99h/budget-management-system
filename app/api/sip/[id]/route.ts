import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { updateSIP, deleteSIP, getSIPById } from "@/lib/data/storage"
import { sipSchema } from "@/lib/validations"
import { calculateNextExecutionDate } from "@/lib/utils/sip"
import { v4 as uuidv4 } from "uuid"

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const body = await request.json()
    const validated = sipSchema.partial().parse(body)

    const existing = await getSIPById(user.id, id)
    if (!existing) {
      return NextResponse.json({ error: "SIP not found" }, { status: 404 })
    }

    // Recalculate next execution date if frequency or dates changed
    let nextExecutionDate = existing.nextExecutionDate
    if (validated.frequency || validated.startDate || validated.lastExecuted) {
      nextExecutionDate = calculateNextExecutionDate(
        validated.frequency || existing.frequency,
        validated.lastExecuted || existing.lastExecuted,
        validated.startDate || existing.startDate
      )
    }

    // Ensure all adjustments have IDs
    const adjustments = validated.adjustments
      ? validated.adjustments.map((adj) => ({
          ...adj,
          id: adj.id || uuidv4(),
        }))
      : undefined

    const updates = {
      ...validated,
      nextExecutionDate,
      ...(adjustments !== undefined && { adjustments }),
      ...(validated.currentNetValue !== undefined && { currentNetValue: validated.currentNetValue }),
    }

    await updateSIP(user.id, id, updates)
    const updated = await getSIPById(user.id, id)
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
    await deleteSIP(user.id, id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

