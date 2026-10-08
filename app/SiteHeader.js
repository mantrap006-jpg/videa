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
  ShieldCheck
} from "lucide-react";

const iconProps = { size: 17, strokeWidth: 2 };

export default function SiteHeader({ user }) {
  const pathname = usePathname();
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <header className="topbar">
      <a href="/" className="brand"><span>V</span>IDEA</a>
      {!isAdminRoute && (
        <Navigation>
          <a href="/videos"><Video {...iconProps} /> Videos</a>
          {user ? (
            <>
              <a href="/dashboard"><LayoutDashboard {...iconProps} /> Dashboard</a>
              <a href="/wallet"><Wallet {...iconProps} /> Wallet</a>
              <span className="nav-user"><UserCircle {...iconProps} /> Hi, {user.name}</span>
              <span className="nav-points"><Coins {...iconProps} /> {user.points}</span>
              {user.role === "creator" && (
                <a className="nav-admin" href="/creator"><Megaphone {...iconProps} /> Creator</a>
              )}
              {user.role === "admin" && (
                <a className="nav-admin" href="/admin"><ShieldCheck {...iconProps} /> Admin</a>
              )}
              <a className="nav-logout" href="/api/auth/logout"><LogOut {...iconProps} /> Log out</a>
            </>
          ) : (
            <>
              <a className="nav-login" href="/login"><LogIn {...iconProps} /> Log in</a>
              <a className="nav-signup" href="/signup"><UserPlus {...iconProps} /> Create account</a>
            </>
          )}
        </Navigation>
      )}
    </header>
  );
}
