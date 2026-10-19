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
  const currentExpiry =
    existingUser.subscription?.status === "active" && existingUser.subscription?.expiresAt
      ? new Date(existingUser.subscription.expiresAt)
      : null;
  // Every successful purchase starts a fresh access period from the purchase time.
  // This prevents a renewal from carrying an old countdown forward.
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + plan.days);

  // Points are credited only after a deposit is approved. One point equals one RWF
  // for subscription pricing; no mobile-money transfer is initiated here.
  const updatedUser = await User.findOneAndUpdate(
    { _id: session.sub, role: "creator", points: { $gte: plan.amountRwf } },
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
    return NextResponse.json({
      error: `You need ${plan.amountRwf.toLocaleString()} points for this plan. Please deposit and wait for admin approval first.`,
      requiredPoints: plan.amountRwf,
      availablePoints: Number(existingUser.points || 0)
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
