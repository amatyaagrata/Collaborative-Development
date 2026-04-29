// src/components/layout/SupplierLayout.tsx
"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/supplier/notifications/NotificationBell";
import { Package, ShoppingBag, Settings, Home } from "lucide-react";
import styles from "./PortalLayout.module.css";

export default function SupplierLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/suppliers/dashboard", label: "Dashboard", icon: Home },
    { href: "/suppliers/orders", label: "Orders", icon: ShoppingBag },
    { href: "/product", label: "Products", icon: Package },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  const currentItem = navItems.find((item) => pathname.startsWith(item.href));

  return (
    <div className={styles.portalShell}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <h2 className={styles.brandTitle}>GoGodam</h2>
          <span className={styles.brandSubtitle}>Supplier Portal</span>
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
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <h1 className={styles.topbarTitle}>{currentItem?.label || "Dashboard"}</h1>
            <div className={styles.topbarMeta}>Manage orders, products, and supplier activity.</div>
          </div>
          <NotificationBell />
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
