import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import Video from "@/models/Video";
import HeroImageCarousel from "./HeroImageCarousel";
import HomeStreamingDiscovery from "@/components/HomeStreamingDiscovery";
import { connectDB } from "@/lib/mongodb";
import {
  ArrowRight, Play, Sparkles, ShieldCheck, Coins, Clapperboard,
  CircleCheck, Zap, Users, ChevronRight
} from "lucide-react";

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
    <div className="mobile-home mh-redesign">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        { "@context": "https://schema.org", "@type": "Organization", name: "Videa", url: "https://videapro.site/", logo: "https://videapro.site/favicon.png" },
        { "@context": "https://schema.org", "@type": "WebSite", name: "Videa", url: "https://videapro.site/", description: "Discover YouTube videos, watch eligible content, and earn Videa points through verified viewing activity." },
        { "@context": "https://schema.org", "@type": "WebPage", name: "Videa | Watch YouTube Videos & Earn Points", url: "https://videapro.site/", description: "Watch eligible YouTube videos, explore creators, and collect Videa points through verified viewing activity." }
      ]) }} />
      <main className="mh-main">
        <section className="mh-hero-v2">
          <div className="mh-hero-copy">
            <div className="mh-pill"><Sparkles size={14} /> WATCH YOUTUBE · EARN POINTS</div>
            <h1>Watch YouTube videos.<br /><span>Earn Videa points.</span></h1>
            <p>Discover videos from creators, watch eligible content, complete the viewing requirements, and collect Videa points. Explore entertainment, gaming, music, learning, and more.</p>
            <div className="mh-actions">
              <a href="/signup" className="mh-primary">Start watching & earning <ArrowRight size={17} /></a>
              <a href="/videos" className="mh-secondary"><Play size={16} /> Explore videos</a>
            </div>
            <div className="mh-hero-note"><ShieldCheck size={15} /> Viewing progress is verified. Points are awarded for eligible activity under Videa's rules.</div>
          </div>
          <div className="mh-hero-art">
            <HeroImageCarousel />
            <div className="mh-art-label"><span className="mh-live-dot" /> WATCH · DISCOVER · COLLECT</div>
            <div className="mh-floating-reward">
              <span className="mh-floating-icon"><Coins size={19} /></span>
              <span><small>ELIGIBLE WATCHING</small><strong>Watch videos. Collect points.</strong></span>
              <Sparkles size={17} className="mh-floating-sparkle" />
            </div>
          </div>
        </section>
        <section className="mh-proof-row" aria-label="Videa benefits">
          <div><span><Clapperboard size={17} /></span><p><strong>YouTube videos</strong><small>Explore creators</small></p></div>
          <div><span><CircleCheck size={17} /></span><p><strong>Verified watching</strong><small>Complete watch targets</small></p></div>
          <div><span><Coins size={17} /></span><p><strong>Earn points</strong><small>Track your rewards</small></p></div>
        </section>
        <HomeStreamingDiscovery approvedVideos={videos} />
        <section className="mh-how-v2">
          <div className="mh-section-head">
            <div><div className="mh-section-kicker">WATCH · COMPLETE · COLLECT</div><h2>Earn points in three steps.</h2></div>
          </div>
          <div className="mh-steps-v2">
            <article><span className="mh-step-number">01</span><span className="mh-step-icon"><Users size={19} /></span><h3>Create your account</h3><p>Sign up for free and keep your viewing activity and points in one place.</p></article>
            <article><span className="mh-step-number">02</span><span className="mh-step-icon"><Play size={19} /></span><h3>Watch YouTube videos</h3><p>Choose a video, follow the displayed watch target, and complete the required checks.</p></article>
            <article><span className="mh-step-number">03</span><span className="mh-step-icon"><Zap size={19} /></span><h3>Earn and track points</h3><p>Eligible completed viewing earns points you can track in your Videa account.</p></article>
          </div>
        </section>
        <section className="mh-bottom-cta-v2">
          <div className="mh-cta-orb" aria-hidden="true" />
          <div className="mh-section-kicker">WATCH YOUTUBE · COLLECT VIDEA POINTS</div>
          <h2>Turn eligible watching into points.</h2>
          <p>Join Videa, discover videos, and start earning points for eligible viewing activity.</p>
          <a href="/signup">Create free account <ArrowRight size={16} /></a>
          <small>Points depend on eligible activity, verification, limits, and Videa's rules. Rewards are not guaranteed for every view.</small>
        </section>
      </main>
      <footer className="footer">© 2026 Videa. Watch responsibly. Earn transparently.<div className="footer-legal"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a></div></footer>
    </div>
  );
}
