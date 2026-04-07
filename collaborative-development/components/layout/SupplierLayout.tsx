// src/components/layout/SupplierLayout.tsx
"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import NotificationBell from "@/components/supplier/notifications/NotificationBell";
import { Package, ShoppingBag, Bell, User, Home } from "lucide-react";

export default function SupplierLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/supplier/dashboard", label: "Dashboard", icon: Home },
    { href: "/supplier/orders", label: "Orders", icon: ShoppingBag },
    { href: "/supplier/products", label: "Products", icon: Package },
    { href: "/supplier/notifications", label: "Notifications", icon: Bell },
    { href: "/supplier/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="supplier-layout">
      <aside className="sidebar">
        <div className="logo">
          <h2>GoGodam</h2>
          <span>Supplier Portal</span>
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
      </aside>

      <main className="main-content">
        <header className="top-header">
          <h1>{navItems.find(item => item.href === pathname)?.label || "Dashboard"}</h1>
          <NotificationBell />
        </header>
        <div className="content-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}