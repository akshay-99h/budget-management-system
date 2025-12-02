import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getUserById } from "@/lib/data/storage"

export async function GET() {
  try {
    const user = await requireAuth()
    const userData = await getUserById(user.id)
    
    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Don't send password
    const { password, ...userWithoutPassword } = userData
    return NextResponse.json(userWithoutPassword)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

