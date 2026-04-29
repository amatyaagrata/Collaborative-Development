// src/components/layout/SupplierLayout.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import NotificationBell from "@/components/supplier/notifications/NotificationBell";
import { ShoppingBag, Package, Grid3x3, User, ChevronDown, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import styles from "./PortalLayout.module.css";

export default function SupplierLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState("Supplier");
  const [userName, setUserName] = useState("Supplier");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchUser() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching supplier user:", error);
        return;
      }
      if (user) {
        if (typeof user.user_metadata?.role === "string") {
          setUserRole(
            user.user_metadata.role.charAt(0).toUpperCase() +
              user.user_metadata.role.slice(1)
          );
        }
        setUserName(
          user.user_metadata?.full_name || user.email?.split("@")[0] || "Supplier"
        );
      }
    }
    fetchUser();
  }, [supabase]);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Logout failed. Please try again.");
      return;
    }
    router.push("/login");
  };

  const navItems = [
    { href: "/suppliers/orders", label: "Orders", icon: ShoppingBag },
    { href: "/suppliers/products", label: "Product List", icon: Package },
    { href: "/suppliers/categories", label: "Categories", icon: Grid3x3 },
    { href: "/suppliers/settings", label: "Settings", icon: Settings },
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
            <h1 className={styles.topbarTitle}>{currentItem?.label || "Orders"}</h1>
            <div className={styles.topbarMeta}>Manage orders, products, and supplier activity.</div>
          </div>

          <div className={styles.topbarActions}>
            <NotificationBell />
            <div className={styles.userMenuContainer}>
              <button
                type="button"
                className={styles.userMenuTrigger}
                onClick={() => setShowUserMenu((value) => !value)}
              >
                <div className={styles.userAvatar}>
                  <User size={18} />
                </div>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{userName}</span>
                  <span className={styles.userRoleLabel}>{userRole}</span>
                </div>
                <ChevronDown
                  size={18}
                  className={`${styles.chevronIcon} ${showUserMenu ? styles.rotated : ""}`}
                />
              </button>

              {showUserMenu && (
                <div className={styles.userDropdown}>
                  <div className={styles.dropdownItem}>
                    <span>Role:</span>
                    <strong>{userRole}</strong>
                  </div>
                  <button onClick={handleLogout} className={styles.dropdownItemButton}>
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}
