import mongoose from "mongoose";

const PlatformSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  ussdNumber: { type: String, default: "", trim: true, maxlength: 40 },
  paymentNetwork: { type: String, default: "MTN / Airtel Money", trim: true, maxlength: 80 },
  dailyRewardPointsLimit: { type: Number, default: 100, min: 0, max: 100000 },
  dailyRewardCountLimit: { type: Number, default: 10, min: 0, max: 1000 },
  maxPointsPerVideo: { type: Number, default: 50, min: 0, max: 10000 },
  minimumWatchPercent: { type: Number, default: 80, min: 1, max: 100 },
  monthlyFixedCostsRwf: { type: Number, default: 100000, min: 0, max: 1000000000 }
}, { timestamps: true });

export default mongoose.models.PlatformSetting ||
  mongoose.model("PlatformSetting", PlatformSettingSchema);
