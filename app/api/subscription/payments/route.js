import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import SubscriptionPayment from "@/models/SubscriptionPayment";
import { getActiveUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

function priceRwf() {
  return Number(process.env.CREATOR_SUBSCRIPTION_PRICE_RWF || 5000);
}

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
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phone = String(body.phone || "").trim();
  const senderName = String(body.senderName || "").trim();
  const amountRwf = Number(body.amountRwf);

  if (!phone || !senderName || senderName.length > 120) {
    return NextResponse.json({ error: "Phone and sender name are required" }, { status: 400 });
  }
  if (!Number.isFinite(amountRwf) || amountRwf !== priceRwf()) {
    return NextResponse.json({ error: `Payment amount must be ${priceRwf().toLocaleString()} RWF` }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session.sub).select("role").lean();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "creator") {
    return NextResponse.json({ error: "Only Creator accounts can subscribe" }, { status: 403 });
  }

  const payment = await SubscriptionPayment.create({
    user: session.sub,
    plan: "creator",
    amountRwf,
    phone,
    senderName,
    transactionReference: `legacy-${randomUUID()}`,
    status: "pending"
  });

  return NextResponse.json(
    { payment: { id: payment._id.toString(), status: payment.status } },
    { status: 201 }
  );
}
