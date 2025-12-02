import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getLoans, updateLoan } from "@/lib/data/storage"
import { loanPaymentSchema } from "@/lib/validations"
import { parseISO, isAfter } from "date-fns"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const validated = loanPaymentSchema.parse(body)
    const { id } = await params

    const loans = await getLoans(user.id)
    const loan = loans.find((l) => l.id === id)

    if (!loan) {
      return NextResponse.json({ error: "Loan not found" }, { status: 404 })
    }

    const updatedPayments = [...loan.payments, validated]
    const totalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0)
    const dueDate = parseISO(loan.dueDate)
    const isFullyPaid = totalPaid >= loan.amount
    const isOverdue = !isFullyPaid && isAfter(new Date(), dueDate)

    let status: "active" | "paid" | "overdue" = loan.status
    if (isFullyPaid) {
      status = "paid"
    } else if (isOverdue) {
      status = "overdue"
    } else {
      status = "active"
    }

    await updateLoan(user.id, id, {
      payments: updatedPayments,
      status,
    })

    const updatedLoans = await getLoans(user.id)
    const updated = updatedLoans.find((l) => l.id === id)

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

