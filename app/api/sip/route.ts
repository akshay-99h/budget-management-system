import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getSIPs, saveSIP, updateSIP, deleteSIP } from "@/lib/data/storage"
import { sipSchema } from "@/lib/validations"
import { v4 as uuidv4 } from "uuid"
import { calculateNextExecutionDate } from "@/lib/utils/sip"

export async function GET() {
  try {
    const user = await requireAuth()
    const sips = await getSIPs(user.id)
    return NextResponse.json(sips)
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

    const sip = {
      id: uuidv4(),
      ...validated,
      isActive: validated.isActive ?? true,
      nextExecutionDate,
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

