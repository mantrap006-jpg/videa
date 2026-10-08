import "./globals.css";

export const metadata = { title: "Videa — Watch & Earn", description: "Watch approved videos and earn points." };

export default function RootLayout({ children }) {
  return (
    <html lang="en"><body>
      <header className="topbar">
        <a href="/" className="brand"><span>V</span>IDEA</a>
        <nav><a href="/videos">Videos</a><a href="/dashboard">Dashboard</a><a className="nav-login" href="/login">Log in</a><a className="nav-signup" href="/signup">Create account</a><a className="nav-logout" href="/api/auth/logout">Log out</a></nav>
      </header>
      <main>{children}</main>
      <footer className="footer">© 2026 Videa. Watch responsibly. Earn transparently.</footer>
    </body></html>
  );
}