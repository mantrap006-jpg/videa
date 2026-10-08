export default function Home() {
  const videos = [
    { title: "Travel the World", creator: "Travel Vibes", points: 35, image: "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=800&q=80" },
    { title: "Creative Lifestyle", creator: "Daily Life", points: 45, image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80" },
    { title: "Tech & Innovation", creator: "Tech World", points: 50, image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80" },
  ];

  return (
    <div className="home">
      <section className="hero hero-card">
        <div className="hero-copy">
          <div className="eyebrow">● THE SMART WAY TO WATCH</div>
          <h1>Watch great videos.<br /><span>Earn while you engage.</span></h1>
          <p className="hero-text">Videa connects viewers with approved video content and rewards meaningful watching with points. Simple, transparent, and built for growth.</p>
          <div className="hero-actions">
            <a className="button button-large" href="/signup">Create free account</a>
            <a className="button secondary button-large" href="/videos">Explore videos</a>
          </div>
          <div className="hero-note">Free to join • Track your points • Watch on any device</div>
        </div>

        <div className="hero-visual">
          <img className="hero-image" src="https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1100&q=85" alt="Person enjoying video content" />
          <div className="image-glow" />
          <div className="earn-card">
            <div className="earn-icon">▶</div>
            <div><strong>Watch & Earn</strong><span>Build your Videa points</span></div>
          </div>
          <div className="points-card"><span>YOUR POINTS</span><strong>+120</strong><small>Example reward</small></div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div><div className="eyebrow">HOW IT WORKS</div><h2>Start in three simple steps.</h2></div>
          <p>Discover approved content, watch it, and build your points balance.</p>
        </div>
        <div className="feature-grid">
          <div className="feature-card"><div className="step-icon">👤</div><b>01</b><h3>Create your account</h3><p>Sign up for free and get your personal Videa dashboard.</p></div>
          <div className="feature-card"><div className="step-icon">▶</div><b>02</b><h3>Choose a video</h3><p>Browse available videos and open the content you want to watch.</p></div>
          <div className="feature-card"><div className="step-icon">✦</div><b>03</b><h3>Earn points</h3><p>Reach the required watch level and receive the configured reward once.</p></div>
        </div>
      </section>

      <section className="video-showcase">
        <div className="section-heading"><div><div className="eyebrow">DISCOVER CONTENT</div><h2>Popular videos.</h2></div><a className="text-link" href="/videos">View all videos →</a></div>
        <div className="video-grid">
          {videos.map((video) => (
            <article className="video-card" key={video.title}>
              <img src={video.image} alt={video.title} />
              <div className="video-info"><h3>{video.title}</h3><p>{video.creator}</p><strong>🪙 +{video.points} points</strong></div>
            </article>
          ))}
        </div>
      </section>

      <section className="reward-banner">
        <div className="dashboard-preview">
          <div className="preview-top"><span>Videa</span><span>Dashboard</span></div>
          <div className="balance">1,250 <small>POINTS</small></div>
          <div className="chart"><i /><i /><i /><i /><i /><i /></div>
          <div className="preview-row"><span>Videos watched</span><b>24</b></div>
          <div className="preview-row"><span>Total earned</span><b>1,250</b></div>
        </div>
        <div className="reward-copy"><div className="eyebrow">WATCH • EARN • GROW</div><h2>Make your viewing time more valuable.</h2><p>Build your points balance as you explore approved content and keep your progress in one simple dashboard.</p><a className="button button-large" href="/signup">Get started →</a></div>
      </section>

      <section className="cta-card">
        <div><div className="eyebrow">READY TO START?</div><h2>Turn your screen time into progress.</h2><p>Create your account and explore the Videa experience.</p></div>
        <a className="button button-large" href="/signup">Join Videa</a>
      </section>
    </div>
  );
}