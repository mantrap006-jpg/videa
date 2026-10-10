import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const token = (await cookies()).get("videa_token")?.value;
  if (!token || !process.env.JWT_SECRET) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let session;
  try { session = jwt.verify(token, process.env.JWT_SECRET); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.sub)
    .select("name email role points status subscription createdAt")
    .lean();
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  return NextResponse.json({
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      points: user.points,
      status: user.status,
      subscription: user.subscription,
      createdAt: user.createdAt
    }
  });
}
