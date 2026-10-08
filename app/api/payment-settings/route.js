import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import PlatformSetting from "@/models/PlatformSetting";

export const dynamic = "force-dynamic";

export async function GET() {
  const defaults = {
    ussdNumber: process.env.CREATOR_USSD_NUMBER || "",
    paymentNetwork: process.env.CREATOR_PAYMENT_NETWORK || "MTN / Airtel Money"
  };
  try {
    await connectDB();
    const saved = await PlatformSetting.findOne({ key: "payment" }).lean();
    return NextResponse.json(saved ? {
      ussdNumber: saved.ussdNumber || "",
      paymentNetwork: saved.paymentNetwork || defaults.paymentNetwork
    } : defaults);
  } catch {
    return NextResponse.json(defaults);
  }
}
