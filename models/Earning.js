import mongoose from "mongoose";

const EarningSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: "Video", required: true },
    points: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

export default mongoose.models.Earning || mongoose.model("Earning", EarningSchema);