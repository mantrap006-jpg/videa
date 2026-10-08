import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { signToken, COOKIE_NAME } from "@/lib/auth";

const allowedRoles = ["viewer", "youtuber", "advertiser"];

export async function POST(request) {
  try {
    const { name, email, password, role = "viewer" } = await request.json();

    if (!name || !email || !password || password.length < 6)
      return NextResponse.json({ error: "Name, email and a 6+ character password are required." }, { status: 400 });

    if (!allowedRoles.includes(role))
      return NextResponse.json({ error: "Invalid account type." }, { status: 400 });

    await connectDB();
    const normalized = email.toLowerCase().trim();

    if (await User.findOne({ email: normalized }))
      return NextResponse.json({ error: "Email is already registered." }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name: name.trim(), email: normalized, passwordHash, role });

    const response = NextResponse.json({
      user: { name: user.name, email: user.email, role: user.role }
    });

    response.cookies.set(COOKIE_NAME, signToken(user), {
      httpOnly: true, sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 2592000, path: "/"
    });

    return response;
  } catch (e) {
    return NextResponse.json({ error: "Signup failed.", detail: e.message }, { status: 500 });
  }
}