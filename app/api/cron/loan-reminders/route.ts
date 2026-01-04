import { NextResponse } from "next/server"
import { getLoans } from "@/lib/data/storage"
import { getUserById } from "@/lib/data/storage"
import {
  sendLoanReminderToBorrower,
  sendLoanReminderToLender,
} from "@/lib/email/nodemailer"
import { format, addDays, parseISO, isBefore, differenceInDays } from "date-fns"

// This endpoint should be called by a cron job service (like Vercel Cron, GitHub Actions, etc.)
// For security, you should add a secret token check
export async function GET(request: Request) {
  try {
    // Check for secret token to prevent unauthorized access
    const authHeader = request.headers.get("authorization")
    const secretToken = process.env.CRON_SECRET_TOKEN

    // Require authentication token - fail if not present or incorrect
    if (!secretToken || authHeader !== `Bearer ${secretToken}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get all active loans
    const allLoans = await getAllActiveLoans()
    const remindersSent = []

    for (const loan of allLoans) {
      if (!loan.reminderEnabled || loan.status === "paid") continue

      const dueDate = parseISO(loan.dueDate)
      const today = new Date()
      const daysUntilDue = differenceInDays(dueDate, today)

      // Send reminder if due date is within 7 days and we haven't sent one in the last 24 hours
      if (daysUntilDue >= 0 && daysUntilDue <= 7) {
        const lastReminder = loan.lastReminderSent
          ? parseISO(loan.lastReminderSent)
          : null

        // Only send if we haven't sent a reminder in the last 24 hours
        if (!lastReminder || differenceInDays(today, lastReminder) >= 1) {
          const lender = await getUserById(loan.userId)
          if (!lender) continue

          // Send reminder to lender
          if (lender.email) {
            await sendLoanReminderToLender(
              lender.email,
              lender.name,
              loan.borrowerName,
              loan.amount,
              loan.dueDate,
              loan.id
            )
          }

          // Send reminder to borrower if email is provided
          if (loan.borrowerEmail) {
            await sendLoanReminderToBorrower(
              loan.borrowerEmail,
              loan.borrowerName,
              lender.name,
              loan.amount,
              loan.dueDate,
              loan.id
            )
          }

          // Update last reminder sent date
          const { updateLoan } = await import("@/lib/data/storage")
          await updateLoan(loan.userId, loan.id, {
            lastReminderSent: format(today, "yyyy-MM-dd"),
          })

          remindersSent.push({
            loanId: loan.id,
            borrowerName: loan.borrowerName,
            lenderEmail: lender.email,
            borrowerEmail: loan.borrowerEmail,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      remindersSent: remindersSent.length,
      details: remindersSent,
    })
  } catch (error: any) {
    const { logger } = await import("@/lib/utils/logger")
    logger.error("Error sending loan reminders", error)
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}

async function getAllActiveLoans() {
  // This is a helper function to get all loans from all users
  // In a production system, you might want to optimize this
  const UserModel = (await import("@/lib/models/User")).default
  const LoanModel = (await import("@/lib/models/Loan")).default
  const connectDB = (await import("@/lib/db/mongodb")).default

  await connectDB()

  const users = await UserModel.find({}).lean()
  const allLoans = []

  for (const user of users) {
    const loans = await LoanModel.find({ userId: user.id }).lean()
    allLoans.push(
      ...loans.map((l) => ({
        id: l.id,
        borrowerName: l.borrowerName,
        borrowerEmail: l.borrowerEmail,
        amount: l.amount,
        date: l.date,
        dueDate: l.dueDate,
        status: l.status,
        payments: l.payments,
        notes: l.notes,
        userId: l.userId,
        reminderEnabled: l.reminderEnabled ?? true,
        lastReminderSent: l.lastReminderSent,
      }))
    )
  }

  return allLoans
}

