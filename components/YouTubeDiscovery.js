"use client";
import { useState } from "react";

export default function YouTubeDiscovery() {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("video");
  const [items, setItems] = useState([]);
  const [next, setNext] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playlist, setPlaylist] = useState(null);
  const [playlistNext, setPlaylistNext] = useState(null);
  const [playing, setPlaying] = useState(null);

  async function search(reset = true) {
    if (!query.trim() || loading) return;
    setLoading(true); setError(""); if (reset) { setItems([]); setPlaylist(null); setPlaying(null); }
    try {
      const url = new URL("/api/youtube-search", window.location.origin);
      url.searchParams.set("q", query.trim()); url.searchParams.set("type", kind);
      if (!reset && next) url.searchParams.set("pageToken", next);
      const res = await fetch(url); const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setItems(old => reset ? data.items || [] : [...old, ...(data.items || [])]); setNext(data.nextPageToken || null);
    } catch (e) { setError(e.message); } finally { setLoading(false); }
  }
  async function openPlaylist(item) {
    setPlaylist({ ...item, items: [], loading: true }); setPlaying(null); setError("");
    try {
      const res = await fetch("/api/youtube-playlist/" + encodeURIComponent(item.id)); const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not load playlist");
      setPlaylist({ ...item, items: data.items || [], loading: false }); setPlaylistNext(data.nextPageToken || null);
    } catch (e) { setPlaylist({ ...item, items: [], loading: false, error: e.message }); }
  }
  async function morePlaylist() {
    if (!playlistNext || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/youtube-playlist/" + encodeURIComponent(playlist.id) + "?pageToken=" + encodeURIComponent(playlistNext));
      const data = await res.json(); if (!res.ok) throw new Error(data.error || "Could not load more playlist videos");
      setPlaylist(p => ({ ...p, items: [...p.items, ...(data.items || [])] })); setPlaylistNext(data.nextPageToken || null);
    } catch(e) { setError(e.message); } finally { setLoading(false); }
  }
  const styles = { grid: { display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,230px),1fr))", gap:14 }, card:{ overflow:"hidden", border:"1px solid rgba(145,90,255,.25)", borderRadius:14, background:"rgba(19,14,30,.72)" }, img:{ display:"block", width:"100%", aspectRatio:"16/9", objectFit:"cover", background:"#18121f" }, content:{ padding:12 }, btn:{ border:"1px solid rgba(167,119,255,.4)", background:"#241438", color:"inherit", padding:"9px 13px", borderRadius:9, cursor:"pointer" }};
  return <section className="youtube-discovery" style={{ marginBottom:28 }}>
    <div style={{ padding:"18px 16px", border:"1px solid rgba(150,90,255,.28)", borderRadius:16, background:"linear-gradient(120deg,rgba(40,20,66,.72),rgba(12,12,18,.8))", marginBottom:16 }}>
      <h2 style={{ margin:"0 0 5px" }}>Discover YouTube</h2><p style={{ opacity:.78, margin:"0 0 13px" }}>Search public videos and playlists across YouTube. Only Videa-approved creator videos earn points.</p>
      <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:10 }}>
        <button type="button" style={styles.btn} onClick={()=>{setKind("video");setItems([]);setPlaylist(null);setNext(null);}}>Videos</button>
        <button type="button" style={styles.btn} onClick={()=>{setKind("playlist");setItems([]);setPlaylist(null);setNext(null);}}>Playlists</button>
      </div>
      <form onSubmit={e=>{e.preventDefault();setNext(null);search(true);}} style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
        <input value={query} onChange={e=>setQuery(e.target.value)} placeholder={kind==="video"?"Search YouTube videos...":"Search YouTube playlists..."} style={{ flex:"1 1 220px", minWidth:0, padding:11, borderRadius:9, color:"inherit", background:"#100c18", border:"1px solid #493366" }} />
        <button type="submit" style={styles.btn} disabled={loading}>{loading?"Searching…":"Search"}</button>
      </form>
    </div>
    {error && <p role="alert" style={{ color:"#ff9e9e" }}>{error}</p>}
    {playlist && <div style={{ marginBottom:16, padding:14, border:"1px solid rgba(145,90,255,.3)", borderRadius:14 }}>
      <button style={styles.btn} onClick={()=>setPlaylist(null)}>← Back to search</button><h3>{playlist.title}</h3><p>{playlist.channelTitle}</p>
      {playlist.loading ? <p>Loading playlist…</p> : playlist.error ? <p>{playlist.error}</p> : <div style={{ display:"grid", gridTemplateColumns:"minmax(0,1fr)", gap:8 }}>
        {playlist.items.map((v,i)=><div key={v.id+i} style={{ display:"flex", gap:10, alignItems:"center", padding:8, borderRadius:10, background:"rgba(255,255,255,.04)" }}>
          <img src={v.thumbnail} alt="" style={{ width:110, borderRadius:8, aspectRatio:"16/9", objectFit:"cover" }} /><div style={{ minWidth:0, flex:1 }}><strong>{v.title}</strong><div style={{ fontSize:12, opacity:.7 }}>{v.channelTitle}</div><small>{v.earningEligible ? "✓ Videa earning eligible" : "YouTube • Watch only"}</small></div><button style={styles.btn} onClick={()=>setPlaying(v)}>Play</button>
        </div>)}
        {playlistNext && <button style={styles.btn} onClick={morePlaylist} disabled={loading}>Load more playlist videos</button>}
      </div>}
    </div>}
    {playing && <div style={{ marginBottom:16, borderRadius:12, overflow:"hidden", background:"#000" }}>
      <div style={{ display:"flex", justifyContent:"space-between", padding:10 }}><strong>{playing.title}</strong><button style={styles.btn} onClick={()=>setPlaying(null)}>Close player</button></div>
      <div style={{ position:"relative", aspectRatio:"16/9" }}><iframe title={playing.title} src={"https://www.youtube-nocookie.com/embed/"+playing.id+"?autoplay=1"} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position:"absolute", inset:0, width:"100%", height:"100%", border:0 }} /></div>
    </div>}
    <div style={styles.grid}>{items.map(item=><article key={item.id} style={styles.card}>
      {kind==="video" ? <button onClick={()=>setPlaying(item)} style={{ padding:0, border:0, background:"transparent", cursor:"pointer", width:"100%" }}><img src={item.thumbnail} alt="" style={styles.img}/></button> : <button onClick={()=>openPlaylist(item)} style={{ padding:0, border:0, background:"transparent", cursor:"pointer", width:"100%" }}><img src={item.thumbnail} alt="" style={styles.img}/></button>}
      <div style={styles.content}><h3 style={{ margin:"0 0 7px", fontSize:15, lineHeight:1.4 }}>{item.title}</h3><div style={{ opacity:.7, fontSize:12 }}>{item.channelTitle}</div>
      {kind==="video" && <p style={{ fontSize:12, margin:"9px 0" }}>{item.earningEligible ? <strong style={{ color:"#bba1ff" }}>✓ Videa approved • +{item.rewardPoints} points</strong> : "YouTube • Watch only (no Videa rewards)"}</p>}
      <button style={styles.btn} onClick={()=>kind==="video"?setPlaying(item):openPlaylist(item)}>{kind==="video"?"Play video":"Open playlist"}</button></div>
    </article>)}</div>
    {next && !playlist && <div style={{ textAlign:"center", margin:18 }}><button style={styles.btn} disabled={loading} onClick={()=>search(false)}>{loading?"Loading…":"Load more results"}</button></div>}
  </section>;
}