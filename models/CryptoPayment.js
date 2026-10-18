import mongoose from "mongoose";

const CryptoPaymentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  externalReference: { type: String, required: true, unique: true, index: true },
  invoiceId: { type: String, default: "", index: true },
  checkoutId: { type: String, default: "" },
  checkoutUrl: { type: String, default: "" },
  amountUsd: { type: String, default: undefined },
  // Retained for compatibility with historical Payclave records.
  amountUsdc: { type: String, default: undefined },
  points: { type: Number, required: true, min: 1 },
  rateRwfPerUsd: { type: Number, default: undefined, min: 1 },
  // Legacy rate field for historical Payclave records.
  rateRwfPerUsdc: { type: Number, default: undefined, min: 1 },
  status: { type: String, enum: ["pending", "paid", "failed"], default: "pending", index: true },
  providerMode: { type: String, enum: ["test", "live"], required: true },
  creditedAt: { type: Date, default: null },
  paidAt: { type: Date, default: null },
  providerEventId: { type: String, default: undefined }
}, { timestamps: true });

CryptoPaymentSchema.index({ providerEventId: 1 }, { unique: true, sparse: true });

export default mongoose.models.CryptoPayment || mongoose.model("CryptoPayment", CryptoPaymentSchema);
