import "./home-mobile-first.css";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import Video from "@/models/Video";
import HeroImageCarousel from "./HeroImageCarousel";
import HomeStreamingDiscovery from "@/components/HomeStreamingDiscovery";
import { connectDB } from "@/lib/mongodb";
import { ArrowRight, Play, Sparkles, ShieldCheck, Coins, Clapperboard, CircleCheck, Zap, Users } from "lucide-react";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Watch YouTube Videos & Earn Points",
  description: "Discover YouTube videos on Videa, watch eligible content, and earn Videa points through verified viewing activity. Explore gaming, music, entertainment, education, and more.",
  keywords: ["watch YouTube videos and earn", "watch videos and earn points", "watch to earn", "YouTube video discovery", "earn points watching videos", "video rewards", "Videa", "online entertainment"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Videa | Watch YouTube Videos & Earn Points",
    description: "Discover YouTube videos, watch eligible content, and earn Videa points through verified viewing activity.",
    url: "https://videapro.site/",
    siteName: "Videa",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Videa | Watch YouTube Videos & Earn Points",
    description: "Watch eligible YouTube videos, discover creators, and earn Videa points through verified viewing activity."
  }
};

export default async function MobileHomePage() {
  try {
    const token = (await cookies()).get("videa_token")?.value;
    if (token && process.env.JWT_SECRET) {
      const session = jwt.verify(token, process.env.JWT_SECRET);
      if (session?.sub) {
        await connectDB();
        const user = await User.findById(session.sub).select("role").lean();
        if (user) redirect(user.role === "admin" ? "/admin" : "/points");
      }
    }
  } catch (error) {
    if (error?.digest?.startsWith("NEXT_REDIRECT")) throw error;
  }
  let videos = [];
  try {
    await connectDB();
    videos = await Video.find({ active: true })
      .select("title description youtubeId rewardPoints minimumWatchPercent createdAt")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();
  } catch {}

  return (
    <div className="vf-home">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        { "@context": "https://schema.org", "@type": "Organization", name: "Videa", url: "https://videapro.site/", logo: "https://videapro.site/favicon.png" },
        { "@context": "https://schema.org", "@type": "WebSite", name: "Videa", url: "https://videapro.site/", description: "Discover YouTube videos, watch eligible content, and earn Videa points through verified viewing activity." },
        { "@context": "https://schema.org", "@type": "WebPage", name: "Videa | Watch YouTube Videos & Earn Points", url: "https://videapro.site/", description: "Watch eligible YouTube videos, explore creators, and collect Videa points through verified viewing activity." }
      ]) }} />
      <main className="vf-home-shell">
        <section className="vf-home-hero" aria-labelledby="vf-home-title">
          <div className="vf-home-copy">
            <span className="vf-home-tag"><Sparkles size={14}/> VIDEO DISCOVERY · WATCH · EARN</span>
            <h1 id="vf-home-title" className="vf-home-title">Your next favorite video.<span>Your watch, your points.</span></h1>
            <p className="vf-home-lead">Discover videos from creators around the world. Watch eligible YouTube content, complete the required checks, and collect Videa points as you explore.</p>
            <div className="vf-home-actions">
              <a href="/signup" className="vf-home-btn vf-home-btn-primary">Start watching <ArrowRight size={17}/></a>
              <a href="/videos" className="vf-home-btn vf-home-btn-secondary"><Play size={16}/> Explore videos</a>
            </div>
            <div className="vf-home-footnote"><ShieldCheck size={15}/> Watching is verified. Points are earned only for eligible viewing activity, subject to platform rules and limits.</div>
          </div>
          <div className="vf-home-visual" aria-label="Videa creator and entertainment highlights">
            <HeroImageCarousel/>
            <span className="vf-home-visual-label"><i/> WATCH · DISCOVER · COLLECT</span>
          </div>
        </section>

        <section className="vf-home-proof" aria-label="Videa platform benefits">
          <div className="vf-home-proof-item"><span className="vf-home-proof-icon"><Clapperboard size={18}/></span><div><strong>Creator videos</strong><small>Explore new channels</small></div></div>
          <div className="vf-home-proof-item"><span className="vf-home-proof-icon"><CircleCheck size={18}/></span><div><strong>Verified watching</strong><small>Complete watch targets</small></div></div>
          <div className="vf-home-proof-item"><span className="vf-home-proof-icon"><Coins size={18}/></span><div><strong>Collect points</strong><small>Track rewards in Videa</small></div></div>
        </section>

        <HomeStreamingDiscovery approvedVideos={videos}/>

        <section className="vf-home-section" aria-labelledby="vf-steps-title">
          <span className="vf-home-section-kicker">HOW VIDEA WORKS</span>
          <h2 id="vf-steps-title" className="vf-home-section-title">Three simple steps.</h2>
          <p className="vf-home-section-desc">A clear flow from discovering a video to tracking eligible rewards.</p>
          <div className="vf-home-steps">
            <article className="vf-home-step"><span className="vf-home-step-number">STEP 01</span><span className="vf-home-step-icon"><Users size={19}/></span><h3>Create your account</h3><p>Join free and keep your viewing activity and points in one place.</p></article>
            <article className="vf-home-step"><span className="vf-home-step-number">STEP 02</span><span className="vf-home-step-icon"><Play size={19}/></span><h3>Watch eligible videos</h3><p>Pick a video, follow its watch target, and complete the required checks.</p></article>
            <article className="vf-home-step"><span className="vf-home-step-number">STEP 03</span><span className="vf-home-step-icon"><Zap size={19}/></span><h3>Earn & track points</h3><p>Complete eligible viewing to earn points and follow your balance.</p></article>
          </div>
        </section>

        <section className="vf-home-cta">
          <span className="vf-home-section-kicker">START EXPLORING</span>
          <h2>Find something worth watching.</h2>
          <p>Discover new creators, explore videos, and make your viewing time count with Videa.</p>
          <a href="/signup" className="vf-home-btn vf-home-btn-primary">Join Videa for free <ArrowRight size={17}/></a>
          <small className="vf-home-cta-note">Points depend on eligible activity, verification, daily limits, and Videa rules. Rewards are not guaranteed for every view.</small>
        </section>
      </main>
      <footer className="vf-home-footer">© 2026 Videa. Watch responsibly. Earn transparently.
        <div className="vf-home-footer-links"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a></div>
      </footer>
    </div>
  );
}
