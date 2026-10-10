import Video from "@/models/Video";
import { connectDB } from "@/lib/mongodb";
import { Play, ArrowRight, Coins, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MobileHomePage() {
  let videos = [];
  try {
    await connectDB();
    videos = await Video.find({ active: true })
      .select("title description youtubeId rewardPoints minimumWatchPercent createdAt")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();
  } catch {
    // Keep the mobile landing page usable even if video data is temporarily unavailable.
  }

  return (
    <div className="mobile-home">
      <header className="mh-topbar">
        <a href="/" className="mh-brand" aria-label="Videa home"><img src="/logo.svg" alt="VIDEA" width="104" height="28" /></a>
        <a href="/login" className="mh-login">Log in</a>
      </header>

      <main className="mh-main">
        <section className="mh-hero">
          <div className="mh-hero-glow" aria-hidden="true" />
          <div className="mh-pill"><Sparkles size={14} /> WATCH · LEARN · EARN</div>
          <h1>Your next video.<br /><span>Your next reward.</span></h1>
          <p>Discover creator videos, complete eligible views, and collect points with Videa.</p>
          <div className="mh-actions">
            <a href="/signup" className="mh-primary">Get started <ArrowRight size={17} /></a>
            <a href="/videos" className="mh-secondary"><Play size={16} /> Explore videos</a>
          </div>
          <div className="mh-trust"><span><ShieldCheck size={14} /> Clear watch requirements</span><span><Coins size={14} /> Points tracked in your account</span></div>
          <div className="mh-reward-card">
            <div className="mh-reward-icon"><Coins size={21} /></div>
            <div><small>YOUR NEXT REWARD</small><strong>Watch. Complete. Collect.</strong><span>Eligible rewards are confirmed by Videa.</span></div>
            <TrendingUp size={19} className="mh-trend" />
          </div>
        </section>

        <section className="mh-how">
          <div className="mh-section-kicker">HOW IT WORKS</div>
          <div className="mh-steps">
            <article><span>01</span><strong>Choose</strong><small>Find a video you like.</small></article>
            <article><span>02</span><strong>Watch</strong><small>Meet its watch target.</small></article>
            <article><span>03</span><strong>Collect</strong><small>Check your points.</small></article>
          </div>
        </section>

        <section className="mh-videos">
          <div className="mh-section-head"><div><div className="mh-section-kicker">FRESH PICKS</div><h2>Find your next watch</h2></div><a href="/videos">See all <ArrowRight size={15} /></a></div>
          {videos.length ? <div className="mh-video-list">{videos.map((v) => (
            <article className="mh-video-card" key={v._id.toString()}>
              <a className="mh-thumb" href={`/watch/${v._id}`} aria-label={`Watch ${v.title}`}>
                <img src={`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" />
                <span><Play size={17} fill="currentColor" /></span>
              </a>
              <div className="mh-video-info"><h3>{v.title}</h3><p>{v.description || "Approved Videa content."}</p><div><strong>+{Number(v.rewardPoints || 0)} points</strong><span>{Number(v.minimumWatchPercent || 0)}% required</span></div><a href={`/watch/${v._id}`} className="mh-watch">Watch video <ArrowRight size={14} /></a></div>
            </article>
          ))}</div> : <div className="mh-empty"><Play size={20} /><strong>New videos are on the way</strong><p>Browse the library to see all available content.</p><a href="/videos">Browse videos <ArrowRight size={15} /></a></div>}
        </section>

        <section className="mh-bottom-cta"><div><div className="mh-section-kicker">READY WHEN YOU ARE</div><h2>Make every watch count.</h2><p>Create an account to keep your points and activity together.</p></div><a href="/signup">Create free account <ArrowRight size={16} /></a></section>
      </main>
      <footer className="mh-footer"><span>© {new Date().getFullYear()} Videa</span><div><a href="/videos">Videos</a><a href="/login">Log in</a><a href="/signup">Sign up</a></div></footer>
    </div>
  );
}
