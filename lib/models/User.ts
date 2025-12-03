import mongoose, { Schema, Document } from "mongoose"

export interface IUser extends Document {
  id: string
  name: string
  email: string
  password: string
  createdAt: Date
}

const UserSchema = new Schema<IUser>(
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
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
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

UserSchema.index({ email: 1 })

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema)

