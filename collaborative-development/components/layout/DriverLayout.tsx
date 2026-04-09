// src/components/layout/DriverLayout.tsx
"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Truck, Home, Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import styles from "./PortalLayout.module.css";

export default function DriverLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const navItems = [
    { href: "/driver/dashboard", label: "Dashboard", icon: Home },
    { href: "/driver/trips", label: "My Trips", icon: Truck },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const currentItem = navItems.find((item) => pathname.startsWith(item.href));

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <div className={styles.portalShell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h2 className={styles.brandTitle}>GoGodam</h2>
          <span className={styles.brandSubtitle}>Transporter Portal</span>
        </div>
        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className={styles.sidebarFooter}>
          <button
            onClick={handleLogout}
            className={`${styles.navItem} ${styles.logoutButton}`}
            type="button"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <h1 className={styles.topbarTitle}>{currentItem?.label || "Dashboard"}</h1>
            <div className={styles.topbarMeta}>Track deliveries, earnings, and current trip status.</div>
          </div>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
