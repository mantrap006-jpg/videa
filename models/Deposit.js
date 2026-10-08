import mongoose from "mongoose";

const DepositSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  amountRwf: { type: Number, required: true, min: 100 },
  points: { type: Number, required: true, min: 100 },
  phone: { type: String, required: true, trim: true },
  senderName: { type: String, default: "", trim: true, maxlength: 120 },
  network: { type: String, required: true, trim: true },
  transactionReference: { type: String, required: true, trim: true },
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
  adminNote: { type: String, default: "" },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reviewedAt: { type: Date, default: null }
}, { timestamps: true });

DepositSchema.index({ transactionReference: 1 }, { unique: true });

export default mongoose.models.Deposit || mongoose.model("Deposit", DepositSchema);
