import mongoose, { Schema, Document } from "mongoose"

export interface ITransaction extends Document {
  id: string
  type: "income" | "expense"
  amount: number
  category: string
  date: string
  description?: string
  userId: string
  createdAt: Date
}

const TransactionSchema = new Schema<ITransaction>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: ["income", "expense"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    description: {
      type: String,
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

TransactionSchema.index({ userId: 1, date: -1 })

export default mongoose.models.Transaction || mongoose.model<ITransaction>("Transaction", TransactionSchema)

