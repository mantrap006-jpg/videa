import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_PREFIX = "videa_yt_sub_";
const MAX_AGE_SECONDS = 12 * 60 * 60;

export function subscriptionCookieName(channelId) {
  return `${COOKIE_PREFIX}${String(channelId || "").replace(/[^a-zA-Z0-9_-]/g, "")}`;
}

function signingSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured.");
  return secret;
}

export function createSubscriptionProof(userId, channelId) {
  const payload = Buffer.from(JSON.stringify({
    sub: String(userId),
    channelId: String(channelId),
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS
  })).toString("base64url");
  const signature = createHmac("sha256", signingSecret()).update(payload).digest("base64url");
  return payload + "." + signature;
}

export function verifySubscriptionProof(proof, userId, channelId) {
  if (typeof proof !== "string") return false;
  const [payload, signature, extra] = proof.split(".");
  if (!payload || !signature || extra) return false;
  try {
    const expected = createHmac("sha256", signingSecret()).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return data.sub === String(userId) &&
      data.channelId === String(channelId) &&
      Number.isFinite(data.exp) &&
      data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
