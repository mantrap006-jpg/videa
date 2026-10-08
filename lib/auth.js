import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";

const COOKIE_NAME = "videa_token";

export function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

export function getTokenFromRequest(request) {
  return request.cookies.get(COOKIE_NAME)?.value || null;
}

export function getUserFromRequest(request) {
  const token = getTokenFromRequest(request);
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export async function getActiveUserFromRequest(request) {
  const session = getUserFromRequest(request);
  if (!session?.sub) return null;

  await connectDB();
  const user = await User.findById(session.sub).select("status").lean();
  if (!user || user.status === "suspended") return null;
  return session;
}

export { COOKIE_NAME };