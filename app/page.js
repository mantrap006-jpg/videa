export default function Home() {
  return (
    <div className="home">
      <section className="hero hero-card">
        <div className="hero-copy">
          <div className="eyebrow">● THE SMART WAY TO WATCH</div>
          <h1>Watch great videos.<br /><span>Earn while you engage.</span></h1>
          <p className="hero-text">
            Videa connects viewers with approved video content and rewards
            meaningful watching with points. Simple, transparent, and built for growth.
          </p>
          <div className="hero-actions">
            <a className="button button-large" href="/signup">Create free account</a>
            <a className="button secondary button-large" href="/videos">Explore videos</a>
          </div>
          <div className="hero-note">Free to join • Track your points • Watch on any device</div>
        </div>

        <div className="hero-visual">
          <div className="orb orb-one" />
          <div className="orb orb-two" />
          <div className="earn-card">
            <div className="earn-icon">▶</div>
            <div>
              <strong>Watch & Earn</strong>
              <span>Build your Videa points</span>
            </div>
          </div>
          <div className="points-card">
            <span>YOUR POINTS</span>
            <strong>+120</strong>
            <small>Example reward</small>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <div className="eyebrow">HOW IT WORKS</div>
            <h2>Start in three simple steps.</h2>
          </div>
          <p>Discover approved content, watch it, and build your points balance.</p>
        </div>

        <div className="feature-grid">
          <div className="feature-card"><b>01</b><h3>Create your account</h3><p>Sign up for free and get your personal Videa dashboard.</p></div>
          <div className="feature-card"><b>02</b><h3>Choose a video</h3><p>Browse available videos and open the content you want to watch.</p></div>
          <div className="feature-card"><b>03</b><h3>Earn points</h3><p>Reach the required watch level and receive the configured reward once.</p></div>
        </div>
      </section>

      <section className="cta-card">
        <div>
          <div className="eyebrow">READY TO START?</div>
          <h2>Turn your screen time into progress.</h2>
          <p>Create your account and explore the Videa experience.</p>
        </div>
        <a className="button button-large" href="/signup">Join Videa</a>
      </section>
    </div>
  );
}