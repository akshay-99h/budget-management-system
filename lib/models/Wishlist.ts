import mongoose, { Schema, Document } from "mongoose"

export interface IWishlist extends Document {
  id: string
  itemName: string
  description?: string
  estimatedPrice: number
  priority: "low" | "medium" | "high"
  category?: string
  link?: string
  isPurchased: boolean
  purchasedDate?: string
  actualPrice?: number
  userId: string
  createdAt: Date
}

const WishlistSchema = new Schema<IWishlist>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    itemName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    estimatedPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    category: {
      type: String,
    },
    link: {
      type: String,
    },
    isPurchased: {
      type: Boolean,
      default: false,
    },
    purchasedDate: {
      type: String,
    },
    actualPrice: {
      type: Number,
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

WishlistSchema.index({ userId: 1, isPurchased: 1 })
WishlistSchema.index({ userId: 1, priority: 1 })

export default mongoose.models.Wishlist ||
  mongoose.model<IWishlist>("Wishlist", WishlistSchema)
