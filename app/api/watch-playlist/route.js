import { NextResponse } from "next/server";
import Video from "@/models/Video";
import { connectDB } from "@/lib/mongodb";
export const dynamic = "force-dynamic";
function formatDuration(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  return total >= 3600 ? `${Math.floor(total / 3600)}:${String(Math.floor((total % 3600) / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}` : `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
export async function GET(request) {
  try {
    await connectDB();
    const current = request.nextUrl.searchParams.get("current") || "";
    let videos = await Video.find({ active: true }).select("_id title youtubeId channelTitle durationSeconds createdAt").sort({ createdAt: -1 }).limit(12).lean();\n    if (current && !videos.some(video => String(video._id) === current)) {\n      const currentVideo = await Video.findOne({ _id: current, active: true }).select("_id title youtubeId channelTitle durationSeconds createdAt").lean();\n      if (currentVideo) videos = [currentVideo, ...videos.slice(0, 11)];\n    }
    const items = videos.map(video => ({ _id: String(video._id), title: video.title || "Untitled video", channelTitle: video.channelTitle || "", thumbnail: `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`, duration: formatDuration(video.durationSeconds) }));
    return NextResponse.json({ items });
  } catch (error) {
    console.error("Watch playlist fetch failed", error);
    return NextResponse.json({ error: "Playlist unavailable." }, { status: 500 });
  }
}
