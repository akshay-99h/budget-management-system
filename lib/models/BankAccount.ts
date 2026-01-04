import mongoose, { Schema, Document } from "mongoose"

export interface IBankAccount extends Document {
  id: string
  name: string
  accountNumber?: string
  accountType: "checking" | "savings" | "credit" | "cash"
  balance: number
  currency: string
  isDefault: boolean
  userId: string
  createdAt: Date
}

const BankAccountSchema = new Schema<IBankAccount>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
    },
    accountType: {
      type: String,
      enum: ["checking", "savings", "credit", "cash"],
      default: "checking",
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
)

BankAccountSchema.index({ userId: 1, isDefault: 1 })

export default mongoose.models.BankAccount ||
  mongoose.model<IBankAccount>("BankAccount", BankAccountSchema)
