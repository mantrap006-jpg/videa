export default function Home() {
  return (
    <section className="hero">
      <p className="muted">WATCH • ENGAGE • EARN</p>
      <h1>Watch videos.<br />Earn points.</h1>
      <p>
        Videa is a watch-and-earn platform where approved YouTube videos can
        reward viewers with points after they reach the required watch level.
      </p>
      <a className="button" href="/signup">Create account</a>
      <a className="button secondary" href="/videos">Browse videos</a>
      <div className="card" style={{marginTop: 35}}>
        <h3>How it works</h3>
        <p>1. Create an account → 2. Choose a video → 3. Watch the required percentage → 4. Receive points once.</p>
      </div>
    </section>
  );
}