"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  Coins,
  Play,
  Sparkles,
  TrendingUp,
  UserPlus,
  Video,
  Zap
} from "lucide-react";

const videos = [
  { title: "Travel & Adventure", creator: "Travel Vibes", points: 35, tag: "Travel" },
  { title: "Creative Lifestyle", creator: "Daily Life", points: 45, tag: "Lifestyle" },
  { title: "Tech & Innovation", creator: "Tech World", points: 50, tag: "Technology" }
];

const categories = ["All", "Travel", "Lifestyle", "Technology"];

export default function Home() {
  useEffect(() => {
    const mobile = window.matchMedia("(max-width: 768px)");
    const redirectIfMobile = () => {
      if (mobile.matches) window.location.replace("/mobile-home");
    };
    redirectIfMobile();
    mobile.addEventListener("change", redirectIfMobile);
    return () => mobile.removeEventListener("change", redirectIfMobile);
  }, []);

  const [category, setCategory] = useState("All");
  const [minutes, setMinutes] = useState(30);

  const filteredVideos = useMemo(
    () => category === "All" ? videos : videos.filter((video) => video.tag === category),
    [category]
  );

  const estimatedPoints = Math.round(minutes * 2.5);

  return (
    <div className="home">
      <section className="hero hero-light">
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} /> SMART WATCHING</div>
          <h1>Watch something.<br /><span>Earn something.</span></h1>
          <p className="hero-text">
            Discover approved videos, watch them, and build points in a simple,
            transparent experience.
          </p>

          <div className="hero-actions">
            <a className="button button-large" href="/signup">
              Start earning <ArrowRight size={18} />
            </a>
            <a className="button secondary button-large" href="/videos">
              <Play size={17} /> Browse videos
            </a>
          </div>

          <div className="trust-row">
            <span><Check size={15} /> Free to join</span>
            <span><Check size={15} /> Simple rewards</span>
            <span><Check size={15} /> Mobile friendly</span>
          </div>
        </div>

        <div className="hero-visual lightweight-visual" aria-label="Videa points preview">
          <img className="hero-photo" src="https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?auto=format&fit=crop&w=800&q=70" alt="Person enjoying video content on a screen" fetchPriority="high" decoding="async" />
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="watch-card">
            <div className="watch-card-top">
              <span className="live-dot" /> NOW WATCHING
              <Video size={18} />
            </div>
            <div className="play-circle"><Play size={28} fill="currentColor" /></div>
            <h3>Build your points</h3>
            <p>Every approved watch can move your balance forward.</p>
            <div className="watch-progress"><span /></div>
            <div className="watch-meta"><span>Progress</span><b>72%</b></div>
          </div>
          <div className="floating-points">
            <Coins size={18} />
            <div><small>POINTS</small><strong>+50</strong></div>
          </div>
          <div className="floating-stats">
            <TrendingUp size={17} />
            <span>Growing balance</span>
          </div>
        </div>
      </section>

      <section className="quick-stats">
        <div><strong>01</strong><span>Choose content</span></div>
        <div><strong>02</strong><span>Watch & engage</span></div>
        <div><strong>03</strong><span>Receive points</span></div>
      </section>

      <section className="section">
        <div className="section-heading compact">
          <div>
            <div className="eyebrow">DISCOVER</div>
            <h2>Find something worth watching.</h2>
          </div>
          <a className="text-link" href="/videos">See library <ArrowRight size={16} /></a>
        </div>

        <div className="category-tabs" role="tablist" aria-label="Video categories">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? "active" : ""}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="video-grid lightweight-grid">
          {filteredVideos.map((video) => (
            <a className="video-card interactive-card" href="/videos" key={video.title}>
              <div className="video-thumb">
                <img className="video-thumb-image" src={video.tag === "Travel" ? "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80" : video.tag === "Lifestyle" ? "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80" : "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"} alt={`${video.tag} video preview`} loading="lazy" decoding="async" />
                <span><Play size={18} fill="currentColor" /></span>
                <small>{video.tag}</small>
              </div>
              <div className="video-info">
                <div><h3>{video.title}</h3><p>{video.creator}</p></div>
                <strong><Coins size={15} /> +{video.points}</strong>
              </div>
            </a>
          ))}
        </div>
      </section>

      <section className="earn-calculator">
        <div>
          <div className="eyebrow"><Zap size={15} /> PLAN YOUR WATCHING</div>
          <h2>See your potential progress.</h2>
          <p>This is an example estimate, not a guaranteed payout. Actual rewards depend on the videos available on Videa.</p>
        </div>

        <div className="calculator-card">
          <div className="calculator-value">
            <span>Watch time</span>
            <strong>{minutes} min</strong>
          </div>
          <input
            type="range"
            min="10"
            max="120"
            step="5"
            value={minutes}
            onChange={(event) => setMinutes(Number(event.target.value))}
            aria-label="Watch time in minutes"
          />
          <div className="range-labels"><span>10 min</span><span>120 min</span></div>
          <div className="estimated-reward">
            <span>Example points</span>
            <strong><Coins size={20} /> {estimatedPoints}</strong>
          </div>
        </div>
      </section>

      <section className="steps-section">
        <div className="section-heading compact">
          <div><div className="eyebrow">HOW IT WORKS</div><h2>Simple from the first click.</h2></div>
        </div>
        <div className="feature-grid">
          <div className="feature-card interactive-card"><div className="step-icon"><UserPlus size={20} /></div><b>01</b><h3>Create an account</h3><p>Join free and get your personal points dashboard.</p></div>
          <div className="feature-card interactive-card"><div className="step-icon"><Play size={20} /></div><b>02</b><h3>Watch approved videos</h3><p>Choose content and reach its required watch level.</p></div>
          <div className="feature-card interactive-card"><div className="step-icon"><Coins size={20} /></div><b>03</b><h3>Build your balance</h3><p>Eligible completed watches add their configured reward once.</p></div>
        </div>
      </section>

      <section className="cta-card interactive-card">
        <div>
          <div className="eyebrow"><Sparkles size={15} /> READY?</div>
          <h2>Make your viewing time count.</h2>
          <p>Start exploring Videa today.</p>
        </div>
        <a className="button button-large" href="/signup">Join Videa <ArrowRight size={18} /></a>
      </section>
    </div>
  );
}