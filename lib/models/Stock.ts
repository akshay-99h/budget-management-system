import mongoose, { Schema, Document } from "mongoose"

export interface IStock extends Document {
  id: string
  symbol: string
  name: string
  quantity: number
  purchasePrice: number
  currentPrice?: number
  purchaseDate: string
  broker?: string
  category: "equity" | "mutual-fund" | "etf" | "bonds" | "other"
  notes?: string
  userId: string
  createdAt: Date
  updatedAt: Date
}

const StockSchema = new Schema<IStock>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    symbol: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: 0,
    },
    currentPrice: {
      type: Number,
      min: 0,
    },
    purchaseDate: {
      type: String,
      required: true,
    },
    broker: {
      type: String,
    },
    category: {
      type: String,
      enum: ["equity", "mutual-fund", "etf", "bonds", "other"],
      default: "equity",
    },
    notes: {
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
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
)

StockSchema.index({ userId: 1, category: 1 })
StockSchema.index({ symbol: 1 })

export default mongoose.models.Stock || mongoose.model<IStock>("Stock", StockSchema)
