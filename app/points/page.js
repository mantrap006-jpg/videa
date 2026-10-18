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

  const [recent, totals, watchedCount, allRecommendations] = await Promise.all([
    Earning.find({ userId: session.sub }).sort({ createdAt: -1 }).limit(30).populate("videoId", "title").lean(),
    Earning.aggregate([{ $match: { userId: user._id } }, { $group: { _id: null, total: { $sum: "$points" }, rewards: { $sum: 1 } } }]),
    WatchProgress.countDocuments({ userId: session.sub, watchedPercent: { $gt: 0 } }),
    Video.find({ active: true }).select("title description youtubeId rewardPoints minimumWatchPercent createdAt").lean()
  ]);

  // Rank recommendations by the original YouTube publication date.
  const publishedDates = new Map();
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey && allRecommendations.length) {
    try {
      const ids = [...new Set(allRecommendations.map((video) => video.youtubeId).filter(Boolean))];
      for (let i = 0; i < ids.length; i += 50) {
        const url = new URL("https://www.googleapis.com/youtube/v3/videos");
        url.searchParams.set("part", "snippet");
        url.searchParams.set("id", ids.slice(i, i + 50).join(","));
        url.searchParams.set("key", apiKey);
        const response = await fetch(url, { next: { revalidate: 300 } });
        if (!response.ok) continue;
        const data = await response.json();
        for (const item of data.items || []) {
          if (item.snippet?.publishedAt) publishedDates.set(item.id, Date.parse(item.snippet.publishedAt) || 0);
        }
      }
    } catch (error) {
      console.error("Unable to load YouTube upload dates for recommendations:", error);
    }
  }
  const recommendations = [...allRecommendations]
    .sort((a, b) => (publishedDates.get(b.youtubeId) || 0) - (publishedDates.get(a.youtubeId) || 0))
    .slice(0, 3);
  const totalEarned = totals[0]?.total ?? 0;
  const rewards = totals[0]?.rewards ?? 0;

  return (
    <section className="points-page points-page-redesign">
      <div className="points-hero dashboard-head">
        <div><div className="eyebrow">YOUR REWARDS</div><h1>Points</h1><p>Track your available balance and rewards earned from approved video views.</p></div>
        <a className="button" href="/videos">Watch videos →</a>
      </div>
      <div className="stats-grid points-stats-grid">
        <div className="card stat-card points-stat points-stat-primary"><span className="points-stat-icon">✦</span><span>Available points</span><strong>{Number(user.points || 0).toLocaleString()}</strong><small>Ready to use in Videa</small></div>
        <div className="card stat-card points-stat"><span className="points-stat-icon">↗</span><span>Total points earned</span><strong>{Number(totalEarned).toLocaleString()}</strong><small>All recorded rewards</small></div>
        <div className="card stat-card points-stat"><span className="points-stat-icon">✧</span><span>Rewards received</span><strong>{Number(rewards).toLocaleString()}</strong><small>Successful reward entries</small></div>
        <div className="card stat-card points-stat"><span className="points-stat-icon">▶</span><span>Videos watched</span><strong>{Number(watchedCount).toLocaleString()}</strong><small>Videos with saved progress</small></div>
      </div>
      <section className="points-recommendations">
        <div className="section-heading compact"><div><div className="eyebrow">PICKED FOR YOU</div><h2>Recommended videos</h2><p>Latest uploads on YouTube appear first.</p></div><a className="points-see-all" href="/videos">View library →</a></div>
        {recommendations.length ? <div className="points-recommendation-grid">{recommendations.map((video) => <article className="card points-recommendation-card" key={video._id.toString()}><a className="points-recommendation-thumb" href={`/watch/${video._id}`} aria-label={`Watch ${video.title}`}><img src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" /><span>▶</span></a><div className="points-recommendation-content"><h3>{video.title}</h3><p>{video.description || "Approved Videa content."}</p>{publishedDates.has(video.youtubeId) ? <small>Uploaded on YouTube {new Date(publishedDates.get(video.youtubeId)).toLocaleDateString()}</small> : null}<div className="points-recommendation-meta"><strong>+{Number(video.rewardPoints || 0).toLocaleString()} points</strong><span>Watch {video.minimumWatchPercent}%</span></div><a className="button points-recommendation-action" href={`/watch/${video._id}`}>Watch & earn →</a></div></article>)}</div> : <div className="card points-recommendations-empty"><h3>New recommendations are coming</h3><p>Approved videos will appear here when they are available.</p><a className="button" href="/videos">Browse video library</a></div>}
      </section>
      <div className="card points-history-card">
        <div className="section-heading compact"><div><div className="eyebrow">POINTS HISTORY</div><h2>Recent rewards</h2></div></div>
        {recent.length === 0 ? <div className="empty-state"><h3>Your rewards start here</h3><p>Watch approved videos and eligible rewards will appear here.</p><a className="button" href="/videos">Browse videos</a></div> : <div className="table-wrap"><table><thead><tr><th>Video</th><th>Points</th><th>Date</th></tr></thead><tbody>{recent.map((item) => <tr key={item._id.toString()}><td>{item.videoId?.title || "Video reward"}</td><td><strong>+{Number(item.points).toLocaleString()}</strong></td><td>{new Date(item.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div>}
      </div>
    </section>
  );
}
