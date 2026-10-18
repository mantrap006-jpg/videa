import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import CryptoPayment from "@/models/CryptoPayment";
import CryptoWebhookEvent from "@/models/CryptoWebhookEvent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function validSignature(rawBody, signatureHeader, secret) {
  if (!rawBody || !signatureHeader || !secret) return false;
  const parts = signatureHeader.split(",").map(part => part.trim());
  const timestampPart = parts.find(part => part.startsWith("t="));
  const timestampText = timestampPart ? timestampPart.slice(2) : "";
  if (!/^\\d+$/.test(timestampText)) return false;
  const timestamp = Number(timestampText);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300) return false;
  const expected = createHmac("sha256", secret).update(timestampText + "." + rawBody, "utf8").digest("hex");
  const candidates = parts.filter(part => part.startsWith("v1=")).map(part => part.slice(3));
  return candidates.some(candidate => {
    if (!/^[a-f0-9]{64}$/i.test(candidate)) return false;
    const actualBuffer = Buffer.from(candidate, "hex");
    const expectedBuffer = Buffer.from(expected, "hex");
    return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
  });
}

export async function POST(request) {
  const secret = process.env.PAYCLAVE_WEBHOOK_SECRET;
  const expectedMode = process.env.PAYCLAVE_MODE;
  if (!secret || !["test", "live"].includes(expectedMode)) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("X-Payclave-Signature") || "";
  if (!validSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  let event;
  try { event = JSON.parse(rawBody); } catch { return NextResponse.json({ error: "Invalid event body." }, { status: 400 }); }
  if (!event?.id || !event?.type || !event?.data) {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }
  if (event.mode !== expectedMode) return new Response(null, { status: 204 });
  if (event.type !== "invoice.paid") return new Response(null, { status: 204 });
  if (expectedMode !== "live" || event.data.test === true) return new Response(null, { status: 204 });

  const data = event.data;
  const reference = String(data.externalReference || "");
  const invoiceId = String(data.invoiceId || "");
  const paidAmount = String(data.total ?? "");
  const currency = String(data.currencyCode || data.tokenSymbol || "").toUpperCase();
  if (!reference || !invoiceId || !paidAmount || currency !== "USDC") {
    return NextResponse.json({ error: "Paid event is missing required invoice details." }, { status: 400 });
  }

  await connectDB();
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await CryptoWebhookEvent.create([{ eventId: String(event.id), eventType: event.type }], { session });
      const payment = await CryptoPayment.findOne({ externalReference: reference }).session(session);
      if (!payment || payment.providerMode !== expectedMode || payment.invoiceId !== invoiceId ||
          payment.amountUsdc !== Number(paidAmount).toFixed(2)) {
        throw new Error("PAYMENT_MISMATCH");
      }
      if (payment.status === "paid" || payment.creditedAt) return;
      if (payment.status !== "pending") throw new Error("PAYMENT_NOT_PENDING");

      const userUpdate = await User.updateOne({ _id: payment.user }, { $inc: { points: payment.points } }, { session });
      if (!userUpdate.matchedCount) throw new Error("USER_NOT_FOUND");
      payment.status = "paid";
      payment.creditedAt = new Date();
      payment.paidAt = new Date();
      payment.providerEventId = String(event.id);
      payment.checkoutUrl = "";
      await payment.save({ session });
    });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error?.code === 11000) return new Response(null, { status: 204 });
    if (["PAYMENT_MISMATCH", "PAYMENT_NOT_PENDING", "USER_NOT_FOUND"].includes(error?.message)) {
      console.error("Payclave webhook rejected:", error.message, String(event.id));
      return NextResponse.json({ error: "Payment did not match a pending Videa order." }, { status: 409 });
    }
    console.error("Payclave webhook processing failed:", error?.message || "unknown_error");
    return NextResponse.json({ error: "Webhook processing failed. Provider may retry." }, { status: 500 });
  } finally {
    await session.endSession();
  }
}
