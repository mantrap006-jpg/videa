import { NextResponse } from "next/server";
import Video from "@/models/Video";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { getActiveUserFromRequest } from "@/lib/auth";
import { extractYouTubeId, getYouTubeVideoDetails } from "@/lib/youtube";

export async function POST(request) {
  try {
    const session = await getActiveUserFromRequest(request);
    if (!session?.sub) return NextResponse.json({ error: "Please log in." }, { status: 401 });

    await connectDB();
    const user = await User.findById(session.sub).lean();

    if (!user || !["creator", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Creator access required." }, { status: 403 });
    }

    if (user.role !== "admin" && user.subscription?.status !== "active") {
      return NextResponse.json(
        { error: "An active creator subscription is required before submitting videos." },
        { status: 402 }
      );
    }

    const body = await request.json();
    const {
      youtubeUrl,
      description = "",
      pointsPerMinute = 1,
      minimumWatchPercent = 80
    } = body;

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "YouTube URL is required." },
        { status: 400 }
      );
    }

    const rate = Number(pointsPerMinute);

    if (!Number.isFinite(rate) || rate <= 0) {
      return NextResponse.json(
        { error: "Points per minute must be greater than 0." },
        { status: 400 }
      );
    }

    const youtubeId = extractYouTubeId(youtubeUrl);

    if (!youtubeId) {
      return NextResponse.json(
        { error: "Please provide a valid YouTube URL." },
        { status: 400 }
      );
    }

    // The browser may detect the duration for display, but it is never trusted
    // for the stored duration or reward calculation.
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

    const verifiedDurationSeconds = youtubeDetails.durationSeconds;
    const rewardPoints = Math.max(
      1,
      Math.floor((verifiedDurationSeconds / 60) * rate)
    );

    const video = await Video.create({
      title: youtubeDetails.title,
      youtubeUrl: youtubeUrl.trim(),
      youtubeId,
      description: youtubeDetails.description,
      durationSeconds: verifiedDurationSeconds,
      durationVerifiedAt: new Date(),
      pointsPerMinute: rate,
      rewardPoints,
      minimumWatchPercent: Math.min(
        100,
        Math.max(1, Number(minimumWatchPercent) || 80)
      ),
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
    return NextResponse.json(
      { error: "Could not submit video.", detail: e.message },
      { status: 500 }
    );
  }
}
