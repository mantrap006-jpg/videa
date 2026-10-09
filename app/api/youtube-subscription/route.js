import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Video from "@/models/Video";
import { connectDB } from "@/lib/mongodb";
import { getActiveUserFromRequest } from "@/lib/auth";
import { getYouTubeVideoDetails } from "@/lib/youtube";
import { createSubscriptionProof, subscriptionCookieName, verifySubscriptionProof } from "@/lib/youtube-subscription";

export const dynamic = "force-dynamic";
const YOUTUBE_READ_SCOPE = "https://www.googleapis.com/auth/youtube.readonly";

async function loadVideo(videoId) {
  if (!mongoose.isValidObjectId(videoId)) return null;
  await connectDB();
  const video = await Video.findOne({ _id: videoId, active: true });
  if (!video) return null;
  if (!video.channelId) {
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
  }
  return video;
}

export async function GET(request) {
  try {
    const session = await getActiveUserFromRequest(request);
    if (!session?.sub) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
    const videoId = new URL(request.url).searchParams.get("videoId");
    const video = await loadVideo(videoId);
    if (!video) return NextResponse.json({ error: "Video not found." }, { status: 404 });
    const cookieName = subscriptionCookieName(video.channelId);
    const proof = request.cookies.get(cookieName)?.value;
    const subscribed = verifySubscriptionProof(proof, session.sub, video.channelId);
    return NextResponse.json({
      subscribed,
      needsAuthorization: !subscribed,
      channelId: video.channelId,
      channelTitle: video.channelTitle || "YouTube channel",
      channelUrl: `https://www.youtube.com/channel/${video.channelId}`
    });
  } catch {
    return NextResponse.json({ error: "Could not check the saved YouTube subscription status." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getActiveUserFromRequest(request);
    if (!session?.sub) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

    const body = await request.json();
    const accessToken = typeof body.accessToken === "string" ? body.accessToken : "";
    const videoId = body.videoId;
    if (!accessToken || accessToken.length > 5000) {
      return NextResponse.json({ error: "Connect your YouTube account to verify the subscription." }, { status: 400 });
    }

    const video = await loadVideo(videoId);
    if (!video) return NextResponse.json({ error: "Video not found." }, { status: 404 });

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 503 });

    const tokenInfoUrl = new URL("https://oauth2.googleapis.com/tokeninfo");
    tokenInfoUrl.searchParams.set("access_token", accessToken);
    const tokenResponse = await fetch(tokenInfoUrl, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    const tokenInfo = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok) {
      return NextResponse.json({ error: "Your Google authorization expired. Please verify again." }, { status: 401 });
    }

    const tokenAudience = tokenInfo.aud || tokenInfo.azp || tokenInfo.issued_to;
    if (tokenAudience && tokenAudience !== clientId) {
      return NextResponse.json({ error: "The YouTube authorization was issued to a different application." }, { status: 401 });
    }
    const scopes = String(tokenInfo.scope || "").split(/\s+/);
    if (!scopes.includes(YOUTUBE_READ_SCOPE)) {
      return NextResponse.json({ error: "Videa needs permission to check your YouTube subscriptions. Please authorize the YouTube read-only permission." }, { status: 403 });
    }

    const checkUrl = new URL("https://www.googleapis.com/youtube/v3/subscriptions");
    checkUrl.searchParams.set("part", "snippet");
    checkUrl.searchParams.set("forChannelId", video.channelId);
    checkUrl.searchParams.set("mine", "true");
    checkUrl.searchParams.set("maxResults", "1");
    const checkResponse = await fetch(checkUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });
    const result = await checkResponse.json().catch(() => ({}));
    if (!checkResponse.ok) {
      const message = checkResponse.status === 403
        ? "YouTube did not allow subscription verification. Check that YouTube Data API v3 is enabled and that your Google account has granted access."
        : "YouTube subscription verification failed. Please try again.";
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const subscribed = Array.isArray(result.items) && result.items.length > 0;
    const response = NextResponse.json({
      subscribed,
      needsAuthorization: !subscribed,
      channelId: video.channelId,
      channelTitle: video.channelTitle || "YouTube channel",
      channelUrl: `https://www.youtube.com/channel/${video.channelId}`,
      message: subscribed
        ? "Subscription verified. You can watch and earn."
        : "You are not subscribed to this channel yet. Subscribe, then verify again."
    });
    const cookieName = subscriptionCookieName(video.channelId);
    if (subscribed) {
      response.cookies.set(cookieName, createSubscriptionProof(session.sub, video.channelId), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        maxAge: 12 * 60 * 60,
        path: "/"
      });
    } else {
      response.cookies.set(cookieName, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 0, path: "/" });
    }
    return response;
  } catch (error) {
    const message = error?.message?.includes("YOUTUBE_API_KEY")
      ? "Add YOUTUBE_API_KEY in Vercel Environment Variables so Videa can detect the video's channel."
      : "Could not verify your YouTube subscription. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
