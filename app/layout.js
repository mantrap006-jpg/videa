import "./globals.css";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import SiteHeader from "./SiteHeader";
import PWARegister from "./PWARegister";

export const metadata = {
  metadataBase: new URL("https://videapro.site"),
  title: {
    default: "Videa — Watch, Discover & Earn",
    template: "%s | Videa"
  },
  description: "Discover videos, complete eligible watches, and track your points with Videa.",
  applicationName: "Videa",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "https://videapro.site/",
    siteName: "Videa",
    title: "Videa — Watch, Discover & Earn",
    description: "Discover videos, complete eligible watches, and track your points with Videa.",
    locale: "en_US"
  },
  twitter: {
    card: "summary",
    title: "Videa — Watch, Discover & Earn",
    description: "Discover videos, complete eligible watches, and track your points with Videa."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 }
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Videa" },
  themeColor: "#17052a",
  icons: {
    icon: "/videa-icon.svg?v=4",
    shortcut: "/videa-icon.svg?v=4",
    apple: "/videa-icon.svg?v=4"
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
        <style>{`body:has(.videa-loading) .footer { display: none !important; }`}</style>
        <SiteHeader user={user} />
        <main>{children}</main>
        <PWARegister />
        <footer className="footer">© 2026 Videa. Watch responsibly. Earn transparently.<div className="footer-legal"><a href="/privacy">Privacy Policy</a><a href="/terms">Terms of Service</a></div></footer>
      </body>
    </html>
  );
}
