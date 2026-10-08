import mongoose from "mongoose";

const SubscriptionPaymentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    plan: { type: String, enum: ["creator"], default: "creator" },
    amountRwf: { type: Number, required: true, min: 1 },
    phone: { type: String, required: true, trim: true },
    transactionReference: { type: String, required: true, trim: true, unique: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    adminNote: { type: String, default: "" },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    verifiedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.models.SubscriptionPayment ||
  mongoose.model("SubscriptionPayment", SubscriptionPaymentSchema);
