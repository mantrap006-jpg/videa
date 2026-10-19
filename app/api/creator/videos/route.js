import { NextResponse } from "next/server";
import Video from "@/models/Video";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { getActiveUserFromRequest } from "@/lib/auth";
import { extractYouTubeId, getYouTubeVideoDetails } from "@/lib/youtube";

const CREATOR_PLAN_LIMITS = {
  monthly: { videoLimit: 5, maxVideoMinutes: 10 },
  quarterly: { videoLimit: 15, maxVideoMinutes: 20 },
  annual: { videoLimit: 50, maxVideoMinutes: 30 }
};

export async function POST(request) {
  try {
    const session = await getActiveUserFromRequest(request);
    if (!session?.sub) return NextResponse.json({ error: "Please log in." }, { status: 401 });

    await connectDB();
    const user = await User.findById(session.sub).lean();

    if (!user || !["creator", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Creator access required." }, { status: 403 });
    }

    const subscriptionActive =
      user.role === "admin" ||
      (user.subscription?.status === "active" &&
        (!user.subscription?.expiresAt || new Date(user.subscription.expiresAt) > new Date()));

    if (!subscriptionActive) {
      return NextResponse.json(
        { error: "An active creator subscription is required before submitting videos." },
        { status: 402 }
      );
    }

    const planLimits = user.role === "admin"
      ? null
      : CREATOR_PLAN_LIMITS[user.subscription?.plan];

    if (user.role !== "admin" && !planLimits) {
      return NextResponse.json({ error: "Your active subscription plan is not recognized. Please contact support." }, { status: 403 });
    }

    if (planLimits) {
      const currentVideoCount = await Video.countDocuments({ creator: user._id, active: true });
      if (currentVideoCount >= planLimits.videoLimit) {
        return NextResponse.json({
          error: `Your plan allows up to ${planLimits.videoLimit} active video promotions. Deactivate an existing promotion or upgrade your plan.`,
          videoLimit: planLimits.videoLimit,
          currentVideoCount
        }, { status: 403 });
      }
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const {
      youtubeUrl,
      pointsPerMinute = 1,
      minimumWatchPercent = 80
    } = body;

    if (!youtubeUrl) {
      return NextResponse.json({ error: "YouTube URL is required." }, { status: 400 });
    }

    const rate = Number(pointsPerMinute);
    if (!Number.isFinite(rate) || rate <= 0) {
      return NextResponse.json({ error: "Points per minute must be greater than 0." }, { status: 400 });
    }

    const youtubeId = extractYouTubeId(youtubeUrl);
    if (!youtubeId) {
      return NextResponse.json({ error: "Please provide a valid YouTube URL." }, { status: 400 });
    }

    let youtubeDetails;
    try {
      youtubeDetails = await getYouTubeVideoDetails(youtubeId);
      if (!youtubeDetails.durationSeconds) throw new Error("YouTube returned an invalid video duration.");
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error.message?.includes("YOUTUBE_API_KEY") || error.message?.includes("quotaExceeded")
              ? "YouTube duration verification needs a valid YouTube Data API key. Add YOUTUBE_API_KEY in Vercel → Project Settings → Environment Variables, then redeploy."
              : "Could not verify the YouTube video duration. Please check the URL and try again."
        },
        { status: 502 }
      );
    }

    const normalizedTitle = String(youtubeDetails.title || "").trim().toLocaleLowerCase().replace(/\s+/g, " ");
    const existingVideo = await Video.findOne({
      $or: [
        { youtubeId },
        { titleKey: normalizedTitle },
        { $expr: { $eq: [{ $toLower: "$title" }, normalizedTitle] } }
      ]
    }).select("_id title youtubeId").lean();

    if (existingVideo) {
      const sameTitle = String(existingVideo.title || "").trim().toLocaleLowerCase() === normalizedTitle;
      return NextResponse.json(
        { error: sameTitle ? "A video with this title already exists in Videa." : "This YouTube video has already been added." },
        { status: 409 }
      );
    }

    const verifiedDurationSeconds = youtubeDetails.durationSeconds;
    if (planLimits && verifiedDurationSeconds > planLimits.maxVideoMinutes * 60) {
      return NextResponse.json({
        error: `Your plan allows videos up to ${planLimits.maxVideoMinutes} minutes. This video is ${Math.ceil(verifiedDurationSeconds / 60)} minutes long.`,
        maxVideoMinutes: planLimits.maxVideoMinutes,
        durationSeconds: verifiedDurationSeconds
      }, { status: 400 });
    }
    const rewardPoints = Math.max(1, Math.floor((verifiedDurationSeconds / 60) * rate));

    const video = await Video.create({
      creator: user.role === "admin" ? undefined : user._id,
      title: youtubeDetails.title,
      titleKey: normalizedTitle,
      youtubeUrl: youtubeUrl.trim(),
      youtubeId,
      channelId: youtubeDetails.channelId || "",
      channelTitle: youtubeDetails.channelTitle || "",
      channelThumbnail: youtubeDetails.channelThumbnail || "",
      description: youtubeDetails.description,
      durationSeconds: verifiedDurationSeconds,
      durationVerifiedAt: new Date(),
      pointsPerMinute: rate,
      rewardPoints,
      minimumWatchPercent: Math.min(100, Math.max(1, Number(minimumWatchPercent) || 80)),
      active: true
    });

    return NextResponse.json(
      {
        video,
        verifiedDurationSeconds,
        rewardPoints,
        title: youtubeDetails.title,
        description: youtubeDetails.description
      },
      { status: 201 }
    );
  } catch (e) {
    if (e?.code === 11000) {
      return NextResponse.json({ error: "A video with this title already exists in Videa." }, { status: 409 });
    }
    console.error("Creator video submission failed:", e);
    return NextResponse.json(
      { error: "Could not submit video.", detail: e.message },
      { status: 500 }
    );
  }
}
