import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Video from "@/models/Video";
import WatchProgress from "@/models/WatchProgress";
import Earning from "@/models/Earning";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request) {
  try {
    const session = getUserFromRequest(request);
    if (!session?.sub) return NextResponse.json({ error: "Please log in to earn points." }, { status: 401 });

    const body = await request.json();
    const { videoId, watchedPercent } = body;
    if (!mongoose.isValidObjectId(videoId)) return NextResponse.json({ error: "Invalid video." }, { status: 400 });

    const percent = Math.min(100, Math.max(0, Number(watchedPercent) || 0));
    await connectDB();
    const video = await Video.findOne({ _id: videoId, active: true }).lean();
    if (!video) return NextResponse.json({ error: "Video not found." }, { status: 404 });

    const progress = await WatchProgress.findOneAndUpdate(
      { userId: session.sub, videoId },
      { $max: { watchedPercent: percent } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    if (progress.rewarded) return NextResponse.json({ rewarded: true, points: video.rewardPoints, watchedPercent: progress.watchedPercent, message: "Reward already claimed for this video." });
    if (progress.watchedPercent < video.minimumWatchPercent) {
      return NextResponse.json({ rewarded: false, watchedPercent: progress.watchedPercent, required: video.minimumWatchPercent, message: "Keep watching until " + video.minimumWatchPercent + "%." });
    }

    const claimed = await WatchProgress.findOneAndUpdate(
      { _id: progress._id, rewarded: false },
      { $set: { rewarded: true, rewardedAt: new Date() } },
      { new: true }
    );
    if (!claimed) return NextResponse.json({ rewarded: true, points: video.rewardPoints, watchedPercent: progress.watchedPercent });

    await User.findByIdAndUpdate(session.sub, { $inc: { points: video.rewardPoints } });
    await Earning.create({ userId: session.sub, videoId, points: video.rewardPoints });

    return NextResponse.json({ rewarded: true, points: video.rewardPoints, watchedPercent: claimed.watchedPercent, message: "Reward received: +" + video.rewardPoints + " points" });
  } catch (error) {
    return NextResponse.json({ error: "Could not save watch progress.", detail: error.message }, { status: 500 });
  }
}