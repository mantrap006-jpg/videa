"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Play, ChevronLeft, ChevronRight, Sparkles, BadgeCheck } from "lucide-react";

const CATEGORIES = [
  { label: "Trending Now", query: "trending viral videos 2026", icon: "🔥" },
  { label: "Travel & Places", query: "travel destinations nature cinematic", icon: "🌍" },
  { label: "Gaming", query: "gaming gameplay esports", icon: "🎮" },
  { label: "Music", query: "music performances new music", icon: "🎵" },
  { label: "Technology", query: "technology AI gadgets", icon: "💻" },
  { label: "Comedy", query: "comedy funny videos", icon: "😂" },
  { label: "Education", query: "educational tutorials science", icon: "🎓" },
];

function VideoRow({ title, items, approved = false }) {
  const rail = useRef(null);
  const scroll = (direction) => rail.current?.scrollBy({ left: direction * Math.max(280, rail.current.clientWidth * .78), behavior: "smooth" });
  if (!items?.length) return null;
  return <section className="vstream-row">
    <div className="vstream-row-head"><h2>{approved && <BadgeCheck size={18} />} {title}</h2><div className="vstream-controls"><button onClick={() => scroll(-1)} aria-label={`Scroll ${title} left`}><ChevronLeft size={19}/></button><button onClick={() => scroll(1)} aria-label={`Scroll ${title} right`}><ChevronRight size={19}/></button></div></div>
    <div className="vstream-rail" ref={rail}>
      {items.map((v) => <a className="vstream-card" key={v.id} href={v.href || `https://www.youtube.com/watch?v=${v.id}`} target={v.external ? "_blank" : undefined} rel={v.external ? "noopener noreferrer" : undefined}>
        <div className="vstream-thumb"><img src={v.thumbnail || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`} alt="" loading="lazy"/><span className="vstream-play"><Play size={18} fill="currentColor"/></span>{approved && <span className="vstream-approved">Videa Approved</span>}</div>
        <div className="vstream-card-copy"><strong>{v.title}</strong><small>{v.creator || v.channelTitle || (approved ? "Videa creator" : "YouTube")} {v.rewardPoints ? ` · +${v.rewardPoints} points` : ""}</small></div>
      </a>)}
    </div>
  </section>
  ;
}

export default function HomeStreamingDiscovery({ approvedVideos = [] }) {
  const [categoryVideos, setCategoryVideos] = useState({});
  const [activeCategory, setActiveCategory] = useState("Trending Now");
  const featured = approvedVideos[0];
  const approved = useMemo(() => approvedVideos.map(v => ({ id: v.youtubeId, title: v.title, thumbnail: `https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`, href: `/watch/${v._id}`, rewardPoints: v.rewardPoints, creator: "Videa creator" })), [approvedVideos]);
  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      const entries = await Promise.all(CATEGORIES.map(async category => {
        try {
          const url = new URL("/api/youtube-search", window.location.origin);
          url.searchParams.set("q", category.query); url.searchParams.set("type", "video");
          const res = await fetch(url); const data = await res.json();
          return [category.label, (data.items || []).filter(item => !item.earningEligible).slice(0, 12).map(v => ({ ...v, external: true }))];
        } catch { return [category.label, []]; }
      }));
      if (!cancelled) setCategoryVideos(Object.fromEntries(entries));
    }
    loadCategories();
    return () => { cancelled = true; };
  }, []);
  const selected = categoryVideos[activeCategory] || [];
  return <section className="vstream-discovery">
    {featured && <section className="vstream-hero">
      <img className="vstream-hero-image" src={`https://img.youtube.com/vi/${featured.youtubeId}/maxresdefault.jpg`} alt="" fetchPriority="high"/>
      <div className="vstream-hero-shade"/>
      <div className="vstream-hero-content"><span className="vstream-eyebrow"><Sparkles size={14}/> FEATURED ON VIDEA</span><h1>{featured.title}</h1><p>{featured.description || "Discover a video selected from the Videa creator library."}</p><a className="vstream-watch" href={`/watch/${featured._id}`}><Play size={17} fill="currentColor"/> Watch & earn</a></div>
    </section>}
    <VideoRow title="Videa Approved" items={approved} approved/>
    <VideoRow title="Trending Now" items={categoryVideos["Trending Now"]}/>
    <div className="vstream-category-tabs" role="tablist" aria-label="Explore video categories">{CATEGORIES.map(c=><button key={c.label} role="tab" aria-selected={activeCategory===c.label} className={activeCategory===c.label?"active":""} onClick={()=>setActiveCategory(c.label)}>{c.icon} {c.label}</button>)}</div>
    <VideoRow title={activeCategory} items={selected}/>
    {CATEGORIES.filter(c=>c.label!==activeCategory && c.label!=="Trending Now").map(c=><VideoRow key={c.label} title={c.label} items={categoryVideos[c.label]}/>)}
  <style jsx global>{`
    .vstream-discovery{display:flex;flex-direction:column;gap:26px;margin:18px 0 34px}
    .vstream-hero{position:relative;min-height:clamp(270px,42vw,510px);overflow:hidden;border-radius:22px;background:#120d1b;border:1px solid rgba(165,112,255,.18)}
    .vstream-hero-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
    .vstream-hero-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(8,6,12,.96) 0%,rgba(10,7,15,.75) 42%,rgba(10,7,15,.12) 100%),linear-gradient(0deg,rgba(8,6,12,.7),transparent 60%)}
    .vstream-hero-content{position:relative;z-index:1;display:flex;flex-direction:column;justify-content:flex-end;min-height:inherit;max-width:670px;padding:clamp(20px,5vw,48px);gap:12px}
    .vstream-eyebrow{display:flex;align-items:center;gap:7px;color:#d0b4ff;font-size:11px;font-weight:800;letter-spacing:.14em}
    .vstream-hero-content h1{font-size:clamp(24px,4.5vw,48px);line-height:1.06;margin:0;color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .vstream-hero-content p{color:#e2d9ed;margin:0;max-width:560px;line-height:1.5;font-size:14px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    .vstream-watch{align-self:flex-start;display:inline-flex;align-items:center;gap:9px;background:#7544c9;color:#fff;text-decoration:none;font-weight:800;padding:11px 17px;border-radius:10px;box-shadow:0 8px 28px rgba(91,45,166,.25)}
    .vstream-row{min-width:0}
    .vstream-row-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 0 12px}
    .vstream-row-head h2{margin:0;font-size:clamp(16px,2vw,21px);display:flex;align-items:center;gap:8px;color:inherit}
    .vstream-row-head h2 svg{color:#bda1ff}
    .vstream-controls{display:flex;gap:6px}
    .vstream-controls button{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;background:#20152e;border:1px solid rgba(167,124,255,.3);color:#fff;cursor:pointer}
    .vstream-rail{display:flex;gap:12px;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;padding:2px 1px 8px}
    .vstream-rail::-webkit-scrollbar{display:none}
    .vstream-card{flex:0 0 clamp(180px,24vw,265px);min-width:0;scroll-snap-align:start;text-decoration:none;color:inherit}
    .vstream-thumb{position:relative;aspect-ratio:16/9;overflow:hidden;border-radius:12px;background:#191321;border:1px solid rgba(150,105,235,.15)}
    .vstream-thumb img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .25s ease}
    .vstream-card:hover .vstream-thumb img{transform:scale(1.045)}
    .vstream-play{position:absolute;inset:0;display:grid;place-items:center;opacity:0;transition:opacity .2s;background:rgba(8,5,12,.22);color:#fff}
    .vstream-card:hover .vstream-play{opacity:1}
    .vstream-approved{position:absolute;left:8px;top:8px;background:rgba(78,35,135,.92);border:1px solid rgba(219,198,255,.25);color:#fff;border-radius:6px;padding:4px 7px;font-size:9px;font-weight:800;letter-spacing:.06em}
    .vstream-card-copy{display:flex;flex-direction:column;gap:5px;padding:8px 2px}
    .vstream-card-copy strong{font-size:13px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
    .vstream-card-copy small{opacity:.65;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .vstream-category-tabs{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:1px 0}
    .vstream-category-tabs::-webkit-scrollbar{display:none}
    .vstream-category-tabs button{white-space:nowrap;background:rgba(29,20,42,.85);color:inherit;border:1px solid rgba(145,103,217,.25);padding:9px 13px;border-radius:999px;font-size:12px;cursor:pointer}
    .vstream-category-tabs button.active{background:#7442c4;border-color:#9164d8;color:#fff}
    @media(max-width:640px){.vstream-discovery{gap:21px;margin-top:12px}.vstream-hero{border-radius:15px;min-height:290px}.vstream-hero-shade{background:linear-gradient(0deg,rgba(7,5,10,.95),rgba(7,5,10,.15) 100%)}.vstream-hero-content{padding:18px;gap:10px}.vstream-hero-content p{font-size:13px}.vstream-card{flex-basis:64vw}.vstream-controls{display:none}.vstream-row-head{margin-bottom:9px}}
    @media(prefers-reduced-motion:reduce){.vstream-thumb img,.vstream-play{transition:none}}
  `}</style>
  </section>;
}
