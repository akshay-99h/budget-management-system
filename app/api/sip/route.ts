import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getSIPs, saveSIP, updateSIP, deleteSIP } from "@/lib/data/storage"
import { sipSchema } from "@/lib/validations"
import { v4 as uuidv4 } from "uuid"
import { calculateNextExecutionDate } from "@/lib/utils/sip"
import { parseISO, isBefore } from "date-fns"

export async function GET() {
  try {
    const user = await requireAuth()
    const sips = await getSIPs(user.id)
    
    // Recalculate nextExecutionDate for all active SIPs to ensure they show future dates
    const updatedSips = await Promise.all(
      sips.map(async (sip) => {
        if (!sip.isActive) return sip
        
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const nextDate = parseISO(sip.nextExecutionDate)
        nextDate.setHours(0, 0, 0, 0)
        
        // If nextExecutionDate is in the past, recalculate it
        if (isBefore(nextDate, today)) {
          const recalculatedDate = calculateNextExecutionDate(
            sip.frequency,
            sip.lastExecuted,
            sip.startDate
          )
          
          // Update the SIP in the database if the date changed
          if (recalculatedDate !== sip.nextExecutionDate) {
            await updateSIP(user.id, sip.id, { nextExecutionDate: recalculatedDate })
            return { ...sip, nextExecutionDate: recalculatedDate }
          }
        }
        
        return sip
      })
    )
    
    return NextResponse.json(updatedSips)
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
    const validated = sipSchema.parse(body)

    const nextExecutionDate = calculateNextExecutionDate(
      validated.frequency,
      undefined,
      validated.startDate
    )

    // Ensure all adjustments have IDs
    const adjustments = validated.adjustments?.map((adj) => ({
      ...adj,
      id: adj.id || uuidv4(),
    })) || []

    const sip = {
      id: uuidv4(),
      ...validated,
      isActive: validated.isActive ?? true,
      nextExecutionDate,
      currentNetValue: validated.currentNetValue,
      adjustments,
      userId: user.id,
      createdAt: new Date().toISOString(),
    }

    await saveSIP(user.id, sip)
    return NextResponse.json(sip, { status: 201 })
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

