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
    paymentNetwork: process.env.CREATOR_PAYMENT_NETWORK || "MTN / Airtel Money",
    dailyRewardPointsLimit: 100,
    dailyRewardCountLimit: 10,
    maxPointsPerVideo: 50,
    minimumWatchPercent: 80,
    monthlyFixedCostsRwf: 100000
  };
}

function serialize(saved) {
  const fallback = defaults();
  return {
    ussdNumber: saved?.ussdNumber ?? fallback.ussdNumber,
    paymentNetwork: saved?.paymentNetwork || fallback.paymentNetwork,
    dailyRewardPointsLimit: Number(saved?.dailyRewardPointsLimit ?? fallback.dailyRewardPointsLimit),
    dailyRewardCountLimit: Number(saved?.dailyRewardCountLimit ?? fallback.dailyRewardCountLimit),
    maxPointsPerVideo: Number(saved?.maxPointsPerVideo ?? fallback.maxPointsPerVideo),
    minimumWatchPercent: Number(saved?.minimumWatchPercent ?? fallback.minimumWatchPercent),
    monthlyFixedCostsRwf: Number(saved?.monthlyFixedCostsRwf ?? fallback.monthlyFixedCostsRwf)
  };
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  try {
    const saved = await PlatformSetting.findOne({ key: "payment" }).lean();
    return NextResponse.json(serialize(saved));
  } catch {
    return NextResponse.json({ error: "Could not load platform settings." }, { status: 500 });
  }
}

export async function PATCH(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;
  let body;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const current = serialize(await PlatformSetting.findOne({ key: "payment" }).lean().catch(() => null));
  const ussdNumber = String(body.ussdNumber ?? current.ussdNumber).trim();
  const paymentNetwork = String(body.paymentNetwork ?? current.paymentNetwork).trim();
  const dailyRewardPointsLimit = Number(body.dailyRewardPointsLimit ?? current.dailyRewardPointsLimit);
  const dailyRewardCountLimit = Number(body.dailyRewardCountLimit ?? current.dailyRewardCountLimit);
  const maxPointsPerVideo = Number(body.maxPointsPerVideo ?? current.maxPointsPerVideo);
  const minimumWatchPercent = Number(body.minimumWatchPercent ?? current.minimumWatchPercent);
  const monthlyFixedCostsRwf = Number(body.monthlyFixedCostsRwf ?? current.monthlyFixedCostsRwf);

  if (ussdNumber.length > 40 || !/^[+*#0-9\s()-]*$/.test(ussdNumber)) {
    return NextResponse.json({ error: "Enter a valid USSD or mobile-money payment number." }, { status: 400 });
  }
  if (!paymentNetwork || paymentNetwork.length > 80) {
    return NextResponse.json({ error: "Enter a valid payment network name." }, { status: 400 });
  }
  const validInteger = (value, min, max) => Number.isSafeInteger(value) && value >= min && value <= max;
  if (!validInteger(dailyRewardPointsLimit, 0, 100000)) {
    return NextResponse.json({ error: "Daily reward points limit must be between 0 and 100,000." }, { status: 400 });
  }
  if (!validInteger(dailyRewardCountLimit, 0, 1000)) {
    return NextResponse.json({ error: "Daily reward count limit must be between 0 and 1,000." }, { status: 400 });
  }
  if (!validInteger(maxPointsPerVideo, 0, 10000)) {
    return NextResponse.json({ error: "Maximum points per video must be between 0 and 10,000." }, { status: 400 });
  }
  if (!validInteger(minimumWatchPercent, 1, 100)) {
    return NextResponse.json({ error: "Minimum watch percentage must be between 1 and 100." }, { status: 400 });
  }
  if (!validInteger(monthlyFixedCostsRwf, 0, 1000000000)) {
    return NextResponse.json({ error: "Monthly fixed costs must be between 0 and 1,000,000,000 RWF." }, { status: 400 });
  }

  try {
    const saved = await PlatformSetting.findOneAndUpdate(
      { key: "payment" },
      { $set: { ussdNumber, paymentNetwork, dailyRewardPointsLimit, dailyRewardCountLimit, maxPointsPerVideo, minimumWatchPercent, monthlyFixedCostsRwf } },
      { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
    ).lean();
    return NextResponse.json(serialize(saved));
  } catch {
    return NextResponse.json({ error: "Could not save platform settings." }, { status: 500 });
  }
}
