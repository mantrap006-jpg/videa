import { NextResponse } from "next/server";
import Video from "@/models/Video";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return NextResponse.json({ error: "YouTube search is not configured yet." }, { status: 503 });
  const params = request.nextUrl.searchParams;
  const q = (params.get("q") || "").trim().slice(0, 120);
  const type = params.get("type") === "playlist" ? "playlist" : "video";
  const pageToken = params.get("pageToken") || "";
  if (!q) return NextResponse.json({ error: "Enter a search term." }, { status: 400 });
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("q", q);
  url.searchParams.set("type", type);
  url.searchParams.set("maxResults", "24");
  url.searchParams.set("safeSearch", "strict");
  url.searchParams.set("regionCode", "US");
  if (type === "video") url.searchParams.set("videoEmbeddable", "true");
  if (pageToken) url.searchParams.set("pageToken", pageToken);
  url.searchParams.set("key", key);
  try {
    const response = await fetch(url, { next: { revalidate: 180 } });
    const data = await response.json();
    if (!response.ok) return NextResponse.json({ error: data.error?.message || "YouTube search failed." }, { status: response.status });
    const items = (data.items || []).map(item => {
      const id = type === "playlist" ? item.id.playlistId : item.id.videoId;
      return { id, type, title: item.snippet?.title || "", description: item.snippet?.description || "", channelTitle: item.snippet?.channelTitle || "", channelId: item.snippet?.channelId || "", publishedAt: item.snippet?.publishedAt || "", thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "" };
    });
    if (type === "video" && items.length) {
      await connectDB();
      const eligible = await Video.find({ youtubeId: { $in: items.map(i => i.id) }, active: true }).select("youtubeId rewardPoints minimumWatchPercent").lean();
      const byId = new Map(eligible.map(v => [v.youtubeId, v]));
      for (const item of items) {
        const record = byId.get(item.id);
        item.earningEligible = !!record;
        if (record) { item.rewardPoints = record.rewardPoints; item.minimumWatchPercent = record.minimumWatchPercent; }
      }
    }
    return NextResponse.json({ items, nextPageToken: data.nextPageToken || null });
  } catch (error) {
    console.error("YouTube discovery search failed", error);
    return NextResponse.json({ error: "Unable to search YouTube right now." }, { status: 502 });
  }
}