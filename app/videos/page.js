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
  if (q) filter.$or = [
    { title: { $regex: q, $options: "i" } },
    { description: { $regex: q, $options: "i" } }
  ];

  const [allRecords, totalVideos] = await Promise.all([
    Video.find(filter).select("title description youtubeId rewardPoints minimumWatchPercent createdAt").lean(),
    Video.countDocuments(filter)
  ]);

  // Use YouTube's original publication date, not the date a video was added to Videa.
  const youtubeApiKey = process.env.YOUTUBE_API_KEY;
  const publishedDates = new Map();
  const viewCounts = new Map();
  if (youtubeApiKey && allRecords.length) {
    try {
      const ids = [...new Set(allRecords.map((video) => video.youtubeId).filter(Boolean))];
      for (let i = 0; i < ids.length; i += 50) {
        const url = new URL("https://www.googleapis.com/youtube/v3/videos");
        url.searchParams.set("part", "snippet,statistics");
        url.searchParams.set("id", ids.slice(i, i + 50).join(","));
        url.searchParams.set("key", youtubeApiKey);
        const response = await fetch(url, { next: { revalidate: 300 } });
        if (!response.ok) continue;
        const data = await response.json();
        for (const item of data.items || []) {
          if (item.snippet?.publishedAt) publishedDates.set(item.id, Date.parse(item.snippet.publishedAt) || 0);
          const count = Number(item.statistics?.viewCount);
          if (Number.isFinite(count)) viewCounts.set(item.id, count);
        }
      }
    } catch (error) {
      console.error("Unable to load YouTube video metadata:", error);
    }
  }

  const sortedRecords = [...allRecords].sort((a, b) => {
    if (sort === "reward") {
      return Number(b.rewardPoints || 0) - Number(a.rewardPoints || 0)
        || (publishedDates.get(b.youtubeId) || 0) - (publishedDates.get(a.youtubeId) || 0);
    }
    return (publishedDates.get(b.youtubeId) || 0) - (publishedDates.get(a.youtubeId) || 0);
  });
  const start = (page - 1) * pageSize;
  const videos = sortedRecords.slice(start, start + pageSize).map((video) => ({
    ...video,
    youtubeViews: viewCounts.has(video.youtubeId) ? viewCounts.get(video.youtubeId) : null,
    youtubePublishedAt: publishedDates.get(video.youtubeId) || null
  }));
  const hasNextPage = start + pageSize < totalVideos;
  const pageHref = (nextPage) => {
    const query = new URLSearchParams();
    if (q) query.set("q", q);
    if (sort !== "newest") query.set("sort", sort);
    query.set("page", String(nextPage));
    return `/videos?${query.toString()}`;
  };

  return (
    <section className="videos-page">
      <div className="videos-toolbar"><div className="videos-results"><strong>{totalVideos.toLocaleString()}</strong> approved videos <span>•</span> page {page}</div><form className="videos-sort" action="/videos"><input type="hidden" name="q" value={q} /><label htmlFor="videos-sort">Sort by</label><select id="videos-sort" name="sort" defaultValue={sort}><option value="newest">Recently uploaded on YouTube</option><option value="reward">Highest points</option></select><button className="button" type="submit">Apply</button></form></div>
      <form className="search-bar videos-search" action="/videos">
        <input name="q" defaultValue={q} placeholder="Search videos..." aria-label="Search videos" />
        <button className="button" type="submit">Search</button>
      </form>
      <div className="grid video-library videos-library">
        {videos.map(v => (
          <article className="card library-card videos-library-card" key={v._id.toString()}>
            <a className="videos-thumb-wrap videos-thumb-link" href={`/watch/${v._id}`} aria-label={`Watch ${v.title}`}>
              <img className="library-thumb" src={`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`} alt={`Thumbnail for ${v.title}`} loading="lazy" decoding="async" />
              <span className="videos-play-badge" aria-hidden="true">▶</span>
              <span className="videos-approved-badge">APPROVED</span>
            </a>
            <div className="library-content">
              <h3>{v.title}</h3>
              <p>{v.description || "Approved Videa content."}</p>
              <div className="videos-card-label">V I D E A&nbsp; • &nbsp;WATCH & EARN</div><div className="library-meta">
                <strong>+{v.rewardPoints} points</strong>
                <span>Watch {v.minimumWatchPercent}%</span>
              </div>
              {v.youtubePublishedAt ? <div className="videos-youtube-views">Uploaded on YouTube {new Date(v.youtubePublishedAt).toLocaleDateString()}</div> : null}
              <div className="videos-youtube-views" aria-label="YouTube video views">
                <span aria-hidden="true">▶</span>
                <span>{v.youtubeViews === null ? "YouTube views unavailable" : `${v.youtubeViews.toLocaleString()} YouTube views`}</span>
              </div>
              <a className="button videos-watch-button" href={`/watch/${v._id}`}>Watch & earn <span aria-hidden="true">→</span></a>
            </div>
          </article>
        ))}
      </div>
      {(page > 1 || hasNextPage) && <div className="library-pagination" aria-label="Video library pagination">{page > 1 ? <a href={pageHref(page - 1)}>← Previous</a> : <span />}<span>Page {page}</span>{hasNextPage ? <a href={pageHref(page + 1)}>Next →</a> : <span />}</div>}
      {videos.length === 0 && <div className="card"><h3>No videos found</h3><p>{q ? "Try a different search." : "New videos will appear here when an administrator adds them."}</p></div>}
    </section>
  );
}
