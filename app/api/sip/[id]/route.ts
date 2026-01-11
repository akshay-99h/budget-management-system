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
    
    // Debug: Log what we receive
    console.log('PUT /api/sip/[id] - Received body:', { ...body, bankAccountId: body.bankAccountId })
    
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

    const updates: any = {
      ...validated,
      nextExecutionDate,
      ...(adjustments !== undefined && { adjustments }),
      ...(validated.currentNetValue !== undefined && { currentNetValue: validated.currentNetValue }),
    }
    
    // Always include bankAccountId if it's in the request body (check raw body first)
    // This ensures it's included even if validation filtered it out
    if ('bankAccountId' in body && typeof body.bankAccountId === 'string') {
      if (body.bankAccountId.length > 0) {
        updates.bankAccountId = body.bankAccountId
        console.log('PUT /api/sip/[id] - Setting bankAccountId:', body.bankAccountId)
      } else {
        // Empty string - this should not happen if frontend validation works
        console.error('PUT /api/sip/[id] - ERROR: bankAccountId is empty string in request body')
        // Don't update it - keep existing value by not including it in updates
      }
    } else if (validated.bankAccountId && validated.bankAccountId.length > 0) {
      // Fallback to validated if it passed validation
      updates.bankAccountId = validated.bankAccountId
      console.log('PUT /api/sip/[id] - Using validated bankAccountId:', validated.bankAccountId)
    } else {
      console.warn('PUT /api/sip/[id] - No valid bankAccountId in request, keeping existing value')
    }
    
    console.log('PUT /api/sip/[id] - Final updates object:', { ...updates, bankAccountId: updates.bankAccountId })

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

