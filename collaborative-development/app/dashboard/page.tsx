"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProductSummaryChart } from "@/components/dashboard/ProductSummaryChart";
import { TrendingProductsTable } from "@/components/dashboard/TrendingProductsTable";
import { SalesPurchaseChart } from "@/components/dashboard/SalesPurchaseChart";
import { createClient } from "@/lib/supabase/client";
import { LogOut, User, Store } from "lucide-react";
import { toast } from "sonner";
import { useProducts } from "@/lib/supabase/hooks/useProducts";
import { useOrders } from "@/lib/supabase/hooks/useOrders";
import { useUsers } from "@/lib/supabase/hooks/useUsers";
import "./dashboard.css";

export default function Dashboard() {
  const router = useRouter();
  const supabase = createClient();
  const { data: products, loading: productsLoading } = useProducts();
  const { data: orders, loading: ordersLoading } = useOrders();
  const { data: users, loading: usersLoading } = useUsers();

  const [organizationName, setOrganizationName] = useState("Loading...");
  const [userData, setUserData] = useState({
    email: "",
    fullName: "",
    loginTime: ""
  });

  const [stats, setStats] = useState({
    inventoryValue: 0,
    totalStocks: 0,
    newOrders: 0,
    delivered: 0
  });

  const [summary, setSummary] = useState({
    quantityInHand: 0,
    toBeReceived: 0
  });

  useEffect(() => {
    async function loadDashboard() {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        setUserData({
          email: user.email || "user@example.com",
          fullName: user.user_metadata?.full_name || user.email?.split('@')[0] || "User",
          loginTime: new Date().toISOString()
        });
        setOrganizationName(user.user_metadata?.organization_name || "GoGodam Default");
      }

      // Calculate stats from actual data
      if (!productsLoading && !ordersLoading) {
        const inventoryValue = products.reduce((acc, product) => acc + (product.price * product.stock), 0);
        const totalStocks = products.reduce((acc, product) => acc + product.stock, 0);
        const newOrders = orders.filter(order => order.status === 'pending' || order.status === 'confirmed').length;
        const delivered = orders.filter(order => order.status === 'delivered').length;

        setStats({
          inventoryValue,
          totalStocks,
          newOrders,
          delivered
        });

        // Calculate summary
        const quantityInHand = totalStocks;
        const toBeReceived = orders
          .filter(order => order.status !== 'delivered' && order.status !== 'cancelled')
          .reduce((acc, order) => acc + (order.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0), 0);

        setSummary({
          quantityInHand,
          toBeReceived
        });
      }
    }
    loadDashboard();
  }, [products, orders, productsLoading, ordersLoading]); // supabase is a singleton — stable reference

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  if (productsLoading || ordersLoading || usersLoading) {
    return (
      <AppLayout title="Dashboard">
        <div className="loading-spinner">Loading dashboard...</div>
      </AppLayout>
    );
  }

  const getDisplayName = () => {
    if (userData.fullName && userData.fullName !== "User") {
      return userData.fullName;
    }
    return userData.email.split('@')[0] || "User";
  };

  return (
    <AppLayout
      title={`Dashboard - ${organizationName}`}
    >
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
            <button onClick={handleLogout} className="logout-btn">
              <LogOut size={18} />
              <span>Sign out</span>
            </button>
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
          <TrendingProductsTable products={products.slice(0, 4)} />
        </div>

        {/* TODO: Replace hardcoded mock data with real sales/purchase data from Supabase */}
        <SalesPurchaseChart data={[
          { name: "Mon", Sales: 10200, Purchase: 8400 },
          { name: "Tue", Sales: 8800, Purchase: 7200 },
          { name: "Wed", Sales: 12400, Purchase: 9600 },
          { name: "Thu", Sales: 9600, Purchase: 10800 },
          { name: "Fri", Sales: 11200, Purchase: 8000 },
          { name: "Sat", Sales: 7400, Purchase: 6200 },
          { name: "Sun", Sales: 6800, Purchase: 5400 },
        ]} />
      </div>
    </AppLayout>
  );
}