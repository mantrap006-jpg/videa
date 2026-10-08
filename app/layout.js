import "./globals.css";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import SiteHeader from "./SiteHeader";

export const metadata = {
  title: "Videa — Watch & Earn",
  description: "Watch approved videos and earn points.",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png"
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

export default async function RootLayout({ children }) {
  const user = await getNavigationUser();

  return (
    <html lang="en">
      <body>
        <SiteHeader user={user} />
        <main>{children}</main>
        <footer className="footer">© 2026 Videa. Watch responsibly. Earn transparently.</footer>
      </body>
    </html>
  );
}
