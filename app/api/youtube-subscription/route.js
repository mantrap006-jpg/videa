import { NextResponse } from "next/server";
import mongoose from "mongoose";
import Video from "@/models/Video";
import { connectDB } from "@/lib/mongodb";
import { getActiveUserFromRequest } from "@/lib/auth";
import { getYouTubeVideoDetails } from "@/lib/youtube";
import { createSubscriptionProof, subscriptionCookieName, verifySubscriptionProof } from "@/lib/youtube-subscription";

export const dynamic = "force-dynamic";
const YOUTUBE_READ_SCOPE = "https://www.googleapis.com/auth/youtube.readonly";
const YOUTUBE_TOKEN_COOKIE = "videa_youtube_access";

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

async function checkSubscription(accessToken, channelId) {
  const url = new URL("https://www.googleapis.com/youtube/v3/subscriptions");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("forChannelId", channelId);
  url.searchParams.set("mine", "true");
  url.searchParams.set("maxResults", "1");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store", signal: AbortSignal.timeout(10000)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(response.status === 401
      ? "Your Google YouTube permission expired. Please sign in with Google again."
      : response.status === 403
        ? "YouTube did not allow subscription verification. Check that YouTube Data API v3 is enabled and the permission was approved."
        : "YouTube subscription verification failed. Please try again.");
    error.status = response.status === 401 ? 401 : 502;
    throw error;
  }
  return Array.isArray(data.items) && data.items.length > 0;
}

function resultFor(video, subscribed, needsAuthorization = false) {
  return {
    subscribed, needsAuthorization, channelId: video.channelId,
    channelTitle: video.channelTitle || "YouTube channel",
    channelUrl: `https://www.youtube.com/channel/${video.channelId}`,
    message: subscribed ? "Subscription verified. You can watch and earn."
      : needsAuthorization ? "Sign in with Google and approve YouTube read-only access to check your subscription."
      : "You are not subscribed to this channel yet. Subscribe, then check again."
  };
}

function setProof(response, session, video, subscribed) {
  const options = { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" };
  const name = subscriptionCookieName(video.channelId);
  response.cookies.set(name, subscribed ? createSubscriptionProof(session.sub, video.channelId) : "", {
    ...options, maxAge: subscribed ? 12 * 60 * 60 : 0
  });
  return response;
}

export async function GET(request) {
  try {
    const session = await getActiveUserFromRequest(request);
    if (!session?.sub) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
    const videoId = new URL(request.url).searchParams.get("videoId");
    const video = await loadVideo(videoId);
    if (!video) return NextResponse.json({ error: "Video not found." }, { status: 404 });

    const proof = request.cookies.get(subscriptionCookieName(video.channelId))?.value;
    if (verifySubscriptionProof(proof, session.sub, video.channelId)) return NextResponse.json(resultFor(video, true));

    const accessToken = request.cookies.get(YOUTUBE_TOKEN_COOKIE)?.value;
    if (!accessToken) return NextResponse.json(resultFor(video, false, true));
    try {
      const subscribed = await checkSubscription(accessToken, video.channelId);
      return setProof(NextResponse.json(resultFor(video, subscribed)), session, video, subscribed);
    } catch (error) {
      if (error.status === 401) {
        const response = NextResponse.json(resultFor(video, false, true));
        response.cookies.set(YOUTUBE_TOKEN_COOKIE, "", {
          httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 0, path: "/"
        });
        return response;
      }
      throw error;
    }
  } catch (error) {
    return NextResponse.json({ error: error.message || "Could not check the saved YouTube subscription status." }, { status: error.status || 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getActiveUserFromRequest(request);
    if (!session?.sub) return NextResponse.json({ error: "Please log in first." }, { status: 401 });
    const body = await request.json();
    const accessToken = typeof body.accessToken === "string" ? body.accessToken : request.cookies.get(YOUTUBE_TOKEN_COOKIE)?.value || "";
    const video = await loadVideo(body.videoId);
    if (!video) return NextResponse.json({ error: "Video not found." }, { status: 404 });
    if (!accessToken || accessToken.length > 5000) return NextResponse.json({ error: "Sign in with Google and approve YouTube read-only access to verify the subscription." }, { status: 400 });

    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return NextResponse.json({ error: "Google OAuth is not configured." }, { status: 503 });
    const infoUrl = new URL("https://oauth2.googleapis.com/tokeninfo");
    infoUrl.searchParams.set("access_token", accessToken);
    const infoResponse = await fetch(infoUrl, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    const tokenInfo = await infoResponse.json().catch(() => ({}));
    if (!infoResponse.ok) return NextResponse.json({ error: "Your Google authorization expired. Please sign in again." }, { status: 401 });
    const audience = tokenInfo.aud || tokenInfo.azp || tokenInfo.issued_to;
    if (audience !== clientId) return NextResponse.json({ error: "The YouTube authorization could not be verified for Videa." }, { status: 401 });
    if (!String(tokenInfo.scope || "").split(/\s+/).includes(YOUTUBE_READ_SCOPE)) return NextResponse.json({ error: "Videa needs YouTube read-only permission. Please sign in with Google again." }, { status: 403 });

    const subscribed = await checkSubscription(accessToken, video.channelId);
    return setProof(NextResponse.json(resultFor(video, subscribed)), session, video, subscribed);
  } catch (error) {
    const message = error?.message?.includes("YOUTUBE_API_KEY")
      ? "Add YOUTUBE_API_KEY in Vercel Environment Variables so Videa can detect the video's channel."
      : error.message || "Could not verify your YouTube subscription. Please try again.";
    return NextResponse.json({ error: message }, { status: error.status || 500 });
  }
}
