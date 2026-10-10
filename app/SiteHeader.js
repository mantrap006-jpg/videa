"use client";

import { usePathname } from "next/navigation";
import Navigation from "./Navigation";
import {
  Video,
  LayoutDashboard,
  UserCircle,
  Coins,
  Wallet,
  Megaphone,
  LogOut,
  LogIn,
  UserPlus,
  ShieldCheck,
  Sparkles
} from "lucide-react";

const iconProps = { size: 16, strokeWidth: 2 };

export default function SiteHeader({ user }) {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <header className="topbar">
      <a href="/" className="brand" aria-label="Videa home">
        <img src="/logo.svg" alt="VIDEA" width="154" height="40" />
      </a>

      {!isAdminRoute && (
        <Navigation>
          {user ? (
            <>
              <a href="/videos"><Video {...iconProps} /> Videos</a>
              <a href="/dashboard"><LayoutDashboard {...iconProps} /> Dashboard</a>
              <a href="/wallet"><Wallet {...iconProps} /> Wallet</a>

              {user.role === "creator" && (
                <>
                  <a className="nav-admin" href="/creator"><Megaphone {...iconProps} /> Creator</a>
                  <a href="/subscription"><Sparkles {...iconProps} /> Subscription</a>
                </>
              )}

              {user.role === "admin" && (
                <a className="nav-admin" href="/admin"><ShieldCheck {...iconProps} /> Admin control center</a>
              )}

              <span className="nav-user"><UserCircle {...iconProps} /> Hi, {user.name}</span>
              <span className="nav-points"><Coins {...iconProps} /> {Number(user.points || 0).toLocaleString()} points</span>
              <a className="nav-logout" href="/api/auth/logout"><LogOut {...iconProps} /> Log out</a>
            </>
          ) : (
            <>
              <a href="/videos"><Video {...iconProps} /> Videos</a>
              <a className="nav-login" href="/login"><LogIn {...iconProps} /> Log in</a>
              <a className="nav-signup" href="/signup"><UserPlus {...iconProps} /> Create account</a>
            </>
          )}
        </Navigation>
      )}
    </header>
  );
}
