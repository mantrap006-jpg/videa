import Video from "@/models/Video";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export default async function VideosPage({ searchParams }) {
  await connectDB();
  const params = await searchParams;
  const q = typeof params?.q === "string" ? params.q.trim() : "";
  const rawPage = Number.parseInt(typeof params?.page === "string" ? params.page : "1", 10);
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.min(rawPage, 100000)) : 1;
  const pageSize = 18;

  const filter = { active: true };
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } }
    ];
  }

  const records = await Video.find(filter)
    .select("title description youtubeId rewardPoints minimumWatchPercent createdAt")
    .sort({ createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize + 1)
    .lean();
  const hasNextPage = records.length > pageSize;
  const videos = records.slice(0, pageSize);
  const pageHref = (nextPage) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    query.set("page", String(nextPage));
    return `/videos?${query.toString()}`;
  };

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
            <img className="library-thumb" src={`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" />
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

      {(page > 1 || hasNextPage) && (
        <div className="library-pagination" aria-label="Video library pagination">
          {page > 1 ? <a href={pageHref(page - 1)}>← Previous</a> : <span />}
          <span>Page {page}</span>
          {hasNextPage ? <a href={pageHref(page + 1)}>Next →</a> : <span />}
        </div>
      )}

      {videos.length === 0 && (
        <div className="card">
          <h3>No videos found</h3>
          <p>{q ? "Try a different search." : "New videos will appear here when an administrator adds them."}</p>
        </div>
      )}
    </section>
  );
}