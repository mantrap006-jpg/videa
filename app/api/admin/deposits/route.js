import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getActiveUserFromRequest } from "@/lib/auth";
import User from "@/models/User";
import Deposit from "@/models/Deposit";

export const dynamic = "force-dynamic";

export async function PATCH(request) {
  const session = await getActiveUserFromRequest(request);
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const id = String(body.id || "");
  const action = String(body.action || "");
  const adminNote = String(body.adminNote || "").trim();
  if (!id || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Deposit ID and valid action are required." }, { status: 400 });
  }

  await connectDB();
  const admin = await User.findById(session.sub).select("role").lean();
  if (!admin || admin.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  const deposit = await Deposit.findOneAndUpdate(
    { _id: id, status: "pending" },
    { $set: { status: action === "approve" ? "approved" : "rejected", adminNote, reviewedBy: session.sub, reviewedAt: new Date() } },
    { new: true }
  );
  if (!deposit) {
    const exists = await Deposit.findById(id).select("status").lean();
    return NextResponse.json({ error: exists ? "This deposit was already reviewed." : "Deposit not found." }, { status: exists ? 409 : 404 });
  }

  if (action === "approve") {
    await User.updateOne({ _id: deposit.user }, { $inc: { points: deposit.points } });
  }

  return NextResponse.json({ deposit: {
    id: deposit._id.toString(), status: deposit.status, adminNote: deposit.adminNote,
    reviewedAt: deposit.reviewedAt, points: deposit.points, amountRwf: deposit.amountRwf
  } });
}
