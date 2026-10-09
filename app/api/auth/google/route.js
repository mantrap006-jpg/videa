import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { signToken, COOKIE_NAME } from "@/lib/auth";

const allowedRoles = ["viewer", "creator"];

export async function POST(request) {
  try {
    const { credential, role = "viewer" } = await request.json();
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    if (!clientId) {
      return NextResponse.json(
        { error: "Google sign-in is not configured on the server." },
        { status: 503 }
      );
    }

    if (!credential || typeof credential !== "string") {
      return NextResponse.json({ error: "Google credential is missing." }, { status: 400 });
    }

    const googleClient = new OAuth2Client(clientId);
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || payload.email_verified !== true) {
      return NextResponse.json(
        { error: "Google could not verify this email address." },
        { status: 401 }
      );
    }

    await connectDB();

    const email = payload.email.toLowerCase().trim();
    let user = await User.findOne({ $or: [{ googleId: payload.sub }, { email }] });

    if (user?.status === "suspended") {
      return NextResponse.json(
        { error: "This account is suspended. Please contact Videa support." },
        { status: 403 }
      );
    }

    if (user?.googleId && user.googleId !== payload.sub) {
      return NextResponse.json(
        { error: "This email is already linked to a different Google account." },
        { status: 409 }
      );
    }

    if (!user) {
      const safeRole = allowedRoles.includes(role) ? role : "viewer";
      const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
      user = await User.create({
        name: (payload.name || email.split("@")[0]).trim(),
        email,
        passwordHash,
        googleId: payload.sub,
        role: safeRole
      });
    } else if (!user.googleId) {
      // Link only after Google's verified email has been validated above.
      user.googleId = payload.sub;
      if (!user.name && payload.name) user.name = payload.name;
      await user.save();
    }

    const response = NextResponse.json({
      user: { name: user.name, email: user.email, role: user.role }
    });

    response.cookies.set(COOKIE_NAME, signToken(user), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 2592000,
      path: "/"
    });

    return response;
  } catch (error) {
    console.error("Google authentication failed:", error?.message || error);
    return NextResponse.json({ error: "Google sign-in failed. Please try again." }, { status: 401 });
  }
}
