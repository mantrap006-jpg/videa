import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["viewer", "user", "creator", "admin"],
      default: "viewer"
    },
    points: { type: Number, default: 0, min: 0 },
    subscription: {
      plan: { type: String, enum: ["free", "creator"], default: "free" },
      status: { type: String, enum: ["inactive", "active", "past_due", "cancelled"], default: "inactive" },
      expiresAt: { type: Date, default: null }
    }
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);