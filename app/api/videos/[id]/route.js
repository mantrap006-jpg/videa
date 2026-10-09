import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Video from "@/models/Video";
import PlatformSetting from "@/models/PlatformSetting";
import { connectDB } from "@/lib/mongodb";
import { getYouTubeVideoDetails, getYouTubeDurationSeconds } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    if (!mongoose.isValidObjectId(id)) {
      return NextResponse.json({ error: "Invalid video." }, { status: 400 });
    }

    await connectDB();
    const video = await Video.findOne({ _id: id, active: true });
    if (!video) return NextResponse.json({ error: "Video not found." }, { status: 404 });

    if (!video.channelId || !video.durationSeconds || video.durationSeconds <= 0 || !video.durationVerifiedAt) {
      try {
        const details = await getYouTubeVideoDetails(video.youtubeId);
        video.channelId = details.channelId;
        video.channelTitle = details.channelTitle;
        video.channelThumbnail = details.channelThumbnail;
        if (details.durationSeconds > 0) {
          video.durationSeconds = details.durationSeconds;
          video.durationVerifiedAt = new Date();
          video.rewardPoints = Math.max(
            1,
            Math.floor((details.durationSeconds / 60) * Number(video.pointsPerMinute || 1))
          );
        } else if (!video.durationSeconds || video.durationSeconds <= 0) {
          video.durationSeconds = await getYouTubeDurationSeconds(video.youtubeId);
          video.durationVerifiedAt = new Date();
        }
        await video.save();
      } catch (error) {
        const missingKey = error.message?.includes("YOUTUBE_API_KEY");
        return NextResponse.json({
          error: missingKey
            ? "This video needs server-side YouTube verification. Add YOUTUBE_API_KEY in Vercel Project Settings → Environment Variables, then redeploy."
            : "Videa could not detect this video's YouTube channel or duration. Check the API key, quota, and video availability."
        }, { status: 503 });
      }
    }

    const platformSettings = await PlatformSetting.findOne({ key: "payment" }).lean();
    const maxPointsPerVideo = Math.max(0, Number(platformSettings?.maxPointsPerVideo ?? 50));
    const globalMinimumWatchPercent = Math.min(100, Math.max(1, Number(platformSettings?.minimumWatchPercent ?? 80)));
    const rewardPoints = Math.min(maxPointsPerVideo, Math.max(1, Math.floor((Number(video.durationSeconds || 0) / 60) * Number(video.pointsPerMinute || 1))));
    const minimumWatchPercent = Math.max(globalMinimumWatchPercent, Number(video.minimumWatchPercent || 80));

    return NextResponse.json({
      video: {
        id: video._id.toString(),
        title: video.title,
        description: video.description || "",
        youtubeId: video.youtubeId,
        channelId: video.channelId,
        channelTitle: video.channelTitle || "YouTube channel",
        channelThumbnail: video.channelThumbnail || "",
        channelUrl: video.channelId ? `https://www.youtube.com/channel/${video.channelId}` : "",
        durationSeconds: video.durationSeconds,
        durationVerifiedAt: video.durationVerifiedAt?.toISOString() || null,
        pointsPerMinute: video.pointsPerMinute || 1,
        rewardPoints,
        minimumWatchPercent
      }
    });
  } catch {
    return NextResponse.json({ error: "Could not load the video." }, { status: 500 });
  }
}
