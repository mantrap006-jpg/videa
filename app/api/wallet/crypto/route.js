import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getActiveUserFromRequest } from "@/lib/auth";
import User from "@/models/User";
import CryptoPayment from "@/models/CryptoPayment";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request) {
  const session = await getActiveUserFromRequest(request);
  if (!session?.sub) return NextResponse.json({ error: "Please log in." }, { status: 401 });
  try {
    await connectDB();
    const items = await CryptoPayment.find({ user: session.sub })
      .sort({ createdAt: -1 }).limit(20)
      .select("externalReference amountUsd amountUsdc points status createdAt paidAt checkoutUrl providerMode")
      .lean();
    return NextResponse.json({
      rateRwfPerUsd: Number(process.env.CRYPTO_USD_RWF_RATE) || null,
      payments: items.map(item => ({
        id: item._id.toString(),
        reference: item.externalReference,
        amountUsd: item.amountUsd ?? item.amountUsdc ?? "0.00",
        points: item.points,
        status: item.status,
        createdAt: item.createdAt,
        paidAt: item.paidAt,
        checkoutUrl: item.status === "pending" ? item.checkoutUrl : ""
      }))
    });
  } catch (error) {
    console.error("Crypto payment history failed:", error);
    return NextResponse.json({ error: "Crypto payment history is temporarily unavailable." }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await getActiveUserFromRequest(request);
  if (!session?.sub) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const apiKey = process.env.FLOWPAY_API_KEY;
  const rate = Number(process.env.CRYPTO_USD_RWF_RATE);
  if (!apiKey || !Number.isSafeInteger(rate) || rate < 1) {
    return NextResponse.json({ error: "Crypto checkout is not configured yet. Please use the existing RWF deposit option." }, { status: 503 });
  }

  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const cents = Number(body.amountCents);
  if (!Number.isSafeInteger(cents) || cents < 100 || cents > 100000000) {
    return NextResponse.json({ error: "Choose an amount between $1.00 and $1,000,000.00." }, { status: 400 });
  }

  await connectDB();
  const user = await User.findById(session.sub).select("_id name email role").lean();
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  if (user.role !== "creator") return NextResponse.json({ error: "Only creator accounts can fund a wallet." }, { status: 403 });

  const amountUsd = (cents / 100).toFixed(2);
  const points = Math.floor((cents * rate) / 100);
  if (!Number.isSafeInteger(points) || points < 1) {
    return NextResponse.json({ error: "This payment is too small to credit at the configured exchange rate." }, { status: 400 });
  }
  const externalReference = "videa_crypto_" + randomUUID();
  const payment = await CryptoPayment.create({
    user: user._id,
    externalReference,
    amountUsd,
    points,
    rateRwfPerUsd: rate,
    providerMode: "live",
    status: "pending"
  });

  try {
    const origin = (process.env.APP_BASE_URL || "https://videapro.site").replace(/\/$/, "");
    const response = await fetch("https://flowpay.network/v1/charges", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
        "Idempotency-Key": externalReference
      },
      body: JSON.stringify({
        amount: Number(amountUsd),
        currency: "USD",
        order_id: externalReference,
        metadata: {
          product: "videa_wallet_topup",
          userId: user._id.toString(),
          points,
          currency: "USD"
        }
      }),
      signal: AbortSignal.timeout(12000)
    });
    const result = await response.json().catch(() => null);
    const hosted = result?.hosted_url;
    if (!response.ok || !result?.id || !hosted) {
      await CryptoPayment.updateOne({ _id: payment._id, status: "pending" }, { $set: { status: "failed" } });
      console.error("FlowPay charge creation failed:", response.status);
      return NextResponse.json({ error: "Could not create crypto checkout. Please try again or use RWF deposit." }, { status: 502 });
    }

    let checkoutUrl;
    try {
      checkoutUrl = new URL(hosted);
      if (checkoutUrl.protocol !== "https:" || checkoutUrl.hostname !== "flowpay.network") throw new Error("Invalid provider checkout URL");
    } catch {
      await CryptoPayment.updateOne({ _id: payment._id, status: "pending" }, { $set: { status: "failed" } });
      console.error("FlowPay returned an invalid hosted checkout URL.");
      return NextResponse.json({ error: "The payment provider returned an invalid checkout link." }, { status: 502 });
    }

    await CryptoPayment.updateOne({ _id: payment._id }, { $set: {
      invoiceId: String(result.id),
      checkoutId: String(result.id),
      checkoutUrl: checkoutUrl.toString()
    } });
    return NextResponse.json({ checkoutUrl: checkoutUrl.toString(), amountUsd, points }, { status: 201 });
  } catch (error) {
    await CryptoPayment.updateOne({ _id: payment._id, status: "pending" }, { $set: { status: "failed" } }).catch(() => {});
    console.error("FlowPay checkout request failed:", error?.name || "unknown_error");
    return NextResponse.json({ error: "Checkout provider is temporarily unavailable. Please try again." }, { status: 502 });
  }
}
