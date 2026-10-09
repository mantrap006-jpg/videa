import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Video from "@/models/Video";
import WatchProgress from "@/models/WatchProgress";
import Earning from "@/models/Earning";
import PlatformSetting from "@/models/PlatformSetting";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { getActiveUserFromRequest } from "@/lib/auth";
import { getYouTubeDurationSeconds, getYouTubeVideoDetails } from "@/lib/youtube";
import { subscriptionCookieName, verifySubscriptionProof } from "@/lib/youtube-subscription";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const session = await getActiveUserFromRequest(request);
    if (!session?.sub) {
      return NextResponse.json({ error: "Please log in to earn points." }, { status: 401 });
    }

    const body = await request.json();
    const { videoId } = body;
    const isPlaying = body.isPlaying === true;
    const currentTime = Number(body.currentTime);

    if (!mongoose.isValidObjectId(videoId)) {
      return NextResponse.json({ error: "Invalid video." }, { status: 400 });
    }
    if (!Number.isFinite(currentTime) || currentTime < 0) {
      return NextResponse.json({ error: "Invalid playback position." }, { status: 400 });
    }

    await connectDB();
    const video = await Video.findOne({ _id: videoId, active: true });
    if (!video) return NextResponse.json({ error: "Video not found." }, { status: 404 });

    // Detect the video's channel on the server and require a verified subscription
    // before recording watch time or issuing any reward.
    if (!video.channelId) {
      try {
        const details = await getYouTubeVideoDetails(video.youtubeId);
        video.channelId = details.channelId;
        video.channelTitle = details.channelTitle;
        video.channelThumbnail = details.channelThumbnail;
        if (details.durationSeconds > 0 && (!video.durationSeconds || !video.durationVerifiedAt)) {
          video.durationSeconds = details.durationSeconds;
          video.durationVerifiedAt = new Date();
          video.rewardPoints = Math.max(1, Math.floor((details.durationSeconds / 60) * Number(video.pointsPerMinute || 1)));
        }
        await video.save();
      } catch {
        return NextResponse.json({ error: "Videa could not detect this video's YouTube channel. Please try again later." }, { status: 503 });
      }
    }

    const platformSettings = await PlatformSetting.findOne({ key: "payment" }).lean();
    const dailyRewardPointsLimit = Math.max(0, Number(platformSettings?.dailyRewardPointsLimit ?? 100));
    const dailyRewardCountLimit = Math.max(0, Number(platformSettings?.dailyRewardCountLimit ?? 10));
    const maxPointsPerVideo = Math.max(0, Number(platformSettings?.maxPointsPerVideo ?? 50));
    const globalMinimumWatchPercent = Math.min(100, Math.max(1, Number(platformSettings?.minimumWatchPercent ?? 80)));

    const subscriptionProof = request.cookies.get(subscriptionCookieName(video.channelId))?.value;
    if (!verifySubscriptionProof(subscriptionProof, session.sub, video.channelId)) {
      return NextResponse.json({
        error: "Subscribe to this video's YouTube channel and verify your subscription before earning points.",
        subscriptionRequired: true,
        channelId: video.channelId,
        channelTitle: video.channelTitle || "YouTube channel",
        channelUrl: `https://www.youtube.com/channel/${video.channelId}`
      }, { status: 403 });
    }

    // Recover older records whose verified duration was never stored.
    if (!video.durationSeconds || video.durationSeconds <= 0 || !video.durationVerifiedAt) {
      try {
        const duration = await getYouTubeDurationSeconds(video.youtubeId);
        video.durationSeconds = duration;
        video.durationVerifiedAt = new Date();
        video.rewardPoints = Math.max(1, Math.floor((duration / 60) * (video.pointsPerMinute || 1)));
        await video.save();
      } catch (error) {
        const missingKey = error.message?.includes("YOUTUBE_API_KEY");
        return NextResponse.json({
          error: missingKey
            ? "Server duration verification needs YOUTUBE_API_KEY. Add it in Vercel Project Settings → Environment Variables, then redeploy."
            : "Videa could not verify this video's duration with YouTube. Check the server API key and YouTube video availability."
        }, { status: 503 });
      }
    }

    let progress = await WatchProgress.findOne({ userId: session.sub, videoId });
    const now = new Date();

    if (!progress) {
      try {
        progress = await WatchProgress.create({
          userId: session.sub,
          videoId,
          watchedPercent: 0,
          watchedSeconds: 0,
          lastPlayerTime: currentTime,
          lastHeartbeatAt: now,
          rewarded: false
        });
      } catch (error) {
        if (error?.code !== 11000) throw error;
        progress = await WatchProgress.findOne({ userId: session.sub, videoId });
      }
    } else {
      const previousHeartbeat = progress.lastHeartbeatAt ? new Date(progress.lastHeartbeatAt).getTime() : 0;
      const elapsed = previousHeartbeat ? Math.max(0, Math.min(8, (now.getTime() - previousHeartbeat) / 1000)) : 0;
      const playerDelta = currentTime - Number(progress.lastPlayerTime || 0);

      // Count only time that elapsed on the server while the player was playing
      // and the YouTube playback position advanced at a plausible rate.
      if (isPlaying && elapsed >= 1 && playerDelta > 0 && playerDelta <= elapsed + 3) {
        progress.watchedSeconds = Math.min(
          video.durationSeconds,
          Number(progress.watchedSeconds || 0) + elapsed
        );
      }

      progress.lastPlayerTime = currentTime;
      progress.lastHeartbeatAt = now;
      progress.watchedPercent = Math.min(
        100,
        Math.floor((Number(progress.watchedSeconds || 0) / video.durationSeconds) * 100)
      );
      await progress.save();
    }

    const watchedPercent = Math.min(
      100,
      Math.floor((Number(progress.watchedSeconds || 0) / video.durationSeconds) * 100)
    );
    const requiredPercent = Math.max(globalMinimumWatchPercent, Number(video.minimumWatchPercent || 80));
    const calculatedReward = Math.min(
      maxPointsPerVideo,
      Math.max(1, Math.floor((video.durationSeconds / 60) * Number(video.pointsPerMinute || 1)))
    );

    if (progress.rewarded) {
      const previousEarning = await Earning.findOne({ userId: session.sub, videoId }).select("points").lean();
      return NextResponse.json({
        rewarded: true,
        points: previousEarning?.points ?? calculatedReward,
        watchedPercent,
        watchedSeconds: progress.watchedSeconds || 0,
        durationSeconds: video.durationSeconds,
        required: requiredPercent,
        message: "Reward already claimed for this video."
      });
    }

    if (watchedPercent < requiredPercent) {
      return NextResponse.json({
        rewarded: false,
        watchedPercent,
        watchedSeconds: progress.watchedSeconds || 0,
        durationSeconds: video.durationSeconds,
        required: requiredPercent,
        message: `Keep watching. Your verified watch time is ${watchedPercent}% of the required ${requiredPercent}%.`
      });
    }

    // Rwanda is UTC+2 year-round; reset daily earning limits at local midnight.
    const kigaliOffsetMs = 2 * 60 * 60 * 1000;
    const dayStart = new Date(Math.floor((now.getTime() + kigaliOffsetMs) / 86400000) * 86400000 - kigaliOffsetMs);
    const dailyEarnings = await Earning.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(session.sub), createdAt: { $gte: dayStart } } },
      { $group: { _id: null, count: { $sum: 1 }, points: { $sum: "$points" } } }
    ]);
    const dailyCount = Number(dailyEarnings[0]?.count || 0);
    const dailyPoints = Number(dailyEarnings[0]?.points || 0);
    const remainingPoints = Math.max(0, dailyRewardPointsLimit - dailyPoints);

    if (dailyCount >= dailyRewardCountLimit || remainingPoints <= 0 || maxPointsPerVideo <= 0) {
      return NextResponse.json({
        rewarded: false,
        dailyLimitReached: true,
        watchedPercent,
        watchedSeconds: progress.watchedSeconds || 0,
        durationSeconds: video.durationSeconds,
        required: requiredPercent,
        message: "You reached today's reward limit. You can continue earning after the daily limit resets."
      });
    }

    const pointsToAward = Math.min(calculatedReward, remainingPoints);
    const claimed = await WatchProgress.findOneAndUpdate(
      { _id: progress._id, rewarded: false },
      { $set: { rewarded: true, rewardedAt: now, watchedPercent } },
      { new: true }
    );
    if (!claimed) {
      const existingEarning = await Earning.findOne({ userId: session.sub, videoId }).select("points").lean();
      return NextResponse.json({ rewarded: true, points: existingEarning?.points ?? pointsToAward, watchedPercent });
    }

    await User.findByIdAndUpdate(session.sub, { $inc: { points: pointsToAward } });
    await Earning.create({ userId: session.sub, videoId, points: pointsToAward });

    return NextResponse.json({
      rewarded: true,
      points: pointsToAward,
      watchedPercent,
      watchedSeconds: progress.watchedSeconds || 0,
      durationSeconds: video.durationSeconds,
      required: requiredPercent,
      message: `Reward received: +${pointsToAward} points`
    });
  } catch (error) {
    return NextResponse.json({ error: "Could not save watch progress." }, { status: 500 });
  }
}
