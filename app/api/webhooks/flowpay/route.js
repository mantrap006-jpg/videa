import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import CryptoPayment from "@/models/CryptoPayment";
import CryptoWebhookEvent from "@/models/CryptoWebhookEvent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function validSignature(rawBody, signatureHeader, timestampHeader, secret) {
  if (!rawBody || !signatureHeader || !timestampHeader || !secret) return false;
  if (!/^sha256=[a-f0-9]{64}$/i.test(signatureHeader)) return false;
  if (!/^\d+$/.test(timestampHeader)) return false;
  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 600) return false;

  const expected = "sha256=" + createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "utf8");
  const actualBuffer = Buffer.from(signatureHeader, "utf8");
  return expectedBuffer.length === actualBuffer.length && timingSafeEqual(expectedBuffer, actualBuffer);
}

function fixedUsd(value) {
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount.toFixed(2) : "";
}

export async function POST(request) {
  const secret = process.env.FLOWPAY_WEBHOOK_SECRET;
  const apiKey = process.env.FLOWPAY_API_KEY;
  if (!secret || !apiKey) return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });

  const rawBody = Buffer.from(await request.arrayBuffer());
  const signature = request.headers.get("X-Webhook-Signature") || "";
  const timestamp = request.headers.get("X-Webhook-Timestamp") || "";
  if (!validSignature(rawBody, signature, timestamp, secret)) {
    return NextResponse.json({ error: "Invalid webhook signature or stale timestamp." }, { status: 401 });
  }

  let event;
  try { event = JSON.parse(rawBody.toString("utf8")); } catch { return NextResponse.json({ error: "Invalid event body." }, { status: 400 }); }
  if (!event || typeof event !== "object" || typeof event.event !== "string") {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }
  if (event.event !== "invoice.paid") return new Response(null, { status: 200 });

  const chargeId = String(event.id || event.charge_id || "");
  const reference = String(event.order_id || "");
  const paidAmount = fixedUsd(event.amount);
  const currency = String(event.currency || "").toUpperCase();
  if (!chargeId || !reference || !paidAmount || currency !== "USD" || event.status !== "paid") {
    return NextResponse.json({ error: "Paid event is missing required charge details." }, { status: 400 });
  }

  // Treat the signed webhook as a trigger, then verify current charge state with FlowPay.
  let providerCharge;
  try {
    const response = await fetch("https://flowpay.network/v1/charges/" + encodeURIComponent(chargeId), {
      headers: { Authorization: "Bearer " + apiKey, Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000)
    });
    providerCharge = await response.json().catch(() => null);
    if (!response.ok) throw new Error("Provider charge lookup failed");
  } catch (error) {
    console.error("FlowPay charge verification failed:", error?.name || "unknown_error");
    return NextResponse.json({ error: "Could not verify provider charge. Retry webhook later." }, { status: 502 });
  }

  const verifiedId = String(providerCharge?.id || providerCharge?.data?.id || "");
  const verifiedStatus = String(providerCharge?.status || providerCharge?.data?.status || "").toLowerCase();
  const verifiedReference = String(providerCharge?.order_id || providerCharge?.data?.order_id || "");
  const verifiedAmount = fixedUsd(providerCharge?.amount ?? providerCharge?.data?.amount);
  const verifiedCurrency = String(providerCharge?.currency || providerCharge?.data?.currency || "").toUpperCase();
  if (verifiedId !== chargeId || verifiedStatus !== "paid" || verifiedReference !== reference ||
      verifiedAmount !== paidAmount || verifiedCurrency !== "USD") {
    console.error("FlowPay webhook did not match provider charge:", chargeId);
    return NextResponse.json({ error: "Payment did not match the provider's current charge record." }, { status: 409 });
  }

  await connectDB();
  const session = await mongoose.startSession();
  const eventKey = "flowpay:" + chargeId + ":paid";
  try {
    await session.withTransaction(async () => {
      await CryptoWebhookEvent.create([{ eventId: eventKey, eventType: event.event }], { session });
      const payment = await CryptoPayment.findOne({ externalReference: reference }).session(session);
      if (!payment || payment.providerMode !== "live" || payment.invoiceId !== chargeId ||
          (payment.amountUsd ?? payment.amountUsdc) !== paidAmount) {
        throw new Error("PAYMENT_MISMATCH");
      }
      if (payment.status === "paid" || payment.creditedAt) return;
      if (payment.status !== "pending") throw new Error("PAYMENT_NOT_PENDING");

      const userUpdate = await User.updateOne({ _id: payment.user }, { $inc: { points: payment.points } }, { session });
      if (!userUpdate.matchedCount) throw new Error("USER_NOT_FOUND");
      payment.status = "paid";
      payment.creditedAt = new Date();
      payment.paidAt = new Date();
      payment.providerEventId = eventKey;
      payment.checkoutUrl = "";
      await payment.save({ session });
    });
    return new Response(null, { status: 200 });
  } catch (error) {
    if (error?.code === 11000) return new Response(null, { status: 200 });
    if (["PAYMENT_MISMATCH", "PAYMENT_NOT_PENDING", "USER_NOT_FOUND"].includes(error?.message)) {
      console.error("FlowPay webhook rejected:", error.message, chargeId);
      return NextResponse.json({ error: "Payment did not match a pending Videa order." }, { status: 409 });
    }
    console.error("FlowPay webhook processing failed:", error?.message || "unknown_error");
    return NextResponse.json({ error: "Webhook processing failed. Provider may retry." }, { status: 500 });
  } finally {
    await session.endSession();
  }
}
