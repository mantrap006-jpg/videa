import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import { getActiveUserFromRequest } from "@/lib/auth";

export const dynamic = "force-dynamic";

// A watch lease expires after 30 seconds without a heartbeat. This permits
// recovery after a closed browser or lost connection while blocking parallel tabs/devices.
const LEASE_MS = 30 * 1000;

export async function POST(request) {
  try {
    const session = await getActiveUserFromRequest(request);
    if (!session?.sub) return NextResponse.json({ error: "Please log in to watch videos." }, { status: 401 });

    const { sessionId } = await request.json();
    if (typeof sessionId !== "string" || !/^[a-zA-Z0-9-]{16,100}$/.test(sessionId)) {
      return NextResponse.json({ error: "Invalid watch session." }, { status: 400 });
    }

    await connectDB();
    const now = new Date();
    const staleBefore = new Date(now.getTime() - LEASE_MS);
    const user = await User.findOneAndUpdate(
      {
        _id: session.sub,
        $or: [
          { activeWatchSessionId: sessionId },
          { activeWatchSessionId: { $exists: false } },
          { activeWatchSessionId: null },
          { activeWatchLastSeenAt: { $lt: staleBefore } },
          { activeWatchLastSeenAt: { $exists: false } }
        ]
      },
      { $set: { activeWatchSessionId: sessionId, activeWatchLastSeenAt: now } },
      { new: true, projection: { _id: 1 } }
    ).lean();

    if (!user) {
      return NextResponse.json({
        error: "A watch session is already active on another tab or device. Close the other watch page and try again."
      }, { status: 409 });
    }
    return NextResponse.json({ ok: true, leaseSeconds: LEASE_MS / 1000 });
  } catch {
    return NextResponse.json({ error: "Could not start a secure watch session." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getActiveUserFromRequest(request);
    if (!session?.sub) return NextResponse.json({ ok: true });
    const { sessionId } = await request.json();
    if (typeof sessionId !== "string") return NextResponse.json({ error: "Invalid watch session." }, { status: 400 });
    await connectDB();
    await User.updateOne(
      { _id: session.sub, activeWatchSessionId: sessionId },
      { $unset: { activeWatchSessionId: 1, activeWatchLastSeenAt: 1 } }
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not release the watch session." }, { status: 500 });
  }
}
