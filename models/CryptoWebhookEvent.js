import mongoose from "mongoose";

const CryptoWebhookEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
  processedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.CryptoWebhookEvent || mongoose.model("CryptoWebhookEvent", CryptoWebhookEventSchema);
