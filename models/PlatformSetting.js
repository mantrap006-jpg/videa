import mongoose from "mongoose";

const PlatformSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  ussdNumber: { type: String, default: "", trim: true, maxlength: 40 },
  paymentNetwork: { type: String, default: "MTN / Airtel Money", trim: true, maxlength: 80 }
}, { timestamps: true });

export default mongoose.models.PlatformSetting ||
  mongoose.model("PlatformSetting", PlatformSettingSchema);
