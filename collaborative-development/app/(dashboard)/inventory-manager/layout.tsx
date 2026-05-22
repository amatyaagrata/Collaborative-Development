"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  FileText, 
  LogOut, 
  User, 
  ChevronDown,
  Bell,
  Moon,
  Sun,
  Menu,
  X,
  ChevronRight,
  AlertCircle,
  Box
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface IMLayoutProps { 
  title?: string; 
  children: React.ReactNode; 
}

const navItems = [
  { label: "Dashboard",       href: "/inventory-manager/dashboard", Icon: LayoutDashboard, description: "Overview & metrics" },
  { label: "Inventory",       href: "/inventory-manager/products",  Icon: Package, description: "Manage products" },
  { label: "Purchase Orders", href: "/inventory-manager/stock",     Icon: ShoppingCart, description: "Track orders" },
  { label: "Reports",         href: "/inventory-manager/reports",   Icon: FileText, description: "Analytics & insights" },
];

export default function IMLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [showMenu, setShowMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [orgName, setOrgName] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [logoError, setLogoError] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, title: "New Order Received", message: "PO-12345 has been created", time: "2 min ago", read: false, type: "order" },
    { id: 2, title: "Low Stock Alert", message: "Product 'Wireless Mouse' is running low", time: "1 hour ago", read: false, type: "alert" },
    { id: 3, title: "Order Approved", message: "PO-12340 has been approved by supplier", time: "3 hours ago", read: true, type: "order" }
  ]);
  const [darkMode, setDarkMode] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
        const { data } = await supabase
          .from("users")
          .select("name, email")
          .eq("auth_user_id", user.id)
          .single();
        if (data?.name) {
          setOrgName(data.name);
          setUserName(data.name.split(' ')[0]);
        }
      }
    };
    fetchUser();

    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedDarkMode);
    if (savedDarkMode) {
      document.documentElement.classList.add('dark-mode');
    }

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    
    const handlePopState = () => {
      setMounted(false);
      setTimeout(() => setMounted(true), 0);
    };
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [supabase]);

  const activeNavItem = navItems.find(item => pathname === item.href || pathname.startsWith(item.href + "/"));
  const title = activeNavItem ? activeNavItem.label : "Inventory Portal";
  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { 
      toast.error("Logout failed."); 
      return; 
    }
    toast.success("Logged out successfully!");
    router.push("/login");
  };

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    if (newDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  };

  const handleNotificationClick = (id: number) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
    toast.info("Notification opened");
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setShowMenu(false);
    setShowNotifications(false);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className={`im-layout ${darkMode ? 'dark' : ''}`}>
      {/* Desktop Sidebar */}
      <aside className={`im-sidebar ${showMobileMenu ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <Link href="/inventory-manager/dashboard" className="logo-container">
            <div className="logo-icon">
              {!logoError ? (
                <Image 
                  src="/assets/white logo.png" 
                  alt="GoGodam" 
                  width={36} 
                  height={36} 
                  priority
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="logo-fallback">
                  <Box size={28} />
                </div>
              )}
            </div>
            <div className="logo-text">
              <span className="logo-name">GoGodam</span>
              <span className="logo-badge">INV MGR</span>
            </div>
          </Link>
          <button className="mobile-close-btn" onClick={() => setShowMobileMenu(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="user-profile-sidebar">
          <div className="user-avatar">
            <User size={20} />
          </div>
          <div className="user-info">
            <p className="user-name">{userName || 'Inventory Manager'}</p>
            <p className="user-org">{orgName || 'Loading...'}</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ label, href, Icon, description }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link 
                key={href} 
                href={href} 
                className={`nav-item ${active ? 'active' : ''}`}
              >
                <div className="nav-icon-wrapper">
                  <Icon size={18} />
                </div>
                <div className="nav-text">
                  <span className="nav-label">{label}</span>
                  <span className="nav-description">{description}</span>
                </div>
                {active && <ChevronRight size={14} className="nav-arrow" />}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {showMobileMenu && (
        <div className="mobile-overlay" onClick={() => setShowMobileMenu(false)} />
      )}

      {/* Main Content */}
      <div className="im-main">
        <header className={`im-header ${isScrolled ? 'scrolled' : ''}`}>
          <div className="header-left">
            <button className="mobile-menu-btn" onClick={() => setShowMobileMenu(true)}>
              <Menu size={20} />
            </button>
            <div className="header-title">
              <h1>{title}</h1>
              {activeNavItem && (
                <span className="header-description">{activeNavItem.description}</span>
              )}
            </div>
          </div>

          <div className="header-right">
            <button className="header-action-btn" onClick={toggleDarkMode}>
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <div className="notification-dropdown">
              <button 
                className="header-action-btn notification-btn" 
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="notification-badge">{unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <div className="notification-menu">
                  <div className="notification-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className="mark-all-btn">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <div className="empty-notifications">
                        <Bell size={32} />
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div 
                          key={notif.id} 
                          className={`notification-item ${!notif.read ? 'unread' : ''}`}
                          onClick={() => handleNotificationClick(notif.id)}
                        >
                          <div className={`notification-icon ${notif.type}`}>
                            {notif.type === 'order' ? <ShoppingCart size={14} /> : <AlertCircle size={14} />}
                          </div>
                          <div className="notification-content">
                            <p className="notification-title">{notif.title}</p>
                            <p className="notification-message">{notif.message}</p>
                            <span className="notification-time">{notif.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="notification-footer">
                    <button onClick={() => handleNavigation('/inventory-manager/notifications')}>
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="user-dropdown">
              <button onClick={() => setShowMenu(p => !p)} className="user-trigger">
                <div className="user-avatar-small">
                  <User size={14} />
                </div>
                <div className="user-details">
                  <span className="user-greeting">Welcome back,</span>
                  <span className="user-name-header">{userName || 'Manager'}</span>
                </div>
                <ChevronDown size={14} className={`dropdown-arrow ${showMenu ? 'rotated' : ''}`} />
              </button>

              {showMenu && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="dropdown-user-avatar">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="dropdown-user-name">{userName || 'Inventory Manager'}</p>
                      <p className="dropdown-user-org">{userEmail || orgName || 'Organization'}</p>
                    </div>
                  </div>
                  <div className="dropdown-divider" />
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <LogOut size={16} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="im-content">{children}</main>
      </div>

      <style jsx global>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .im-layout {
          display: flex;
          min-height: 100vh;
          background: linear-gradient(135deg, #f5f7fa 0%, #e9eef5 100%);
          transition: background 0.3s ease;
        }

        .im-layout.dark {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        }

        .im-sidebar {
          width: 280px;
          flex-shrink: 0;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(10px);
          display: flex;
          flex-direction: column;
          border-right: 1px solid rgba(0, 0, 0, 0.08);
          position: sticky;
          top: 0;
          height: 100vh;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 100;
        }

        .dark .im-sidebar {
          background: rgba(26, 26, 46, 0.98);
          border-right-color: rgba(255, 255, 255, 0.05);
        }

        .sidebar-header {
          padding: 24px 20px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .dark .sidebar-header {
          border-bottom-color: rgba(255, 255, 255, 0.05);
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 12px;
          text-decoration: none;
        }

        .logo-icon {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          border-radius: 10px;
        }

        .logo-fallback {
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .logo-name {
          color: #1a1a2e;
          font-weight: 800;
          font-size: 1.1rem;
          letter-spacing: -0.02em;
        }

        .dark .logo-name {
          color: #ffffff;
        }

        .logo-badge {
          font-size: 0.55rem;
          font-weight: 700;
          background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
          color: white;
          padding: 2px 8px;
          border-radius: 20px;
          display: inline-block;
          width: fit-content;
          letter-spacing: 0.06em;
        }

        .user-profile-sidebar {
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
        }

        .dark .user-profile-sidebar {
          border-bottom-color: rgba(255, 255, 255, 0.05);
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .user-info {
          flex: 1;
        }

        .user-name {
          font-weight: 600;
          color: #1a1a2e;
          font-size: 0.9rem;
          margin: 0 0 2px 0;
        }

        .dark .user-name {
          color: #ffffff;
        }

        .user-org {
          font-size: 0.7rem;
          color: #64748b;
          margin: 0;
        }

        .dark .user-org {
          color: #a0aec0;
        }

        .sidebar-nav {
          flex: 1;
          padding: 16px 12px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 12px;
          text-decoration: none;
          transition: all 0.2s ease;
          position: relative;
        }

        .nav-item:hover {
          background: rgba(124, 58, 237, 0.08);
          transform: translateX(4px);
        }

        .nav-item.active {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(109, 40, 217, 0.08) 100%);
        }

        .dark .nav-item.active {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.2) 0%, rgba(109, 40, 217, 0.15) 100%);
        }

        .nav-icon-wrapper {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #64748b;
        }

        .nav-item.active .nav-icon-wrapper {
          color: #7c3aed;
        }

        .dark .nav-icon-wrapper {
          color: #a0aec0;
        }

        .nav-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .nav-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: #475569;
        }

        .dark .nav-label {
          color: #cbd5e1;
        }

        .nav-item.active .nav-label {
          color: #7c3aed;
          font-weight: 600;
        }

        .nav-description {
          font-size: 0.7rem;
          color: #94a3b8;
        }

        .dark .nav-description {
          color: #64748b;
        }

        .nav-arrow {
          color: #7c3aed;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .nav-item.active .nav-arrow {
          opacity: 1;
        }

        .sidebar-footer {
          padding: 16px 12px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
        }

        .dark .sidebar-footer {
          border-top-color: rgba(255, 255, 255, 0.05);
        }

        .logout-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 16px;
          border-radius: 10px;
          border: none;
          background: transparent;
          color: #64748b;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logout-btn:hover {
          background: #fef2f2;
          color: #ef4444;
        }

        .dark .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .im-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .im-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          height: 70px;
          flex-shrink: 0;
          transition: all 0.3s ease;
          position: sticky;
          top: 0;
          z-index: 99;
        }

        .dark .im-header {
          background: rgba(26, 26, 46, 0.95);
          border-bottom-color: rgba(255, 255, 255, 0.05);
        }

        .im-header.scrolled {
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          cursor: pointer;
          color: #1a1a2e;
          padding: 8px;
        }

        .dark .mobile-menu-btn {
          color: #ffffff;
        }

        .header-title h1 {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 4px 0;
        }

        .dark .header-title h1 {
          color: #ffffff;
        }

        .header-description {
          font-size: 0.75rem;
          color: #64748b;
        }

        .dark .header-description {
          color: #a0aec0;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-action-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: none;
          background: rgba(0, 0, 0, 0.04);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          position: relative;
        }

        .dark .header-action-btn {
          background: rgba(255, 255, 255, 0.05);
          color: #cbd5e1;
        }

        .header-action-btn:hover {
          background: rgba(124, 58, 237, 0.1);
          transform: scale(1.05);
        }

        .notification-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: #ef4444;
          color: white;
          font-size: 9px;
          font-weight: 700;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-dropdown {
          position: relative;
        }

        .notification-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 360px;
          background: white;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          animation: slideDown 0.2s ease;
          z-index: 1000;
        }

        .dark .notification-menu {
          background: #1a1a2e;
          border-color: rgba(255, 255, 255, 0.05);
        }

        .notification-header {
          padding: 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.06);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .dark .notification-header {
          border-bottom-color: rgba(255, 255, 255, 0.05);
        }

        .notification-header h4 {
          font-size: 1rem;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0;
        }

        .dark .notification-header h4 {
          color: #ffffff;
        }

        .mark-all-btn {
          background: none;
          border: none;
          color: #7c3aed;
          font-size: 0.75rem;
          cursor: pointer;
          font-weight: 500;
        }

        .notification-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .notification-item {
          padding: 12px 16px;
          display: flex;
          gap: 12px;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        }

        .notification-item:hover {
          background: rgba(124, 58, 237, 0.05);
        }

        .notification-item.unread {
          background: rgba(124, 58, 237, 0.03);
        }

        .notification-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notification-icon.order {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .notification-icon.alert {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        .notification-content {
          flex: 1;
        }

        .notification-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0 0 4px 0;
        }

        .dark .notification-title {
          color: #ffffff;
        }

        .notification-message {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0 0 4px 0;
        }

        .notification-time {
          font-size: 0.65rem;
          color: #94a3b8;
        }

        .notification-footer {
          padding: 12px 16px;
          border-top: 1px solid rgba(0, 0, 0, 0.06);
          text-align: center;
        }

        .dark .notification-footer {
          border-top-color: rgba(255, 255, 255, 0.05);
        }

        .notification-footer button {
          background: none;
          border: none;
          color: #7c3aed;
          font-size: 0.875rem;
          cursor: pointer;
          font-weight: 500;
        }

        .empty-notifications {
          text-align: center;
          padding: 40px;
          color: #94a3b8;
        }

        .empty-notifications p {
          margin-top: 12px;
          font-size: 0.875rem;
        }

        .user-dropdown {
          position: relative;
        }

        .user-trigger {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 12px 6px 8px;
          background: rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 40px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .dark .user-trigger {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(255, 255, 255, 0.1);
        }

        .user-trigger:hover {
          background: rgba(124, 58, 237, 0.1);
        }

        .user-avatar-small {
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .user-details {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .user-greeting {
          font-size: 0.65rem;
          color: #64748b;
        }

        .dark .user-greeting {
          color: #a0aec0;
        }

        .user-name-header {
          font-size: 0.85rem;
          font-weight: 600;
          color: #1a1a2e;
        }

        .dark .user-name-header {
          color: #ffffff;
        }

        .dropdown-arrow {
          transition: transform 0.2s;
          color: #64748b;
        }

        .dropdown-arrow.rotated {
          transform: rotate(180deg);
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 260px;
          background: white;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          animation: slideDown 0.2s ease;
          z-index: 1000;
        }

        .dark .dropdown-menu {
          background: #1a1a2e;
          border-color: rgba(255, 255, 255, 0.05);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .dropdown-user-avatar {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .dropdown-user-name {
          font-weight: 600;
          color: #1a1a2e;
          margin: 0 0 2px 0;
        }

        .dark .dropdown-user-name {
          color: #ffffff;
        }

        .dropdown-user-org {
          font-size: 0.7rem;
          color: #64748b;
          margin: 0;
        }

        .dark .dropdown-user-org {
          color: #a0aec0;
        }

        .dropdown-divider {
          height: 1px;
          background: rgba(0, 0, 0, 0.06);
          margin: 8px 0;
        }

        .dark .dropdown-divider {
          background: rgba(255, 255, 255, 0.05);
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 16px;
          background: none;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.875rem;
          color: #475569;
        }

        .dark .dropdown-item {
          color: #cbd5e1;
        }

        .dropdown-item:hover {
          background: rgba(124, 58, 237, 0.08);
        }

        .dropdown-item.logout {
          color: #ef4444;
        }

        .im-content {
          flex: 1;
          overflow: auto;
          padding: 28px;
        }

        .mobile-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 98;
          display: none;
        }

        .mobile-close-btn {
          display: none;
        }

        @media (max-width: 768px) {
          .im-sidebar {
            position: fixed;
            left: -280px;
            z-index: 100;
            background: white;
          }

          .dark .im-sidebar {
            background: #1a1a2e;
          }

          .im-sidebar.mobile-open {
            left: 0;
          }

          .mobile-overlay {
            display: block;
          }

          .mobile-menu-btn {
            display: flex;
          }

          .mobile-close-btn {
            display: flex;
            background: none;
            border: none;
            cursor: pointer;
            color: #1a1a2e;
          }

          .dark .mobile-close-btn {
            color: #ffffff;
          }

          .im-header {
            padding: 0 16px;
          }

          .user-details {
            display: none;
          }

          .user-greeting {
            display: none;
          }

          .header-description {
            display: none;
          }

          .notification-menu {
            width: calc(100vw - 32px);
            right: -60px;
          }

          .im-content {
            padding: 16px;
          }
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
        }
      `}</style>
    </div>
  );
}