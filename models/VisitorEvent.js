import mongoose from "mongoose";

const VisitorEventSchema = new mongoose.Schema({
  visitorId: { type: String, required: true },
  day: { type: String, required: true },
  path: { type: String, default: "/" },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 400 }
}, { timestamps: false });

VisitorEventSchema.index({ visitorId: 1, day: 1 }, { unique: true, name: "unique_daily_visitor" });
VisitorEventSchema.index({ day: 1 });

export default mongoose.models.VisitorEvent || mongoose.model("VisitorEvent", VisitorEventSchema);
