import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import SubscriptionPayment from "@/models/SubscriptionPayment";
import { getActiveUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function requireAdmin(request) {
  const session = await getActiveUserFromRequest(request);
  if (!session) return null;

  await connectDB();
  const user = await User.findById(session.sub).select("role").lean();
  return user?.role === "admin" ? { session, user } : null;
}

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const payments = await SubscriptionPayment.find({ status: "pending" })
    .populate("user", "name email")
    .sort({ createdAt: 1 })
    .lean();

  return NextResponse.json({
    payments: payments.map((p) => ({
      id: p._id.toString(),
      name: p.user?.name || "Unknown",
      email: p.user?.email || "",
      amountRwf: p.amountRwf,
      phone: p.phone,
      transactionReference: p.transactionReference,
      createdAt: p.createdAt
    }))
  });
}

export async function PATCH(request) {
  const admin = await requireAdmin(request);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = String(body.id || "").trim();
  const action = String(body.action || "").trim().toLowerCase();
  const note = String(body.note || "").trim();

  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "A valid payment id and action are required" }, { status: 400 });
  }

  const payment = await SubscriptionPayment.findById(id);
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status !== "pending") {
    return NextResponse.json({ error: "This payment has already been reviewed" }, { status: 409 });
  }

  if (action === "reject") {
    payment.status = "rejected";
    payment.adminNote = note || "Payment could not be verified.";
    payment.verifiedBy = admin.session.sub;
    payment.verifiedAt = new Date();
    await payment.save();

    return NextResponse.json({ ok: true, status: "rejected" });
  }

  const user = await User.findById(payment.user);
  if (!user) return NextResponse.json({ error: "Creator account not found" }, { status: 404 });

  const now = new Date();
  const currentExpiry =
    user.subscription?.status === "active" && user.subscription?.expiresAt
      ? new Date(user.subscription.expiresAt)
      : null;
  const start = currentExpiry && currentExpiry > now ? currentExpiry : now;
  const expiresAt = new Date(start);
  expiresAt.setDate(expiresAt.getDate() + 30);

  user.subscription = {
    plan: "creator",
    status: "active",
    expiresAt
  };
  await user.save();

  payment.status = "approved";
  payment.adminNote = note;
  payment.verifiedBy = admin.session.sub;
  payment.verifiedAt = new Date();
  await payment.save();

  return NextResponse.json({ ok: true, status: "approved", expiresAt });
}
