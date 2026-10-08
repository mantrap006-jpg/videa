import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import SubscriptionPayment from "@/models/SubscriptionPayment";
import { getUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

function priceRwf() {
  return Number(process.env.CREATOR_SUBSCRIPTION_PRICE_RWF || 5000);
}

export async function GET(request) {
  const session = getUserFromRequest(request);
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
  const session = getUserFromRequest(request);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phone = String(body.phone || "").trim();
  const transactionReference = String(body.transactionReference || "").trim();
  const amountRwf = Number(body.amountRwf);

  if (!phone || !transactionReference) {
    return NextResponse.json({ error: "Phone and transaction reference are required" }, { status: 400 });
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

  const duplicate = await SubscriptionPayment.findOne({ transactionReference }).lean();
  if (duplicate) {
    return NextResponse.json({ error: "This transaction reference has already been submitted" }, { status: 409 });
  }

  const payment = await SubscriptionPayment.create({
    user: session.sub,
    plan: "creator",
    amountRwf,
    phone,
    transactionReference,
    status: "pending"
  });

  return NextResponse.json(
    { payment: { id: payment._id.toString(), status: payment.status } },
    { status: 201 }
  );
}
