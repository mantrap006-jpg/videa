import mongoose from "mongoose";

const WithdrawalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  points: { type: Number, required: true, min: 100 },
  amountRwf: { type: Number, required: true, min: 100 },
  phone: { type: String, required: true, trim: true },
  network: { type: String, required: true, trim: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  adminNote: { type: String, default: "" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.models.Withdrawal || mongoose.model("Withdrawal", WithdrawalSchema);
