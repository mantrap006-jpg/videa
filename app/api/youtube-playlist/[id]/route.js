import { NextResponse } from "next/server";
import Video from "@/models/Video";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return NextResponse.json({ error: "YouTube playlists are not configured." }, { status: 503 });
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{10,}$/.test(id || "")) return NextResponse.json({ error: "Invalid playlist ID." }, { status: 400 });
  const pageToken = request.nextUrl.searchParams.get("pageToken") || "";
  const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("playlistId", id);
  url.searchParams.set("maxResults", "50");
  if (pageToken) url.searchParams.set("pageToken", pageToken);
  url.searchParams.set("key", key);
  try {
    const response = await fetch(url, { next: { revalidate: 180 } });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.error?.message || "Playlist could not be loaded." }, { status: response.status });
    const items = (data.items || []).map(entry => {
      const videoId = entry.contentDetails?.videoId || "";
      return { id: videoId, title: entry.snippet?.title || "", description: entry.snippet?.description || "", channelTitle: entry.snippet?.videoOwnerChannelTitle || entry.snippet?.channelTitle || "", thumbnail: entry.snippet?.thumbnails?.high?.url || entry.snippet?.thumbnails?.medium?.url || entry.snippet?.thumbnails?.default?.url || "" };
    }).filter(item => item.id);
    await connectDB();
    const records = await Video.find({ youtubeId: { $in: items.map(i => i.id) }, active: true }).select("youtubeId rewardPoints minimumWatchPercent").lean();
    const eligible = new Map(records.map(v => [v.youtubeId, v]));
    for (const item of items) { const rec = eligible.get(item.id); item.earningEligible = !!rec; if (rec) { item.rewardPoints = rec.rewardPoints; item.minimumWatchPercent = rec.minimumWatchPercent; } }
    return NextResponse.json({ items, nextPageToken: data.nextPageToken || null });
  } catch (error) {
    console.error("Playlist load failed", error);
    return NextResponse.json({ error: "Unable to load playlist." }, { status: 502 });
  }
}