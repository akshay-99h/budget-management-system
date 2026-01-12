import mongoose, { Schema, Document } from "mongoose"

export interface IBudget extends Document {
  id: string
  category: string
  month: string
  limit: number
  userId: string
  isSIPBudget?: boolean // If true, only SIP transactions count against this budget
}

const BudgetSchema = new Schema<IBudget>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    category: {
      type: String,
      required: true,
    },
    month: {
      type: String,
      required: true,
    },
    limit: {
      type: Number,
      required: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    isSIPBudget: {
      type: Boolean,
      default: false,
    },
  },
  {
    _id: false,
  }
)

BudgetSchema.index({ userId: 1, month: 1, category: 1 }, { unique: true })

export default mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema)

