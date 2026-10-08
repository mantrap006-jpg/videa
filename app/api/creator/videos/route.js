import { NextResponse } from "next/server";
import Video from "@/models/Video";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import { extractYoutubeId } from "@/lib/youtube";

export async function POST(request) {
  try {
    const session = getUserFromRequest(request);
    if (!session?.sub) return NextResponse.json({ error: "Please log in." }, { status: 401 });

    await connectDB();
    const user = await User.findById(session.sub).lean();

    if (!user || !["creator", "admin"].includes(user.role)) {
      return NextResponse.json({ error: "Creator access required." }, { status: 403 });
    }

    if (user.role !== "admin" && user.subscription?.status !== "active") {
      return NextResponse.json({ error: "An active creator subscription is required before submitting videos." }, { status: 402 });
    }

    const body = await request.json();
    const { title, youtubeUrl, description = "", durationSeconds = 0, pointsPerMinute = 1, minimumWatchPercent = 80 } = body;

    if (!title || !youtubeUrl) {
      return NextResponse.json({ error: "Title and YouTube URL are required." }, { status: 400 });
    }

    const duration = Number(durationSeconds);
    const rate = Number(pointsPerMinute);
    if (!Number.isFinite(duration) || duration <= 0) {
      return NextResponse.json({ error: "Video duration in seconds is required." }, { status: 400 });
    }
    if (!Number.isFinite(rate) || rate <= 0) {
      return NextResponse.json({ error: "Points per minute must be greater than 0." }, { status: 400 });
    }

    const youtubeId = extractYoutubeId(youtubeUrl);
    if (!youtubeId) return NextResponse.json({ error: "Please provide a valid YouTube URL." }, { status: 400 });

    const video = await Video.create({
      title: title.trim(),
      youtubeUrl: youtubeUrl.trim(),
      youtubeId,
      description: description.trim(),
      durationSeconds: Math.round(duration),
      pointsPerMinute: rate,
      rewardPoints: Math.max(1, Math.floor((duration / 60) * rate)),
      minimumWatchPercent: Math.min(100, Math.max(1, Number(minimumWatchPercent) || 80)),
      active: true
    });

    return NextResponse.json({ video }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Could not submit video.", detail: e.message }, { status: 500 });
  }
}