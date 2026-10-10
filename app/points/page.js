import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import Earning from "@/models/Earning";
import Video from "@/models/Video";
import WatchProgress from "@/models/WatchProgress";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export default async function PointsPage() {
  const token = (await cookies()).get("videa_token")?.value;
  if (!token || !process.env.JWT_SECRET) redirect("/login");
  let session;
  try { session = jwt.verify(token, process.env.JWT_SECRET); } catch { redirect("/login"); }
  if (!session?.sub) redirect("/login");

  await connectDB();
  const user = await User.findById(session.sub).select("points").lean();
  if (!user) redirect("/login");

  const [recent, totals, watchedCount] = await Promise.all([
    Earning.find({ userId: session.sub }).sort({ createdAt: -1 }).limit(30).populate("videoId", "title").lean(),
    Earning.aggregate([{ $match: { userId: user._id } }, { $group: { _id: null, total: { $sum: "$points" }, rewards: { $sum: 1 } } }]),
    WatchProgress.countDocuments({ userId: session.sub, watchedPercent: { $gt: 0 } })
  ]);
  const totalEarned = totals[0]?.total ?? 0;
  const rewards = totals[0]?.rewards ?? 0;

  return (
    <section className="points-page">
      <div className="dashboard-head">
        <div><div className="eyebrow">YOUR REWARDS</div><h1>Points</h1><p>Track your available balance and rewards earned from approved video views.</p></div>
        <a className="button" href="/videos">Watch videos →</a>
      </div>
      <div className="stats-grid">
        <div className="card stat-card"><span>Available points</span><strong>{Number(user.points || 0).toLocaleString()}</strong><small>Ready to use in Videa</small></div>
        <div className="card stat-card"><span>Total points earned</span><strong>{Number(totalEarned).toLocaleString()}</strong><small>All recorded rewards</small></div>
        <div className="card stat-card"><span>Rewards received</span><strong>{Number(rewards).toLocaleString()}</strong><small>Successful reward entries</small></div>
        <div className="card stat-card"><span>Videos watched</span><strong>{Number(watchedCount).toLocaleString()}</strong><small>Videos with saved progress</small></div>
      </div>
      <div className="card">
        <div className="section-heading compact"><div><div className="eyebrow">POINTS HISTORY</div><h2>Recent rewards</h2></div></div>
        {recent.length === 0 ? <div className="empty-state"><h3>Your rewards start here</h3><p>Watch approved videos and eligible rewards will appear here.</p><a className="button" href="/videos">Browse videos</a></div> : (
          <div className="table-wrap"><table><thead><tr><th>Video</th><th>Points</th><th>Date</th></tr></thead><tbody>
            {recent.map((item) => <tr key={item._id.toString()}><td>{item.videoId?.title || "Video reward"}</td><td><strong>+{Number(item.points).toLocaleString()}</strong></td><td>{new Date(item.createdAt).toLocaleDateString()}</td></tr>)}
          </tbody></table></div>
        )}
      </div>
    </section>
  );
}
