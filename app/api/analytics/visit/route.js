import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import VisitorEvent from "@/models/VisitorEvent";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const visitorId = String(body.visitorId || "");
    const path = String(body.path || "/").slice(0, 180);
    if (!/^[a-zA-Z0-9-]{12,80}$/.test(visitorId)) {
      return NextResponse.json({ error: "Invalid visitor identifier." }, { status: 400 });
    }
    if (path.startsWith("/admin") || path.startsWith("/api")) {
      return NextResponse.json({ ok: true });
    }
    await connectDB();
    const day = new Date().toISOString().slice(0, 10);
    await VisitorEvent.updateOne(
      { visitorId, day },
      { $setOnInsert: { visitorId, day, path, createdAt: new Date() } },
      { upsert: true }
    );
    return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error?.code === 11000) return NextResponse.json({ ok: true });
    return NextResponse.json({ error: "Could not record visit." }, { status: 500 });
  }
}
