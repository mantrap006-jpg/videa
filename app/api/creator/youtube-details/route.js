import { NextResponse } from "next/server";
import { getActiveUserFromRequest } from "@/lib/auth";
import { extractYouTubeId, getYouTubeVideoDetails } from "@/lib/youtube";

export async function POST(request) {
  try {
    const session = await getActiveUserFromRequest(request);
    if (!session?.sub) {
      return NextResponse.json({ error: "Please log in." }, { status: 401 });
    }

    const body = await request.json();
    const youtubeId = extractYouTubeId(String(body.youtubeUrl || "").trim());

    if (!youtubeId) {
      return NextResponse.json({ error: "Please provide a valid YouTube URL." }, { status: 400 });
    }

    const details = await getYouTubeVideoDetails(youtubeId);
    return NextResponse.json({
      youtubeId,
      title: details.title,
      description: details.description,
      durationSeconds: details.durationSeconds
    });
  } catch (error) {
    const message = error.message || "";
    const apiError = message.includes("YOUTUBE_API_KEY") || message.includes("quotaExceeded");
    return NextResponse.json({
      error: apiError
        ? "YouTube lookup is unavailable. Check the YOUTUBE_API_KEY setting and YouTube Data API quota."
        : "Could not retrieve this video's details. Check that the video is public or unlisted and the URL is correct."
    }, { status: 502 });
  }
}
