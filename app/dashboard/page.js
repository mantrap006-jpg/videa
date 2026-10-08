import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import Earning from "@/models/Earning";
import WatchProgress from "@/models/WatchProgress";
import { connectDB } from "@/lib/mongodb";

async function getUser() {
  const token = (await cookies()).get("videa_token")?.value;
  if (!token || !process.env.JWT_SECRET) return null;
  try { return jwt.verify(token, process.env.JWT_SECRET); } catch { return null; }
}

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await getUser();
  if (!session?.sub) redirect("/login");

  await connectDB();
  const user = await User.findById(session.sub).lean();

  const [earnings, watchedCount, totalEarned] = await Promise.all([
    Earning.find({ userId: session.sub }).sort({ createdAt: -1 }).limit(20).populate("videoId", "title").lean(),
    WatchProgress.countDocuments({ userId: session.sub, watchedPercent: { $gt: 0 } }),
    Earning.aggregate([{ $match: { userId: user?._id } }, { $group: { _id: null, total: { $sum: "$points" } } }])
  ]);

  const earned = totalEarned[0]?.total ?? 0;

  return (
    <section>
      <div className="dashboard-head">
        <div><div className="eyebrow">YOUR VIDEA ACCOUNT</div><h2>Welcome, {user?.name || "User"}.</h2><p>Track your viewing activity and points in one place.</p></div>
        <a className="button" href="/videos">Watch videos →</a>
      </div>
      <div className="stats-grid">
        <div className="card stat-card"><span>Current points</span><strong>{user?.points ?? 0}</strong><small>Your available balance</small></div>
        <div className="card stat-card"><span>Videos watched</span><strong>{watchedCount}</strong><small>Videos with saved progress</small></div>
        <div className="card stat-card"><span>Total earned</span><strong>{earned}</strong><small>Points earned from rewards</small></div>
      </div>
      <div className="card">
        <div className="section-heading compact"><div><div className="eyebrow">ACTIVITY</div><h3>Recent earnings</h3></div></div>
        {earnings.length === 0 ? <p>No earnings yet. <a href="/videos">Start watching.</a></p> : (
          <table><thead><tr><th>Video</th><th>Points</th><th>Date</th></tr></thead><tbody>
            {earnings.map(e => <tr key={e._id.toString()}><td>{e.videoId?.title || "Video reward"}</td><td><strong>+{e.points}</strong></td><td>{new Date(e.createdAt).toLocaleString()}</td></tr>)}
          </tbody></table>
        )}
      </div>
    </section>
  );
}