import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getActiveUserFromRequest } from "@/lib/auth";
import User from "@/models/User";
import Video from "@/models/Video";
import Deposit from "@/models/Deposit";
import Withdrawal from "@/models/Withdrawal";
import SubscriptionPayment from "@/models/SubscriptionPayment";
import Earning from "@/models/Earning";

export const dynamic = "force-dynamic";

async function requireAdmin(request) {
  const session = await getActiveUserFromRequest(request);
  if (!session?.sub) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  await connectDB();
  const admin = await User.findById(session.sub).select("role").lean();
  if (!admin || admin.role !== "admin") {
    return { error: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) };
  }
  return { session };
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [
      usersCount, creatorCount, videoCount, activeVideoCount,
      pendingDeposits, pendingWithdrawals, pendingSubscriptions,
      users, videos, rewards24h, flaggedGroups
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "creator" }),
      Video.countDocuments({}),
      Video.countDocuments({ active: true }),
      Deposit.countDocuments({ status: "pending" }),
      Withdrawal.countDocuments({ status: "pending" }),
      SubscriptionPayment.countDocuments({ status: "pending" }),
      User.find({}).select("name email role points status subscription createdAt").sort({ createdAt: -1 }).limit(100).lean(),
      Video.find({}).select("title youtubeUrl active rewardPoints minimumWatchPercent createdAt updatedAt").sort({ updatedAt: -1 }).limit(100).lean(),
      Earning.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: null, count: { $sum: 1 }, points: { $sum: "$points" } } }
      ]),
      Earning.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: "$userId", rewardCount: { $sum: 1 }, points: { $sum: "$points" }, lastRewardAt: { $max: "$createdAt" } } },
        { $match: { rewardCount: { $gte: 10 } } },
        { $sort: { rewardCount: -1 } },
        { $limit: 30 }
      ])
    ]);

    const flaggedUserIds = flaggedGroups.map((item) => item._id).filter(Boolean);
    const flaggedUsers = flaggedUserIds.length
      ? await User.find({ _id: { $in: flaggedUserIds } }).select("name email role status").lean()
      : [];
    const flaggedById = new Map(flaggedUsers.map((user) => [user._id.toString(), user]));

    return NextResponse.json({
      stats: {
        usersCount, creatorCount, videoCount, activeVideoCount,
        pendingDeposits, pendingWithdrawals, pendingSubscriptions,
        rewards24h: rewards24h[0]?.count || 0,
        pointsIssued24h: rewards24h[0]?.points || 0
      },
      users: users.map((user) => ({
        id: user._id.toString(), name: user.name, email: user.email, role: user.role,
        points: user.points || 0, status: user.status || "active",
        plan: user.subscription?.plan || "free",
        subscriptionStatus: user.subscription?.status || "inactive",
        createdAt: user.createdAt?.toISOString() || null
      })),
      videos: videos.map((video) => ({
        id: video._id.toString(), title: video.title, youtubeUrl: video.youtubeUrl,
        active: video.active !== false, rewardPoints: video.rewardPoints || 0,
        minimumWatchPercent: video.minimumWatchPercent || 80,
        updatedAt: video.updatedAt?.toISOString() || null
      })),
      flags: flaggedGroups.map((item) => {
        const user = flaggedById.get(item._id?.toString());
        return {
          userId: item._id?.toString(), userName: user?.name || "Unknown user",
          email: user?.email || "", role: user?.role || "unknown",
          status: user?.status || "active", rewardCount: item.rewardCount,
          points: item.points, lastRewardAt: item.lastRewardAt?.toISOString() || null,
          reason: "10 or more video rewards recorded in the last 24 hours"
        };
      })
    });
  } catch (error) {
    return NextResponse.json({ error: "Could not load admin control center." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const action = String(body.action || "");
  const id = String(body.id || "");
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "A valid record ID is required." }, { status: 400 });
  }

  if (action === "suspend-user" || action === "activate-user") {
    if (id === auth.session.sub) {
      return NextResponse.json({ error: "You cannot change your own account status here." }, { status: 400 });
    }
    const target = await User.findById(id).select("role").lean();
    if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
    if (target.role === "admin") {
      return NextResponse.json({ error: "Administrator accounts cannot be suspended from this screen." }, { status: 403 });
    }
    const status = action === "suspend-user" ? "suspended" : "active";
    const user = await User.findByIdAndUpdate(id, { $set: { status } }, { new: true })
      .select("name email role status").lean();
    return NextResponse.json({ user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role, status: user.status } });
  }

  if (action === "toggle-video") {
    if (typeof body.active !== "boolean") {
      return NextResponse.json({ error: "Video active state is required." }, { status: 400 });
    }
    const video = await Video.findByIdAndUpdate(id, { $set: { active: body.active } }, { new: true })
      .select("title active").lean();
    if (!video) return NextResponse.json({ error: "Video not found." }, { status: 404 });
    return NextResponse.json({ video: { id: video._id.toString(), title: video.title, active: video.active } });
  }

  return NextResponse.json({ error: "Unsupported admin action." }, { status: 400 });
}
