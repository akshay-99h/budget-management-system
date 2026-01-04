import mongoose, { Schema, Document } from "mongoose"

export interface ISIPAdjustment {
  id: string
  date: string
  amount: number
  type: "withdrawal" | "deposit" | "adjustment"
  description?: string
}

export interface ISIP extends Document {
  id: string
  name: string
  amount: number
  frequency: "daily" | "weekly" | "monthly" | "yearly"
  startDate: string
  endDate?: string
  category: string
  description?: string
  isActive: boolean
  lastExecuted?: string
  nextExecutionDate: string
  currentNetValue?: number
  adjustments?: ISIPAdjustment[]
  userId: string
  createdAt: Date
}

const SIPSchema = new Schema<ISIP>(
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly", "yearly"],
      required: true,
    },
    startDate: {
      type: String,
      required: true,
    },
    endDate: {
      type: String,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastExecuted: {
      type: String,
    },
    nextExecutionDate: {
      type: String,
      required: true,
    },
    currentNetValue: {
      type: Number,
      min: 0,
    },
    adjustments: [
      {
        id: String,
        date: String,
        amount: Number,
        type: {
          type: String,
          enum: ["withdrawal", "deposit", "adjustment"],
        },
        description: String,
      },
    ],
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

SIPSchema.index({ userId: 1, isActive: 1 })
SIPSchema.index({ nextExecutionDate: 1, isActive: 1 })

export default mongoose.models.SIP || mongoose.model<ISIP>("SIP", SIPSchema)

