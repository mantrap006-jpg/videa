import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getActiveUserFromRequest } from "@/lib/auth";
import User from "@/models/User";
import CryptoPayment from "@/models/CryptoPayment";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function getMode() {
  return process.env.PAYCLAVE_MODE === "test" || process.env.PAYCLAVE_MODE === "live"
    ? process.env.PAYCLAVE_MODE : null;
}

export async function GET(request) {
  const session = await getActiveUserFromRequest(request);
  if (!session?.sub) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  try {
    await connectDB();
    const items = await CryptoPayment.find({ user: session.sub })
      .sort({ createdAt: -1 }).limit(20)
      .select("externalReference amountUsdc points status createdAt paidAt checkoutUrl providerMode")
      .lean();
    return NextResponse.json({ rateRwfPerUsdc: Number(process.env.USDC_RWF_RATE) || null, payments: items.map(item => ({
      id: item._id.toString(), reference: item.externalReference, amountUsdc: item.amountUsdc,
      points: item.points, status: item.status, createdAt: item.createdAt,
      paidAt: item.paidAt, checkoutUrl: item.status === "pending" ? item.checkoutUrl : ""
    })) });
  } catch (error) {
    console.error("Crypto payment history failed:", error);
    return NextResponse.json({ error: "Crypto payment history is temporarily unavailable." }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getActiveUserFromRequest(request);
  if (!session?.sub) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const mode = getMode();
  const secretKey = process.env.PAYCLAVE_SECRET_KEY;
  const rate = Number(process.env.USDC_RWF_RATE);
  if (!mode || !secretKey || !Number.isSafeInteger(rate) || rate < 1) {
    return NextResponse.json({ error: "USDC checkout is not configured yet. Please use the existing RWF deposit option." }, { status: 503 });
  }

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const cents = Number(body.amountCents);
  if (!Number.isSafeInteger(cents) || cents < 100 || cents > 100000000) {
    return NextResponse.json({ error: "Choose a USDC amount between $1.00 and $1,000,000.00." }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session.sub).select("_id name email role").lean();
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (user.role !== "creator") return NextResponse.json({ error: "Only creator accounts can fund a wallet." }, { status: 403 });

  const amountUsdc = (cents / 100).toFixed(2);
  const points = Math.floor((cents * rate) / 100);
  if (!Number.isSafeInteger(points) || points < 100) {
    return NextResponse.json({ error: "This payment is too small to credit at the configured exchange rate." }, { status: 400 });
  }
  const externalReference = "videa_usdc_" + randomUUID();
  const payment = await CryptoPayment.create({
    user: user._id, externalReference, amountUsdc, points, rateRwfPerUsdc: rate,
    providerMode: mode, status: "pending"
  });

  try {
    const origin = (process.env.APP_BASE_URL || "https://videapro.site").replace(/\/$/, "");
    const response = await fetch("https://api.payclave.com/v1/checkout-sessions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + secretKey,
        "Content-Type": "application/json",
        "Idempotency-Key": externalReference
      },
      body: JSON.stringify({
        amount: amountUsdc,
        externalReference,
        customerEmail: typeof user.email === "string" ? user.email : undefined,
        successUrl: origin + "/wallet?crypto=return",
        cancelUrl: origin + "/wallet?crypto=cancel",
        metadata: { product: "videa_wallet_topup", userId: user._id.toString(), points, currencyCode: "USDC" }
      }),
      signal: AbortSignal.timeout(12000)
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || result?.success !== true || !result?.data?.checkoutUrl) {
      await CryptoPayment.updateOne({ _id: payment._id, status: "pending" }, { $set: { status: "failed" } });
      console.error("Payclave checkout creation failed:", response.status, result?.error?.code || "provider_error");
      return NextResponse.json({ error: "Could not create the USDC checkout. Please try again or use RWF deposit." }, { status: 502 });
    }

    const checkout = result.data;
    const token = String(checkout.tokenSymbol || checkout.currencyCode || "").toUpperCase();
    if (token !== "USDC") {
      await CryptoPayment.updateOne({ _id: payment._id }, { $set: { status: "failed" } });
      console.error("Payclave merchant settlement token is not USDC.");
      return NextResponse.json({ error: "USDC is not enabled for this checkout account. Please contact Videa support." }, { status: 503 });
    }

    let checkoutUrl;
    try {
      checkoutUrl = new URL(checkout.checkoutUrl);
      if (checkoutUrl.protocol !== "https:" || !["payclave.com", "www.payclave.com"].includes(checkoutUrl.hostname)) {
        throw new Error("Invalid provider checkout URL");
      }
    } catch {
      await CryptoPayment.updateOne({ _id: payment._id }, { $set: { status: "failed" } });
      console.error("Payclave returned an invalid checkout URL.");
      return NextResponse.json({ error: "The payment provider returned an invalid checkout link." }, { status: 502 });
    }
    await CryptoPayment.updateOne({ _id: payment._id }, { $set: {
      invoiceId: String(checkout.invoiceId || ""),
      checkoutId: String(checkout.checkoutId || ""),
      checkoutUrl: checkoutUrl.toString()
    } });
    return NextResponse.json({ checkoutUrl: checkoutUrl.toString(), amountUsdc, points }, { status: 201 });
  } catch (error) {
    await CryptoPayment.updateOne({ _id: payment._id, status: "pending" }, { $set: { status: "failed" } }).catch(() => {});
    console.error("Payclave checkout request failed:", error?.name || "unknown_error");
    return NextResponse.json({ error: "Checkout provider is temporarily unavailable. Please try again." }, { status: 502 });
  }
}
