import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getActiveUserFromRequest } from "@/lib/auth";
import User from "@/models/User";
import Earning from "@/models/Earning";
import Withdrawal from "@/models/Withdrawal";
import Deposit from "@/models/Deposit";

export const dynamic = "force-dynamic";
const POINTS_TO_RWF = 1;
const MIN_WITHDRAWAL_POINTS = 100;

export async function GET(request) {
  const session = await getActiveUserFromRequest(request);
  if (!session?.sub) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  await connectDB();
  const user = await User.findById(session.sub).select("name points").lean();
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const [earnings, withdrawals, deposits] = await Promise.all([
    Earning.find({ userId: session.sub }).sort({ createdAt: -1 }).limit(30).populate("videoId", "title").lean(),
    Withdrawal.find({ user: session.sub }).sort({ createdAt: -1 }).limit(30).lean(),
    Deposit.find({ user: session.sub }).sort({ createdAt: -1 }).limit(30).lean()
  ]);

  return NextResponse.json({
    wallet: { name: user.name, points: user.points || 0, balanceRwf: (user.points || 0) * POINTS_TO_RWF, pointValueRwf: POINTS_TO_RWF, minimumWithdrawalPoints: MIN_WITHDRAWAL_POINTS },
    earnings: earnings.map(item => ({ id: item._id.toString(), title: item.videoId?.title || "Video reward", points: item.points, createdAt: item.createdAt })),
    withdrawals: withdrawals.map(item => ({ id: item._id.toString(), points: item.points, amountRwf: item.amountRwf, phone: item.phone, network: item.network, status: item.status, adminNote: item.adminNote, createdAt: item.createdAt, reviewedAt: item.reviewedAt })),
    deposits: deposits.map(item => ({ id: item._id.toString(), points: item.points, amountRwf: item.amountRwf, phone: item.phone, network: item.network, senderName: item.senderName || "", transactionReference: item.transactionReference, status: item.status, adminNote: item.adminNote, createdAt: item.createdAt, reviewedAt: item.reviewedAt }))
  });
}

export async function POST(request) {
  const session = await getActiveUserFromRequest(request);
  if (!session?.sub) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const points = Number(body.points);
  const phone = String(body.phone || "").trim();
  const network = String(body.network || "").trim();

  if (!Number.isSafeInteger(points) || points < MIN_WITHDRAWAL_POINTS) {
    return NextResponse.json({ error: `Minimum withdrawal is ${MIN_WITHDRAWAL_POINTS} points.` }, { status: 400 });
  }
  if (!phone || phone.length < 8 || phone.length > 20 || !network || network.length > 40) {
    return NextResponse.json({ error: "Enter a valid phone number and mobile money network." }, { status: 400 });
  }

  await connectDB();
  const user = await User.findOneAndUpdate(
    { _id: session.sub, points: { $gte: points } },
    { $inc: { points: -points } },
    { new: true }
  ).select("points").lean();

  if (!user) return NextResponse.json({ error: "Insufficient points for this withdrawal." }, { status: 400 });

  try {
    const withdrawal = await Withdrawal.create({
      user: session.sub, points, amountRwf: points * POINTS_TO_RWF,
      phone, network, status: "pending"
    });
    return NextResponse.json({
      withdrawal: { id: withdrawal._id.toString(), points, amountRwf: withdrawal.amountRwf, status: withdrawal.status },
      wallet: { points: user.points, balanceRwf: user.points * POINTS_TO_RWF }
    }, { status: 201 });
  } catch {
    await User.updateOne({ _id: session.sub }, { $inc: { points } });
    return NextResponse.json({ error: "Could not create withdrawal request. Your points were returned." }, { status: 500 });
  }
}
