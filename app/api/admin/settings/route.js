import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getActiveUserFromRequest } from "@/lib/auth";
import User from "@/models/User";
import PlatformSetting from "@/models/PlatformSetting";

export const dynamic = "force-dynamic";

async function requireAdmin(request) {
  const session = await getActiveUserFromRequest(request);
  if (!session?.sub) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  await connectDB();
  const admin = await User.findById(session.sub).select("role").lean();
  if (!admin || admin.role !== "admin") {
    return { error: NextResponse.json({ error: "Administrator access required." }, { status: 403 }) };
  }
  return {};
}

function defaults() {
  return {
    ussdNumber: process.env.CREATOR_USSD_NUMBER || "",
    paymentNetwork: process.env.CREATOR_PAYMENT_NETWORK || "MTN / Airtel Money"
  };
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const saved = await PlatformSetting.findOne({ key: "payment" }).lean();
    return NextResponse.json(saved ? {
      ussdNumber: saved.ussdNumber || "",
      paymentNetwork: saved.paymentNetwork || defaults().paymentNetwork
    } : defaults());
  } catch {
    return NextResponse.json({ error: "Could not load payment settings." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const ussdNumber = String(body.ussdNumber || "").trim();
  const paymentNetwork = String(body.paymentNetwork || "MTN / Airtel Money").trim();
  if (ussdNumber.length > 40 || !/^[+*#0-9\\s()-]*$/.test(ussdNumber)) {
    return NextResponse.json({ error: "Enter a valid USSD or mobile-money payment number." }, { status: 400 });
  }
  if (paymentNetwork.length > 80) {
    return NextResponse.json({ error: "Payment network name is too long." }, { status: 400 });
  }

  try {
    const saved = await PlatformSetting.findOneAndUpdate(
      { key: "payment" },
      { $set: { ussdNumber, paymentNetwork } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    ).lean();
    return NextResponse.json({ ussdNumber: saved.ussdNumber, paymentNetwork: saved.paymentNetwork });
  } catch {
    return NextResponse.json({ error: "Could not save payment settings." }, { status: 500 });
  }
}
