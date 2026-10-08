import "./globals.css";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";

export const metadata = { title: "Videa — Watch & Earn", description: "Watch approved videos and earn points." };
export const dynamic = "force-dynamic";

async function getNavigationUser() {
  try {
    const token = (await cookies()).get("videa_token")?.value;
    if (!token || !process.env.JWT_SECRET) return null;
    const session = jwt.verify(token, process.env.JWT_SECRET);
    if (!session?.sub) return null;
    await connectDB();
    const user = await User.findById(session.sub).select("name role points").lean();
    return user ? { name: user.name, role: user.role, points: user.points || 0 } : null;
  } catch { return null; }
}

export default async function RootLayout({ children }) {
  const user = await getNavigationUser();

  return (
    <html lang="en"><body>
      <header className="topbar">
        <a href="/" className="brand"><span>V</span>IDEA</a>
        <nav>
          <a href="/videos">Videos</a>
          {user ? (
            <>
              <a href="/dashboard">Dashboard</a>
              <span className="nav-user">Hi, {user.name}</span>
              <span className="nav-points">🪙 {user.points}</span>
              {user.role === "admin" && <a className="nav-admin" href="/admin">Admin</a>}
              <a className="nav-logout" href="/api/auth/logout">Log out</a>
            </>
          ) : (
            <>
              <a className="nav-login" href="/login">Log in</a>
              <a className="nav-signup" href="/signup">Create account</a>
            </>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="footer">© 2026 Videa. Watch responsibly. Earn transparently.</footer>
    </body></html>
  );
}