import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getStockById, updateStock, deleteStock } from "@/lib/data/storage"
import { stockSchema } from "@/lib/validations"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const stock = await getStockById(user.id, id)

    if (!stock) {
      return NextResponse.json({ error: "Stock not found" }, { status: 404 })
    }

    return NextResponse.json(stock)
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
    const validated = stockSchema.partial().parse(body)

    await updateStock(user.id, id, validated)
    const updatedStock = await getStockById(user.id, id)

    return NextResponse.json(updatedStock)
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    if (error.message === "Stock not found") {
      return NextResponse.json({ error: error.message }, { status: 404 })
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
    await deleteStock(user.id, id)
    return NextResponse.json({ message: "Stock deleted successfully" })
  } catch (error: any) {
    if (error.message === "Stock not found") {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
