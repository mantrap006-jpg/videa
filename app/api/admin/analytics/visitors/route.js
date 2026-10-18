import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getActiveUserFromRequest } from "@/lib/auth";
import User from "@/models/User";
import VisitorEvent from "@/models/VisitorEvent";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getActiveUserFromRequest(request);
  if (!session?.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await connectDB();
  const admin = await User.findById(session.sub).select("role").lean();
  if (admin?.role !== "admin") return NextResponse.json({ error: "Administrator access required." }, { status: 403 });

  try {
    const days = 30;
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    const startDay = start.toISOString().slice(0, 10);
    const rows = await VisitorEvent.aggregate([
      { $match: { day: { $gte: startDay } } },
      { $group: { _id: "$day", visitors: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const counts = new Map(rows.map((row) => [row._id, row.visitors]));
    const daily = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + i);
      const day = date.toISOString().slice(0, 10);
      daily.push({ day, visitors: counts.get(day) || 0 });
    }
    return NextResponse.json({
      daily,
      today: daily[daily.length - 1]?.visitors || 0,
      yesterday: daily[daily.length - 2]?.visitors || 0,
      total30d: daily.reduce((sum, item) => sum + item.visitors, 0)
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Could not load visitor analytics." }, { status: 500 });
  }
}
