"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, Grid3x3, ShoppingCart,
  Truck, FileText, Users, Settings,
} from "lucide-react";

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Package, Grid3x3, ShoppingCart,
  Truck, FileText, Users, Settings,
};

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Product", href: "#", icon: "Package" },
  { label: "Categories", href: "/categories", icon: "Grid3x3" },
  { label: "Orders", href: "#", icon: "ShoppingCart" },
  { label: "Transfer", href: "#", icon: "Truck" },
  { label: "Reports", href: "#", icon: "FileText" },
  { label: "Users", href: "#", icon: "Users" },
  { label: "Settings", href: "#", icon: "Settings" },
];

export function AppLayout({ title, children }: AppLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="app-layout">
      <aside className="app-sidebar">
        <Link href="/" className="sidebar-brand">
          <div className="sidebar-logo">
            <Image
              src="/assets/white logo.png"
              alt="GoGodam Logo"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>
          <span className="sidebar-brand-text">GoGodam</span>
        </Link>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const IconComponent = iconMap[item.icon];
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`sidebar-nav-item ${isActive ? "active" : ""}`}
              >
                {IconComponent && <IconComponent className="sidebar-nav-icon" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="app-main">
        <header className="app-header">
          <h1 className="app-header-title">{title}</h1>
          <Link href="/" className="app-header-logout">Logout</Link>
        </header>
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
