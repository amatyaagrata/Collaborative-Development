"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, FileText, MapPin, Settings,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import "./AdminLayout.css";

interface AdminLayoutProps {
  title: string;
  children: React.ReactNode;
}

// Icon map for dynamic rendering
const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard,
  Users,
  FileText,
  MapPin,
  Settings,
};

// Admin sidebar navigation items
const adminNavItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
  { label: "Users", href: "/admin/users", icon: "Users" },
  { label: "Reports", href: "/admin/reports", icon: "FileText" },
  { label: "Tracking", href: "/admin/tracking", icon: "MapPin" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
];

export function AdminLayout({ title, children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed.");
      return;
    }
    router.push("/login");
  };

  return (
    <div className="admin-layout">
      {/* ─── Sidebar ─────────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <Link href="/admin/dashboard" className="admin-sidebar-brand">
          <div className="admin-sidebar-logo">
            <Image
              src="/assets/white logo.png"
              alt="GoGodam Logo"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>
          <span className="admin-sidebar-brand-text">GoGodam</span>
        </Link>

        <nav className="admin-sidebar-nav">
          {adminNavItems.map((item) => {
            const IconComponent = iconMap[item.icon];
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`admin-nav-item ${isActive ? "active" : ""}`}
              >
                {IconComponent && <IconComponent className="admin-nav-icon" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* ─── Main Content ────────────────────────────────────── */}
      <div className="admin-main">
        <header className="admin-header">
          <h1 className="admin-header-title">{title}</h1>
          <button onClick={handleLogout} className="admin-header-logout">
            Logout
          </button>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
