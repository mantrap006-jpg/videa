import Video from "@/models/Video";
import { connectDB } from "@/lib/mongodb";
import {
  ArrowRight, Play, Sparkles, ShieldCheck, Coins, Clapperboard,
  CircleCheck, Zap, Users, ChevronRight
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Mobile Home | Videa",
  description: "Discover videos, complete eligible views, and track your Videa rewards."
};

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
    // Keep the landing page usable while the video library is unavailable.
  }

  return (
    <div className="mobile-home mh-redesign">
      <header className="mh-topbar">
        <a href="/" className="mh-brand" aria-label="Videa home">
          <img src="/logo.svg" alt="VIDEA" width="100" height="28" />
        </a>
        <div className="mh-header-actions">
          <a href="/login" className="mh-login">Log in</a>
          <a href="/signup" className="mh-header-join">Join free <ArrowRight size={15} /></a>
        </div>
      </header>

      <main className="mh-main">
        <section className="mh-hero-v2">
          <div className="mh-hero-copy">
            <div className="mh-pill"><Sparkles size={14} /> WATCH · DISCOVER · EARN</div>
            <h1>Good videos.<br /><span>Good rewards.</span></h1>
            <p>Find videos worth watching, meet the watch requirements, and keep track of your points in one place.</p>
            <div className="mh-actions">
              <a href="/signup" className="mh-primary">Get started <ArrowRight size={17} /></a>
              <a href="/videos" className="mh-secondary"><Play size={16} /> Explore videos</a>
            </div>
            <div className="mh-hero-note"><ShieldCheck size={15} /> Watch progress and rewards are verified by Videa.</div>
          </div>
          <div className="mh-hero-art">
            <img
              src="https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=1000&q=85"
              alt="Camera and creative video production equipment"
              fetchPriority="high"
            />
            <div className="mh-art-shade" />
            <div className="mh-art-label"><span className="mh-live-dot" /> MADE FOR VIDEO LOVERS</div>
            <div className="mh-floating-reward">
              <span className="mh-floating-icon"><Coins size={19} /></span>
              <span><small>YOUR ACTIVITY</small><strong>Watch. Complete. Collect.</strong></span>
              <Sparkles size={17} className="mh-floating-sparkle" />
            </div>
          </div>
        </section>

        <section className="mh-proof-row" aria-label="Videa benefits">
          <div><span><Clapperboard size={17} /></span><p><strong>Fresh videos</strong><small>Discover content</small></p></div>
          <div><span><CircleCheck size={17} /></span><p><strong>Clear targets</strong><small>Know the requirements</small></p></div>
          <div><span><Coins size={17} /></span><p><strong>Tracked points</strong><small>See activity in account</small></p></div>
        </section>

        <section className="mh-how-v2">
          <div className="mh-section-head">
            <div><div className="mh-section-kicker">SIMPLE BY DESIGN</div><h2>Three steps. One smooth flow.</h2></div>
          </div>
          <div className="mh-steps-v2">
            <article><span className="mh-step-number">01</span><span className="mh-step-icon"><Users size={19} /></span><h3>Create your account</h3><p>Join Videa to keep your activity and points together.</p></article>
            <article><span className="mh-step-number">02</span><span className="mh-step-icon"><Play size={19} /></span><h3>Choose and watch</h3><p>Pick a video and meet its displayed watch target.</p></article>
            <article><span className="mh-step-number">03</span><span className="mh-step-icon"><Zap size={19} /></span><h3>Track your points</h3><p>Check your account for eligible rewards and progress.</p></article>
          </div>
        </section>

        <section className="mh-videos mh-videos-v2">
          <div className="mh-section-head">
            <div><div className="mh-section-kicker">PICK YOUR NEXT VIDEO</div><h2>Fresh from Videa</h2><p>Explore the latest videos in the library.</p></div>
            <a href="/videos" className="mh-see-all">See all <ChevronRight size={16} /></a>
          </div>
          {videos.length ? (
            <div className="mh-video-list">
              {videos.map((v) => (
                <article className="mh-video-card" key={v._id.toString()}>
                  <a className="mh-thumb" href={`/watch/${v._id}`} aria-label={`Watch ${v.title}`}>
                    <img src={`https://img.youtube.com/vi/${v.youtubeId}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" />
                    <span><Play size={17} fill="currentColor" /></span>
                    <small className="mh-thumb-tag">Videa pick</small>
                  </a>
                  <div className="mh-video-info">
                    <h3>{v.title}</h3>
                    <p>{v.description || "Discover this video on Videa."}</p>
                    <div className="mh-video-meta"><strong>+{Number(v.rewardPoints || 0)} points</strong><span>{Number(v.minimumWatchPercent || 0)}% watch target</span></div>
                    <a href={`/watch/${v._id}`} className="mh-watch">Watch video <ArrowRight size={14} /></a>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mh-empty"><span><Play size={21} /></span><strong>New videos are on the way</strong><p>Visit the video library to see what is available.</p><a href="/videos">Browse videos <ArrowRight size={15} /></a></div>
          )}
        </section>

        <section className="mh-bottom-cta-v2">
          <div className="mh-cta-orb" aria-hidden="true" />
          <div className="mh-section-kicker">YOUR NEXT WATCH STARTS HERE</div>
          <h2>Make your screen time count.</h2>
          <p>Create your free account and start exploring videos on Videa.</p>
          <a href="/signup">Create free account <ArrowRight size={16} /></a>
          <small>No reward is guaranteed; points depend on eligible activity and Videa's rules.</small>
        </section>
      </main>

      <footer className="mh-footer">
        <span>© {new Date().getFullYear()} Videa</span>
        <div><a href="/videos">Videos</a><a href="/login">Log in</a><a href="/signup">Sign up</a></div>
      </footer>
    </div>
  );
}
