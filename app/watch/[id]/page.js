"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function WatchPage() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [percent, setPercent] = useState(0);
  const [message, setMessage] = useState("Loading...");
  const [rewarded, setRewarded] = useState(false);

  useEffect(() => {
    fetch("/api/videos/" + id).then(r => r.json()).then(d => {
      if (d.video) setVideo(d.video);
      else setMessage(d.error || "Video not found");
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const timer = setInterval(async () => {
      const next = Math.min(100, percent + 5);
      setPercent(next);
      if (next >= 80 && !rewarded) {
        const res = await fetch("/api/watch-progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId: id, watchedPercent: next })
        });
        const data = await res.json();
        if (res.ok) {
          setMessage(data.rewarded ? `Reward received: +${data.points} points` : data.message || "Progress saved");
          if (data.rewarded) setRewarded(true);
        } else {
          setMessage(data.error || "Please log in to earn");
        }
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [id, percent, rewarded]);

  if (!video) return <section><p>{message}</p></section>;

  return <section>
    <h2>{video.title}</h2>
    <div className="video-wrap">
      <iframe
        src={`https://www.youtube.com/embed/${video.youtubeId}`}
        title={video.title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
    <div className="card" style={{marginTop: 18}}>
      <p>Tracked watch progress: <strong>{percent}%</strong></p>
      <p>{message}</p>
      <p className="muted">Reward: {video.rewardPoints} points after {video.minimumWatchPercent}%.</p>
    </div>
  </section>;
}