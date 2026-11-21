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
  </section>;
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
  </section>;
}
