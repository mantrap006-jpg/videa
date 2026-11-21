import "./globals.css";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import User from "@/models/User";
import { connectDB } from "@/lib/mongodb";
import SiteHeader from "./SiteHeader";
import PWARegister from "./PWARegister";
import VisitorTracker from "./VisitorTracker";

const siteDescription = "Explore trending videos, music, gaming, travel, technology, comedy, and educational content. Discover videos on Videa and collect points for eligible viewing activity.";


export const metadata = {
  metadataBase: new URL("https://videapro.site"),
  title: { default: "Videa | Video Streaming, Discovery & Entertainment", template: "%s | Videa" },
  description: siteDescription,
  applicationName: "Videa",
  keywords: ["Videa", "video streaming platform", "video discovery", "watch trending videos", "online videos", "entertainment videos", "music videos", "gaming videos", "travel videos", "technology videos", "comedy videos", "educational videos", "discover videos online", "video creators"],
  alternates: { canonical: "/" },
  openGraph: { type: "website", url: "https://videapro.site/", siteName: "Videa", title: "Videa | Video Streaming, Discovery & Entertainment", description: siteDescription, locale: "en_US" },
  twitter: { card: "summary_large_image", title: "Videa | Video Streaming, Discovery & Entertainment", description: siteDescription },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Videa" },
  icons: { icon: "/favicon.png", shortcut: "/favicon.png", apple: "/favicon.png" }
};


export const viewport = { themeColor: "#17052a" };
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
  } catch { return null; }
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
        <VisitorTracker />
      </body>
    </html>
  );
}
