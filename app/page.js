import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import Video from "@/models/Video";
import HeroImageCarousel from "./HeroImageCarousel";
import HomeStreamingDiscovery from "./HomeStreamingDiscovery";
import { connectDB } from "@/lib/mongodb";
import {
  ArrowRight, Play, Sparkles, ShieldCheck, Coins, Clapperboard,
  CircleCheck, Zap, Users, ChevronRight
} from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Watch, Discover & Earn",
  description: "Discover videos, meet watch targets, and track your Videa points."
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
    // Invalid or expired sessions should still be able to see the public home page.
  }

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
            <HeroImageCarousel />
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

        <HomeStreamingDiscovery approvedVideos={videos} />
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

        <section className="mh-bottom-cta-v2">
          <div className="mh-cta-orb" aria-hidden="true" />
          <div className="mh-section-kicker">YOUR NEXT WATCH STARTS HERE</div>
          <h2>Make your screen time count.</h2>
          <p>Create your free account and start exploring videos on Videa.</p>
          <a href="/signup">Create free account <ArrowRight size={16} /></a>
          <small>No reward is guaranteed; points depend on eligible activity and Videa's rules.</small>
        </section>
      </main>

      <footer className="footer">© 2026 Videa. Watch responsibly. Earn transparently.<div className="footer-legal"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a></div></footer>
    </div>
  );
}
