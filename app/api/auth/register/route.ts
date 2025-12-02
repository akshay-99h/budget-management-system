import { NextResponse } from "next/server"
import { registerSchema } from "@/lib/validations"
import { createUser } from "@/lib/auth"
import { getUserByEmail } from "@/lib/data/storage"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = registerSchema.parse(body)

    const existingUser = await getUserByEmail(validated.email)
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    const user = await createUser(validated.name, validated.email, validated.password)

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    )
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

