"use client";

import { useEffect, useState } from "react";
import { Play, ArrowRight, Sparkles } from "lucide-react";

export default function HomeYouTubeSpotlight() {
  const [videos, setVideos] = useState([]);
  const [active, setActive] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const url = new URL("/api/youtube-search", window.location.origin);
        url.searchParams.set("q", "travel nature lifestyle technology inspiration");
        url.searchParams.set("type", "video");
        const res = await fetch(url);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Videos unavailable");
        if (!cancelled) setVideos((data.items || []).slice(0, 6));
      } catch {
        if (!cancelled) setVideos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);
  return <section className="home-youtube-section">
    <div className="home-youtube-head">
      <div><span className="home-youtube-kicker"><Sparkles size={13}/> YOUTUBE DISCOVERY</span><h2>Real videos. New perspectives.</h2><p>Explore videos from across YouTube—travel, lifestyle, creativity, tech and more.</p></div>
      <a className="home-youtube-link" href="/videos">Explore all <ArrowRight size={15}/></a>
    </div>
    {active && <div className="home-youtube-player">
      <div className="home-youtube-player-top"><strong>{active.title}</strong><button onClick={()=>setActive(null)} aria-label="Close video">✕</button></div>
      <div className="home-youtube-embed"><iframe title={active.title} src={"https://www.youtube-nocookie.com/embed/"+active.id+"?autoplay=1"} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen /></div>
    </div>}
    {loading ? <div className="home-youtube-loading"><span className="home-youtube-pulse"/><span>Finding videos to inspire you…</span></div> :
    videos.length ? <div className="home-youtube-grid">{videos.map((video,index)=><button type="button" key={video.id} className="home-youtube-card" onClick={()=>setActive(video)} style={{animationDelay:(index*70)+"ms"}}>
      <span className="home-youtube-thumb"><img src={video.thumbnail} alt="" loading="lazy"/><span className="home-youtube-play"><Play size={19} fill="currentColor"/></span><span className="home-youtube-badge">YouTube</span></span>
      <span className="home-youtube-card-copy"><strong>{video.title}</strong><small>{video.channelTitle || "YouTube creator"} · Watch only</small></span>
    </button>)}</div> :
    <div className="home-youtube-fallback"><p>Discover the latest videos directly in the Videa library.</p><a href="/videos">Browse YouTube videos <ArrowRight size={15}/></a></div>}
    <div className="home-youtube-footer"><span>Videos from YouTube</span><span>General discovery is watch-only</span></div>
  </section>;
}
