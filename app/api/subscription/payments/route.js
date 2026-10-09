import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import SubscriptionPayment from "@/models/SubscriptionPayment";
import { getActiveUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

const PLANS = {
  monthly: {
    id: "monthly",
    name: "Monthly Creator",
    amountRwf: Number(process.env.CREATOR_SUBSCRIPTION_PRICE_RWF || 5000),
    days: 30
  },
  quarterly: {
    id: "quarterly",
    name: "Quarterly Creator",
    amountRwf: Number(process.env.CREATOR_QUARTERLY_PRICE_RWF || 13500),
    days: 90
  },
  annual: {
    id: "annual",
    name: "Annual Creator",
    amountRwf: Number(process.env.CREATOR_ANNUAL_PRICE_RWF || 50000),
    days: 365
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
  const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const expiresAt = new Date(baseDate);
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
}
