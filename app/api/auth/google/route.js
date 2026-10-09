import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { signToken, COOKIE_NAME } from "@/lib/auth";

const allowedRoles = ["viewer", "creator"];
const YOUTUBE_SCOPE = "https://www.googleapis.com/auth/youtube.readonly";
const YOUTUBE_TOKEN_COOKIE = "videa_youtube_access";

export async function POST(request) {
  try {
    const { accessToken, role = "viewer" } = await request.json();
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return NextResponse.json({ error: "Google sign-in is not configured on the server." }, { status: 503 });
    if (typeof accessToken !== "string" || !accessToken || accessToken.length > 5000) return NextResponse.json({ error: "Google authorization is missing. Please try again." }, { status: 400 });

    const infoUrl = new URL("https://oauth2.googleapis.com/tokeninfo");
    infoUrl.searchParams.set("access_token", accessToken);
    const infoResponse = await fetch(infoUrl, { cache: "no-store", signal: AbortSignal.timeout(10000) });
    const tokenInfo = await infoResponse.json().catch(() => ({}));
    if (!infoResponse.ok) return NextResponse.json({ error: "Google authorization expired or was rejected. Please try again." }, { status: 401 });
    const audience = tokenInfo.aud || tokenInfo.azp || tokenInfo.issued_to;
    if (audience !== clientId) return NextResponse.json({ error: "Google authorization was not issued to Videa." }, { status: 401 });

    const scopes = String(tokenInfo.scope || "").split(/\s+/);
    if (!scopes.includes(YOUTUBE_SCOPE) || !scopes.includes("openid") || !scopes.includes("email")) {
      return NextResponse.json({ error: "Videa needs your consent for basic Google identity and YouTube read-only access." }, { status: 403 });
    }

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store", signal: AbortSignal.timeout(10000)
    });
    const profile = await profileResponse.json().catch(() => ({}));
    if (!profileResponse.ok || !profile.sub || !profile.email || profile.email_verified !== true) return NextResponse.json({ error: "Google could not verify your email address." }, { status: 401 });

    await connectDB();
    const email = profile.email.toLowerCase().trim();
    let user = await User.findOne({ $or: [{ googleId: profile.sub }, { email }] });
    if (user?.status === "suspended") return NextResponse.json({ error: "This account is suspended. Please contact Videa support." }, { status: 403 });
    if (user?.googleId && user.googleId !== profile.sub) return NextResponse.json({ error: "This email is already linked to a different Google account." }, { status: 409 });

    if (!user) {
      user = await User.create({
        name: (profile.name || email.split("@")[0]).trim(), email,
        passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12),
        googleId: profile.sub, role: allowedRoles.includes(role) ? role : "viewer"
      });
    } else if (!user.googleId) {
      user.googleId = profile.sub;
      if (!user.name && profile.name) user.name = profile.name;
      await user.save();
    }

    const expiresIn = Math.min(Math.max(Number(tokenInfo.expires_in) || 3600, 60), 3600);
    const response = NextResponse.json({ user: { name: user.name, email: user.email, role: user.role }, youtubePermissionGranted: true });
    const cookieOptions = { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" };
    response.cookies.set(COOKIE_NAME, signToken(user), { ...cookieOptions, maxAge: 2592000 });
    response.cookies.set(YOUTUBE_TOKEN_COOKIE, accessToken, { ...cookieOptions, maxAge: expiresIn });
    return response;
  } catch (error) {
    console.error("Google authentication failed:", error?.message || error);
    return NextResponse.json({ error: "Google sign-in failed. Please try again." }, { status: 401 });
  }
}
