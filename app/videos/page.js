import Video from "@/models/Video";
import { connectDB } from "@/lib/mongodb";

export const dynamic = "force-dynamic";

export default async function VideosPage() {
  await connectDB();
  const videos = await Video.find({ active: true }).sort({ createdAt: -1 }).lean();

  return <section>
    <h2>Available videos</h2>
    <p>Watch approved videos and complete the required percentage to earn points.</p>
    <div className="grid">
      {videos.map(v => (
        <article className="card" key={v._id.toString()}>
          <div className="video-wrap">
            <iframe
              src={`https://www.youtube.com/embed/${v.youtubeId}`}
              title={v.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <h3>{v.title}</h3>
          <p>{v.description}</p>
          <p><strong>{v.rewardPoints} points</strong> • Watch {v.minimumWatchPercent}%</p>
          <a className="button" href={`/watch/${v._id}`}>Watch & earn</a>
        </article>
      ))}
    </div>
    {videos.length === 0 && <div className="card"><p>No videos have been added yet.</p></div>}
  </section>;
}