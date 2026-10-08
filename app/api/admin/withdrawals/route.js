import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import User from "@/models/User";
import Withdrawal from "@/models/Withdrawal";

export const dynamic = "force-dynamic";

export async function PATCH(request) {
  const session = getUserFromRequest(request);
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const id = String(body.id || "");
  const action = String(body.action || "");
  const adminNote = String(body.adminNote || "").trim();
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Withdrawal ID and valid action are required." }, { status: 400 });
  }

  await connectDB();
  const admin = await User.findById(session.sub).select("role").lean();
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  // Conditional update guarantees a request is reviewed only once.
  const withdrawal = await Withdrawal.findOneAndUpdate(
    { _id: id, status: "pending" },
    { $set: { status: action === "approve" ? "approved" : "rejected", adminNote, reviewedBy: session.sub, reviewedAt: new Date() } },
    { new: true }
  );
  if (!withdrawal) {
    const exists = await Withdrawal.findById(id).select("status").lean();
    return NextResponse.json({ error: exists ? "This withdrawal was already reviewed." : "Withdrawal not found." }, { status: exists ? 409 : 404 });
  }

  // Points were reserved when requested. If rejected, return them exactly once.
  if (action === "reject") {
    await User.updateOne({ _id: withdrawal.user }, { $inc: { points: withdrawal.points } });
  }

  return NextResponse.json({ withdrawal: {
    id: withdrawal._id.toString(), status: withdrawal.status,
    adminNote: withdrawal.adminNote, reviewedAt: withdrawal.reviewedAt
  } });
}
