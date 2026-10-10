import Video from "@/models/Video";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export default async function VideosPage({ searchParams }) {
  await connectDB();
  const params = await searchParams;
  const q = typeof params?.q === "string" ? params.q.trim() : "";
  const rawPage = Number.parseInt(typeof params?.page === "string" ? params.page : "1", 10);
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.min(rawPage, 100000)) : 1;
  const sort = params?.sort === "reward" ? "reward" : "newest";
  const pageSize = 18;

  const filter = { active: true };
  if (q) {
    filter.$or = [
      { title: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } }
    ];
  }

  const [records, totalVideos] = await Promise.all([
    Video.find(filter)
    .select("title description youtubeId rewardPoints minimumWatchPercent createdAt")
    .sort(sort === "reward" ? { rewardPoints: -1, createdAt: -1 } : { createdAt: -1 })
    .skip((page - 1) * pageSize)
    .limit(pageSize + 1)
    .lean(),
    Video.countDocuments(filter)
  ]);
  const hasNextPage = records.length > pageSize;
  const videos = records.slice(0, pageSize);
  const pageHref = (nextPage) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (sort !== "newest") query.set("sort", sort);
    query.set("page", String(nextPage));
    return `/videos?${query.toString()}`;
  };

  return (
    <section className="videos-page">
      <div className="videos-hero">
        <div className="videos-hero-copy">
          <div className="eyebrow">YOUR NEXT FAVORITE VIDEO</div>
          <h1>Watch. Discover.<br /><span>Earn points.</span></h1>
          <p>Explore approved videos, find a topic you love, and earn points when you complete the required watch percentage.</p>
          <div className="videos-hero-pills"><span>✦ Approved videos</span><span>◉ Clear rewards</span><span>▶ Watch at your pace</span></div>
        </div>
        <div className="videos-hero-art" aria-hidden="true"><div className="videos-art-orbit"></div><div className="videos-art-play">▶</div><div className="videos-art-points">✦ Points await</div><div className="videos-art-caption">DISCOVER SOMETHING NEW</div></div>
      </div>
      <div className="section-heading videos-section-heading">
        <div>
          <div className="eyebrow">VIDEO LIBRARY</div>
          <h2>Find your next watch.</h2>
          <p>Pick a video, follow its watch requirement, and collect eligible rewards.</p>
        </div>
      </div>

      <div className="videos-toolbar"><div className="videos-results"><strong>{totalVideos.toLocaleString()}</strong> approved videos <span>•</span> page {page}</div><form className="videos-sort" action="/videos"><input type="hidden" name="q" value={q} /><label htmlFor="videos-sort">Sort by</label><select id="videos-sort" name="sort" defaultValue={sort}><option value="newest">Recently added</option><option value="reward">Highest points</option></select><button className="button" type="submit">Apply</button></form></div>
      <form className="search-bar videos-search" action="/videos">
        <input name="q" defaultValue={q} placeholder="Search videos..." aria-label="Search videos" />
        <button className="button" type="submit">Search</button>
      </form>

      <div className="grid video-library videos-library">
        {videos.map(v => (
          <article className="card library-card videos-library-card" key={v._id.toString()}>
            <div className="videos-thumb-wrap"><img className="library-thumb" src={`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" /><span className="videos-play-badge">▶</span><span className="videos-approved-badge">APPROVED</span></div>
            <div className="library-content">
              <h3>{v.title}</h3>
              <p>{v.description || "Approved Videa content."}</p>
              <div className="videos-card-label">V I D E A&nbsp; • &nbsp;WATCH & EARN</div><div className="library-meta">
                <strong>+{v.rewardPoints} points</strong>
                <span>Watch {v.minimumWatchPercent}%</span>
              </div>
              <a className="button videos-watch-button" href={`/watch/${v._id}`}>Watch & earn <span aria-hidden="true">→</span></a>
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