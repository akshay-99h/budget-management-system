import mongoose from "mongoose"

const SubscriptionSchema = new mongoose.Schema(
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
      default: null,
    },
    category: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastExecuted: {
      type: String,
      default: null,
    },
    nextExecutionDate: {
      type: String,
      required: true,
    },
    bankAccountId: {
      type: String,
      required: true,
    },
    reminderEnabled: {
      type: Boolean,
      default: true,
    },
    reminderDaysBefore: {
      type: Number,
      default: 3,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
  },
  { _id: false, timestamps: true }
)

const SubscriptionModel =
  mongoose.models.Subscription || mongoose.model("Subscription", SubscriptionSchema)

export default SubscriptionModel
