"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Navigation from "./Navigation";
import {
  Video, LayoutDashboard, UserCircle, Coins, Wallet, Megaphone,
  LogOut, LogIn, UserPlus, ShieldCheck, Sparkles, MoreHorizontal, X
} from "lucide-react";

const iconProps = { size: 16, strokeWidth: 2 };
const mobileIconProps = { size: 19, strokeWidth: 1.9 };

export default function SiteHeader({ user }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isActive = (href) => pathname === href || (href !== "/" && pathname.startsWith(href + "/"));

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
              {user.role === "admin" && <a className="nav-admin" href="/admin"><ShieldCheck {...iconProps} /> Admin control center</a>}
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

      {!isAdminRoute && (
        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          <a href="/videos" className={isActive("/videos") ? "mobile-nav-item active" : "mobile-nav-item"} aria-current={isActive("/videos") ? "page" : undefined}>
            <Video {...mobileIconProps} /><span>Videos</span>
          </a>
          {user && (
            <a href="/dashboard" className={isActive("/dashboard") ? "mobile-nav-item active" : "mobile-nav-item"} aria-current={isActive("/dashboard") ? "page" : undefined}>
              <LayoutDashboard {...mobileIconProps} /><span>Dashboard</span>
            </a>
          )}
          {user && (
            <a href="/wallet" className={isActive("/wallet") ? "mobile-nav-item active" : "mobile-nav-item"} aria-current={isActive("/wallet") ? "page" : undefined}>
              <Wallet {...mobileIconProps} /><span>Wallet</span>
            </a>
          )}
          {!user && (
            <a href="/login" className={isActive("/login") ? "mobile-nav-item active" : "mobile-nav-item"}>
              <LogIn {...mobileIconProps} /><span>Log in</span>
            </a>
          )}
          {!user && (
            <a href="/signup" className={isActive("/signup") ? "mobile-nav-item active" : "mobile-nav-item"}>
              <UserPlus {...mobileIconProps} /><span>Sign up</span>
            </a>
          )}
          <button type="button" className={moreOpen ? "mobile-nav-item active" : "mobile-nav-item"} aria-expanded={moreOpen} onClick={() => setMoreOpen((value) => !value)}>
            {moreOpen ? <X {...mobileIconProps} /> : <MoreHorizontal {...mobileIconProps} />}<span>More</span>
          </button>
        </nav>
      )}

      {moreOpen && !isAdminRoute && (
        <>
          <button className="mobile-more-backdrop" aria-label="Close more menu" onClick={() => setMoreOpen(false)} />
          <section className="mobile-more-panel" aria-label="More navigation">
            {user ? (
              <>
                <div className="mobile-more-user">
                  <UserCircle size={19} />
                  <div><strong>{user.name}</strong><span>{Number(user.points || 0).toLocaleString()} points</span></div>
                </div>
                {user.role === "creator" && <>
                  <a href="/creator"><Megaphone {...iconProps} /> Creator tools</a>
                  <a href="/subscription"><Sparkles {...iconProps} /> Subscription</a>
                </>}
                {user.role === "admin" && <a href="/admin"><ShieldCheck {...iconProps} /> Admin control center</a>}
                <a href="/api/auth/logout" className="mobile-more-logout"><LogOut {...iconProps} /> Log out</a>
              </>
            ) : (
              <p>Log in or create an account to access your dashboard and wallet.</p>
            )}
          </section>
        </>
      )}
    </header>
  );
}
