import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getStocks, saveStock, updateStock, deleteStock } from "@/lib/data/storage"
import { stockSchema } from "@/lib/validations"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  try {
    const user = await requireAuth()
    const stocks = await getStocks(user.id)
    return NextResponse.json(stocks)
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
    const validated = stockSchema.parse(body)

    const stock = {
      id: uuidv4(),
      ...validated,
      userId: user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await saveStock(user.id, stock)
    return NextResponse.json(stock, { status: 201 })
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
