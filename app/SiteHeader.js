"use client";

import { usePathname } from "next/navigation";
import Navigation from "./Navigation";
import {
  Video, UserCircle, Coins, Wallet, Megaphone,
  LogOut, LogIn, UserPlus, ShieldCheck, Sparkles
} from "lucide-react";

const iconProps = { size: 16, strokeWidth: 2 };
const mobileIconProps = { size: 19, strokeWidth: 1.9 };

export default function SiteHeader({ user }) {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/signup" || pathname === "/auth" || pathname === "/admin" || pathname.startsWith("/admin/")) return null;

  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isActive = (href) => pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  const homeHref = user ? "/points" : "/";

  return (
    <>
    <header className="topbar">
      <a href={homeHref} className="brand" aria-label={user ? "Videa points" : "Videa home"}>
        <img src="/logo.svg" alt="VIDEA" width="154" height="40" />
      </a>

      {!isAdminRoute && (
        <Navigation user={user}>
          {user ? (
            <>
              <a href="/videos"><Video {...iconProps} /> Videos</a>
              <a className="nav-points-link" href="/points"><Coins {...iconProps} /> Points</a>
              <a href="/wallet"><Wallet {...iconProps} /> Wallet</a>
              {user.role === "creator" && (
                <>
                  <a className="nav-admin" href="/creator"><Megaphone {...iconProps} /> Creator</a>
                  <a href="/subscription"><Sparkles {...iconProps} /> Subscription</a>
                </>
              )}
              {user.role === "admin" && <a className="nav-admin" href="/admin"><ShieldCheck {...iconProps} /> Admin control center</a>}
              <span className="nav-user"><UserCircle {...iconProps} /> Hi, {user.name}</span>
              <span className="nav-points"><Coins {...iconProps} /> {Number(user.points || 0).toLocaleString()} points</span>
              <a className="nav-logout" href="/api/auth/logout"><LogOut {...iconProps} /> Log out</a>
            </>
          ) : (
            <>
              <a className="nav-login" href="/login"><LogIn {...iconProps} /> Sign In</a>
              <a className="nav-signup" href="/signup"><UserPlus {...iconProps} /> Join Now</a>
            </>
          )}
        </Navigation>
      )}

    </header>

      {user && !isAdminRoute && (
        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          <a href="/videos" className={isActive("/videos") ? "mobile-nav-item active" : "mobile-nav-item"}><Video {...mobileIconProps} /><span>Videos</span></a>
          <a href="/points" className={isActive("/points") ? "mobile-nav-item active" : "mobile-nav-item"}><Coins {...mobileIconProps} /><span>Points</span></a>
          <a href="/wallet" className={isActive("/wallet") ? "mobile-nav-item active" : "mobile-nav-item"}><Wallet {...mobileIconProps} /><span>Wallet</span></a>
          <a href="/account" className={isActive("/account") ? "mobile-nav-item active" : "mobile-nav-item"}><UserCircle {...mobileIconProps} /><span>Account</span></a>
        </nav>
      )}
    </>
  );
}
