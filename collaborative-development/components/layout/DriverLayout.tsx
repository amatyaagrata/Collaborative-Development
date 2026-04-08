// src/components/layout/DriverLayout.tsx
"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Truck, Home, User, Bell, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export default function DriverLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const navItems = [
    { href: "/driver/dashboard", label: "Dashboard", icon: Home },
    { href: "/driver/trips", label: "My Trips", icon: Truck },
    { href: "/driver/notifications", label: "Notifications", icon: Bell },
    { href: "/driver/profile", label: "Profile", icon: User },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <div className="driver-layout">
      <aside className="sidebar">
        <div className="logo">
          <h2>GoGodam</h2>
          <span>Driver Portal</span>
        </div>
        <nav className="nav-menu">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          <button onClick={handleLogout} className="nav-item logout-btn">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header">
          <h1>{navItems.find(item => item.href === pathname)?.label || "Dashboard"}</h1>
        </header>
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}
