import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { updateWishlist, deleteWishlist, getWishlistById } from "@/lib/data/storage"
import { wishlistSchema } from "@/lib/validations"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const { id } = await params
    const item = await getWishlistById(user.id, id)

    if (!item) {
      return NextResponse.json({ error: "Wishlist item not found" }, { status: 404 })
    }

    return NextResponse.json(item)
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
    const validated = wishlistSchema.partial().parse(body)

    await updateWishlist(user.id, id, validated)
    const updated = await getWishlistById(user.id, id)
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
    await deleteWishlist(user.id, id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
