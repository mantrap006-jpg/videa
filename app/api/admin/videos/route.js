import { NextResponse } from "next/server";
import Video from "@/models/Video";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { getActiveUserFromRequest } from "@/lib/auth";
import { extractYouTubeId } from "@/lib/youtube";

export async function POST(request) {
  try {
    const session = await getActiveUserFromRequest(request);

    if (!session?.sub) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.sub).lean();

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      youtubeUrl,
      description = "",
      rewardPoints = 10,
      minimumWatchPercent = 80
    } = body;

    if (!title || !youtubeUrl) {
      return NextResponse.json({ error: "Title and YouTube URL are required." }, { status: 400 });
    }

    const youtubeId = extractYouTubeId(youtubeUrl);

    if (!youtubeId) {
      return NextResponse.json({ error: "Please provide a valid YouTube URL." }, { status: 400 });
    }

    const video = await Video.create({
      title: title.trim(),
      youtubeUrl: youtubeUrl.trim(),
      youtubeId,
      description: description.trim(),
      rewardPoints: Math.max(0, Number(rewardPoints) || 0),
      minimumWatchPercent: Math.min(100, Math.max(1, Number(minimumWatchPercent) || 80)),
      active: true
    });

    return NextResponse.json({ video }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Could not add video.", detail: e.message }, { status: 500 });
  }
}