import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    youtubeUrl: { type: String, required: true, trim: true },
    youtubeId: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    durationSeconds: { type: Number, default: 0, min: 0 },
    durationVerifiedAt: { type: Date, default: null },
    pointsPerMinute: { type: Number, default: 1, min: 0 },
    rewardPoints: { type: Number, default: 0, min: 0 },
    minimumWatchPercent: { type: Number, default: 80, min: 1, max: 100 },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.Video || mongoose.model("Video", VideoSchema);