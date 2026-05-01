"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, ShoppingCart, FileText, LogOut, User, ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface IMLayoutProps { title: string; children: React.ReactNode; }

const navItems = [
  { label: "Dashboard", href: "/inventory-manager/dashboard", Icon: LayoutDashboard },
  { label: "Products",  href: "/inventory-manager/products",  Icon: Package         },
  { label: "Stock",     href: "/inventory-manager/stock",     Icon: ShoppingCart    },
  { label: "Reports",   href: "/inventory-manager/reports",   Icon: FileText        },
];

export default function IMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [showMenu, setShowMenu] = useState(false);

  const activeNavItem = navItems.find(item => pathname === item.href || pathname.startsWith(item.href + "/"));
  const title = activeNavItem ? activeNavItem.label : "Inventory Portal";

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { toast.error("Logout failed."); return; }
    router.push("/login");
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#f6f8fc" }}>
      {/* Sidebar */}
      <aside style={{ width: 240, flexShrink: 0, background: "#ffffff", display: "flex", flexDirection: "column", borderRight: "1px solid #e9ecf0", position: "sticky", top: 0, height: "100vh" }}>
        <Link href="/inventory-manager/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, padding: "22px 20px 18px", textDecoration: "none", borderBottom: "1px solid #e9ecf0" }}>
          <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0 }}>
            <Image src="/assets/white logo.png" alt="GoGodam" fill className="object-contain" style={{ filter: "invert(1)" }} />
          </div>
          <span style={{ color: "#1a1a2e", fontWeight: 700, fontSize: "1.05rem", letterSpacing: "-0.02em" }}>GoGodam</span>
          <span style={{ marginLeft: "auto", fontSize: "0.55rem", fontWeight: 700, background: "#f3e8ff", color: "#7c3aed", padding: "2px 6px", borderRadius: 4, flexShrink: 0, letterSpacing: "0.06em" }}>INV MGR</span>
        </Link>

        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {navItems.map(({ label, href, Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link key={href} href={href} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, textDecoration: "none", background: active ? "#f3e8ff" : "transparent", color: active ? "#7c3aed" : "#64748b", fontWeight: active ? 600 : 500, fontSize: "0.875rem", transition: "all 0.15s" }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#f8fafc"; e.currentTarget.style.color = "#334155"; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#64748b"; } }}
              >
                <Icon size={17} /><span>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: "12px", borderTop: "1px solid #e9ecf0" }}>
          <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", borderRadius: 10, border: "none", background: "transparent", color: "#64748b", fontSize: "0.875rem", cursor: "pointer", fontWeight: 500 }}
            onMouseEnter={e => (e.currentTarget.style.background = "#fef2f2", e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent", e.currentTarget.style.color = "#64748b")}>
            <LogOut size={17} /><span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <header style={{ height: 60, background: "#fff", borderBottom: "1px solid #e9ecf0", display: "flex", alignItems: "center", padding: "0 28px", justifyContent: "space-between", flexShrink: 0 }}>
          <h1 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>{title}</h1>
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowMenu(p => !p)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 24, background: "#f8fafc", cursor: "pointer", fontSize: "0.85rem" }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <User size={15} color="#fff" />
              </div>
              <span style={{ fontWeight: 600, color: "#1a1a2e" }}>Inventory</span>
              <ChevronDown size={14} color="#64748b" style={{ transform: showMenu ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>
            {showMenu && (
              <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, background: "#fff", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", zIndex: 1000, width: 180, overflow: "hidden" }}>
                <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", border: "none", background: "none", color: "#dc2626", fontSize: "0.875rem", cursor: "pointer" }}>
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            )}
          </div>
        </header>
        <main style={{ flex: 1, overflow: "auto", padding: 28 }}>{children}</main>
      </div>
    </div>
  );
}

