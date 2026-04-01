"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProductSummaryChart } from "@/components/dashboard/ProductSummaryChart";
import { TrendingProductsTable } from "@/components/dashboard/TrendingProductsTable";
import { SalesPurchaseChart } from "@/components/dashboard/SalesPurchaseChart";
import { createClient } from "@/lib/supabase/client";
import { LogOut, User, ChevronDown, Store } from "lucide-react";
import { toast } from "sonner";
import "./dashboard.css";

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [organizationName, setOrganizationName] = useState("Loading...");
  const [userData, setUserData] = useState({
    email: "",
    fullName: "",
    loginTime: ""
  });

  const [stats, setStats] = useState({ inventoryValue: 0, totalStocks: 0, newOrders: 0, delivered: 0 });
  const [summary, setSummary] = useState({ quantityInHand: 0, toBeReceived: 0 });

  useEffect(() => {
    async function loadDashboard() {
      // Fetch user profile securely
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserData({
          email: user.email || "user@example.com",
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || "User",
          loginTime: new Date().toISOString()
        });
        setOrganizationName(user.user_metadata?.organization_name || "GoGodam Default");
      }

      // 1. Total Products
      const { count: productsCount } = await supabase.from("products").select("*", { count: "exact", head: true });
      
      // 2. Total Orders
      const { count: ordersCount } = await supabase.from("orders").select("*", { count: "exact", head: true });

      // 3. Inventory Value Aggregation
      const { data: productsData } = await supabase.from("products").select("price, stock");
      const inventoryValue = productsData?.reduce((acc, item) => acc + (item.price * item.stock), 0) || 0;

      setStats({
        inventoryValue: inventoryValue,
        totalStocks: productsCount || 0,
        newOrders: ordersCount || 0,
        delivered: 0 // Waiting for order status logic
      });

      setSummary({
        quantityInHand: productsCount || 0,
        toBeReceived: ordersCount || 0
      });
    }
    
    loadDashboard();
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
    if (userData.fullName && userData.fullName !== "User") {
      return userData.fullName;
    }
    return userData.email.split('@')[0] || "User";
  };

  return (
    <AppLayout title={`Dashboard - ${organizationName}`}>
      <div className="dashboard-content">
        
        {/* Top Bar with Organization Badge and User Menu */}
        <div className="dashboard-top-bar">
          <div className="organization-badge">
            <div className="org-badge-icon">
              <Store size={18} />
            </div>
            <div className="org-badge-info">
              <span className="org-badge-label">Current Organization</span>
              <span className="org-badge-name">{organizationName}</span>
            </div>
          </div>

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
                <span className="user-email">{userData.email}</span>
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
                    <div className="dropdown-email">{userData.email}</div>
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
        </div>

        {/* Welcome Section */}
        <div className="welcome-section">
          <h1 className="welcome-title">Welcome back, {getDisplayName()}! 👋</h1>
          <p className="welcome-subtitle">
            You&apos;re logged in to <strong className="org-highlight">{organizationName}</strong>
          </p>
        </div>

        <h2 className="activity-header">Activity Overview</h2>

        <div className="stat-cards-grid">
          <StatCard label="Inventory Value" value={`Rs. ${stats.inventoryValue.toLocaleString()}`} delay={0} />
          <StatCard label="Total Stocks" value={stats.totalStocks.toLocaleString()} delay={50} />
          <StatCard label="New Orders" value={stats.newOrders.toString()} delay={100} />
          <StatCard label="Delivered" value={stats.delivered.toString()} delay={150} />
        </div>

        <div className="charts-row">
          <ProductSummaryChart quantityInHand={summary.quantityInHand} toBeReceived={summary.toBeReceived} />
          <TrendingProductsTable products={[]} />
        </div>

        <SalesPurchaseChart data={[]} />
      </div>
    </AppLayout>
  );
}