"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, Sparkles, BadgeCheck, MapPin, Flame, Globe2, Gamepad2, Music2, Laptop2, Laugh, GraduationCap, ArrowRight } from "lucide-react";

const CATEGORIES = [
  { label: "Trending Now", query: "trending viral videos", Icon: Flame },
  { label: "Travel & Places", query: "travel destinations nature cinematic", Icon: Globe2 },
  { label: "Gaming", query: "gaming gameplay esports", Icon: Gamepad2 },
  { label: "Music", query: "music performances new music", Icon: Music2 },
  { label: "Technology", query: "technology AI gadgets", Icon: Laptop2 },
  { label: "Comedy", query: "comedy funny videos", Icon: Laugh },
  { label: "Education", query: "educational tutorials science", Icon: GraduationCap },
];

function VideoGrid({ title, items, approved = false }) {
  if (!items?.length) return null;
  return <section className="vstream-row">
    <div className="vstream-row-head"><h2>{approved && <BadgeCheck size={18} />} {title}</h2><span className="vstream-count">{items.length} videos</span></div>
    <div className="vstream-grid">
      {items.slice(0, 6).map((v, index) => <a className="vstream-card" key={v.id} href={v.href || "/videos"} target={undefined} rel={undefined} style={{animationDelay:(index*65)+"ms"}}>
        <div className="vstream-thumb"><img src={v.thumbnail || `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`} alt="" loading="lazy"/><span className="vstream-play"><Play size={18} fill="currentColor"/></span>{approved && <span className="vstream-approved">Videa Approved</span>}</div>
        <div className="vstream-card-copy"><strong>{v.title}</strong><small>{v.creator || v.channelTitle || (approved ? "Videa creator" : "YouTube")} {v.rewardPoints ? ` · +${v.rewardPoints} points` : ""}</small></div>
      </a>)}
    </div>
  </section>;
}

export default function HomeStreamingDiscovery({ approvedVideos = [] }) {
  const [categoryVideos, setCategoryVideos] = useState({});
  const [activeCategory, setActiveCategory] = useState("Trending Now");
  const [locationInfo, setLocationInfo] = useState(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const approved = useMemo(() => approvedVideos.map(v => ({ id: v.youtubeId, title: v.title, description: v.description, thumbnail: `https://img.youtube.com/vi/${v.youtubeId}/maxresdefault.jpg`, href: `/watch/${v._id}`, rewardPoints: v.rewardPoints, creator: "Videa creator" })), [approvedVideos]);
  const featured = approvedVideos[featuredIndex % Math.max(approvedVideos.length, 1)];

  useEffect(() => {
    if (approved.length < 2) return;
    const timer = window.setInterval(() => setFeaturedIndex((current) => (current + 1) % approved.length), 6500);
    return () => window.clearInterval(timer);
  }, [approved.length]);

  useEffect(() => {
    let cancelled = false;
    async function loadLocation() {
      try {
        const response = await fetch("/api/location", { cache: "no-store" });
        const data = await response.json();
        if (!cancelled && data?.countryCode) setLocationInfo(data);
      } catch {}
    }
    loadLocation();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadCategories() {
      const country = locationInfo?.country || "";
      const countryCode = locationInfo?.countryCode || "";
      const localized = country ? `popular songs music videos hits in ${country}` : "popular songs music videos trending hits";
      const africa = "popular African songs music videos Afrobeat amapiano";
      const groups = [
        { label: locationInfo ? `Trending in ${country}` : "Trending Now", query: localized, regionCode: countryCode },
        { label: "Trending in Africa", query: africa, regionCode: "RW" },
        { label: "Explore the World", query: "global trending music songs official music videos", regionCode: "US" },
        ...CATEGORIES.slice(1).map(c => ({ label: c.label, query: country ? `${c.query} ${country}` : c.query, regionCode: countryCode || "US" })),
      ];
      try {
        const entries = await Promise.all(groups.map(async group => {
          try {
            const url = new URL("/api/youtube-search", window.location.origin);
            url.searchParams.set("q", group.query);
            url.searchParams.set("type", "video");
            if (group.regionCode) url.searchParams.set("regionCode", group.regionCode);
            const res = await fetch(url);
            const data = await res.json();
            return [group.label, (data.items || []).filter(item => !item.earningEligible).slice(0, 6).map(v => ({ ...v, href: "/videos" }))];
          } catch { return [group.label, []]; }
        }));
        if (!cancelled) setCategoryVideos(Object.fromEntries(entries));
      } catch {}
    }
    loadCategories();
    return () => { cancelled = true; };
  }, [locationInfo]);

  const localTitle = "Trending Now";
  const selected = categoryVideos[activeCategory] || [];

  return <section className="vstream-discovery">
    <header className="vstream-discovery-heading">
      <div><span className="vstream-eyebrow"><Sparkles size={14}/> PERSONALIZED DISCOVERY</span><h2>Videos you'll love, from around the world.</h2><p>Discover what’s popular near you, across Africa, and everywhere.</p></div>
      {locationInfo && <span className="vstream-location"><MapPin size={14}/> {locationInfo.city ? `${locationInfo.city}, ${locationInfo.country}` : locationInfo.country}</span>}
    </header>

    {featured && <section className="vstream-hero" key={featured._id || featured.youtubeId}>
      <img className="vstream-hero-image" src={`https://img.youtube.com/vi/${featured.youtubeId}/maxresdefault.jpg`} alt="" fetchPriority="high"/>
      <div className="vstream-hero-shade"/>
      <div className="vstream-hero-content"><span className="vstream-eyebrow"><Sparkles size={14}/> FEATURED ON VIDEA</span><h1>{featured.title}</h1><p>{featured.description || "Discover a video selected from the Videa creator library."}</p><a className="vstream-watch" href={`/watch/${featured._id}`}><Play size={17} fill="currentColor"/> Watch & earn</a></div>
      {approved.length > 1 && <div className="vstream-featured-dots" aria-label={`Featured video ${featuredIndex + 1} of ${approved.length}`}>{approved.slice(0,6).map((v,i)=><button type="button" key={v.id} aria-label={`Show featured video ${i+1}`} aria-current={i===featuredIndex ? "true" : undefined} className={i===featuredIndex ? "active" : ""} onClick={()=>setFeaturedIndex(i)} />)}</div>}
    </section>}

    <VideoGrid title="Videa Approved" items={approved} approved/>
    <VideoGrid title={localTitle} items={categoryVideos[localTitle]}/>
    <VideoGrid title="Trending in Africa" items={categoryVideos["Trending in Africa"]}/>
    <VideoGrid title="Explore the World" items={categoryVideos["Explore the World"]}/>

    <div className="vstream-category-block">
      <div className="vstream-category-heading"><div><span className="vstream-eyebrow">EXPLORE BY INTEREST</span><h2>Find your next favorite</h2></div><a href="/videos">Browse library <ArrowRight size={14}/></a></div>
      <div className="vstream-category-tabs" role="tablist" aria-label="Explore video categories">{CATEGORIES.map(({label,Icon})=><button key={label} role="tab" aria-selected={activeCategory===label} className={activeCategory===label?"active":""} onClick={()=>setActiveCategory(label)}><Icon size={15}/> {label}</button>)}</div>
      <VideoGrid title={activeCategory} items={selected}/>
    </div>

  <style jsx global>{`
    .vstream-discovery{display:flex;flex-direction:column;gap:clamp(18px,3vw,28px);margin:18px 0 34px;min-width:0;width:100%;overflow:hidden}
    .vstream-discovery-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:15px;min-width:0}
    .vstream-discovery-heading h2{font-size:clamp(23px,4vw,36px);letter-spacing:-.035em;margin:7px 0 5px}
    .vstream-discovery-heading p{margin:0;opacity:.7;font-size:13px}
    .vstream-location{display:inline-flex;align-items:center;gap:5px;white-space:nowrap;background:#20152e;border:1px solid rgba(167,124,255,.28);border-radius:999px;padding:7px 10px;font-size:11px;color:#d9c7ff}
    .vstream-hero{position:relative;min-height:clamp(270px,42vw,510px);width:100%;max-width:100%;overflow:hidden;border-radius:22px;background:#120d1b;border:1px solid rgba(165,112,255,.18);animation:vstreamHeroSwap .75s ease both}
    .vstream-hero-image{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;display:block;animation:vstreamImageReveal .9s ease both}
    .vstream-hero-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(8,6,12,.96) 0%,rgba(10,7,15,.75) 42%,rgba(10,7,15,.12) 100%),linear-gradient(0deg,rgba(8,6,12,.7),transparent 60%)}
    .vstream-hero-content{position:relative;z-index:1;display:flex;flex-direction:column;justify-content:flex-end;min-height:inherit;width:100%;max-width:670px;padding:clamp(20px,5vw,48px);gap:12px;animation:vstreamContentReveal .7s ease both}
    .vstream-eyebrow{display:flex;align-items:center;gap:7px;color:#d0b4ff;font-size:11px;font-weight:800;letter-spacing:.14em}
    .vstream-hero-content h1{font-size:clamp(24px,4.5vw,48px);line-height:1.06;margin:0;color:#fff;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
    .vstream-hero-content p{color:#e2d9ed;margin:0;max-width:560px;line-height:1.5;font-size:14px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
    .vstream-watch{align-self:flex-start;display:inline-flex;align-items:center;gap:9px;background:#7544c9;color:#fff;text-decoration:none;font-weight:800;padding:11px 17px;border-radius:10px;box-shadow:0 8px 28px rgba(91,45,166,.25);transition:transform .2s,box-shadow .2s}
    .vstream-watch:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(91,45,166,.4)}
    .vstream-featured-dots{position:absolute;z-index:3;right:clamp(14px,3vw,30px);bottom:clamp(14px,3vw,28px);display:flex;gap:7px;align-items:center}
    .vstream-featured-dots button{width:8px;height:8px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.42);cursor:pointer;transition:width .25s,background .25s}
    .vstream-featured-dots button.active{width:24px;border-radius:9px;background:#c3a4ff}
    .vstream-row{min-width:0;width:100%;max-width:100%;overflow:hidden}
    .vstream-row-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:0 0 12px;min-width:0}
    .vstream-row-head h2{margin:0;font-size:clamp(16px,2vw,21px);display:flex;align-items:center;gap:8px;color:inherit;min-width:0}
    .vstream-row-head h2 svg{color:#bda1ff}
    .vstream-count{font-size:10px;color:#8995b2;white-space:nowrap}
    .vstream-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:clamp(9px,1.5vw,14px);width:100%;min-width:0}
    .vstream-card{display:flex;flex-direction:column;min-width:0;max-width:100%;overflow:hidden;text-decoration:none;color:inherit;border:1px solid rgba(255,255,255,.09);border-radius:13px;background:rgba(13,19,34,.88);animation:vstreamCardIn .5s ease both;transition:transform .2s,border-color .2s,box-shadow .2s}
    .vstream-card:hover{transform:translateY(-3px);border-color:rgba(151,129,255,.48);box-shadow:0 13px 26px rgba(0,0,0,.22)}
    .vstream-thumb{position:relative;display:block;width:100%;aspect-ratio:16/9;overflow:hidden;background:#191321}
    .vstream-thumb img{width:100%;height:100%;max-width:none;object-fit:cover;display:block;transition:transform .4s ease}
    .vstream-card:hover .vstream-thumb img{transform:scale(1.04)}
    .vstream-play{position:absolute;inset:0;display:grid;place-items:center;opacity:0;transition:opacity .2s;background:rgba(8,5,12,.22);color:#fff}
    .vstream-card:hover .vstream-play{opacity:1}
    .vstream-approved{position:absolute;left:8px;top:8px;background:rgba(78,35,135,.92);border:1px solid rgba(219,198,255,.25);color:#fff;border-radius:6px;padding:4px 7px;font-size:9px;font-weight:800;letter-spacing:.06em}
    .vstream-card-copy{display:flex;flex-direction:column;gap:5px;padding:8px 10px;min-width:0}
    .vstream-card-copy strong{font-size:clamp(11px,1.2vw,13px);line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;overflow-wrap:anywhere}
    .vstream-card-copy small{opacity:.65;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .vstream-category-block{width:100%;min-width:0;display:flex;flex-direction:column;gap:14px}
    .vstream-category-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:14px;min-width:0}
    .vstream-category-heading h2{margin:6px 0 0;font-size:clamp(20px,3vw,28px);letter-spacing:-.035em}
    .vstream-category-heading>a{display:inline-flex;align-items:center;gap:6px;color:#c7b4ff;font-size:11px;font-weight:750;white-space:nowrap}
    .vstream-category-tabs{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:7px;width:100%;min-width:0}
    .vstream-category-tabs button{display:flex;align-items:center;justify-content:center;gap:7px;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;background:rgba(29,20,42,.85);color:inherit;border:1px solid rgba(145,103,217,.25);padding:9px 8px;border-radius:999px;font-size:clamp(9px,1vw,12px);cursor:pointer;transition:background .2s,border-color .2s,transform .2s}
    .vstream-category-tabs button svg{flex:0 0 auto;color:#bda1ff}
    .vstream-category-tabs button.active{background:#7442c4;border-color:#9164d8;color:#fff}
    .vstream-category-tabs button.active svg{color:#fff}
    .vstream-category-tabs button:hover{transform:translateY(-1px);border-color:rgba(190,160,255,.55)}
    @keyframes vstreamHeroSwap{from{opacity:.5;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
    @keyframes vstreamImageReveal{from{transform:scale(1.045);opacity:.45}to{transform:scale(1);opacity:1}}
    @keyframes vstreamContentReveal{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes vstreamCardIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @media(max-width:900px){.vstream-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.vstream-category-tabs{grid-template-columns:repeat(4,minmax(0,1fr))}.vstream-category-tabs button{font-size:11px}}
    @media(max-width:640px){.vstream-discovery{gap:21px;margin-top:12px}.vstream-discovery-heading{align-items:flex-start;flex-direction:column}.vstream-hero{border-radius:15px;min-height:290px}.vstream-hero-shade{background:linear-gradient(0deg,rgba(7,5,10,.95),rgba(7,5,10,.15) 100%)}.vstream-hero-content{padding:18px;gap:10px}.vstream-hero-content p{font-size:13px}.vstream-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.vstream-card-copy{padding:9px}.vstream-card-copy strong{font-size:11px}.vstream-category-tabs{grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.vstream-category-tabs button{justify-content:flex-start;padding:10px 11px;font-size:11px}.vstream-featured-dots{bottom:12px;right:12px}}
    @media(max-width:360px){.vstream-grid{grid-template-columns:minmax(0,1fr)}.vstream-category-tabs button{font-size:10px;padding:9px 8px}}
    @media(prefers-reduced-motion:reduce){.vstream-hero,.vstream-hero-image,.vstream-hero-content,.vstream-card,.vstream-card:hover,.vstream-thumb img,.vstream-watch,.vstream-category-tabs button{animation:none!important;transition:none!important}}
  `}</style>
  </section>;
}
