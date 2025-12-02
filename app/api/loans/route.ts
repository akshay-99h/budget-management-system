import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getLoans, saveLoan } from "@/lib/data/storage"
import { loanSchema } from "@/lib/validations"
import { v4 as uuidv4 } from "uuid"
import { parseISO, isAfter } from "date-fns"

export async function GET() {
  try {
    const user = await requireAuth()
    const loans = await getLoans(user.id)
    
    // Update loan statuses based on due dates and payments
    const updatedLoans = loans.map((loan) => {
      const totalPaid = loan.payments.reduce((sum, p) => sum + p.amount, 0)
      const isFullyPaid = totalPaid >= loan.amount
      const dueDate = parseISO(loan.dueDate)
      const isOverdue = !isFullyPaid && isAfter(new Date(), dueDate)

      let status: "active" | "paid" | "overdue" = loan.status
      if (isFullyPaid) {
        status = "paid"
      } else if (isOverdue) {
        status = "overdue"
      } else {
        status = "active"
      }

      return { ...loan, status }
    })

    return NextResponse.json(updatedLoans)
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
    const validated = loanSchema.parse(body)

    const loan = {
      id: uuidv4(),
      ...validated,
      status: "active" as const,
      payments: [],
      userId: user.id,
    }

    await saveLoan(user.id, loan)
    return NextResponse.json(loan, { status: 201 })
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

