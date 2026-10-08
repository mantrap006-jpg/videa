import Video from "@/models/Video";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export default async function VideosPage({ searchParams }) {
  await connectDB();
  const params = await searchParams;
  const q = typeof params?.q === "string" ? params.q.trim() : "";

  const filter = { active: true };
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } }
    ];
  }

  const videos = await Video.find(filter).sort({ createdAt: -1 }).lean();

  return (
    <section>
      <div className="section-heading">
        <div>
          <div className="eyebrow">VIDEO LIBRARY</div>
          <h2>Choose something to watch.</h2>
          <p>Watch approved content and complete the required percentage to earn points.</p>
        </div>
      </div>

      <form className="search-bar" action="/videos">
        <input name="q" defaultValue={q} placeholder="Search videos..." aria-label="Search videos" />
        <button className="button" type="submit">Search</button>
      </form>

      <div className="grid video-library">
        {videos.map(v => (
          <article className="card library-card" key={v._id.toString()}>
            <img className="library-thumb" src={`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`} alt="" />
            <div className="library-content">
              <h3>{v.title}</h3>
              <p>{v.description || "Approved Videa content."}</p>
              <div className="library-meta">
                <strong>+{v.rewardPoints} points</strong>
                <span>Watch {v.minimumWatchPercent}%</span>
              </div>
              <a className="button" href={`/watch/${v._id}`}>Watch & earn</a>
            </div>
          </article>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="card">
          <h3>No videos found</h3>
          <p>{q ? "Try a different search." : "New videos will appear here when an administrator adds them."}</p>
        </div>
      )}
    </section>
  );
}