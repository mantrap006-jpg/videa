import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getActiveUserFromRequest } from "@/lib/auth";
import User from "@/models/User";
import Deposit from "@/models/Deposit";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const session = await getActiveUserFromRequest(request);
  if (!session?.sub) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const amountRwf = Number(body.amountRwf);
  const phone = String(body.phone || "").trim();
  const network = String(body.network || "").trim();
  const transactionReference = String(body.transactionReference || "").trim();

  if (!Number.isSafeInteger(amountRwf) || amountRwf < 100 || amountRwf > 10000000) {
    return NextResponse.json({ error: "Deposit amount must be between 100 and 10,000,000 RWF." }, { status: 400 });
  }
  if (!phone || phone.length < 8 || phone.length > 20 || !network || network.length > 40 || !transactionReference || transactionReference.length > 120) {
    return NextResponse.json({ error: "Enter your payment phone, network, and transaction reference." }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session.sub).select("_id").lean();
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  try {
    const deposit = await Deposit.create({
      user: session.sub, amountRwf, points: amountRwf, phone, network,
      transactionReference, status: "pending"
    });
    return NextResponse.json({
      deposit: { id: deposit._id.toString(), amountRwf, points: deposit.points, status: deposit.status }
    }, { status: 201 });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: "This transaction reference has already been submitted." }, { status: 409 });
    }
    return NextResponse.json({ error: "Could not submit deposit request." }, { status: 500 });
  }
}
