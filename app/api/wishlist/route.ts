import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getWishlistItems, saveWishlist } from "@/lib/data/storage"
import { wishlistSchema } from "@/lib/validations"
import { v4 as uuidv4 } from "uuid"

export async function GET() {
  try {
    const user = await requireAuth()
    const items = await getWishlistItems(user.id)
    return NextResponse.json(items)
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
    const validated = wishlistSchema.parse(body)

    const item = {
      id: uuidv4(),
      ...validated,
      userId: user.id,
      createdAt: new Date().toISOString(),
    }

    await saveWishlist(user.id, item)
    return NextResponse.json(item, { status: 201 })
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
