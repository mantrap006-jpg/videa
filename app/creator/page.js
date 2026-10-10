import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import CreatorClient from "./CreatorClient";

export const dynamic = "force-dynamic";

export default async function CreatorPage() {
  const token = (await cookies()).get("videa_token")?.value;
  if (!token || !process.env.JWT_SECRET) redirect("/login");

  let session;
  try {
    session = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    redirect("/login");
  }

  await connectDB();
  const user = await User.findById(session.sub).select("role subscription").lean();

  if (!user || !["creator", "admin"].includes(user.role)) {
    redirect("/dashboard");
  }

  const now = new Date();
  const subscriptionActive =
    user.role === "admin" ||
    (user.subscription?.status === "active" &&
      (!user.subscription?.expiresAt || new Date(user.subscription.expiresAt) > now));

  return (
    <CreatorClient
      subscriptionActive={subscriptionActive}
      subscriptionExpiresAt={user.subscription?.expiresAt?.toISOString?.() || null}
    />
  );
}
