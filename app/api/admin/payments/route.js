import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import SubscriptionPayment from "@/models/SubscriptionPayment";
import { getActiveUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(request) {
  const session = await getActiveUserFromRequest(request);
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const admin = await User.findById(session.sub).select("role").lean();
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Administrator access required" }, { status: 403 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const id = String(body.id || "");
  const action = String(body.action || "");
  const adminNote = String(body.adminNote || "").trim();

  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Payment ID and valid action are required" }, { status: 400 });
  }

  const payment = await SubscriptionPayment.findById(id);
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status !== "pending") return NextResponse.json({ error: "This payment has already been reviewed" }, { status: 409 });

  if (action === "approve") {
    const user = await User.findById(payment.user);
    if (!user) return NextResponse.json({ error: "Creator account not found" }, { status: 404 });

    const now = new Date();
    const currentExpiry =
      user.subscription?.status === "active" && user.subscription?.expiresAt
        ? new Date(user.subscription.expiresAt)
        : null;
    const baseDate = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const expiresAt = new Date(baseDate);
    expiresAt.setDate(expiresAt.getDate() + 30);

    user.role = "creator";
    user.subscription = { plan: "creator", status: "active", expiresAt };
    await user.save();

    payment.status = "approved";
    payment.adminNote = adminNote;
    payment.verifiedBy = session.sub;
    payment.verifiedAt = now;
    await payment.save();

    return NextResponse.json({ payment: { status: payment.status, adminNote: payment.adminNote, verifiedAt: payment.verifiedAt?.toISOString() || null } });
  }

  payment.status = "rejected";
  payment.adminNote = adminNote;
  payment.verifiedBy = session.sub;
  payment.verifiedAt = new Date();
  await payment.save();

  return NextResponse.json({ payment: { status: payment.status, adminNote: payment.adminNote, verifiedAt: payment.verifiedAt?.toISOString() || null } });
}
