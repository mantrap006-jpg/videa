import "./globals.css";

export const metadata = {
  title: "Videa — Watch & Earn",
  description: "Watch approved videos and earn points."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <a href="/" className="brand">VIDEA</a>
          <nav>
            <a href="/videos">Videos</a>
            <a href="/dashboard">Dashboard</a>
            <a href="/login">Login</a>
            <a href="/admin">Admin</a>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}