import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import SubscriptionPayment from "@/models/SubscriptionPayment";
import Video from "@/models/Video";
import { getActiveUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PLANS = {
  monthly: {
    id: "monthly",
    name: "Starter Creator",
    amountRwf: 12000,
    days: 30,
    videoLimit: 5,
    maxVideoMinutes: 10
  },
  quarterly: {
    id: "quarterly",
    name: "Growth Creator",
    amountRwf: 30000,
    days: 90,
    videoLimit: 15,
    maxVideoMinutes: 20
  },
  annual: {
    id: "annual",
    name: "Pro Creator",
    amountRwf: 50000,
    days: 365,
    videoLimit: 50,
    maxVideoMinutes: 30
  }
};

export async function GET(request) {
  const session = await getActiveUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const user = await User.findById(session.sub).select("role").lean();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!["creator", "admin"].includes(user.role)) {
    return NextResponse.json({ error: "Creator account required" }, { status: 403 });
  }

  const query = user.role === "admin" ? {} : { user: session.sub };
  const payments = await SubscriptionPayment.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  return NextResponse.json({ payments });
}

export async function POST(request) {
  const session = await getActiveUserFromRequest(request);
  if (!session?.sub) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const planId = String(body.plan || "monthly").trim();
  const plan = PLANS[planId];
  if (!plan) {
    return NextResponse.json({ error: "Choose a valid subscription plan." }, { status: 400 });
  }

  try {
  await connectDB();
  const existingUser = await User.findById(session.sub).select("role points subscription").lean();
  if (!existingUser) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (existingUser.role !== "creator") {
    return NextResponse.json({ error: "Only Creator accounts can subscribe." }, { status: 403 });
  }

  const now = new Date();
  const subscriptionIsActive =
    existingUser.subscription?.status === "active" &&
    (!existingUser.subscription?.expiresAt || new Date(existingUser.subscription.expiresAt) > now);

  if (subscriptionIsActive && existingUser.subscription?.plan === plan.id) {
    return NextResponse.json({
      error: "This is already your current plan. You cannot purchase the same plan again while it is active.",
      code: "PLAN_ALREADY_ACTIVE",
      currentPlan: existingUser.subscription.plan,
      expiresAt: existingUser.subscription.expiresAt || null
    }, { status: 409 });
  }

  // Every successful purchase starts a fresh access period from the purchase time.
  // The database condition below also prevents concurrent duplicate purchases.
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + plan.days);

  // Points are credited only after a deposit is approved. One point equals one RWF.
  // The same-plan condition is part of the atomic update to close request races.
  const updatedUser = await User.findOneAndUpdate(
    {
      _id: session.sub,
      role: "creator",
      points: { $gte: plan.amountRwf },
      $or: [
        { "subscription.status": { $ne: "active" } },
        { "subscription.expiresAt": { $lte: now } },
        { "subscription.plan": { $ne: plan.id } }
      ]
    },
    {
      $inc: { points: -plan.amountRwf },
      $set: {
        "subscription.plan": plan.id,
        "subscription.status": "active",
        "subscription.expiresAt": expiresAt
      }
    },
    { new: true, runValidators: true }
  ).select("points subscription").lean();

  if (!updatedUser) {
    // Refresh from the database to distinguish a duplicate request from low balance.
    const latestUser = await User.findById(session.sub).select("points subscription").lean();
    const latestSubscriptionActive = latestUser?.subscription?.status === "active" &&
      (!latestUser.subscription?.expiresAt || new Date(latestUser.subscription.expiresAt) > new Date());

    if (latestSubscriptionActive && latestUser.subscription?.plan === plan.id) {
      return NextResponse.json({
        error: "This is already your current plan. You cannot purchase the same plan again while it is active.",
        code: "PLAN_ALREADY_ACTIVE",
        currentPlan: latestUser.subscription.plan,
        expiresAt: latestUser.subscription.expiresAt || null
      }, { status: 409 });
    }

    return NextResponse.json({
      error: `You need ${plan.amountRwf.toLocaleString()} points for this plan. Please deposit and wait for admin approval first.`,
      requiredPoints: plan.amountRwf,
      availablePoints: Number(latestUser?.points || 0)
    }, { status: 400 });
  }

  // Reset the active promotion slots after successful payment so the creator can
  // start the new subscription period with a fresh video allowance. Existing videos
  // remain in the database for historical statistics, but are no longer promoted.
  await Video.updateMany(
    { creator: session.sub, active: true },
    { $set: { active: false } }
  );

  return NextResponse.json({
    subscription: {
      plan: plan.id,
      status: "active",
      expiresAt: updatedUser.subscription?.expiresAt,
      days: plan.days
    },
    wallet: { points: updatedUser.points },
    message: `${plan.name} activated using ${plan.amountRwf.toLocaleString()} points.`
  }, { status: 200 });
  } catch (error) {
    console.error("Subscription payment POST failed:", error);
    return NextResponse.json({ error: "Could not activate the subscription right now. Please refresh your wallet and subscription status before trying again." }, { status: 500 });
  }
}
