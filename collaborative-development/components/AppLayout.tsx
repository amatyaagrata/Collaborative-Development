"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Package, Grid3x3, ShoppingCart,
  Truck, FileText, Users, Settings, LogOut, User, ChevronDown, Store,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface AppLayoutProps {
  title: string;
  children: React.ReactNode;
}

const iconMap: Record<string, React.ElementType> = {
  LayoutDashboard, Package, Grid3x3, ShoppingCart,
  Truck, FileText, Users, Settings,
};

// Filtered nav items (no Transfer, Reports, Users)
const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Product", href: "/product", icon: "Package" },
  { label: "Categories", href: "/categories", icon: "Grid3x3" },
  { label: "Orders", href: "/orders", icon: "ShoppingCart" },
  { label: "Settings", href: "/settings", icon: "Settings" },
];

export function AppLayout({ title, children }: AppLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");

  React.useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "user@example.com");
        setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || "User");
      }
    }
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed.");
      return;
    }
    router.push("/login");
  };

  const getDisplayName = () => {
    if (userName && userName !== "User") {
      return userName;
    }
    return userEmail.split('@')[0] || "User";
  };

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
          
          {/* Gmail-style User Menu (replaces the old Logout link) */}
          <div className="user-menu-container">
            <div 
              className="user-menu-trigger" 
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                <User size={20} />
              </div>
              <div className="user-info">
                <span className="user-name">{getDisplayName()}</span>
                <span className="user-email">{userEmail}</span>
              </div>
              <ChevronDown size={18} className={`chevron-icon ${showUserMenu ? 'rotated' : ''}`} />
            </div>

            {showUserMenu && (
              <div className="user-dropdown">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">
                    <User size={20} />
                  </div>
                  <div className="dropdown-info">
                    <div className="dropdown-name">{getDisplayName()}</div>
                    <div className="dropdown-email">{userEmail}</div>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <button onClick={handleLogout} className="dropdown-item">
                  <LogOut size={18} />
                  <span>Sign out</span>
                </button>
              </div>
            )}
          </div>
        </header>
        <main className="app-content">{children}</main>
      </div>

      {/* Add these styles for the user menu */}
      <style jsx>{`
        .user-menu-container {
          position: relative;
        }
        
        .user-menu-trigger {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 12px;
          border-radius: 40px;
          cursor: pointer;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          transition: all 0.2s;
        }
        
        .user-menu-trigger:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
        }
        
        .user-avatar {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #1e5f74, #0f3b48);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
        }
        
        .user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #0a2540;
        }
        
        .user-email {
          font-size: 0.75rem;
          color: #64748b;
        }
        
        .chevron-icon {
          color: #64748b;
          transition: transform 0.2s;
        }
        
        .chevron-icon.rotated {
          transform: rotate(180deg);
        }
        
        .user-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 280px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.02);
          border: 1px solid #e2e8f0;
          z-index: 1000;
          overflow: hidden;
        }
        
        .dropdown-header {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .dropdown-avatar {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #1e5f74, #0f3b48);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .dropdown-info {
          flex: 1;
        }
        
        .dropdown-name {
          font-weight: 600;
          color: #0a2540;
        }
        
        .dropdown-email {
          font-size: 0.8rem;
          color: #64748b;
        }
        
        .dropdown-divider {
          height: 1px;
          background: #e2e8f0;
        }
        
        .dropdown-item {
          width: 100%;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.9rem;
          color: #dc2626;
          transition: background 0.2s;
        }
        
        .dropdown-item:hover {
          background: #fef2f2;
        }
      `}</style>
    </div>
  );
}