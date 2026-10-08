import mongoose from "mongoose";

const WatchProgressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
    watchedPercent: { type: Number, default: 0, min: 0, max: 100 },
    rewarded: { type: Boolean, default: false },
    rewardedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

WatchProgressSchema.index({ userId: 1, videoId: 1 }, { unique: true });

export default mongoose.models.WatchProgress ||
  mongoose.model("WatchProgress", WatchProgressSchema);