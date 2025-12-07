import mongoose, { Schema, Document } from "mongoose"

export interface ILoan extends Document {
  id: string
  borrowerName: string
  borrowerEmail?: string
  amount: number
  date: string
  dueDate: string
  status: "active" | "paid" | "overdue"
  payments: Array<{
    date: string
    amount: number
  }>
  notes?: string
  userId: string
  reminderEnabled: boolean
  lastReminderSent?: string
}

const LoanSchema = new Schema<ILoan>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    borrowerName: {
      type: String,
      required: true,
    },
    borrowerEmail: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    dueDate: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "paid", "overdue"],
      default: "active",
    },
    payments: [
      {
        date: {
          type: String,
          required: true,
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    notes: {
      type: String,
    },
    reminderEnabled: {
      type: Boolean,
      default: true,
    },
    lastReminderSent: {
      type: String,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    _id: false,
  }
)

LoanSchema.index({ userId: 1, status: 1 })

export default mongoose.models.Loan || mongoose.model<ILoan>("Loan", LoanSchema)

