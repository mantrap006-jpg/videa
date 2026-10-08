import "./globals.css";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import {
  Video,
  LayoutDashboard,
  UserCircle,
  Coins,
  Megaphone,
  LogOut,
  LogIn,
  UserPlus
} from "lucide-react";

export const metadata = {
  title: "Videa — Watch & Earn",
  description: "Watch approved videos and earn points.",
  icons: {
    icon: "/favicon.jpg",
    shortcut: "/favicon.jpg",
    apple: "/favicon.jpg"
  }
};
export const dynamic = "force-dynamic";

async function getNavigationUser() {
  try {
    const token = (await cookies()).get("videa_token")?.value;
    if (!token || !process.env.JWT_SECRET) return null;
    const session = jwt.verify(token, process.env.JWT_SECRET);
    if (!session?.sub) return null;
    await connectDB();
    const user = await User.findById(session.sub).select("name role points subscription").lean();
    return user ? { name: user.name, role: user.role, points: user.points || 0, subscription: user.subscription } : null;
  } catch {
    return null;
  }
}

const iconProps = { size: 17, strokeWidth: 2 };

export default async function RootLayout({ children }) {
  const user = await getNavigationUser();

  return (
    <html lang="en">
      <body>
        <header className="topbar">
          <a href="/" className="brand"><span>V</span>IDEA</a>

          <nav>
            <a href="/videos"><Video {...iconProps} /> Videos</a>

            {user ? (
              <>
                <a href="/dashboard"><LayoutDashboard {...iconProps} /> Dashboard</a>
                <span className="nav-user"><UserCircle {...iconProps} /> Hi, {user.name}</span>
                <span className="nav-points"><Coins {...iconProps} /> {user.points}</span>

                {user.role === "creator" && (
                  <a className="nav-admin" href="/creator">
                    <Megaphone {...iconProps} /> Creator
                  </a>
                )}

                <a className="nav-logout" href="/api/auth/logout">
                  <LogOut {...iconProps} /> Log out
                </a>
              </>
            ) : (
              <>
                <a className="nav-login" href="/login"><LogIn {...iconProps} /> Log in</a>
                <a className="nav-signup" href="/signup"><UserPlus {...iconProps} /> Create account</a>
              </>
            )}
          </nav>
        </header>

        <main>{children}</main>
        <footer className="footer">© 2026 Videa. Watch responsibly. Earn transparently.</footer>
      </body>
    </html>
  );
}